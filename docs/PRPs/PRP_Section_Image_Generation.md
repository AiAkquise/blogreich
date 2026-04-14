# PRP: Sektionsbasierte Bildgenerierung

## Status: DRAFT
**Erstellt:** 2026-04-14
**Prioritaet:** P0

## Ziel
Bilder sollen pro Blog-Abschnitt (Einleitung, jede H2-Sektion, Fazit) generiert werden. Das Backend parst den Markdown-Content in Sektionen, generiert fuer jede Sektion einen passenden FLUX.2-Prompt via Claude, generiert die Bilder als Background Task, und updatet den Status pro Sektion. Im Frontend erscheint ein animiertes Progress-Panel (MagicUI BorderBeam + AnimatedList) das den Fortschritt pro Sektion zeigt, und die fertigen Bilder werden ueber dem jeweiligen Abschnitt in der Preview eingebettet.

## User Story
Als Blogreich-Nutzer
moechte ich auf "KI-Bilder generieren" klicken und fuer jeden Abschnitt meines Blogs ein passendes Bild erhalten
damit die Bilder thematisch zum jeweiligen Text passen und der Blog visuell ansprechend wird.

## Scope

### In Scope
- Backend: Markdown in Sektionen parsen (Intro, H2-Sektionen, Fazit)
- Backend: Pro Sektion einen kontextbezogenen Bild-Prompt generieren (Claude)
- Backend: Bilder via FLUX.2 generieren als **Background Task** mit Status-Updates in Supabase
- Backend: Neuer Polling-Endpoint `GET /api/images/{blog_id}/status` fuer Echtzeit-Fortschritt
- Frontend: Animiertes Progress-Panel mit MagicUI-Komponenten (BorderBeam, AnimatedList)
- Frontend: Bilder in den Markdown-Content einbetten (`![...](url)` vor jeder H2)
- Frontend: Bilder inline in der Preview ueber den Sektionen anzeigen

### Out of Scope
- Bild-Regenerierung einzelner Sektionen
- Drag-and-Drop Bild-Repositionierung
- Bild-Bearbeitung (Cropping, Filter)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/images/service.py` | `_parse_sections()`, `_generate_section_prompts()`, Background Task mit per-section Status-Updates | L18-68, L219-302 |
| `backend/app/images/schemas.py` | `ImageResult` + `section_index/section_title`, neues `ImageJobStatusResponse` Schema | L8-39 |
| `backend/app/images/routes.py` | Neuer `GET /{blog_id}/status` Endpoint, `POST /generate` wird async Background Task | L14-42 |
| `backend/app/main.py` | Keine Aenderung (images router bereits registriert) | — |
| `project/src/pages/BlogEditor.tsx` | Progress-Panel mit MagicUI, Polling, Bild-Einbettung in Markdown | L120-154, L261-278 |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `project/src/components/ui/border-beam.tsx` | MagicUI BorderBeam Komponente (via npx shadcn install) |

## Technischer Plan

### Schritt 1: MagicUI Komponenten installieren

**Was:** BorderBeam installieren fuer das Progress-Panel.

```bash
cd project
npx shadcn@latest add "https://magicui.design/r/border-beam.json"
```

Abhaengigkeit `motion` wird automatisch installiert. Die Komponente landet in `project/src/components/ui/border-beam.tsx`.

**Done-Kriterien:**
- [ ] `border-beam.tsx` existiert in `project/src/components/ui/`
- [ ] `motion` in `package.json` dependencies
- [ ] `npm run build` gruen

---

### Schritt 2: Backend — Markdown Section Parser + Section-Prompt-Generator

**Dateien:** `backend/app/images/service.py`

**Was:**

1. **Neue Funktion `_parse_sections(content: str) -> list[SectionInfo]`:**
   ```python
   @dataclass
   class SectionInfo:
       index: int
       title: str        # "Einleitung", "H2-Titel", oder "Fazit"
       content: str      # Text der Sektion (gekuerzt auf ~500 Zeichen)
   ```
   - Splittet Markdown an `## ` Headings
   - Text vor erster H2 = "Einleitung" (index 0)
   - Jede H2-Sektion bekommt index 1, 2, 3, ...
   - Letzte Sektion: Wird als "Fazit" markiert wenn Titel typische Fazit-Woerter enthaelt (Fazit, Zusammenfassung, Schluss, Conclusion)
   - Jede Sektion hat maximal 500 Zeichen Content (reicht fuer Claude Prompt-Generierung)

2. **Neuer System-Prompt `SECTION_IMAGE_PROMPT_SYSTEM`:**
   ```
   Du bist ein Experte fuer Bild-Prompts fuer KI-Bildgeneratoren.
   Erstelle EINEN detaillierten Bild-Prompt fuer den folgenden Blog-Abschnitt.

   Regeln:
   - Fotorealistisch, professionell, hochwertig
   - Passend zum Inhalt des Abschnitts
   - Kein Text im Bild, keine Wasserzeichen
   - Sprache: Englisch
   - Breitformat (16:9 Querformat)

   Antworte NUR mit JSON: {"prompt": "..."}
   ```

3. **Neue Funktion `_generate_section_prompt(section: SectionInfo) -> str`:**
   - Sync-Funktion (wrap in `asyncio.to_thread`)
   - Ruft Claude mit `SECTION_IMAGE_PROMPT_SYSTEM` (cache_control ephemeral) auf
   - User-Prompt: `"Abschnitt: {section.title}\n\nInhalt:\n{section.content}"`
   - Gibt Bild-Prompt-String zurueck

4. **`generate_images()` umbauen zu Background Task:**
   - Wird per `asyncio.create_task()` gestartet (wie Blog-Generierung)
   - Schreibt Status-Updates in neue Supabase-Tabelle oder nutzt `generation_jobs`
   - Ablauf:
     1. Parst Sektionen → schreibt `total_sections` in Status
     2. Generiert Prompts (alle auf einmal via Claude, oder einzeln)
     3. Pro Sektion: FLUX.2 Submit → Poll → Download → Upload → Status-Update
     4. Bilder werden in max 3er-Batches parallel generiert (Rate Limiting)
   - Status-Feld pro Sektion: `pending | generating | completed | failed`

**Pattern-Referenz:**
- Blog-Generierung Background Task in `blogs/service.py:167-362`
- `_call_claude()` Pattern in `blogs/service.py:48-66`
- `update_blog_status()` in `blogs/service.py:29-45`

**Done-Kriterien:**
- [ ] `_parse_sections()` parst den LED-Blog korrekt in 7+ Sektionen
- [ ] Claude generiert pro Sektion einen kontextbezogenen englischen Prompt
- [ ] System-Prompt wird mit `cache_control: ephemeral` gecacht
- [ ] Bilder werden in 3er-Batches parallel generiert
- [ ] Status-Updates in Supabase nach jedem fertigem Bild
- [ ] `uv run ruff check .` und `uv run mypy app/` gruen

---

### Schritt 3: Backend — Schemas + Status-Endpoint

**Dateien:** `backend/app/images/schemas.py`, `backend/app/images/routes.py`

**Was:**

**schemas.py — Neue/geaenderte Schemas:**
```python
class ImageResult(BaseModel):
    id: str
    image_url: str
    original_bfl_url: str
    prompt: str
    position: str
    section_index: int          # NEU
    section_title: str          # NEU

class SectionStatus(BaseModel):
    section_index: int
    section_title: str
    status: Literal["pending", "generating", "completed", "failed"]
    image_url: str | None = None
    prompt: str | None = None

class ImageJobStatusResponse(BaseModel):
    status: Literal["pending", "running", "completed", "failed"]
    total_sections: int
    completed_sections: int
    sections: list[SectionStatus]

class ImageGenerateRequest(BaseModel):
    blog_id: str
    model: Literal["flux-2-pro-preview", "flux-2-klein-4b"] = "flux-2-pro-preview"
    # count entfaellt — automatisch 1 pro Sektion

class ImageGenerateResponse(BaseModel):
    status: str = "started"
    message: str = "Bildgenerierung gestartet"
    total_sections: int
```

**routes.py — Neuer Polling-Endpoint:**
```python
@router.get("/{blog_id}/status", response_model=ImageJobStatusResponse)
async def get_image_status(blog_id: str, user_id = Depends(get_current_user_id)):
    # Liest aus generation_jobs oder eigener image_generation_jobs Tabelle
    ...
```

**Done-Kriterien:**
- [ ] `POST /api/images/generate` startet Background Task, antwortet sofort mit `total_sections`
- [ ] `GET /api/images/{blog_id}/status` liefert Fortschritt pro Sektion
- [ ] `ImageResult` hat `section_index` und `section_title`

---

### Schritt 4: Frontend — Animiertes Progress-Panel + Polling + Bild-Einbettung

**Dateien:** `project/src/pages/BlogEditor.tsx`

**Was:**

#### 4a. Progress-Panel UI (waehrend Generierung):
Wenn `generatingImages === true`, wird im Editor-Bereich ein **Overlay-Panel** ueber der Preview angezeigt:

```
┌──────────────────────────────────────┐
│  ✨ Bilder werden generiert          │  ← BorderBeam um die Card
│                                      │
│  ┌─────────┐                         │
│  │  3 / 7  │  Sektionen              │  ← Zaehler (kompletiert / gesamt)
│  └─────────┘                         │
│                                      │
│  ✓ Einleitung              [Bild]    │  ← Completed: Checkmark + Thumbnail
│  ✓ Grundlagen der LED...   [Bild]    │  ← Completed
│  ⟳ Vorteile von LED...              │  ← Generating: Spinner
│  ○ Anforderungen an die...          │  ← Pending: Leer
│  ○ Auswahl der richtigen...         │  ← Pending
│  ○ Planung und Installation         │
│  ○ Fazit                            │
│                                      │
│  [BorderBeam Animation am Rand]      │
└──────────────────────────────────────┘
```

**Komponenten:**
- **Card mit `position: relative` + `overflow: hidden`** als Container
- **`<BorderBeam />`** (MagicUI) — leuchtender animierter Rahmen, signalisiert "aktiver Prozess"
  - Props: `duration={4} size={300} colorFrom="#8b5cf6" colorTo="#6366f1"` (lila Toene passend zum Branding)
  - Verschwindet wenn alle Sektionen fertig
- **Sektions-Liste** — jede Sektion als Zeile:
  - `completed`: Gruener Checkmark + Sektions-Titel + kleines Thumbnail (48x27px)
  - `generating`: Lila Spinner + Sektions-Titel + "Wird generiert..."
  - `pending`: Grauer Kreis + Sektions-Titel (ausgegraut)
  - `failed`: Roter X + Sektions-Titel + "Fehlgeschlagen"
- **Zaehler oben:** `{completed} / {total} Sektionen` mit animiertem Update
- **Subtile Einblend-Animation:** Neue Zeilen sliden von unten rein (CSS transition)

#### 4b. Polling-Logik:
```typescript
// Nach POST /api/images/generate:
const poll = setInterval(async () => {
  const status = await apiGet<ImageJobStatusResponse>(`/api/images/${blog.id}/status`);
  setSectionStatuses(status.sections);

  // Fortschritt aktualisieren
  setCompletedCount(status.completed_sections);
  setTotalCount(status.total_sections);

  if (status.status === 'completed' || status.status === 'failed') {
    clearInterval(poll);
    setGeneratingImages(false);
    // Bilder in Content einbetten
    embedImagesInContent(status.sections);
  }
}, 2000);
```

#### 4c. Bild-Einbettung in Markdown:
```typescript
function embedImagesInContent(sections: SectionStatus[]) {
  let newContent = content;
  // Sortiere Sektionen absteigend nach Index (von hinten einfuegen)
  const sorted = [...sections].filter(s => s.image_url).sort((a, b) => b.section_index - a.section_index);

  for (const section of sorted) {
    if (section.section_index === 0) {
      // Einleitung: Bild nach H1-Titel einfuegen
      const h1End = newContent.indexOf('\n', newContent.indexOf('# '));
      if (h1End > -1) {
        newContent = newContent.slice(0, h1End + 1) +
          `\n![${section.section_title}](${section.image_url})\n` +
          newContent.slice(h1End + 1);
      }
    } else {
      // H2-Sektionen: Bild VOR der H2-Zeile einfuegen
      // Finde die N-te ## im Content
      let h2Count = 0;
      let pos = 0;
      while (pos < newContent.length) {
        pos = newContent.indexOf('\n## ', pos);
        if (pos === -1) break;
        h2Count++;
        if (h2Count === section.section_index) {
          newContent = newContent.slice(0, pos + 1) +
            `![${section.section_title}](${section.image_url})\n\n` +
            newContent.slice(pos + 1);
          break;
        }
        pos++;
      }
    }
  }
  setContent(newContent);
}
```

#### 4d. `markdownToHtml` erweitern:
```typescript
// Vor den bestehenden Regeln:
.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
  '<img src="$2" alt="$1" class="w-full rounded-lg my-4 shadow-sm" loading="lazy" />')
```

**Pattern-Referenz:**
- Blog-Generierung Polling in `BlogWriter.tsx:146-168`
- BorderBeam Usage: `<Card className="relative overflow-hidden">...<BorderBeam duration={4} size={300} /></Card>`

**Done-Kriterien:**
- [ ] Klick auf "KI-Bilder" startet Background Task + zeigt Progress-Panel
- [ ] BorderBeam animiert um das Panel waehrend der Generierung
- [ ] Sektionen erscheinen nacheinander mit Status-Updates (pending → generating → completed)
- [ ] Thumbnails der fertigen Bilder erscheinen in der Sektions-Liste
- [ ] Nach Abschluss: Bilder werden VOR jeder H2-Sektion in den Markdown eingefuegt
- [ ] Preview zeigt Bilder inline ueber den Sektionen (`<img>` Tags)
- [ ] Panel verschwindet nach Abschluss
- [ ] `npm run build` gruen

## Datenbank-Aenderungen

Neuer Status-Speicher fuer Image-Generierung. Zwei Optionen:

**Option A (empfohlen): `generation_jobs` Tabelle wiederverwenden**
- Neuer `job_type`: `"image_generation"` (bisher nur `"blog_generation"`)
- `metadata` JSON-Feld: `{"sections": [{"index": 0, "title": "...", "status": "completed", "image_url": "..."}]}`

**Option B: Eigene Tabelle**
```sql
CREATE TABLE image_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_id UUID REFERENCES blogs(id),
    user_id UUID NOT NULL,
    status TEXT DEFAULT 'pending',
    total_sections INT DEFAULT 0,
    completed_sections INT DEFAULT 0,
    sections JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);
```

## API-Aenderungen

| Endpoint | Method | Beschreibung |
|----------|--------|-------------|
| `POST /api/images/generate` | POST | Startet Background Task, antwortet sofort mit `{status: "started", total_sections: N}` |
| `GET /api/images/{blog_id}/status` | GET | Liefert Echtzeit-Fortschritt: Status pro Sektion + Bild-URLs |

## Frontend-Aenderungen

| Datei | Aenderung |
|-------|----------|
| `BlogEditor.tsx` | Progress-Panel mit BorderBeam, Polling, Bild-Einbettung, img-Rendering in Preview |
| `components/ui/border-beam.tsx` | MagicUI BorderBeam (via npx install) |

## Testing-Strategie
- Manueller Test: Blog oeffnen → "KI-Bilder" klicken → Progress-Panel erscheint → Sektionen werden nacheinander gruen → Bilder in Preview sichtbar
- Backend: `_parse_sections()` mit dem LED-Blog-Content testen (7+ Sektionen erwartet)
- Validierung: `ruff check`, `mypy`, `npm run build`

## Validierung
```bash
# Backend
cd backend && uv run ruff check . && uv run mypy app/

# Frontend
cd project && npm run build
```

## Risiken & Offene Fragen
- **FLUX.2 Kosten:** Bei 7 Sektionen = 7 Bilder × 5 Credits = 35 Credits ($0.35) pro Blog — akzeptabel
- **Generierungszeit:** 7 Bilder in 3er-Batches = ~20-40s gesamt — deshalb Progress-UI wichtig
- **Rate Limiting:** FLUX.2 API koennte bei 7 gleichzeitigen Requests throttlen → 3er-Batches als Safeguard
- **`motion` Dependency:** BorderBeam benoetigt `motion` (framer-motion Nachfolger) — ca. 50KB gzip, aber nur einmalig geladen
