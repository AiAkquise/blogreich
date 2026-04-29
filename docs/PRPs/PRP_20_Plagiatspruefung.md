# PRP #20: Plagiatspruefung — Content auf Einzigartigkeit pruefen

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P3 (Nice-to-Have — Vertrauenssignal fuer Nutzer, aber kein Muss fuer Launch)
**Geschaetzte Komplexitaet:** Low
**Betroffene Dateien:** 4 (2 Backend + 2 Frontend)
**Abhaengigkeiten:** Keine

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

KI-generierter Content ist grundsaetzlich "original" — Claude erfindet den Text, er kopiert ihn nicht direkt von einer Website. ABER:
- Claude wurde mit Milliarden von Texten trainiert und koennte Formulierungen reproduzieren die auf anderen Websites existieren
- Bei "Realtime" oder "URL" Content-Sources fliessen echte Web-Inhalte in die Generierung ein — Teile koennten zu aehnlich zu den Quellen sein
- Google bestraft duplicate Content (identische oder sehr aehnliche Texte) mit schlechteren Rankings
- Nutzer wollen BEWEISEN koennen, dass ihr Content einzigartig ist (fuer Kunden, fuer Google, fuer die eigene Sicherheit)

### Die Loesung

Wir integrieren eine **Plagiatspruefung** ueber eine externe API (Copyscape oder Originality.ai). Der Nutzer kann im Blog-Editor einen "Plagiat-Check" Button klicken. Der Check prueft den Blog-Text gegen das gesamte Internet und zeigt:
- **Uniqueness Score** (z.B. 97% einzigartig)
- **Gefundene Uebereinstimmungen** (welche Stellen aehnlich zu welchen Websites sind)
- **Empfehlung** (Gruen = alles ok, Gelb = einige Stellen umformulieren, Rot = signifikante Uebereinstimmungen)

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **Plagiat** | Die Uebernahme fremder Texte als eigene. In unserem Kontext: Wenn der generierte Blog-Text zu aehnlich zu einem bestehenden Text im Internet ist. |
| **Duplicate Content** | Identischer oder sehr aehnlicher Content auf verschiedenen Websites. Google zeigt in seinen Suchergebnissen nur EINE Version — wenn dein Text ein Duplikat ist, wird er nicht angezeigt. |
| **Uniqueness Score** | Ein Prozentwert der angibt, wie einzigartig ein Text ist. 100% = komplett einzigartig, 0% = komplett kopiert. Ueber 90% gilt als gut. |
| **Copyscape** | Der bekannteste Plagiatspruefungs-Dienst. Durchsucht das Internet nach aehnlichen Texten. Kostet ca. $0.03 pro Pruefung (300 Woerter), oder $0.05 fuer bis zu 500 Woerter. Bietet eine Premium API. |
| **Originality.ai** | Eine neuere Alternative die speziell fuer KI-generierten Content entwickelt wurde. Prueft sowohl auf Plagiate ALS AUCH auf KI-Erkennung (ob der Text von einer KI geschrieben wurde). Kostet ca. $0.01 pro 100 Woerter. |
| **API Credit** | Plagiatspruefungs-APIs berechnen pro Pruefung. Man kauft "Credits" im Voraus. Z.B. 100 Credits bei Copyscape = ca. $5 = ca. 100 Pruefungen. |
| **Textvergleich / Fingerprinting** | Die Technik hinter der Plagiatspruefung: Der Text wird in kleine Stuecke ("Fingerprints") aufgeteilt und diese werden mit einer riesigen Datenbank von Web-Inhalten verglichen. |
| **Passagen-Highlight** | Stellen im Text die aehnlich zu bestehenden Web-Inhalten sind werden farblich hervorgehoben, damit der Nutzer sie umformulieren kann. |

---

## Ziel

Eine Plagiatspruefung ueber eine externe API (Copyscape Premium API) in den Blog-Editor integrieren. Der Nutzer kann den fertigen Blog auf Einzigartigkeit pruefen lassen und bekommt einen Uniqueness Score + markierte Uebereinstimmungen.

## User Story

Als Blogreich-Nutzer
moechte ich pruefen koennen, ob mein generierter Blog einzigartig ist und keine bestehenden Texte kopiert
damit ich sicher sein kann, dass Google meinen Blog nicht als Duplikat abstraft.

## Scope

### In Scope
- **Copyscape Premium API** Integration (oder Originality.ai als Alternative)
- **Backend-Endpoint:** `POST /api/blogs/{id}/plagiarism-check` — prueft den Content
- **Frontend:** "Plagiat-Check" Button im BlogEditor + Ergebnis-Anzeige
- **Uniqueness Score** mit Farb-Coding (gruen/gelb/rot)
- **Passagen-Anzeige:** Welche Stellen aehnlich sind + Quell-URL
- **Ergebnis in Supabase speichern** (optional, damit man den Check nicht doppelt bezahlt)
- **Neue ENV-Variable:** `COPYSCAPE_API_KEY`

### Out of Scope
- KI-Erkennung (ob der Text von KI geschrieben wurde — spaeter mit Originality.ai)
- Automatische Umformulierung von plagiierten Stellen
- Batch-Plagiatspruefung (mehrere Blogs auf einmal)
- Plagiatspruefung vor der Veroeffentlichung erzwingen (Nutzer entscheidet selbst)
- Eigene Plagiatspruefungs-Engine (viel zu komplex — externe API ist richtig)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/blogs/routes.py` | Neuer Endpoint `POST /{blog_id}/plagiarism-check` | Ende der Datei |
| `project/src/pages/BlogEditor.tsx` | Button "Plagiat-Check" + Ergebnis-Panel | Toolbar-Bereich |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `backend/app/blogs/plagiarism.py` | Copyscape API Client (Plagiatspruefung durchfuehren) |
| `project/src/components/PlagiarismResult.tsx` | Ergebnis-Anzeige (Score, Passagen, Quellen) |

---

## Technischer Plan

### Schritt 1: Copyscape API-Account einrichten (MANUELL)

**Wo:** https://www.copyscape.com/apiconfigure.php
**Was:** Copyscape Premium API Account erstellen und Credits kaufen.

**Erklaerung fuer die Praktikantin:**
Copyscape ist ein externer Dienst den wir per API aufrufen. Bevor wir Code schreiben, brauchen wir einen Account und API-Zugang.

**Schritt-fuer-Schritt:**

1. Gehe zu https://www.copyscape.com und erstelle einen Account
2. Gehe zu "Premium" → "API Configuration"
3. Notiere deine **API-Schluessel** (Username + API Key)
4. Kaufe Credits: "Add Credits" → mind. $5 (reicht fuer ~100 Pruefungen)
5. Fuege in die `.env` Datei ein:
   ```
   COPYSCAPE_USERNAME=dein_username
   COPYSCAPE_API_KEY=dein_api_key
   ```

**Copyscape API Kosten:**
| Woerter | Kosten pro Check |
|---------|:---:|
| bis 200 | $0.03 |
| 201-500 | $0.05 |
| 501-2000 | $0.08 |
| 2000+ | $0.08 + $0.01 pro 500 extra |

Ein typischer 3000-Woerter-Blog kostet ca. **$0.10** pro Check.

**Alternative: Originality.ai**
Falls Copyscape nicht gewuenscht ist, bietet Originality.ai eine modernere API:
- Kosten: $0.01 pro 100 Woerter (~$0.30 fuer 3000 Woerter, aber mit KI-Erkennung)
- API Docs: https://docs.originality.ai
- Beide APIs koennen parallel unterstuetzt werden (Nutzer waehlt)

**Done-Kriterien:**
- [ ] Copyscape Account mit API-Zugang
- [ ] Credits aufgeladen (mind. $5)
- [ ] Zugangsdaten in `.env`

---

### Schritt 2: Backend — Plagiarism Service

**Datei:** `backend/app/blogs/plagiarism.py` (NEU)
**Was:** Funktion die den Copyscape API aufruft und die Ergebnisse strukturiert zurueckgibt.

**Erklaerung fuer die Praktikantin:**
Die Copyscape Premium API funktioniert einfach:
1. Wir schicken den Blog-Text als POST-Request
2. Copyscape vergleicht ihn mit Milliarden von Web-Seiten
3. Copyscape gibt zurueck: Uebereinstimmende URLs, Prozent-Aehnlichkeit, und die aehnlichen Textpassagen

**Copyscape API-Call:**
```python
async def check_plagiarism(content: str) -> dict[str, Any]:
    """Check content for plagiarism via Copyscape Premium API.

    Returns:
        {
            "uniqueness_score": 97,  # 0-100
            "matches_found": 2,
            "matches": [
                {
                    "url": "https://example.com/article",
                    "title": "Example Article",
                    "percent_matched": 3,
                    "matched_words": 45,
                    "snippet": "The matched text passage..."
                }
            ],
            "words_checked": 3000,
            "credits_used": 1,
        }
    """
    settings = get_settings()

    params = {
        "u": settings.copyscape_username,
        "o": settings.copyscape_api_key,
        "t": content,  # Text to check
        "f": "json",   # Response format
        "e": "UTF-8",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://www.copyscape.com/api/",
            data=params,
        )
        response.raise_for_status()
        data = response.json()

    # Ergebnis aufbereiten
    matches = []
    total_matched_percent = 0

    for result in data.get("result", []):
        match_percent = int(result.get("percentmatched", 0))
        total_matched_percent = max(total_matched_percent, match_percent)
        matches.append({
            "url": result.get("url", ""),
            "title": result.get("title", ""),
            "percent_matched": match_percent,
            "matched_words": int(result.get("minwordsmatched", 0)),
            "snippet": result.get("textsnippet", ""),
        })

    uniqueness = 100 - total_matched_percent

    return {
        "uniqueness_score": max(0, uniqueness),
        "matches_found": len(matches),
        "matches": sorted(matches, key=lambda m: m["percent_matched"], reverse=True),
        "words_checked": len(content.split()),
    }
```

**Neue Config-Werte:**
```python
# Copyscape
copyscape_username: str = ""
copyscape_api_key: str = ""
```

**Done-Kriterien:**
- [ ] `check_plagiarism()` ruft Copyscape API auf und gibt strukturiertes Ergebnis zurueck
- [ ] Uniqueness Score wird korrekt berechnet (100 - max_match_percent)
- [ ] Matches werden nach Aehnlichkeit sortiert (hoechste zuerst)
- [ ] Fehlerbehandlung wenn API nicht erreichbar oder Credits aufgebraucht
- [ ] Logging: `blog.plagiarism_check_completed` mit Score und Match-Anzahl

---

### Schritt 3: Backend — API-Endpoint

**Datei:** `backend/app/blogs/routes.py`
**Was:** Neuer Endpoint der den Blog-Content prueft.

```python
@router.post("/{blog_id}/plagiarism-check")
async def check_blog_plagiarism(
    blog_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Check a blog's content for plagiarism via Copyscape.

    Costs approximately $0.10 per check for a 3000-word blog.
    Results include uniqueness score and matching sources.
    """
    # 1. Blog laden
    blog_result = await db_query("blogs", {"id": blog_id, "user_id": user_id})
    if not blog_result.data:
        raise HTTPException(status_code=404, detail="Blog nicht gefunden")

    blog = blog_result.data[0]
    content = blog.get("content", "")
    if not content or len(content.split()) < 50:
        raise HTTPException(status_code=400, detail="Blog hat zu wenig Content fuer eine Plagiatspruefung (min. 50 Woerter)")

    # 2. Plagiatspruefung durchfuehren
    from app.blogs.plagiarism import check_plagiarism
    result = await check_plagiarism(content)

    # 3. Ergebnis optional in Blog speichern
    await db_update("blogs", {
        "plagiarism_data": result,
    }, {"id": blog_id, "user_id": user_id})

    return result
```

**Rate Limiting:** 5/hour (jeder Check kostet echtes Geld)

**Supabase — Neue Spalte (optional, fuer Ergebnis-Caching):**
```sql
ALTER TABLE blogs
ADD COLUMN IF NOT EXISTS plagiarism_data jsonb DEFAULT NULL;

COMMENT ON COLUMN blogs.plagiarism_data IS 'Cached plagiarism check results from Copyscape. Contains uniqueness_score and matches.';
```

**Done-Kriterien:**
- [ ] Endpoint laedt Blog, prueft Content, gibt Ergebnis zurueck
- [ ] 404 wenn Blog nicht existiert
- [ ] 400 wenn Blog zu kurz (< 50 Woerter)
- [ ] Ergebnis wird in `blogs.plagiarism_data` gecacht (optionaler Re-Check moeglich)
- [ ] Rate Limiting: 5/hour (Kostenschutz)
- [ ] JWT-geschuetzt

---

### Schritt 4: Frontend — PlagiarismResult Komponente

**Datei:** `project/src/components/PlagiarismResult.tsx` (NEU)
**Was:** Ergebnis-Anzeige mit Uniqueness Score, Farb-Coding und gefundenen Uebereinstimmungen.

**Erklaerung fuer die Praktikantin:**
Die Komponente zeigt das Ergebnis der Plagiatspruefung visuell aufbereitet:
- **Gruener Score (90-100%):** Alles einzigartig — keine Sorgen
- **Gelber Score (70-89%):** Einige Stellen aehnlich — empfohlen umzuformulieren
- **Roter Score (< 70%):** Signifikante Uebereinstimmungen — Text sollte ueberarbeitet werden

**Visuelles Design:**
```
┌─────────────────────────────────────────────────────────────┐
│ Plagiatspruefung                                      [✕]   │
│                                                             │
│           ┌────────────────┐                                │
│           │                │                                │
│           │      97%       │  Einzigartig                   │
│           │                │  ✅ Ihr Content ist original   │
│           └────────────────┘                                │
│                                                             │
│ 3.042 Woerter geprueft · 2 Uebereinstimmungen gefunden     │
│                                                             │
│ Gefundene Aehnlichkeiten:                                   │
│                                                             │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🔗 example.com/seo-guide                   3% aehnlich│ │
│ │ "Die wichtigsten SEO-Faktoren sind Keywords,          │ │
│ │  Backlinks und technische Optimierung..."              │ │
│ └────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🔗 blog.example.de/marketing               1% aehnlich│ │
│ │ "Content Marketing ist eine langfristige              │ │
│ │  Strategie die auf qualitativ hochwertige..."          │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💡 Tipp: Aehnlichkeiten unter 5% sind normal und           │
│    kein Grund zur Sorge.                                    │
└─────────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface PlagiarismMatch {
  url: string;
  title: string;
  percent_matched: number;
  matched_words: number;
  snippet: string;
}

interface PlagiarismResultData {
  uniqueness_score: number;
  matches_found: number;
  matches: PlagiarismMatch[];
  words_checked: number;
}

interface PlagiarismResultProps {
  data: PlagiarismResultData;
  onClose: () => void;
}
```

**Bestehende Komponenten:**
- `Card`, `CardContent` — Container
- `Badge` — Score-Badge (gruen/gelb/rot)
- `Button` — Schliessen-Button
- Lucide Icons: `Shield`, `ShieldCheck`, `ShieldAlert`, `ExternalLink`

**Done-Kriterien:**
- [ ] Score-Anzeige mit Farb-Coding (gruen >= 90, gelb 70-89, rot < 70)
- [ ] Uebereinstimmungs-Liste mit URL, Aehnlichkeit und Textausschnitt
- [ ] URLs sind klickbar (externer Link, neuer Tab)
- [ ] Tipp-Text erklaert was der Score bedeutet
- [ ] `npx tsc --noEmit` fehlerfrei

---

### Schritt 5: Frontend — Integration in BlogEditor

**Datei:** `project/src/pages/BlogEditor.tsx`
**Was:** "Plagiat-Check" Button in der Toolbar + Dialog fuer Ergebnis.

**UI:**
```
[Speichern] [Export ▾] [🔗 Links] [📱 Social] [🛡️ Plagiat-Check] [🌐 WordPress]
```

**Flow:**
1. Nutzer klickt "Plagiat-Check"
2. Hinweis-Dialog: "Die Plagiatspruefung kostet ca. $0.10 pro Check. Fortfahren?"
3. Nutzer bestaetigt → Loading-State (kann 10-30 Sekunden dauern)
4. Ergebnis wird als PlagiarismResult Panel angezeigt
5. Wenn bereits geprueft (cached): Zeige das gespeicherte Ergebnis mit Option "Erneut pruefen"

**Implementierung:**
```typescript
const [plagiarismLoading, setPlagiarismLoading] = useState(false);
const [plagiarismResult, setPlagiarismResult] = useState<PlagiarismResultData | null>(null);

const handlePlagiarismCheck = async () => {
    if (!confirm('Die Plagiatspruefung kostet ca. $0.10. Fortfahren?')) return;
    setPlagiarismLoading(true);
    try {
        const result = await apiPost<PlagiarismResultData>(
            `/api/blogs/${blog!.id}/plagiarism-check`, {}
        );
        setPlagiarismResult(result);
    } catch (err) {
        // Toast: Fehler anzeigen
    } finally {
        setPlagiarismLoading(false);
    }
};
```

**Cached-Ergebnis laden:**
```typescript
// Beim Laden des Blogs:
if (blog.plagiarism_data) {
    setPlagiarismResult(blog.plagiarism_data);
}
```

**Done-Kriterien:**
- [ ] Button sichtbar in der Toolbar
- [ ] Bestaetigung-Dialog vor dem Check (Kosten-Hinweis)
- [ ] Loading-State waehrend der Pruefung
- [ ] Ergebnis wird angezeigt (PlagiarismResult Komponente)
- [ ] Gecachtes Ergebnis wird geladen wenn vorhanden
- [ ] "Erneut pruefen" Button fuer neuen Check
- [ ] `npx tsc --noEmit` und `npm run build` fehlerfrei

---

## Datenbank-Aenderungen

### Neue Spalte (manuell in Supabase, optional)

```sql
ALTER TABLE blogs
ADD COLUMN IF NOT EXISTS plagiarism_data jsonb DEFAULT NULL;
```

---

## API-Aenderungen

### Neuer Endpoint

| Method | Path | Auth | Beschreibung |
|--------|------|:---:|-------------|
| `POST` | `/api/blogs/{blog_id}/plagiarism-check` | JWT | Plagiatspruefung via Copyscape |

### Response-Format

```json
{
  "uniqueness_score": 97,
  "matches_found": 2,
  "matches": [
    {
      "url": "https://example.com/seo-guide",
      "title": "SEO Guide 2026",
      "percent_matched": 3,
      "matched_words": 45,
      "snippet": "Die wichtigsten SEO-Faktoren sind..."
    }
  ],
  "words_checked": 3042
}
```

---

## Neue ENV-Variablen

```env
COPYSCAPE_USERNAME=dein_username
COPYSCAPE_API_KEY=dein_api_key
```

---

## Frontend-Aenderungen

### Neue Komponente
- `project/src/components/PlagiarismResult.tsx`

### Geaenderte Datei
- `project/src/pages/BlogEditor.tsx` — Button + Dialog

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Voraussetzung:** Copyscape Account mit Credits, ENV-Variablen konfiguriert.

**Test 1: Einzigartigen Blog pruefen**
1. Einen KI-generierten Blog oeffnen
2. "Plagiat-Check" klicken → Bestaetigen
3. **Erwartet:** Score 90-100%, 0-2 kleine Uebereinstimmungen
4. **Erwartet:** Gruenes Badge "Einzigartig"

**Test 2: Kopierten Text pruefen**
1. Einen Blog oeffnen und den Content durch kopierten Text ersetzen (z.B. von Wikipedia einen Absatz kopieren)
2. Speichern
3. "Plagiat-Check" klicken
4. **Erwartet:** Niedriger Score, mehrere Uebereinstimmungen, rotes Badge

**Test 3: Cached Ergebnis**
1. Einen Blog pruefen (Test 1)
2. Seite neu laden
3. **Erwartet:** Das gespeicherte Ergebnis wird angezeigt (kein neuer API-Call)
4. "Erneut pruefen" klicken
5. **Erwartet:** Neuer Check wird durchgefuehrt

**Test 4: Blog ohne Content**
1. Leeren Blog oeffnen
2. "Plagiat-Check" klicken
3. **Erwartet:** Fehlermeldung "Blog hat zu wenig Content"

**Test 5: Ohne Copyscape-Credentials**
1. `COPYSCAPE_USERNAME` und `COPYSCAPE_API_KEY` aus `.env` entfernen
2. Backend neustarten
3. Plagiat-Check versuchen
4. **Erwartet:** Fehlermeldung "Plagiatspruefung nicht konfiguriert"

### Validierung

```bash
cd backend && uv run ruff check . && uv run mypy app/ && uv run pytest -v
cd project && npx tsc --noEmit && npm run build
```

---

## Risiken & Offene Fragen

### Risiken
1. **Kosten:** Jeder Check kostet $0.03-0.10. Ohne Rate Limiting koennte ein Nutzer hunderte Checks machen. *Mitigation:* Rate Limiting (5/hour), Bestaetigung-Dialog mit Kosten-Hinweis.
2. **API-Latenz:** Copyscape kann 10-30 Sekunden fuer einen Check brauchen. *Mitigation:* Loading-State im Frontend, Timeout von 60 Sekunden im Backend.
3. **False Positives:** Allgemeine Formulierungen ("Content Marketing ist wichtig") werden als "Plagiat" markiert. *Mitigation:* Tipp-Text: "Aehnlichkeiten unter 5% sind normal."
4. **Copyscape API nicht verfuegbar:** Externe Abhaengigkeit. *Mitigation:* Fehlerbehandlung + Option spaeter auf Originality.ai zu wechseln.
5. **Datenschutz:** Der Blog-Text wird an Copyscape gesendet. *Mitigation:* Hinweis in AGB/Datenschutzerklaerung; Copyscape speichert keine Texte (lt. deren Datenschutzerklaerung).

### Offene Fragen
1. Copyscape oder Originality.ai? (Empfehlung: Copyscape fuer V1 — einfachere API, guenstiger. Originality.ai spaeter fuer KI-Erkennung)
2. Soll die Plagiatspruefung automatisch nach der Blog-Generierung laufen? (Empfehlung: Nein — zu teuer. Nutzer entscheidet selbst.)
3. Soll das Ergebnis im Blog-Export sichtbar sein? (Empfehlung: Nein — nur intern)
4. Soll die Pruefung im Free/Starter Plan verfuegbar sein? (Empfehlung: Nur ab Professional — Kosten)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Copyscape Account einrichten (Manuell)
     ↓
Schritt 2: Backend — Plagiarism Service (plagiarism.py)
     ↓
Schritt 3: Backend — API-Endpoint (routes.py)
     ↓
Schritt 4: Frontend — PlagiarismResult Komponente
     ↓
Schritt 5: Frontend — Integration in BlogEditor
```

**Reihenfolge fuer Claude Code:** 2 → 3 (Backend) → 1 (Manuell) → 4 → 5 (Frontend)

**Supabase-Spalte:** Kann parallel zu Schritt 2/3 erstellt werden.

---

## Naechster Schritt

```bash
/02-execute docs/PRPs/PRP_20_Plagiatspruefung.md
```
