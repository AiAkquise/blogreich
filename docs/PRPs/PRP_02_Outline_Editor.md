# PRP #02: Outline Editor — Gliederung vor Blog-Generierung bearbeiten

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P0 (Markt-Minimum — jeder Konkurrent bietet das)
**Geschaetzte Komplexitaet:** High
**Betroffene Dateien:** 5 (2 Backend + 3 Frontend)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Aktuell funktioniert die Blog-Generierung so:
1. Der Nutzer gibt einen Titel ein und klickt "Generieren"
2. Die KI erstellt eine Gliederung (Outline) im Hintergrund
3. Die KI schreibt dann sofort alle Abschnitte basierend auf dieser Gliederung
4. Der Nutzer sieht das Ergebnis erst, wenn ALLES fertig ist

Das Problem: Der Nutzer hat **keine Kontrolle ueber die Struktur** seines Blogs. Wenn die KI eine unpassende Gliederung erstellt (falscher Fokus, fehlende Themen, falsche Reihenfolge), muss der Nutzer den gesamten Blog manuell umschreiben — oder nochmal generieren und hoffen, dass es besser wird.

Jeder Wettbewerber (Koala, GravityWrite, SEOwriting) bietet einen Outline Editor an. Es ist ein **Markt-Minimum**.

### Die Loesung

Wir bauen einen **2-Schritt-Prozess**:
1. **Schritt 1: Gliederung generieren** — Die KI erstellt nur die Gliederung (dauert ~5 Sekunden). Der Nutzer sieht sie sofort.
2. **Schritt 2: Gliederung bearbeiten** — Der Nutzer kann H2-Abschnitte und H3-Unterabschnitte:
   - Nach oben/unten verschieben (Reihenfolge aendern)
   - Loeschen (unwichtige Abschnitte entfernen)
   - Hinzufuegen (eigene Themen ergaenzen)
   - Kernaussagen bearbeiten
3. **Schritt 3: Blog generieren** — Erst wenn der Nutzer zufrieden ist, klickt er "Blog generieren" und die KI schreibt den Content basierend auf der bearbeiteten Gliederung.

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **Outline / Gliederung** | Die Struktur eines Blog-Artikels — welche Ueberschriften (H2) und Unter-Ueberschriften (H3) es gibt und in welcher Reihenfolge. Wie das Inhaltsverzeichnis eines Buchs. |
| **H2 / H3** | HTML-Ueberschriften-Level. H1 ist der Titel, H2 sind die Hauptabschnitte, H3 sind Unterabschnitte. Wie Kapitel (H2) und Unterkapitel (H3) in einem Buch. |
| **API-Endpoint** | Eine "Tuer" im Backend, durch die das Frontend Daten senden oder anfordern kann. Jeder Endpoint hat eine URL (z.B. `/api/blogs/outline`) und eine Methode (GET = Daten holen, POST = Daten senden). |
| **Background Task** | Eine Aufgabe, die im Hintergrund laeuft, waehrend der Nutzer schon eine Antwort bekommt. Aktuell laeuft die GESAMTE Blog-Generierung als Background Task. Mit dem neuen Flow wird nur die Content-Generierung (nach Outline-Edit) als Background Task laufen. |
| **State (React)** | Daten, die sich in einer React-Komponente aendern koennen und die UI automatisch aktualisieren. Z.B. die Liste der Outline-Abschnitte. Wenn der Nutzer einen Abschnitt loescht, aendert sich der State und die UI zeigt sofort die aktualisierte Liste. |
| **Callback** | Eine Funktion, die als Parameter an eine andere Funktion uebergeben wird. Z.B. `onMoveUp={() => moveSection(index, 'up')}` — wenn der Nutzer den "hoch"-Button klickt, wird die `moveSection`-Funktion aufgerufen. |

---

## Ziel

Den Blog-Writer um einen Outline-Editor erweitern, sodass Nutzer die KI-generierte Gliederung vor der Content-Generierung reviewen und bearbeiten koennen. Die bearbeitete Gliederung wird dann an die bestehende Content-Pipeline weitergegeben.

## User Story

Als Blogreich-Nutzer
moechte ich die generierte Gliederung meines Blogs sehen und bearbeiten koennen (Abschnitte verschieben, loeschen, hinzufuegen)
damit der fertige Blog genau die Struktur hat, die ich mir vorstelle — ohne Ueberraschungen.

## Scope

### In Scope
- Neuer Backend-Endpoint: `POST /api/blogs/outline` (generiert NUR die Gliederung)
- Erweiterung von `POST /api/blogs/generate` um optionalen `outline` Parameter (vorgenerierte Gliederung)
- Frontend: 2-Schritt-Flow in BlogWriter.tsx (erst Outline, dann Generate)
- Frontend: Outline-Editor UI (Abschnitte verschieben, loeschen, hinzufuegen, bearbeiten)
- Einfache Buttons fuer Reorder (Pfeil hoch/runter) — kein Drag & Drop (bewusst einfach gehalten)

### Out of Scope
- Drag & Drop Reordering (kann spaeter mit `@dnd-kit` nachgeruestet werden)
- Outline in Datenbank speichern (Outline wird direkt vom Frontend zum Backend geschickt)
- Outline Templates (kommt in PRP #16)
- Easy Mode Outline (der Easy Mode ueberspringt den Outline-Schritt weiterhin)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/blogs/schemas.py` | Neue Schemas: `OutlineRequest`, `OutlineResponse`, `OutlineSection`; `BlogGenerateRequest` erhaelt optionalen `outline`-Parameter | Gesamte Datei (47 Zeilen) |
| `backend/app/blogs/routes.py` | Neuer Endpoint `POST /outline`; bestehender `/generate` Endpoint nutzt optionales Outline | Gesamte Datei (63 Zeilen) |
| `backend/app/blogs/service.py` | Neue Funktion `generate_outline()`; `generate_blog()` kann vorgeneriertes Outline akzeptieren | L167-238 (Outline-Teil der Pipeline) |
| `project/src/pages/BlogWriter.tsx` | 2-Schritt-Flow: Outline generieren → Outline bearbeiten → Blog generieren | Gesamte Datei (489 Zeilen) |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `project/src/components/OutlineEditor.tsx` | React-Komponente fuer den Outline-Editor (Liste mit Bearbeitungs-Buttons) |

---

## Technischer Plan

### Schritt 1: Backend — Outline-Schemas definieren

**Datei:** `backend/app/blogs/schemas.py`
**Was:** Neue Pydantic-Schemas fuer die Outline-Generierung und -Bearbeitung.

**Erklaerung fuer die Praktikantin:**
Schemas sind wie "Vertraege" zwischen Frontend und Backend. Sie definieren exakt, welche Daten in welchem Format erwartet werden. Pydantic (eine Python-Library) prueft automatisch, ob die Daten dem Schema entsprechen und gibt einen Fehler zurueck, wenn nicht.

**Neue Schemas:**
```python
class OutlineSection(BaseModel):
    """A single section in the blog outline."""
    h2: str                              # Hauptueberschrift des Abschnitts
    h3: list[str] = []                   # Unterueberschriften
    key_points: list[str] = []           # Kernaussagen fuer diesen Abschnitt

class OutlineRequest(BaseModel):
    """Request to generate a blog outline."""
    title: str
    company_id: str | None = None
    language: Literal["de", "en"] = "de"
    tone: Literal["professional", "casual", "academic", "creative"] = "professional"
    target_word_count: int = Field(default=3000, ge=1000, le=5000)
    primary_keyword: str | None = None
    secondary_keywords: list[str] = []
    content_source: Literal["ai", "realtime", "url"] = "ai"
    source_url: str | None = None

class OutlineResponse(BaseModel):
    """Generated blog outline."""
    h1: str                              # Optimierter Blog-Titel
    sections: list[OutlineSection]       # Liste der Abschnitte
```

**Aenderung an bestehendem Schema:**
```python
class BlogGenerateRequest(BaseModel):
    # ... bestehende Felder bleiben ...
    outline: list[OutlineSection] | None = None  # NEU: vorgenerierte Gliederung
```

**Done-Kriterien:**
- [ ] `OutlineSection`, `OutlineRequest`, `OutlineResponse` Schemas existieren
- [ ] `BlogGenerateRequest` hat optionalen `outline` Parameter
- [ ] `uv run mypy app/` laeuft fehlerfrei
- [ ] `uv run ruff check .` laeuft fehlerfrei

---

### Schritt 2: Backend — Outline-Generierung als eigenstaendige Funktion

**Datei:** `backend/app/blogs/service.py`
**Was:** Die Outline-Generierung aus der `generate_blog()` Pipeline herauslösen in eine eigene `generate_outline()` Funktion. Diese wird synchron aufgerufen (KEIN Background Task), weil der Nutzer auf die Gliederung warten soll (~5 Sekunden).

**Erklaerung fuer die Praktikantin:**
Aktuell ist die Outline-Generierung ein Schritt in einer laengeren Pipeline (Outline → Sections → Intro → Conclusion). Wir ziehen diesen einen Schritt heraus, damit er einzeln aufgerufen werden kann. Die Pipeline nutzt dann das Ergebnis weiter — egal ob es von der KI kommt oder vom Nutzer bearbeitet wurde.

**Aktuelle Logik (Zeile 215-238 in service.py):**
Die Outline-Generierung ist eingebettet in `generate_blog()`. Wir extrahieren sie.

**Neue Funktion:**
```python
async def generate_outline(
    title: str,
    user_id: str,
    company_id: str | None = None,
    language: str = "de",
    tone: str = "professional",
    target_word_count: int = 3000,
    primary_keyword: str | None = None,
    secondary_keywords: list[str] | None = None,
    content_source: str = "ai",
    source_url: str | None = None,
) -> dict[str, Any]:
    """Generate a blog outline without starting full content generation.

    Returns the outline as a dict with 'h1' and 'sections' keys.
    This function is called synchronously (not as background task)
    because the user waits for the outline to edit it.
    """
    # 1. Load company style profile (gleiche Logik wie in generate_blog)
    # 2. Fetch context material (if realtime/url)
    # 3. Build outline prompt
    # 4. Call Claude
    # 5. Parse and return outline JSON
```

**Aenderung an `generate_blog()`:**
```python
async def generate_blog(request: BlogGenerateRequest, user_id: str) -> None:
    # ...
    if request.outline:
        # Nutze die vom User bearbeitete Gliederung
        sections_spec = [s.model_dump() for s in request.outline]
    else:
        # Fallback: Generiere neue Gliederung (wie bisher)
        outline_text = await asyncio.to_thread(...)
        sections_spec = parsed_outline.get("sections", [])
    # Rest der Pipeline bleibt gleich
```

**Done-Kriterien:**
- [ ] `generate_outline()` Funktion existiert und gibt ein Dict mit `h1` und `sections` zurueck
- [ ] `generate_blog()` akzeptiert optionales `outline` und ueberspringt dann die Outline-Generierung
- [ ] Wenn `outline` mitgegeben wird, startet die Pipeline direkt bei "sections" (nicht bei "outline")
- [ ] Wenn `outline` NICHT mitgegeben wird, funktioniert alles wie bisher (Abwaertskompatibilitaet)

---

### Schritt 3: Backend — Neuer API-Endpoint fuer Outline

**Datei:** `backend/app/blogs/routes.py`
**Was:** Neuer Endpoint `POST /api/blogs/outline` der NUR die Gliederung generiert und zurueckgibt. Kein Background Task — der Response kommt direkt.

**Erklaerung fuer die Praktikantin:**
Der bisherige `/generate` Endpoint startet einen Background Task und antwortet sofort mit "gestartet". Der neue `/outline` Endpoint wartet dagegen, bis die Gliederung fertig ist, und gibt sie direkt als Antwort zurueck. Das ist ok, weil eine Outline-Generierung nur ~5 Sekunden dauert (ein einzelner Claude-API-Call).

**Neuer Endpoint:**
```python
@router.post("/outline", response_model=OutlineResponse)
async def generate_blog_outline(
    request: OutlineRequest,
    user_id: str = Depends(get_current_user_id),
) -> OutlineResponse:
    """Generate a blog outline for review and editing.

    Unlike /generate, this returns the outline directly (no background task).
    The user can then edit the outline and pass it to /generate.
    """
    result = await generate_outline(
        title=request.title,
        user_id=user_id,
        company_id=request.company_id,
        language=request.language,
        tone=request.tone,
        target_word_count=request.target_word_count,
        primary_keyword=request.primary_keyword,
        secondary_keywords=request.secondary_keywords,
        content_source=request.content_source,
        source_url=request.source_url,
    )
    return OutlineResponse(
        h1=result.get("h1", request.title),
        sections=[OutlineSection(**s) for s in result.get("sections", [])],
    )
```

**Done-Kriterien:**
- [ ] `POST /api/blogs/outline` Endpoint existiert und ist erreichbar
- [ ] Endpoint gibt `OutlineResponse` mit `h1` und `sections` zurueck
- [ ] Endpoint ist JWT-geschuetzt (nur eingeloggte Nutzer)
- [ ] Response dauert ~3-8 Sekunden (ein Claude-API-Call)
- [ ] Fehlerbehandlung: Wenn Claude kein gueltiges JSON liefert, kommt ein 500er mit verstaendlicher Fehlermeldung

---

### Schritt 4: Frontend — OutlineEditor Komponente

**Datei:** `project/src/components/OutlineEditor.tsx` (NEU)
**Was:** Eine React-Komponente, die eine Liste von Outline-Sections anzeigt. Jede Section hat Buttons zum Verschieben (hoch/runter), Loeschen, und Bearbeiten. Plus ein Button zum Hinzufuegen neuer Sections.

**Erklaerung fuer die Praktikantin:**
React-Komponenten sind wiederverwendbare UI-Bausteine. Der OutlineEditor ist wie ein Baukasten: Er bekommt eine Liste von Abschnitten als "Props" (Eingabe-Daten) und ruft "Callbacks" auf, wenn der Nutzer etwas aendert (z.B. einen Abschnitt loescht). Die uebergeordnete Seite (BlogWriter) entscheidet dann, was mit der Aenderung passiert.

**Visuelles Design:**
```
┌─────────────────────────────────────────────────┐
│ Gliederung bearbeiten                           │
│                                                 │
│ ┌─── Abschnitt 1 ─────────────────── [↑][↓][✕]│
│ │ H2: Einleitung in das Thema                   │
│ │ H3: Was ist XY?, Warum ist XY wichtig?        │
│ │ Kernaussagen: Punkt 1, Punkt 2                │
│ └───────────────────────────────────────────────│
│                                                 │
│ ┌─── Abschnitt 2 ─────────────────── [↑][↓][✕]│
│ │ H2: Die 5 wichtigsten Vorteile                │
│ │ H3: Vorteil 1, Vorteil 2, Vorteil 3           │
│ └───────────────────────────────────────────────│
│                                                 │
│ [+ Abschnitt hinzufuegen]                       │
│                                                 │
│ [Blog generieren →]                             │
└─────────────────────────────────────────────────┘
```

**Bestehende UI-Komponenten nutzen:**
- `Card` + `CardContent` (bereits vorhanden)
- `Button` (bereits vorhanden)
- `Input` (bereits vorhanden)
- `Badge` (bereits vorhanden)
- Lucide Icons: `ChevronUp`, `ChevronDown`, `X`, `Plus`, `GripVertical`, `Pencil` (bereits installiert)

**Props-Interface:**
```typescript
interface OutlineSection {
  h2: string;
  h3: string[];
  key_points: string[];
}

interface OutlineEditorProps {
  sections: OutlineSection[];
  onChange: (sections: OutlineSection[]) => void;
}
```

**Funktionalitaet:**
- **Verschieben:** Pfeil-hoch/runter Buttons tauschen die Section mit der darueber/darunter
- **Loeschen:** X-Button entfernt die Section (mit Bestaetigung wenn nur noch 2 Sections uebrig)
- **Hinzufuegen:** Button am Ende fuegt leere Section hinzu (H2 editierbar, H3 leer)
- **Bearbeiten:** Klick auf H2-Text macht ihn editierbar (Inline-Edit)
- **H3 bearbeiten:** Klick zeigt H3-Liste, jede H3 ist editierbar, loeschbar, hinzufuegbar

**Done-Kriterien:**
- [ ] Komponente rendert korrekt mit einer Liste von Sections
- [ ] Sections koennen nach oben/unten verschoben werden
- [ ] Sections koennen geloescht werden (nicht unter 2 Sections)
- [ ] Neue Sections koennen hinzugefuegt werden
- [ ] H2-Texte sind inline editierbar
- [ ] H3-Texte sind editierbar, loeschbar, hinzufuegbar
- [ ] `npx tsc --noEmit` laeuft fehlerfrei
- [ ] Komponente folgt dem bestehenden Tailwind/shadcn-Stil der App

---

### Schritt 5: Frontend — BlogWriter 2-Schritt-Flow

**Datei:** `project/src/pages/BlogWriter.tsx`
**Was:** Den "Advanced" Tab von einem 1-Schritt-Flow (Titel → Generieren) auf einen 2-Schritt-Flow umbauen (Titel → Outline generieren → Outline bearbeiten → Blog generieren).

**Erklaerung fuer die Praktikantin:**
Der BlogWriter ist die Hauptseite zum Erstellen von Blogs. Aktuell hat er einen grossen "Blog generieren" Button. Nach der Aenderung gibt es stattdessen:
1. "Gliederung erstellen" — zeigt die Outline
2. Outline-Editor — zum Bearbeiten
3. "Blog generieren" — startet die eigentliche Generierung mit der bearbeiteten Outline

Der **Easy Mode bleibt unveraendert** — er ueberspringt den Outline-Schritt weiterhin.

**Neuer State:**
```typescript
// Neuer State fuer den 2-Schritt-Flow
const [outline, setOutline] = useState<OutlineSection[] | null>(null);
const [outlineLoading, setOutlineLoading] = useState(false);
const [optimizedTitle, setOptimizedTitle] = useState('');
```

**Neuer Flow im Advanced Tab:**

**Phase 1: Noch keine Outline → zeige Formular + "Gliederung erstellen" Button**
```typescript
const handleGenerateOutline = async () => {
  setOutlineLoading(true);
  try {
    const result = await apiPost<OutlineResponse>('/api/blogs/outline', {
      title, company_id: companyId || null,
      language, tone, target_word_count: wordCount,
      primary_keyword: primaryKeyword,
      secondary_keywords: secondaryKeywords,
      content_source: contentSource, source_url: sourceUrl,
    });
    setOutline(result.sections);
    setOptimizedTitle(result.h1);
  } catch (err) {
    setGenerationError(err instanceof Error ? err.message : 'Fehler');
  } finally {
    setOutlineLoading(false);
  }
};
```

**Phase 2: Outline vorhanden → zeige OutlineEditor + "Blog generieren" Button**
```typescript
const handleGenerateFromOutline = () => {
  // Wie bisheriges generateBlog, aber mit outline Parameter
  generateBlog(optimizedTitle || title, companyId, false, outline);
};
```

**Aenderung an `generateBlog()` (Zeile 97-174):**
- Neuer optionaler Parameter `outline: OutlineSection[] | null`
- Wenn outline vorhanden: wird in `/api/blogs/generate` Request mitgeschickt
- Wenn outline null: Verhalten wie bisher

**UI-Aenderungen:**
- "Blog generieren" Button wird zu "Gliederung erstellen" (wenn noch keine Outline)
- Wenn Outline geladen: OutlineEditor + "Zurueck" Button + "Blog generieren" Button
- Progress-Steps aendern sich: bei vorgegebener Outline startet der Progress bei Schritt 1 ("Abschnitte")

**Done-Kriterien:**
- [ ] Advanced Tab hat 2-Schritt-Flow
- [ ] "Gliederung erstellen" Button ruft `/api/blogs/outline` auf
- [ ] OutlineEditor wird mit generierten Sections angezeigt
- [ ] Bearbeitete Outline wird an `/api/blogs/generate` weitergegeben
- [ ] "Zurueck"-Button setzt Outline zurueck (zurueck zu Phase 1)
- [ ] Easy Mode bleibt unveraendert (kein Outline-Schritt)
- [ ] Loading-State waehrend Outline-Generierung (~5 Sek)
- [ ] Fehlerbehandlung bei fehlgeschlagener Outline-Generierung
- [ ] `npx tsc --noEmit` und `npm run build` laufen fehlerfrei

---

### Schritt 6: Frontend — STEPS-Anzeige anpassen

**Datei:** `project/src/pages/BlogWriter.tsx`
**Was:** Die Progress-Anzeige (STEPS Array, Zeile 26-31) anpassen, damit sie den korrekten Zustand zeigt wenn eine Outline bereits vorgegeben wurde.

**Aktuell:**
```typescript
const STEPS = [
  'Gliederung wird erstellt...',      // Entfaellt wenn Outline vorgegeben
  'Abschnitte werden geschrieben...',
  'Bilder werden generiert...',
  'Blog fertig!',
];
```

**Neu:** Wenn Outline vorgegeben, zeige angepasste Steps:
```typescript
const STEPS_WITH_OUTLINE = [
  'Gliederung wird erstellt...',
  'Abschnitte werden geschrieben...',
  'Einleitung & Fazit...',
  'Blog fertig!',
];

const STEPS_FROM_OUTLINE = [
  'Abschnitte werden geschrieben...',
  'Einleitung & Fazit...',
  'Blog fertig!',
];
```

**Done-Kriterien:**
- [ ] Progress-Anzeige zeigt korrekte Steps je nach Flow
- [ ] Kein "Gliederung wird erstellt" Step wenn Outline bereits vorgegeben

---

## Datenbank-Aenderungen

**Keine.** Die Outline wird als JSON zwischen Frontend und Backend ausgetauscht und nicht separat in der Datenbank gespeichert. Der generierte Blog-Content wird wie bisher in `blogs.content` gespeichert.

---

## API-Aenderungen

### Neuer Endpoint

| Method | Path | Request Body | Response Body | Beschreibung |
|--------|------|-------------|---------------|-------------|
| `POST` | `/api/blogs/outline` | `OutlineRequest` | `OutlineResponse` | Generiert NUR die Gliederung (synchron, ~5 Sek) |

**OutlineRequest:**
```json
{
  "title": "10 Tipps fuer besseres SEO",
  "company_id": "uuid-oder-null",
  "language": "de",
  "tone": "professional",
  "target_word_count": 3000,
  "primary_keyword": "SEO Tipps",
  "secondary_keywords": ["Google Ranking", "Keyword Recherche"],
  "content_source": "ai",
  "source_url": null
}
```

**OutlineResponse:**
```json
{
  "h1": "10 bewährte SEO-Tipps für bessere Google-Rankings in 2026",
  "sections": [
    {
      "h2": "Warum SEO 2026 wichtiger ist denn je",
      "h3": ["Die Entwicklung der Suchlandschaft", "KI-Suche vs. traditionelles SEO"],
      "key_points": ["73% des Web-Traffics kommt von organischer Suche", "AEO wird wichtiger"]
    },
    {
      "h2": "Tipp 1: Keyword-Recherche richtig machen",
      "h3": ["Long-Tail Keywords finden", "Search Intent verstehen"],
      "key_points": ["Tools: Ahrefs, SEMrush", "Intent-Kategorien: informational, transactional"]
    }
  ]
}
```

### Geaenderter Endpoint

| Method | Path | Aenderung |
|--------|------|----------|
| `POST` | `/api/blogs/generate` | Neues optionales Feld `outline: OutlineSection[] | null` im Request Body |

---

## Frontend-Aenderungen

### Neue Komponente
- `project/src/components/OutlineEditor.tsx` — Outline-Bearbeitungs-UI

### Geaenderte Seite
- `project/src/pages/BlogWriter.tsx` — 2-Schritt-Flow im Advanced Tab

### Benoetigte Libraries
**Keine neuen Libraries.** Wir nutzen nur bestehende Komponenten (Card, Button, Input, Badge) und Lucide Icons. Drag & Drop (via `@dnd-kit`) ist explizit out of scope — wir nutzen einfache Pfeil-Buttons fuer Reorder.

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Voraussetzung:** Backend UND Frontend laufen lokal.
```bash
# Terminal 1: Backend
cd backend && uv run uvicorn app.main:app --reload --port 8123

# Terminal 2: Frontend
cd project && npm run dev
```

**Test 1: Outline generieren und bearbeiten (Advanced Mode)**
1. Oeffne den Blog Writer (http://localhost:5173/blog/new)
2. Tab "Blog Schreiber" (Advanced) waehlen
3. Titel eingeben: "10 Tipps fuer besseres SEO"
4. Klick auf "Gliederung erstellen"
5. **Erwartet:** Ladeanimation (~5 Sek), dann erscheint die Gliederung
6. Teste: Einen Abschnitt nach oben verschieben (Pfeil-Button)
7. Teste: Einen Abschnitt loeschen (X-Button)
8. Teste: Neuen Abschnitt hinzufuegen (+-Button)
9. Teste: H2-Text bearbeiten (Klick auf Text)
10. Klick auf "Blog generieren"
11. **Erwartet:** Blog wird basierend auf der bearbeiteten Gliederung generiert
12. **Erwartet:** Im Editor (nach Generierung) hat der Blog die geaenderte Struktur

**Test 2: Easy Mode bleibt gleich**
1. Tab "Einfacher Modus" waehlen
2. Titel eingeben, Generieren klicken
3. **Erwartet:** Kein Outline-Schritt, direkt Generierung (wie bisher)

**Test 3: Outline mit Unternehmen**
1. Ein Unternehmen mit Website-Analyse anlegen (falls nicht vorhanden)
2. Im Advanced Tab: Titel + Unternehmen waehlen
3. "Gliederung erstellen" klicken
4. **Erwartet:** Gliederung wird generiert (Stil wird erst beim Blog-Generieren angewendet, nicht bei der Outline — das ist ok)

**Test 4: Fehlerfall**
1. Titel eingeben, Backend stoppen, "Gliederung erstellen" klicken
2. **Erwartet:** Fehlermeldung wird angezeigt, Nutzer kann es erneut versuchen

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
1. **Outline-Generierung dauert zu lange**: Wenn Claude langsam antwortet (>15 Sek), ist die UX schlecht. *Mitigation:* Timeout-Handling und Fehlermeldung nach 30 Sekunden.
2. **Claude liefert kein valides JSON**: Die Outline-Generierung gibt manchmal kein sauberes JSON zurueck. *Mitigation:* Robustes JSON-Parsing mit Fallback (bestehende `_extract_json()` Funktion).
3. **User fuegt zu viele Sections hinzu**: Wenn der Nutzer 20 Sections hinzufuegt, wird die Generierung sehr teuer und langsam. *Mitigation:* Maximum von 10 Sections im Frontend erzwingen.
4. **Abwaertskompatibilitaet**: Der Easy Mode und bestehende API-Aufrufe duerfen nicht brechen. *Mitigation:* `outline` Parameter ist optional, Default ist `None`.

### Offene Fragen
1. Sollen H3-Unterabschnitte auch reorderbar sein? (Empfehlung: Ja, aber einfach — gleiche Pfeil-Buttons)
2. Sollen Key-Points im Editor sichtbar sein? (Empfehlung: Ja, aber nur anzeigen, nicht editierbar — zu komplex fuer V1)
3. Maximum Sections-Limit? (Empfehlung: 3 Minimum, 10 Maximum)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Schemas (Backend)
     ↓
Schritt 2: generate_outline() Funktion (Backend)
     ↓
Schritt 3: POST /outline Endpoint (Backend)
     ↓
Schritt 4: OutlineEditor Komponente (Frontend)
     ↓
Schritt 5: BlogWriter 2-Schritt-Flow (Frontend)
     ↓
Schritt 6: STEPS-Anzeige anpassen (Frontend)
```

**Reihenfolge fuer Claude Code:** 1 → 2 → 3 → 4 → 5 → 6

---

## Naechster Schritt

```bash
# Dieses PRP ausfuehren:
/02-execute docs/PRPs/PRP_02_Outline_Editor.md
```
