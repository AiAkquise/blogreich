# PRP #11: Bulk Blog Generation — Mehrere Blogs auf einmal generieren

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P2 (Skalierung — Agentur-Usecase, Power-User)
**Geschaetzte Komplexitaet:** High
**Betroffene Dateien:** 8 (4 Backend + 3 Frontend + 1 Supabase)
**Abhaengigkeiten:** PRP #01 (Style Pipeline), PRP #03 (SEO), PRP #09 (Usage Tracking)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Aktuell kann ein Nutzer nur **einen Blog nach dem anderen** generieren. Das dauert pro Blog ca. 2-3 Minuten. Wenn eine Agentur 20 Blogs fuer einen Kunden braucht, muss jemand:
1. Blog 1 Titel eingeben → Generieren → Warten → Fertig
2. Blog 2 Titel eingeben → Generieren → Warten → Fertig
3. ... x20

Das sind 40-60 Minuten nur WARTEN — plus die manuelle Arbeit fuer jede Eingabe. Koala und SEOwriting bieten "Bulk Generation" an: Der Nutzer laedt eine Liste von 20 Titeln hoch und bekommt alle 20 Blogs auf einmal — ohne jedes Mal manuell klicken zu muessen.

### Die Loesung

Wir bauen eine **Batch/Bulk-Generierung**:

1. **Eingabe:** Der Nutzer gibt mehrere Blog-Titel ein — entweder manuell (Textarea, ein Titel pro Zeile) oder per CSV-Upload
2. **Gemeinsame Einstellungen:** Unternehmen, Sprache, Tonalitaet gelten fuer alle Blogs im Batch
3. **Parallele Generierung:** Das Backend generiert bis zu 3 Blogs gleichzeitig (nicht alle auf einmal — das wuerde die API-Kosten explodieren lassen und die Anthropic Rate Limits ueberschreiten)
4. **Fortschrittsanzeige:** Eine Tabelle zeigt den Status jedes einzelnen Blogs: wartend, generiert, fertig, fehlgeschlagen
5. **Ergebnis:** Alle fertigen Blogs erscheinen in "Meine Blogs" und koennen einzeln bearbeitet werden

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **Batch / Bulk** | Mehrere Aufgaben auf einmal ausfuehren, statt jede einzeln. Wie eine Waschmaschine: Du wuerfest alle Kleider rein statt jedes einzeln zu waschen. |
| **CSV** | "Comma-Separated Values" — eine einfache Textdatei, in der Daten durch Kommas (oder Semikolons) getrennt sind. Kann mit Excel oder Google Sheets erstellt werden. Z.B.: `"10 SEO Tipps";"seo-tipps";"SEO, Google"` |
| **Queue / Warteschlange** | Aufgaben werden in eine Reihe gestellt und nacheinander abgearbeitet. Wie eine Schlange an der Kasse — wer zuerst kommt, wird zuerst bedient. |
| **Concurrency / Parallelitaet** | Mehrere Aufgaben gleichzeitig ausfuehren. Statt 1 Kasse mit 1 Schlange haben wir 3 Kassen — 3 Blogs werden gleichzeitig generiert. |
| **Semaphore** | Ein Python-Mechanismus, der begrenzt, wie viele Aufgaben gleichzeitig laufen duerfen. Wie ein Parkplatz mit 3 Plaetzen: Wenn alle besetzt sind, muss das naechste Auto warten bis einer frei wird. |
| **asyncio.Semaphore** | Die Python-Version eines Semaphore fuer asynchronen Code. `Semaphore(3)` = maximal 3 gleichzeitige Aufgaben. |
| **Background Task** | Eine Aufgabe, die im Hintergrund laeuft waehrend der Nutzer schon eine Antwort bekommt. "Dein Batch wurde gestartet" — und im Hintergrund werden die Blogs generiert. |
| **Polling** | Regelmaessig nachfragen, ob etwas fertig ist. Das Frontend fragt alle 5 Sekunden: "Wie weit ist der Batch?" — bis alle Blogs fertig sind. |
| **Idempotenz** | Sicherstellen, dass die gleiche Aktion nicht doppelt ausgefuehrt wird. Wenn der Nutzer den "Batch starten" Button zweimal klickt, wird der Batch nur einmal erstellt. |

---

## Ziel

Eine Bulk-Blog-Generierung implementieren, bei der Nutzer mehrere Blog-Titel auf einmal eingeben (oder per CSV hochladen) und alle Blogs als Batch im Hintergrund generiert werden — mit maximal 3 parallelen Generierungen, Fortschrittsanzeige und Fehlerbehandlung pro Blog.

## User Story

Als Agentur-Nutzer mit mehreren Kunden-Blogs
moechte ich 10-20 Blog-Titel auf einmal eingeben und alle generieren lassen
damit ich nicht jeden Blog einzeln starten und abwarten muss.

## Scope

### In Scope
- **Eingabe:** Textarea (1 Titel pro Zeile) oder CSV-Upload (Titel, Keywords)
- **Batch-Erstellung:** Alle Blogs werden in Supabase angelegt + ein `batch_jobs` Record
- **Parallele Generierung:** Max 3 gleichzeitig via `asyncio.Semaphore`
- **Fortschrittsanzeige:** Tabelle mit Status pro Blog (wartend/generiert/fertig/fehlgeschlagen)
- **Fehlerbehandlung:** Einzelne fehlgeschlagene Blogs stoppen NICHT den gesamten Batch
- **Integration mit bestehender Pipeline:** Nutzt die gleiche `generate_blog()` Funktion wie Einzel-Generierung
- **Usage Tracking:** Jeder generierte Blog zaehlt gegen das Plan-Limit

### Out of Scope
- CSV-Templates zum Download anbieten (spaeter)
- Batch-Export (alle Blogs eines Batches als ZIP exportieren — spaeter)
- Automatische Outline-Bearbeitung pro Blog (Outline wird uebersprungen bei Bulk)
- Bild-Generierung im Batch (Bilder werden einzeln im Blog-Editor generiert)
- Scheduling (Blogs zu bestimmten Zeiten generieren — kommt mit PRP #15 AI Agent)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/main.py` | Batch-Router registrieren | L41-44 |
| `backend/app/blogs/service.py` | `generate_blog()` wird wiederverwendet (keine Aenderung noetig) | — |
| `project/src/App.tsx` | Neue Route `/batch` fuer Bulk-Generierung | L20-33 |
| `project/src/components/layout/Sidebar.tsx` oder AppLayout | Neuer Nav-Eintrag "Bulk Generator" | Nav-Links |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `backend/app/batch/` | Neuer Feature-Slice (Ordner) |
| `backend/app/batch/__init__.py` | Package-Init |
| `backend/app/batch/schemas.py` | Pydantic-Schemas fuer Batch-Jobs |
| `backend/app/batch/service.py` | Batch-Orchestrierung (Queue, Semaphore, Status-Updates) |
| `backend/app/batch/routes.py` | API-Endpoints (create, status, cancel) |
| `project/src/pages/BatchGenerator.tsx` | Neue Seite: Bulk-Eingabe + Fortschrittsanzeige |

---

## Technischer Plan

### Schritt 1: Supabase — batch_jobs Tabelle erstellen (MANUELL)

**Wo:** Supabase Dashboard
**Was:** Neue Tabelle fuer Batch-Jobs.

**Schritt-fuer-Schritt fuer die Praktikantin:**

1. Supabase Dashboard oeffnen
2. SQL Editor → New Query
3. Folgenden SQL-Code einfuegen:

```sql
CREATE TABLE IF NOT EXISTS batch_jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'pending',
        -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    total_blogs int NOT NULL DEFAULT 0,
    completed_blogs int NOT NULL DEFAULT 0,
    failed_blogs int NOT NULL DEFAULT 0,
    settings jsonb NOT NULL DEFAULT '{}',
        -- {language, tone, target_word_count, content_source, primary_keyword_per_blog: bool}
    blog_ids uuid[] DEFAULT '{}',
        -- Array der erstellten Blog-IDs (in Reihenfolge)
    error text DEFAULT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batch_jobs_user_id
ON batch_jobs(user_id);

ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own batch jobs"
ON batch_jobs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE batch_jobs IS 'Batch blog generation jobs. Tracks progress of bulk blog creation.';
```

4. "Run" klicken
5. **Erwartet:** "Success. No rows returned"

**Done-Kriterien:**
- [ ] Tabelle `batch_jobs` existiert
- [ ] RLS aktiviert mit Policy
- [ ] Index auf `user_id`

---

### Schritt 2: Backend — Batch Schemas

**Datei:** `backend/app/batch/schemas.py` (NEU)
**Was:** Pydantic-Schemas fuer Batch-Erstellung und Status-Abfrage.

**Erklaerung fuer die Praktikantin:**
Ein Batch-Job hat zwei Phasen:
1. **Erstellung:** Der Nutzer schickt eine Liste von Titeln + gemeinsame Einstellungen
2. **Abfrage:** Das Frontend fragt regelmaessig: "Wie weit ist der Batch?"

Fuer jede Phase brauchen wir ein Schema.

**Schemas:**
```python
class BatchBlogItem(BaseModel):
    """A single blog entry in a batch."""
    title: str
    primary_keyword: str = ""
    secondary_keywords: list[str] = []

class BatchCreateRequest(BaseModel):
    """Request to create a batch blog generation job."""
    blogs: list[BatchBlogItem] = Field(..., min_length=2, max_length=50)
    company_id: str | None = None
    language: Literal["de", "en", "fr", "es", "it"] = "de"
    tone: Literal["professional", "casual", "academic", "creative"] = "professional"
    target_word_count: int = Field(default=3000, ge=1000, le=5000)
    content_source: Literal["ai", "realtime"] = "ai"
    # Kein "url" Content-Source bei Bulk — jeder Blog brauechte eine andere URL

class BatchCreateResponse(BaseModel):
    """Response after creating a batch job."""
    batch_id: str
    total_blogs: int
    status: str = "pending"

class BatchBlogStatus(BaseModel):
    """Status of a single blog in the batch."""
    blog_id: str
    title: str
    status: Literal["queued", "generating", "completed", "failed"]
    error: str | None = None

class BatchStatusResponse(BaseModel):
    """Current status of a batch job."""
    batch_id: str
    status: Literal["pending", "running", "completed", "failed", "cancelled"]
    total_blogs: int
    completed_blogs: int
    failed_blogs: int
    blogs: list[BatchBlogStatus]
```

**Done-Kriterien:**
- [ ] Alle Schemas definiert
- [ ] `blogs` Liste hat min 2, max 50 Eintraege
- [ ] `uv run mypy app/` fehlerfrei

---

### Schritt 3: Backend — Batch Service (Kern-Logik)

**Datei:** `backend/app/batch/service.py` (NEU)
**Was:** Die Batch-Orchestrierung — erstellt alle Blogs in Supabase, startet die parallele Generierung mit Semaphore, und aktualisiert den Status.

**Erklaerung fuer die Praktikantin:**
Stell dir vor, du bist der Chef einer Baeckerei und bekommst eine Bestellung ueber 20 Brote. Du hast aber nur 3 Oefen. Also:
1. Du schreibst alle 20 Brote auf eine Liste (= Blogs in Supabase anlegen)
2. Du schiebst die ersten 3 in die Oefen (= 3 parallele Generierungen starten)
3. Sobald ein Brot fertig ist, schiebst du das naechste rein (= Semaphore gibt frei)
4. Du streichst jedes fertige Brot von der Liste (= Status-Update in Supabase)
5. Am Ende sind alle 20 fertig — oder einige verbrannt (= fehlgeschlagen), aber die anderen sind trotzdem gut.

**Kern-Implementierung:**
```python
import asyncio
from app.blogs.service import generate_blog
from app.blogs.schemas import BlogGenerateRequest

MAX_CONCURRENT = 3  # Maximal 3 gleichzeitige Generierungen

async def run_batch(
    batch_id: str,
    user_id: str,
    blog_entries: list[dict],
    settings: dict,
) -> None:
    """Run batch blog generation as a background task.

    Creates all blogs in Supabase, then generates them in parallel
    with a concurrency limit of MAX_CONCURRENT.
    """
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    async def _generate_one(blog_id: str, entry: dict) -> None:
        async with semaphore:
            # Semaphore stellt sicher: max 3 gleichzeitig
            try:
                request = BlogGenerateRequest(
                    blog_id=blog_id,
                    title=entry["title"],
                    company_id=settings.get("company_id"),
                    language=settings.get("language", "de"),
                    tone=settings.get("tone", "professional"),
                    target_word_count=settings.get("target_word_count", 3000),
                    primary_keyword=entry.get("primary_keyword", ""),
                    secondary_keywords=entry.get("secondary_keywords", []),
                    content_source=settings.get("content_source", "ai"),
                )
                await generate_blog(request, user_id)
                # Blog erfolgreich → Batch-Zaehler erhoehen
                await _increment_batch_counter(batch_id, user_id, "completed")
            except Exception as e:
                await _increment_batch_counter(batch_id, user_id, "failed", str(e))

    # Alle Generierungen parallel starten (Semaphore begrenzt auf 3)
    tasks = [
        _generate_one(blog_id, entry)
        for blog_id, entry in zip(blog_ids, blog_entries)
    ]
    await asyncio.gather(*tasks, return_exceptions=True)

    # Batch abschliessen
    await _finalize_batch(batch_id, user_id)
```

**Done-Kriterien:**
- [ ] `run_batch()` erstellt alle Blogs in Supabase und startet Generierungen
- [ ] Maximal 3 gleichzeitige Generierungen via Semaphore
- [ ] Jeder fertige Blog erhoet `completed_blogs` Zaehler atomar
- [ ] Fehlgeschlagene Blogs erhoehen `failed_blogs` Zaehler (stoppen nicht den Batch)
- [ ] Batch-Status wird auf "completed" gesetzt wenn alle fertig
- [ ] Usage Tracking: Jeder generierte Blog zaehlt gegen das Plan-Limit (via PRP #09)
- [ ] Logging: `batch.generation_started`, `batch.blog_completed`, `batch.blog_failed`, `batch.generation_completed`

---

### Schritt 4: Backend — Batch Routes

**Datei:** `backend/app/batch/routes.py` (NEU)
**Was:** API-Endpoints fuer Batch-Erstellung, Status-Abfrage und Abbruch.

**Endpoints:**
```python
router = APIRouter()

@router.post("/create", response_model=BatchCreateResponse)
async def create_batch(body: BatchCreateRequest, user_id = Depends(get_current_user_id)):
    """Create a batch blog generation job.

    1. Checks usage limits (enough blogs remaining?)
    2. Creates all blogs in Supabase (status: 'draft')
    3. Creates batch_jobs record
    4. Starts background task for generation
    5. Returns batch_id for polling
    """

@router.get("/{batch_id}/status", response_model=BatchStatusResponse)
async def get_batch_status(batch_id: str, user_id = Depends(get_current_user_id)):
    """Get current status of a batch job with per-blog details."""

@router.post("/{batch_id}/cancel")
async def cancel_batch(batch_id: str, user_id = Depends(get_current_user_id)):
    """Cancel a running batch. Already completed blogs are kept."""
```

**Registrierung in main.py:**
```python
from app.batch.routes import router as batch_router
app.include_router(batch_router, prefix="/api/batch", tags=["batch"])
```

**Rate Limiting:**
- `POST /api/batch/create` → `3/hour` (Batches sind teuer)
- `GET /api/batch/{id}/status` → `60/minute` (Polling)

**Usage-Check VOR Batch-Start:**
```python
# Pruefe ob der Nutzer genug Kontingent hat fuer ALLE Blogs im Batch
remaining = await get_remaining_usage(user_id, "blogs")
if remaining < len(body.blogs):
    raise HTTPException(
        status_code=403,
        detail=f"Nicht genug Blog-Kontingent. Verfuegbar: {remaining}, angefordert: {len(body.blogs)}"
    )
```

**Done-Kriterien:**
- [ ] `POST /api/batch/create` erstellt Batch und startet Background Task
- [ ] `GET /api/batch/{id}/status` gibt detaillierten Status pro Blog zurueck
- [ ] `POST /api/batch/{id}/cancel` stoppt ausstehende Generierungen
- [ ] Usage-Check verhindert Batch wenn Kontingent nicht reicht
- [ ] Rate Limiting: max 3 Batches/Stunde

---

### Schritt 5: Frontend — BatchGenerator Seite

**Datei:** `project/src/pages/BatchGenerator.tsx` (NEU)
**Was:** Neue Seite mit Eingabe-Formular (Textarea oder CSV) und Fortschritts-Tabelle.

**Erklaerung fuer die Praktikantin:**
Diese Seite hat zwei Zustaende:
1. **Eingabe-Phase:** Der Nutzer gibt Titel ein oder laedt eine CSV-Datei hoch
2. **Fortschritts-Phase:** Eine Tabelle zeigt den Echtzeit-Status jedes Blogs

**Visuelles Design — Eingabe-Phase:**
```
┌─────────────────────────────────────────────────────────────┐
│ Bulk Blog Generator                                         │
│                                                             │
│ Blog-Titel eingeben (ein Titel pro Zeile):                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 10 SEO Tipps fuer 2026                                 │ │
│ │ Content Marketing Strategie fuer KMU                   │ │
│ │ Die besten KI-Tools fuer Marketing                     │ │
│ │ Social Media Trends 2026                               │ │
│ │ E-Mail Marketing: Der komplette Guide                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [CSV hochladen]   5 Blogs erkannt                           │
│                                                             │
│ Gemeinsame Einstellungen:                                   │
│ Unternehmen: [Dropdown]  Sprache: [DE]  Ton: [Professional] │
│ Wort-Anzahl: [3000]                                         │
│                                                             │
│ [Batch starten (5 Blogs)]                                   │
└─────────────────────────────────────────────────────────────┘
```

**Visuelles Design — Fortschritts-Phase:**
```
┌─────────────────────────────────────────────────────────────┐
│ Bulk Blog Generator — Batch laeuft (3/5 fertig)             │
│                                                             │
│ ████████████████░░░░░░░░░░  60%                            │
│                                                             │
│ ┌────┬──────────────────────────────┬───────────┬────────┐ │
│ │ #  │ Titel                        │ Status    │ Aktion │ │
│ ├────┼──────────────────────────────┼───────────┼────────┤ │
│ │ 1  │ 10 SEO Tipps fuer 2026      │ ✅ Fertig  │ [Edit] │ │
│ │ 2  │ Content Marketing Strategie  │ ✅ Fertig  │ [Edit] │ │
│ │ 3  │ Die besten KI-Tools         │ ⏳ Laeuft  │  —     │ │
│ │ 4  │ Social Media Trends 2026    │ ⏳ Wartend │  —     │ │
│ │ 5  │ E-Mail Marketing Guide      │ ❌ Fehler  │ [Retry]│ │
│ └────┴──────────────────────────────┴───────────┴────────┘ │
│                                                             │
│ [Batch abbrechen]                                           │
└─────────────────────────────────────────────────────────────┘
```

**CSV-Format (das der Nutzer hochladen kann):**
```csv
title;primary_keyword;secondary_keywords
"10 SEO Tipps fuer 2026";"SEO Tipps";"Google Ranking,Keyword Recherche"
"Content Marketing Strategie";"Content Marketing";"Blog,Social Media"
```

**Polling:**
Alle 5 Sekunden: `GET /api/batch/{batch_id}/status` → Tabelle aktualisieren

**Bestehende Komponenten nutzen:**
- `Card`, `CardContent` — Container
- `Button` — Aktionen
- `Select` — Einstellungen (Unternehmen, Sprache, Ton)
- `Badge` — Status-Badges (Fertig/Laeuft/Fehler)
- `Textarea` — Titel-Eingabe
- Lucide Icons: `Upload`, `Play`, `Check`, `X`, `Loader2`, `AlertCircle`

**Done-Kriterien:**
- [ ] Textarea-Eingabe: Ein Titel pro Zeile, Zeilenanzahl wird angezeigt
- [ ] CSV-Upload: Datei auswaehlen, Titel werden geparst und in Textarea angezeigt
- [ ] Gemeinsame Einstellungen (Unternehmen, Sprache, Ton, Wortanzahl)
- [ ] "Batch starten" Button startet den Batch
- [ ] Fortschritts-Tabelle mit Echtzeit-Status pro Blog
- [ ] "Edit" Link fuer fertige Blogs (oeffnet BlogEditor)
- [ ] "Batch abbrechen" Button
- [ ] Fehler werden pro Blog angezeigt (nicht der ganze Batch scheitert)
- [ ] `npx tsc --noEmit` und `npm run build` fehlerfrei

---

### Schritt 6: Frontend — Navigation und Routing

**Dateien:** `project/src/App.tsx`, Sidebar/AppLayout
**Was:** Neue Route `/batch` und Navigations-Eintrag im Sidebar.

**Aenderungen:**
```tsx
// App.tsx — neue Route innerhalb AppLayout:
<Route path="/batch" element={<BatchGenerator />} />

// Sidebar — neuer Eintrag:
{ name: 'Bulk Generator', href: '/batch', icon: Layers }
```

**Done-Kriterien:**
- [ ] `/batch` Route ist geschuetzt (nur eingeloggte Nutzer)
- [ ] Sidebar zeigt "Bulk Generator" Eintrag
- [ ] Navigation funktioniert

---

## Datenbank-Aenderungen

### Neue Tabelle (manuell in Supabase)

Siehe **Schritt 1** fuer die SQL-Anleitung.

---

## API-Aenderungen

### Neue Endpoints

| Method | Path | Auth | Beschreibung |
|--------|------|:---:|-------------|
| `POST` | `/api/batch/create` | JWT | Batch erstellen und starten |
| `GET` | `/api/batch/{batch_id}/status` | JWT | Batch-Status mit Blog-Details |
| `POST` | `/api/batch/{batch_id}/cancel` | JWT | Laufenden Batch abbrechen |

---

## Frontend-Aenderungen

### Neue Seite
- `project/src/pages/BatchGenerator.tsx`

### Geaenderte Dateien
- `project/src/App.tsx` — neue Route
- Sidebar/AppLayout — neuer Nav-Eintrag

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Voraussetzung:** Backend + Frontend laufen, Supabase `batch_jobs` Tabelle existiert, Nutzer hat genuegend Blog-Kontingent.

**Test 1: Batch mit 3 Blogs (Textarea)**
1. Batch Generator oeffnen (`/batch`)
2. 3 Titel eingeben (ein pro Zeile):
   ```
   SEO Guide fuer Anfaenger
   Content Marketing 2026
   Die besten Blog-Tools
   ```
3. Unternehmen waehlen, Sprache "Deutsch"
4. "Batch starten" klicken
5. **Erwartet:** Fortschritts-Tabelle erscheint
6. **Erwartet:** Nach ~5-8 Minuten sind alle 3 Blogs fertig
7. **Erwartet:** "Edit" Links fuehren zum jeweiligen Blog-Editor

**Test 2: CSV-Upload**
1. CSV-Datei erstellen:
   ```csv
   title;primary_keyword
   "SEO Tipps";"SEO"
   "Marketing Guide";"Marketing"
   ```
2. Im Batch Generator: "CSV hochladen" klicken, Datei auswaehlen
3. **Erwartet:** Titel erscheinen in der Textarea, "2 Blogs erkannt"

**Test 3: Fehler bei einzelnem Blog**
1. Batch mit 3 Blogs starten, einer davon mit ungueltigem Titel (z.B. leer)
2. **Erwartet:** 2 Blogs werden fertig, 1 zeigt "Fehler" mit Fehlermeldung
3. **Erwartet:** Batch-Status zeigt "2 fertig, 1 fehlgeschlagen"

**Test 4: Kontingent-Limit**
1. (Plan mit z.B. 5 Blogs/Monat, bereits 3 verbraucht)
2. Batch mit 4 Blogs starten
3. **Erwartet:** Fehlermeldung "Nicht genug Blog-Kontingent. Verfuegbar: 2, angefordert: 4"

**Test 5: Batch abbrechen**
1. Batch mit 5 Blogs starten
2. Sofort "Batch abbrechen" klicken
3. **Erwartet:** Bereits gestartete Blogs werden fertig generiert, wartende werden uebersprungen

### Validierung

```bash
# Backend
cd backend && uv run ruff check . && uv run mypy app/ && uv run pytest -v

# Frontend
cd project && npx tsc --noEmit && npm run build
```

---

## Risiken & Offene Fragen

### Risiken
1. **Anthropic Rate Limits:** 3 parallele Claude-Anfragen koennten Rate Limits treffen (besonders bei sonnet-Modellen). *Mitigation:* `MAX_CONCURRENT = 3` ist konservativ; bei Rate-Limit-Fehlern Retry mit Backoff.
2. **Langlaeufer:** Ein Batch mit 50 Blogs dauert ~30-50 Minuten. Wenn der Server waehrenddessen neustartet, gehen laufende Generierungen verloren. *Mitigation:* Batch-Status in Supabase gespeichert; Nutzer kann sehen welche Blogs fertig sind und fehlende manuell nachgenerieren.
3. **Kosten-Explosion:** 50 Blogs = ~50 Claude-Calls + 50 Tavily-Calls = ~$25-100. *Mitigation:* Usage-Check VOR Batch-Start; Plan-Limits erzwingen.
4. **Memory:** 3 parallele Blog-Generierungen brauchen mehr RAM als eine einzelne. *Mitigation:* ECS Express Mode kann bei Bedarf mehr RAM zuweisen (Schritt fuer spaeter).

### Offene Fragen
1. Max. Batch-Groesse? (Empfehlung: 50 Blogs — darüber wird es zu teuer und dauert zu lang)
2. Soll die Outline auch im Batch editierbar sein? (Empfehlung: Nein — Bulk-Generierung ueberspringt den Outline-Schritt fuer Geschwindigkeit)
3. Retry-Logik fuer fehlgeschlagene Blogs? (Empfehlung: Manuelles Retry per Button im Frontend, kein automatisches Retry)
4. Sollen Bilder automatisch mitgeneriert werden? (Empfehlung: Nein — zu teuer. Nutzer generiert Bilder einzeln im Editor)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Supabase Tabelle (Manuell)
     ↓
Schritt 2: Batch Schemas (Backend)
     ↓
Schritt 3: Batch Service (Backend — Kern-Logik)
     ↓
Schritt 4: Batch Routes (Backend)
     ↓
Schritt 5: BatchGenerator Seite (Frontend)
     ↓
Schritt 6: Routing + Navigation (Frontend)
```

**Reihenfolge fuer Claude Code:** 2 → 3 → 4 (Backend) → 1 (Manuell/Supabase) → 5 → 6 (Frontend)

---

## Naechster Schritt

```bash
# Dieses PRP ausfuehren:
/02-execute docs/PRPs/PRP_11_Bulk_Blog_Generation.md
```
