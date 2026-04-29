# PRP #13: Internal Linking — Automatische interne Verlinkung zwischen Blogs

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P2 (Skalierung — SEO-Booster, Koala hat 10M+ Links generiert)
**Geschaetzte Komplexitaet:** Medium
**Betroffene Dateien:** 7 (4 Backend + 2 Frontend + 1 Supabase)
**Abhaengigkeiten:** PRP #12 (Style RAG pgvector — nutzt die gleiche Embedding-Infrastruktur)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Interne Links sind einer der wichtigsten SEO-Faktoren. Wenn ein Blog-Artikel auf einen anderen Blog-Artikel auf der gleichen Website verlinkt, sagt das Google: "Diese Website hat viel Content zu diesem Thema — sie ist eine Autoritaet." Ausserdem:
- Leser bleiben laenger auf der Website (sie klicken von Artikel zu Artikel)
- Google findet und indexiert neue Seiten schneller
- Die "Link Power" (PageRank) wird innerhalb der Website verteilt

Aktuell hat Blogreich **keine interne Verlinkung**: Jeder Blog steht fuer sich allein. Koala hat ueber 10 Millionen interne Links automatisch generiert — das ist einer ihrer staerksten USPs.

### Die Loesung

Wir bauen ein **automatisches Internal Linking System**:

1. **Blog-Index aufbauen:** Alle bestehenden Blogs eines Nutzers werden indexiert — Titel und Themen-Keywords werden als Vektoren gespeichert (wir nutzen die pgvector-Infrastruktur aus PRP #12)
2. **Relevante Blogs finden:** Wenn ein neuer Blog generiert wird, suchen wir in den bestehenden Blogs nach thematisch verwandten Artikeln
3. **Link-Vorschlaege generieren:** Claude schlaegt natuerliche Ankertexte vor und bestimmt, wo im Blog ein Link sinnvoll ist
4. **Links einfuegen:** Die Links werden als Markdown-Links in den Blog-Content eingefuegt

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **Interne Links** | Links die von einer Seite deiner Website auf eine andere Seite deiner Website zeigen. Im Gegensatz zu "externen Links" die auf fremde Websites zeigen. |
| **Ankertext (Anchor Text)** | Der klickbare Text eines Links. Z.B. in `[SEO Tipps lesen](url)` ist "SEO Tipps lesen" der Ankertext. Ein guter Ankertext beschreibt, wohin der Link fuehrt — das hilft Google und den Lesern. |
| **PageRank** | Ein Algorithmus von Google der misst, wie "wichtig" eine Seite ist. Seiten mit vielen Links (intern und extern) haben einen hoeheren PageRank und ranken tendenziell besser. |
| **Blog-Index** | Eine Sammlung aller Blogs eines Nutzers mit ihren Titeln und Themen als Vektoren. Wie ein Bibliothekskatalog — wir koennen schnell nachschlagen, welche Blogs zu einem Thema passen. |
| **Semantic Matching** | Thematische Zuordnung basierend auf Bedeutung, nicht auf exakten Woertern. "SEO Optimierung" und "Google Rankings verbessern" sind thematisch verwandt, obwohl sie keine gemeinsamen Woerter haben. |
| **Slug** | Der URL-freundliche Teil einer Blog-Adresse. Aus "10 SEO Tipps fuer 2026" wird der Slug `10-seo-tipps-fuer-2026`. Wird fuer die Link-URLs gebraucht. |
| **Contextual Link** | Ein Link der in den natuerlichen Textfluss eingebettet ist, statt in einer separaten "Verwandte Artikel"-Box. Google bewertet kontextuelle Links hoeher als generische Listen-Links. |

---

## Ziel

Automatische interne Verlinkung implementieren, die bei der Blog-Generierung thematisch verwandte bestehende Blogs findet und natuerliche Links in den neuen Blog einfuegt. Optional: Nachtraegliches Verlinken fuer bestehende Blogs.

## User Story

Als Blogreich-Nutzer mit mehreren veroeffentlichten Blogs
moechte ich, dass neue Blogs automatisch auf meine bestehenden Blogs verlinken
damit mein Website-SEO staerker wird und Leser verwandte Artikel entdecken.

## Scope

### In Scope
- **Blog-Embedding-Index:** Titel + Keywords jedes Blogs als Vektor speichern
- **Similarity Search:** Verwandte Blogs per Vektor-Aehnlichkeit finden
- **Claude Link-Vorschlaege:** Natuerliche Ankertexte und Positionen im Blog
- **Automatische Integration:** Links werden in den generierten Blog-Content eingefuegt
- **Nachtraegliches Linking:** API-Endpoint um bestehende Blogs nachtraeglich intern zu verlinken
- **Toggle im BlogWriter:** Nutzer kann Internal Linking an/aus schalten
- **Max 3-5 interne Links pro Blog** (nicht uebertreiben — wirkt spammy)

### Out of Scope
- Externe Links (Links zu fremden Websites)
- Bidirektionales Linking (neuer Blog verlinkt auf alten UND alter Blog verlinkt zurueck auf neuen — zu komplex fuer V1)
- Link-Analytics (welche Links werden geklickt — spaeter)
- Link-Validation (pruefen ob Ziel-URLs noch existieren — spaeter)
- Visueller Link-Graph / Link-Map (spaeter)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/blogs/service.py` | Nach Content-Generierung: Internal Links einfuegen als neuen Pipeline-Schritt | L310-316 (`_assemble_markdown` Aufruf) |
| `backend/app/blogs/schemas.py` | `BlogGenerateRequest` bekommt `enable_internal_links: bool = True` | L8-28 |
| `backend/app/main.py` | Linking-Router registrieren (falls separater Slice) | L41-44 |
| `project/src/pages/BlogWriter.tsx` | Toggle "Interne Links einfuegen" in Erweiterten Einstellungen | L306-394 |
| `project/src/pages/BlogEditor.tsx` | Button "Interne Links hinzufuegen" fuer bestehende Blogs | Export-Bereich |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `backend/app/blogs/linking.py` | Internal Linking Service (Index, Search, Link-Insertion) |

---

## Technischer Plan

### Schritt 1: Supabase — blog_embeddings Tabelle erstellen (MANUELL)

**Wo:** Supabase Dashboard → SQL Editor
**Was:** Tabelle fuer Blog-Titel/Keyword-Embeddings + RPC-Funktion fuer Similarity Search.

**Erklaerung fuer die Praktikantin:**
In PRP #12 haben wir Embeddings fuer *Company-Website-Inhalte* gespeichert. Jetzt erstellen wir eine aehnliche Tabelle fuer *Blog-Inhalte* — damit wir zu einem neuen Blog die thematisch aehnlichsten bestehenden Blogs finden koennen.

**SQL:**
```sql
-- Blog-Embeddings fuer Internal Linking
CREATE TABLE IF NOT EXISTS blog_embeddings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    blog_id uuid NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    keywords text DEFAULT '',
        -- Haupt-Keyword + sekundaere Keywords als Text
    embedding vector(1536) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Unique: Ein Embedding pro Blog
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_embeddings_blog_id
ON blog_embeddings(blog_id);

-- HNSW Index fuer schnelle Vektor-Suche
CREATE INDEX IF NOT EXISTS idx_blog_embeddings_vector
ON blog_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Index fuer User-Abfragen
CREATE INDEX IF NOT EXISTS idx_blog_embeddings_user_id
ON blog_embeddings(user_id);

-- RLS
ALTER TABLE blog_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own blog embeddings"
ON blog_embeddings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RPC-Funktion: Finde aehnliche Blogs
CREATE OR REPLACE FUNCTION match_related_blogs(
    query_embedding vector(1536),
    target_user_id uuid,
    exclude_blog_id uuid DEFAULT NULL,
    match_count int DEFAULT 5,
    match_threshold float DEFAULT 0.35
)
RETURNS TABLE (
    blog_id uuid,
    title text,
    keywords text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        be.blog_id,
        be.title,
        be.keywords,
        1 - (be.embedding <=> query_embedding) AS similarity
    FROM blog_embeddings be
    WHERE be.user_id = target_user_id
      AND (exclude_blog_id IS NULL OR be.blog_id != exclude_blog_id)
      AND 1 - (be.embedding <=> query_embedding) > match_threshold
    ORDER BY be.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON TABLE blog_embeddings IS 'Vector embeddings of blog titles+keywords for internal linking via similarity search.';
```

**Schritt-fuer-Schritt fuer die Praktikantin:**
1. Supabase Dashboard → SQL Editor → New Query
2. SQL oben einfuegen → Run
3. **Erwartet:** "Success. No rows returned"
4. Pruefe: Table Editor → `blog_embeddings` sichtbar

**Done-Kriterien:**
- [ ] Tabelle existiert mit `embedding vector(1536)` Spalte
- [ ] HNSW Index existiert
- [ ] RPC `match_related_blogs` existiert
- [ ] Unique Index auf `blog_id` (ein Embedding pro Blog)

---

### Schritt 2: Backend — Internal Linking Service

**Datei:** `backend/app/blogs/linking.py` (NEU)
**Was:** Service mit drei Funktionen: Blog indexieren, verwandte Blogs finden, Links einfuegen.

**Erklaerung fuer die Praktikantin:**
Dieser Service hat drei Aufgaben:
1. **Indexieren:** Wenn ein Blog fertig generiert ist, wird sein Titel+Keywords als Vektor gespeichert (= der Blog wird "auffindbar" fuer zukuenftige Blogs)
2. **Suchen:** Fuer einen neuen Blog werden die 5 thematisch aehnlichsten bestehenden Blogs gefunden
3. **Verlinken:** Claude schlaegt natuerliche Ankertexte vor und wir fuegen die Links in den Markdown-Content ein

**Kernfunktionen:**
```python
async def index_blog(blog_id: str, user_id: str, title: str, keywords: str) -> None:
    """Create or update the embedding for a blog.

    Called after blog generation completes.
    Generates an embedding from title + keywords and stores it in blog_embeddings.
    """
    from app.core.embeddings import generate_embedding
    text = f"{title}. {keywords}" if keywords else title
    embedding = await generate_embedding(text)
    # Upsert in blog_embeddings (loeschen + einfuegen, da unique auf blog_id)

async def find_related_blogs(
    user_id: str,
    title: str,
    exclude_blog_id: str | None = None,
    max_results: int = 5,
) -> list[dict]:
    """Find the most related existing blogs for a given title.

    Returns list of {blog_id, title, keywords, similarity}.
    """
    from app.core.embeddings import generate_embedding
    embedding = await generate_embedding(title)
    results = await rpc_call("match_related_blogs", {
        "query_embedding": embedding,
        "target_user_id": user_id,
        "exclude_blog_id": exclude_blog_id,
        "match_count": max_results,
        "match_threshold": 0.35,
    })
    return results

async def insert_internal_links(
    content: str,
    related_blogs: list[dict],
    blog_base_url: str = "",
) -> str:
    """Use Claude to insert natural internal links into blog content.

    Claude receives the blog content and a list of related blogs,
    and returns the content with 3-5 contextual links inserted.
    """
    if not related_blogs:
        return content

    # Claude Prompt: "Fuege natuerliche interne Links ein"
    links_info = "\n".join([
        f"- Titel: \"{b['title']}\" → URL: /blog/{b['blog_id']}"
        for b in related_blogs[:5]
    ])

    prompt = f"""Hier ist ein Blog-Artikel im Markdown-Format.
Fuege 3-5 natuerliche interne Links zu verwandten Artikeln ein.

REGELN:
- Links als Markdown: [Ankertext](/blog/blog-id)
- Ankertext soll natuerlich klingen (NICHT einfach den Titel kopieren)
- Links sollen im Textfluss Sinn machen (kontextuell)
- NICHT mehr als 5 Links einfuegen
- NICHT im ersten Absatz verlinken
- Jeden verwandten Artikel maximal EINMAL verlinken
- Den restlichen Text NICHT veraendern

VERWANDTE ARTIKEL:
{links_info}

BLOG-ARTIKEL:
{content}

Gib den kompletten Artikel mit eingefuegten Links zurueck. NUR den Markdown-Text, keine Erklaerungen."""

    # Claude aufrufen
    linked_content = await asyncio.to_thread(
        _call_claude, LINKING_SYSTEM_PROMPT, prompt, 4000
    )
    return linked_content
```

**System-Prompt fuer Link-Insertion:**
```python
LINKING_SYSTEM_PROMPT = """\
Du bist ein SEO-Experte fuer interne Verlinkung. \
Deine Aufgabe ist es, natuerliche interne Links in bestehende Blog-Artikel einzufuegen. \
Die Links muessen sich nahtlos in den Textfluss einfuegen und dem Leser Mehrwert bieten."""
```

**Done-Kriterien:**
- [ ] `index_blog()` speichert Blog-Embedding in `blog_embeddings`
- [ ] `find_related_blogs()` findet thematisch verwandte Blogs via pgvector
- [ ] `insert_internal_links()` fuegt 3-5 natuerliche Links via Claude ein
- [ ] Links sind korrekt formatiert als Markdown `[text](url)`
- [ ] Claude veraendert NUR Link-Stellen, nicht den restlichen Text
- [ ] Logging: `blog.linking_completed` mit Link-Anzahl

---

### Schritt 3: Backend — Pipeline-Integration

**Datei:** `backend/app/blogs/service.py`
**Was:** Internal Linking als optionalen Pipeline-Schritt nach der Content-Assemblierung hinzufuegen. Und nach erfolgreicher Generierung den Blog im Index registrieren.

**Erklaerung fuer die Praktikantin:**
Aktuell ist die Pipeline: Outline → Sections → Intro → Conclusion → Zusammenbauen → Speichern. Wir fuegen ZWEI neue Schritte hinzu:
1. **Nach Zusammenbauen:** Interne Links einfuegen (wenn aktiviert)
2. **Nach Speichern:** Blog im Index registrieren (damit zukuenftige Blogs auf ihn verlinken koennen)

**Aenderung an `BlogGenerateRequest` (schemas.py):**
```python
enable_internal_links: bool = True  # Default: an
```

**Aenderung in `generate_blog()` (service.py):**
```python
# Nach _assemble_markdown() und vor dem Speichern:
if request.enable_internal_links:
    await update_blog_status(blog_id, user_id, "running", "linking", 0.9)
    related = await find_related_blogs(user_id, request.title, exclude_blog_id=blog_id)
    if related:
        full_content = await insert_internal_links(full_content, related)

# Nach dem erfolgreichen Speichern:
keywords_str = f"{request.primary_keyword or ''} {' '.join(request.secondary_keywords)}"
await index_blog(blog_id, user_id, request.title, keywords_str.strip())
```

**Neuer Progress-Step:**
`BlogStatusResponse.current_step` muss `"linking"` als validen Wert akzeptieren.

**Done-Kriterien:**
- [ ] Internal Links werden eingefuegt wenn `enable_internal_links=True` und verwandte Blogs existieren
- [ ] Wenn `enable_internal_links=False`, wird der Schritt uebersprungen
- [ ] Nach Generierung wird der Blog im Embedding-Index registriert
- [ ] Erster Blog eines Nutzers: Keine Links (kein Index vorhanden) — kein Fehler
- [ ] Progress-Step "linking" wird im Frontend angezeigt

---

### Schritt 4: Backend — Nachtraegliches Linking Endpoint

**Datei:** `backend/app/blogs/routes.py`
**Was:** Neuer Endpoint `POST /api/blogs/{blog_id}/add-links` fuer bestehende Blogs die noch keine internen Links haben.

**Erklaerung fuer die Praktikantin:**
Nicht alle Blogs werden mit Internal Linking generiert — aeltere Blogs (vor dieser PRP) haben keine Links. Mit diesem Endpoint kann der Nutzer nachtraeglich Links einfuegen: Er klickt "Interne Links hinzufuegen" im Blog-Editor, das Backend sucht verwandte Blogs und fuegt Links ein.

**Endpoint:**
```python
@router.post("/{blog_id}/add-links")
async def add_internal_links(
    blog_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Add internal links to an existing blog post."""
    # 1. Blog laden
    # 2. Verwandte Blogs finden
    # 3. Links einfuegen via Claude
    # 4. Blog-Content aktualisieren
    # 5. Blog indexieren (falls noch nicht im Index)
    return {"links_added": count, "blog_id": blog_id}
```

**Done-Kriterien:**
- [ ] Endpoint laedt Blog, findet verwandte Blogs, fuegt Links ein
- [ ] Bestehende Links werden NICHT dupliziert (Claude erkennt vorhandene Links)
- [ ] Blog-Content wird in Supabase aktualisiert
- [ ] Rate Limiting: 10/hour

---

### Schritt 5: Frontend — Toggle im BlogWriter

**Datei:** `project/src/pages/BlogWriter.tsx`
**Was:** Neues Toggle "Interne Links automatisch einfuegen" in den Erweiterten Einstellungen.

**Erklaerung fuer die Praktikantin:**
Ein einfacher An/Aus-Schalter in den "Erweiterten Einstellungen" des Blog Writers. Standard: An. Wenn der Nutzer es ausschaltet, werden keine internen Links eingefuegt.

**UI:**
```
Erweiterte Einstellungen:
  ...bestehende Felder...

  ☑ Interne Links automatisch einfuegen
    Verlinkt auf deine bestehenden Blogs fuer besseres SEO
```

**Implementation:**
```typescript
const [enableInternalLinks, setEnableInternalLinks] = useState(true);

// Im API-Call:
enable_internal_links: isEasy ? true : enableInternalLinks,
```

**Done-Kriterien:**
- [ ] Toggle sichtbar in Erweiterten Einstellungen
- [ ] Default: aktiviert
- [ ] Wert wird an Backend uebergeben
- [ ] Easy Mode: immer aktiviert (kein Toggle)

---

### Schritt 6: Frontend — "Links hinzufuegen" Button im BlogEditor

**Datei:** `project/src/pages/BlogEditor.tsx`
**Was:** Neuer Button neben den Export-Buttons fuer nachtraegliches Linking.

**UI:**
```
[Speichern] [Export ▾] [🔗 Interne Links hinzufuegen] [Zu WordPress]
```

**Flow:**
1. Nutzer klickt "Interne Links hinzufuegen"
2. Loading-State
3. Backend-Call: `POST /api/blogs/{id}/add-links`
4. Erfolg: Content wird aktualisiert, Toast: "3 interne Links hinzugefuegt"
5. Blog-Content im Editor wird refreshed

**Done-Kriterien:**
- [ ] Button sichtbar im BlogEditor
- [ ] Loading-State waehrend der Link-Generierung
- [ ] Content wird im Editor aktualisiert nach erfolgreichem Linking
- [ ] Erfolgs-Toast mit Anzahl eingefuegter Links
- [ ] `npx tsc --noEmit` fehlerfrei

---

## Datenbank-Aenderungen

### Neue Tabelle + RPC (manuell in Supabase)

Siehe **Schritt 1** fuer die SQL-Anleitung.

---

## API-Aenderungen

### Neuer Endpoint

| Method | Path | Auth | Beschreibung |
|--------|------|:---:|-------------|
| `POST` | `/api/blogs/{blog_id}/add-links` | JWT | Nachtraegliches Internal Linking |

### Geaenderte Endpoints

| Method | Path | Aenderung |
|--------|------|----------|
| `POST` | `/api/blogs/generate` | Neuer optionaler Parameter `enable_internal_links: bool` + neuer Pipeline-Schritt |

---

## Frontend-Aenderungen

### Geaenderte Dateien
- `project/src/pages/BlogWriter.tsx` — Toggle fuer Internal Linking
- `project/src/pages/BlogEditor.tsx` — Button "Interne Links hinzufuegen"

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Voraussetzung:** Backend + Frontend laufen, `blog_embeddings` Tabelle existiert, mindestens 3-5 bestehende Blogs vorhanden.

**Test 1: Blog mit Internal Linking generieren**
1. Stelle sicher, dass du mindestens 3 Blogs zu aehnlichen Themen hast
2. Blog Writer → Titel: "SEO Best Practices 2026" (aehnlich zu bestehenden Blogs)
3. Toggle "Interne Links" ist aktiviert
4. Blog generieren
5. **Erwartet:** Im generierten Blog gibt es 3-5 Links zu deinen bestehenden Blogs
6. **Erwartet:** Die Links sind natuerlich im Text eingebettet (nicht in einer separaten Liste)
7. **Erwartet:** Im Markdown-Editor sichtbar als `[Ankertext](/blog/uuid)`

**Test 2: Erster Blog (kein Index)**
1. Neuer Nutzer (oder Index leeren)
2. Blog generieren mit Internal Linking aktiviert
3. **Erwartet:** Blog wird ohne Links generiert (kein Fehler, kein leerer Link-Block)

**Test 3: Nachtraegliches Linking**
1. Einen aelteren Blog oeffnen (ohne interne Links)
2. "Interne Links hinzufuegen" klicken
3. **Erwartet:** 3-5 Links werden eingefuegt, Content aktualisiert

**Test 4: Internal Linking deaktiviert**
1. Blog Writer → Toggle "Interne Links" deaktivieren
2. Blog generieren
3. **Erwartet:** Kein Linking-Schritt in der Pipeline, keine Links im Blog

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
1. **Claude veraendert Content:** Beim Link-Einfuegen koennte Claude ungewollt den Blog-Text umschreiben. *Mitigation:* Strenger System-Prompt ("Aendere NUR Link-Stellen"), Output-Laenge validieren (sollte ~gleich lang sein).
2. **Kosten:** Jeder Blog mit Internal Linking = 1 Embedding-Call + 1 Claude-Call extra. *Mitigation:* ~$0.01 extra pro Blog — akzeptabel.
3. **Link-URLs stimmen nicht:** Die Blog-URLs in Blogreich (`/blog/{uuid}`) sind intern. Wenn der Blog auf WordPress veroeffentlicht wird, stimmen die URLs nicht. *Mitigation:* Nutzer muss Links manuell anpassen oder WordPress-Slugs werden spaeter integriert.
4. **Wenige Blogs = schlechte Links:** Wenn der Nutzer nur 2 Blogs hat, sind die Verlinkungsmoeglichkeiten begrenzt. *Mitigation:* Nur verlinken wenn mindestens 3 verwandte Blogs mit Similarity > 0.35 existieren.

### Offene Fragen
1. Blog-URL-Format: `/blog/{uuid}` oder `/blog/{slug}`? (Empfehlung: UUID fuer V1 — Slug erfordert extra Logik)
2. Sollen auch die verlinkten Blogs einen Rueck-Link bekommen? (Empfehlung: Spaeter — zu komplex fuer V1)
3. Max Links pro Blog? (Empfehlung: 5 — mehr wirkt spammy)
4. Soll der Nutzer die Link-Vorschlaege vor dem Einfuegen sehen koennen? (Empfehlung: Spaeter — V1 ist automatisch)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Supabase Tabelle + RPC (Manuell)
     ↓
Schritt 2: Internal Linking Service (Backend)
     ↓
Schritt 3: Pipeline-Integration (Backend)
     ↓
Schritt 4: Nachtraegliches Linking Endpoint (Backend)
     ↓
Schritt 5: BlogWriter Toggle (Frontend)
     ↓
Schritt 6: BlogEditor Button (Frontend)
```

**Reihenfolge fuer Claude Code:** 2 → 3 → 4 (Backend) → 1 (Manuell) → 5 → 6 (Frontend)

---

## Naechster Schritt

```bash
# Dieses PRP ausfuehren:
/02-execute docs/PRPs/PRP_13_Internal_Linking.md
```
