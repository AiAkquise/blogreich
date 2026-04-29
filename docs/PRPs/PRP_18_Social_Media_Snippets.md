# PRP #18: Social Media Snippets — Blog-Content in Social-Media-Posts umwandeln

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P3 (Differenzierung — Mehrwert fuer Marketing-Teams, GravityWrite bietet das)
**Geschaetzte Komplexitaet:** Low
**Betroffene Dateien:** 4 (1 Backend + 2 Frontend + 0 Supabase)
**Abhaengigkeiten:** Keine (nutzt bestehenden Blog-Content)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Ein Blogreich-Nutzer hat gerade einen Blog generiert — 3000 Woerter, SEO-optimiert, mit Bildern. Jetzt will er den Blog auf Social Media bewerben: LinkedIn, Twitter/X, Instagram. Aber dafuer muss er:
1. Den Blog lesen und die Kernaussagen herausfinden
2. Fuer JEDE Plattform einen eigenen Post schreiben (LinkedIn: lang und professionell, Twitter: kurz und knackig, Instagram: visuell und mit Hashtags)
3. Passende Hashtags recherchieren
4. Call-to-Action formulieren

Das dauert 20-30 Minuten pro Blog. GravityWrite bietet "AI Social Media" als Kern-Feature an — inklusive Scheduling.

### Die Loesung

Wir bauen einen **Social Media Snippet Generator** direkt im Blog-Editor: Ein Button "Social Media Posts erstellen" generiert auf Knopfdruck passende Posts fuer LinkedIn, Twitter/X und Instagram — basierend auf dem Blog-Content. Der Nutzer kann die Posts bearbeiten und per Copy-to-Clipboard in seine Social-Media-Tools einfuegen.

**Bewusst einfach gehalten:** Kein Social-Media-Scheduling, kein direktes Posten, kein Bild-Generator fuer Social Media. Nur Text-Snippets die der Nutzer kopiert und selbst postet. Das ist schnell gebaut, sofort nuetzlich, und kann spaeter erweitert werden.

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **Snippet** | Ein kurzer Textausschnitt. In unserem Fall: Ein Social-Media-Post der aus dem Blog-Inhalt abgeleitet ist. |
| **Copy-to-Clipboard** | "In die Zwischenablage kopieren" — der Nutzer klickt einen Button und der Text wird kopiert. Dann kann er ihn in LinkedIn/Twitter einfuegen (Ctrl+V). |
| **Hashtag** | Ein Wort mit `#` davor (z.B. `#SEO`, `#ContentMarketing`). Auf Social Media helfen Hashtags, dass der Post von Leuten gefunden wird, die sich fuer das Thema interessieren. |
| **CTA (Call-to-Action)** | Eine Handlungsaufforderung am Ende des Posts: "Lies den vollstaendigen Artikel hier: [Link]" oder "Was sind eure Erfahrungen? Schreibt es in die Kommentare!" |
| **Ephemere Generierung** | Die Social-Media-Posts werden NICHT in der Datenbank gespeichert. Sie werden on-the-fly generiert und nur im Browser angezeigt. "Ephemer" = kurzlebig, nicht persistent. Das spart Datenbank-Komplexitaet. |
| **Zeichenlimit** | Jede Plattform hat andere Limits: Twitter/X: 280 Zeichen, LinkedIn: 3000 Zeichen, Instagram: 2200 Zeichen. Die KI muss die Posts entsprechend kuerzen oder verlaengern. |
| **Tone of Voice** | Der Stil des Posts. LinkedIn ist professioneller ("Wir haben analysiert, dass..."), Twitter ist lockerer ("Hot take: SEO ist nicht tot!"), Instagram ist visueller und emotionaler. |

---

## Ziel

Einen Social-Media-Snippet-Generator im Blog-Editor implementieren, der per Claude-API den Blog-Content in plattformspezifische Social-Media-Posts umwandelt (LinkedIn, Twitter/X, Instagram) — mit Copy-to-Clipboard und Hashtag-Vorschlaegen.

## User Story

Als Blogreich-Nutzer
moechte ich aus meinem generierten Blog-Artikel direkt Social-Media-Posts fuer LinkedIn, Twitter und Instagram erstellen koennen
damit ich den Blog auf Social Media bewerben kann ohne die Posts manuell schreiben zu muessen.

## Scope

### In Scope
- **3 Plattformen:** LinkedIn (lang, professionell), Twitter/X (kurz, knackig), Instagram (emotional, Hashtags)
- **Backend-Endpoint:** `POST /api/blogs/{id}/social-snippets` — generiert Posts via Claude
- **Frontend-Komponente:** Tabs mit Plattform-Previews + Copy-to-Clipboard
- **Hashtag-Vorschlaege:** 5-10 relevante Hashtags pro Post
- **Bearbeitbar:** Generierte Posts koennen im Frontend editiert werden vor dem Kopieren
- **Ephemer:** Posts werden NICHT in der Datenbank gespeichert (kein DB-Change)

### Out of Scope
- Social-Media-Scheduling (GravityWrite-Feature — zu komplex fuer V1)
- Direktes Posten via Social-Media-APIs (LinkedIn API, Twitter API)
- Bild-Generierung fuer Social Media (separate FLUX.2 Posts)
- Social-Media-Analytics
- Thread-Generierung fuer Twitter (Multi-Tweet Threads)
- TikTok / YouTube Shorts Scripts

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/blogs/routes.py` | Neuer Endpoint `POST /{blog_id}/social-snippets` | Ende der Datei |
| `project/src/pages/BlogEditor.tsx` | Neuer Button + Dialog/Panel fuer Social-Snippets | Toolbar-Bereich |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `backend/app/blogs/social.py` | Social-Media-Snippet-Generierung via Claude |
| `project/src/components/SocialSnippets.tsx` | React-Komponente: Tabs + Previews + Copy |

---

## Technischer Plan

### Schritt 1: Backend — Social-Snippet-Generierung

**Datei:** `backend/app/blogs/social.py` (NEU)
**Was:** Eine Funktion die den Blog-Content nimmt und per Claude drei plattformspezifische Posts generiert.

**Erklaerung fuer die Praktikantin:**
Claude bekommt den Blog-Content und die Anweisung: "Erstelle aus diesem Blog drei Social-Media-Posts — einen fuer LinkedIn (professionell, 200-400 Woerter), einen fuer Twitter (max 280 Zeichen, knackig), und einen fuer Instagram (emotional, mit Hashtags)." Claude gibt ein JSON zurueck mit den drei Posts.

**System-Prompt:**
```python
SOCIAL_SNIPPETS_SYSTEM_PROMPT = """\
Du bist ein Social-Media-Experte. Erstelle aus einem Blog-Artikel \
drei plattformspezifische Social-Media-Posts.

OUTPUT-FORMAT (strikt JSON):
{
  "linkedin": {
    "text": "Professioneller LinkedIn-Post (200-400 Woerter). \
             Beginne mit einem Hook. Nutze Absaetze und Aufzaehlungen. \
             Ende mit CTA und 3-5 Hashtags.",
    "hashtags": ["#Hashtag1", "#Hashtag2"]
  },
  "twitter": {
    "text": "Kurzer, knackiger Tweet (max 260 Zeichen inkl. Link-Platzhalter). \
             Provokant oder neugierig machend. 1-2 Hashtags am Ende.",
    "hashtags": ["#Hashtag1"]
  },
  "instagram": {
    "text": "Emotionaler Instagram-Caption (100-300 Woerter). \
             Beginne mit Emoji und Hook. Storytelling. \
             Ende mit CTA ('Link in Bio'). 10-15 Hashtags am Ende.",
    "hashtags": ["#Hashtag1", "#Hashtag2", "..."]
  }
}

REGELN:
- KEIN Markdown in den Posts (kein **, kein ##)
- LinkedIn: Absaetze mit Leerzeilen, professioneller Ton
- Twitter: Max 260 Zeichen (Platz fuer Link lassen!)
- Instagram: Emojis erlaubt, viele Hashtags (10-15)
- Alle Posts sollen neugierig machen und zum Lesen des Blogs motivieren
- Sprache: Gleiche Sprache wie der Blog
"""
```

**Funktion:**
```python
async def generate_social_snippets(
    blog_content: str,
    blog_title: str,
    language: str = "de",
) -> dict[str, Any]:
    """Generate social media snippets from blog content.

    Returns dict with linkedin, twitter, instagram keys,
    each containing text and hashtags.
    """
    # Blog-Content kuerzen (max 3000 Zeichen fuer den Prompt)
    content_preview = blog_content[:3000]
    user_prompt = f"Blog-Titel: {blog_title}\n\nBlog-Inhalt:\n{content_preview}"

    result = await asyncio.to_thread(
        _call_claude, SOCIAL_SNIPPETS_SYSTEM_PROMPT, user_prompt, 1500
    )
    return _extract_json(result)
```

**Done-Kriterien:**
- [ ] Funktion gibt JSON mit `linkedin`, `twitter`, `instagram` Keys zurueck
- [ ] LinkedIn-Post ist 200-400 Woerter
- [ ] Twitter-Post ist max 280 Zeichen
- [ ] Instagram-Post hat 10-15 Hashtags
- [ ] Posts sind in der gleichen Sprache wie der Blog
- [ ] Fehlerbehandlung wenn Claude kein valides JSON liefert

---

### Schritt 2: Backend — API-Endpoint

**Datei:** `backend/app/blogs/routes.py`
**Was:** Neuer Endpoint der den Blog aus Supabase laedt und Social-Snippets generiert.

```python
@router.post("/{blog_id}/social-snippets")
async def generate_social_media_snippets(
    blog_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Generate social media snippets from a blog's content.

    Returns platform-specific posts for LinkedIn, Twitter/X, and Instagram.
    Posts are NOT stored — they are generated on-the-fly.
    """
    # 1. Blog laden (Content + Titel)
    blog_result = await db_query("blogs", {"id": blog_id, "user_id": user_id})
    if not blog_result.data:
        raise HTTPException(status_code=404, detail="Blog nicht gefunden")

    blog = blog_result.data[0]
    if not blog.get("content"):
        raise HTTPException(status_code=400, detail="Blog hat keinen Content")

    # 2. Snippets generieren
    snippets = await generate_social_snippets(
        blog_content=blog["content"],
        blog_title=blog["title"],
        language=blog.get("language", "de"),
    )

    return snippets
```

**Rate Limiting:** 20/hour (1 Claude-Call pro Aufruf)

**Done-Kriterien:**
- [ ] `POST /api/blogs/{blog_id}/social-snippets` gibt Snippets zurueck
- [ ] 404 wenn Blog nicht existiert oder nicht dem User gehoert
- [ ] 400 wenn Blog keinen Content hat
- [ ] JWT-geschuetzt
- [ ] Rate Limiting aktiv

---

### Schritt 3: Frontend — SocialSnippets Komponente

**Datei:** `project/src/components/SocialSnippets.tsx` (NEU)
**Was:** Eine Komponente mit 3 Tabs (LinkedIn, Twitter, Instagram), jeweils mit Post-Preview, Edit-Feld und Copy-Button.

**Erklaerung fuer die Praktikantin:**
Die Komponente zeigt die generierten Social-Media-Posts in einer Tab-Ansicht. Der Nutzer kann zwischen den Plattformen wechseln, den Text bearbeiten und dann per "Kopieren" Button in die Zwischenablage kopieren. Die Komponente zeigt auch die Zeichenanzahl an (wichtig fuer Twitter!).

**Visuelles Design:**
```
┌─────────────────────────────────────────────────────────────┐
│ Social Media Posts                                    [✕]   │
│                                                             │
│ [LinkedIn]  [Twitter/X]  [Instagram]                        │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ in LinkedIn                                              │ │
│ │                                                          │ │
│ │ SEO ist nicht tot — im Gegenteil. 2026 ist es           │ │
│ │ wichtiger denn je, aber die Spielregeln haben sich      │ │
│ │ geaendert.                                               │ │
│ │                                                          │ │
│ │ In unserem neuesten Artikel zeigen wir 10 Strategien    │ │
│ │ die wirklich funktionieren:                              │ │
│ │                                                          │ │
│ │ - SERP-Analyse vor dem Schreiben                        │ │
│ │ - Entity-basierte Content-Optimierung                   │ │
│ │ - AEO fuer ChatGPT und Perplexity                       │ │
│ │                                                          │ │
│ │ Den vollstaendigen Artikel findest du hier: [Link]       │ │
│ │                                                          │ │
│ │ #SEO #ContentMarketing #DigitalMarketing #KI            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 342 Zeichen · 5 Hashtags                                    │
│                                                             │
│ [Kopieren]  [Neu generieren]                                │
└─────────────────────────────────────────────────────────────┘
```

**Fuer Twitter-Tab:** Zeichenzaehler wird ROT wenn > 280 Zeichen.

**Props:**
```typescript
interface SocialSnippet {
  text: string;
  hashtags: string[];
}

interface SocialSnippetsData {
  linkedin: SocialSnippet;
  twitter: SocialSnippet;
  instagram: SocialSnippet;
}

interface SocialSnippetsProps {
  blogId: string;
  onClose: () => void;
}
```

**State-Management:**
- `loading: boolean` — waehrend der Generierung
- `snippets: SocialSnippetsData | null` — die generierten Posts
- `editedTexts: Record<string, string>` — bearbeitete Versionen (initialisiert mit generierten Texten)

**Bestehende Komponenten nutzen:**
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` (bereits vorhanden)
- `Card`, `CardContent` (bereits vorhanden)
- `Button` (bereits vorhanden)
- `Textarea` (bereits vorhanden)
- Lucide Icons: `Linkedin`, `Twitter`, `Instagram`, `Copy`, `Check`, `RefreshCw`, `Loader2`

**Done-Kriterien:**
- [ ] 3 Tabs (LinkedIn, Twitter, Instagram) mit Post-Text
- [ ] Zeichenzaehler pro Tab (rot bei Ueberschreitung fuer Twitter)
- [ ] Hashtags werden unter dem Text angezeigt
- [ ] Text ist editierbar (Textarea)
- [ ] "Kopieren" Button kopiert Text + Hashtags in Zwischenablage
- [ ] "Kopiert!" Bestaetigung fuer 2 Sekunden
- [ ] "Neu generieren" Button erstellt neue Snippets
- [ ] Loading-State waehrend Generierung
- [ ] `npx tsc --noEmit` fehlerfrei

---

### Schritt 4: Frontend — Integration in BlogEditor

**Datei:** `project/src/pages/BlogEditor.tsx`
**Was:** Neuer Button "Social Media Posts" in der Toolbar, der die SocialSnippets-Komponente als Dialog/Panel oeffnet.

**UI:**
```
[Speichern] [Export ▾] [🔗 Links] [📱 Social Media] [🌐 WordPress]
```

**Implementierung:**
```typescript
const [showSocial, setShowSocial] = useState(false);

// In der Toolbar:
<Button variant="secondary" size="sm" onClick={() => setShowSocial(true)}>
  <Share2 className="h-4 w-4" />
  Social Media
</Button>

// Als Dialog:
{showSocial && blog && (
  <SocialSnippets blogId={blog.id} onClose={() => setShowSocial(false)} />
)}
```

**Done-Kriterien:**
- [ ] "Social Media" Button sichtbar in der BlogEditor Toolbar
- [ ] Button ist deaktiviert wenn kein Blog-Content vorhanden
- [ ] SocialSnippets-Komponente oeffnet sich als Dialog/Panel
- [ ] Dialog kann geschlossen werden
- [ ] `npx tsc --noEmit` und `npm run build` fehlerfrei

---

## Datenbank-Aenderungen

**Keine.** Social-Media-Snippets werden ephemer generiert und nicht gespeichert.

---

## API-Aenderungen

### Neuer Endpoint

| Method | Path | Auth | Beschreibung |
|--------|------|:---:|-------------|
| `POST` | `/api/blogs/{blog_id}/social-snippets` | JWT | Social-Media-Posts aus Blog generieren |

### Response-Format

```json
{
  "linkedin": {
    "text": "SEO ist nicht tot — im Gegenteil...",
    "hashtags": ["#SEO", "#ContentMarketing", "#DigitalMarketing"]
  },
  "twitter": {
    "text": "Hot take: SEO ist 2026 wichtiger denn je. Hier sind 10 Strategien die wirklich funktionieren 👇 #SEO #Marketing",
    "hashtags": ["#SEO", "#Marketing"]
  },
  "instagram": {
    "text": "✨ SEO ist nicht tot — es hat sich nur veraendert!\n\nIn 2026 reicht es nicht mehr...",
    "hashtags": ["#SEO", "#ContentMarketing", "#DigitalMarketing", "#KI", "#BlogTipps", "..."]
  }
}
```

---

## Frontend-Aenderungen

### Neue Komponente
- `project/src/components/SocialSnippets.tsx`

### Geaenderte Datei
- `project/src/pages/BlogEditor.tsx` — Button + Dialog

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Voraussetzung:** Backend + Frontend laufen, ein Blog wurde bereits generiert.

**Test 1: Snippets generieren**
1. Einen Blog im Editor oeffnen (mit Content)
2. "Social Media" Button klicken
3. **Erwartet:** Loading-Spinner, dann 3 Tabs mit generierten Posts
4. LinkedIn-Tab: Professioneller Post, 200-400 Woerter
5. Twitter-Tab: Kurzer Post, unter 280 Zeichen (Zaehler gruen)
6. Instagram-Tab: Post mit Emojis und 10+ Hashtags

**Test 2: Post bearbeiten und kopieren**
1. Im LinkedIn-Tab: Text bearbeiten (ein Wort aendern)
2. "Kopieren" klicken
3. In einen Texteditor einfuegen (Ctrl+V)
4. **Erwartet:** Der bearbeitete Text (nicht der Original-Text) wurde kopiert

**Test 3: Neu generieren**
1. "Neu generieren" klicken
2. **Erwartet:** Neue Posts werden generiert (anderer Wortlaut)
3. **Erwartet:** Bearbeitungen gehen verloren (Warnung waere nice-to-have)

**Test 4: Blog ohne Content**
1. Einen leeren Blog oeffnen (Draft ohne Content)
2. "Social Media" Button klicken
3. **Erwartet:** Fehlermeldung "Blog hat keinen Content"

**Test 5: Verschiedene Sprachen**
1. Einen englischen Blog oeffnen
2. Snippets generieren
3. **Erwartet:** Posts sind auf Englisch

### Validierung

```bash
cd backend && uv run ruff check . && uv run mypy app/ && uv run pytest -v
cd project && npx tsc --noEmit && npm run build
```

---

## Risiken & Offene Fragen

### Risiken
1. **Twitter-Limit ueberschritten:** Claude haelt sich nicht immer an das 280-Zeichen-Limit. *Mitigation:* Zeichenzaehler im Frontend wird rot; Nutzer kann kuerzen. Backend koennte den Tweet zusaetzlich kuerzen.
2. **Hashtag-Qualitaet:** Claude koennte irrelevante Hashtags vorschlagen. *Mitigation:* Nutzer kann Hashtags editieren; SERP-Keywords als Hashtag-Basis (wenn aus PRP #03 vorhanden).
3. **Kosten:** 1 Claude-Call pro Snippet-Generierung (~$0.005). *Mitigation:* Rate Limiting (20/hour); "Neu generieren" zaehlt als neuer Call.

### Offene Fragen
1. Sollen Snippets in der DB gespeichert werden? (Empfehlung: Nein fuer V1 — ephemer. Spaeter optional.)
2. Soll ein "Thread-Modus" fuer Twitter angeboten werden (mehrere Tweets)? (Empfehlung: Spaeter)
3. Sollen Social-Media-Bilder mit FLUX.2 generiert werden? (Empfehlung: Eigene PRP, zu komplex fuer hier)
4. Facebook-Support? (Empfehlung: Facebook-Posts sind aehnlich zu LinkedIn, nicht separat noetig)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Backend — Social-Snippet-Generierung (social.py)
     ↓
Schritt 2: Backend — API-Endpoint (routes.py)
     ↓
Schritt 3: Frontend — SocialSnippets Komponente
     ↓
Schritt 4: Frontend — Integration in BlogEditor
```

**Reihenfolge fuer Claude Code:** 1 → 2 (Backend) → 3 → 4 (Frontend)

---

## Naechster Schritt

```bash
/02-execute docs/PRPs/PRP_18_Social_Media_Snippets.md
```
