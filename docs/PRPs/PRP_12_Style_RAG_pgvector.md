# PRP #12: Style RAG mit pgvector — Tiefe Unternehmens-Personalisierung durch Vektor-Suche

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P2 (Skalierung — verbessert den USP erheblich)
**Geschaetzte Komplexitaet:** High
**Betroffene Dateien:** 6 (4 Backend + 1 Supabase + 1 ENV)
**Abhaengigkeiten:** PRP #01 (Style Pipeline Integration — muss vorher implementiert sein)
**Voraussetzung:** pgvector Extension ist bereits installiert (v0.8.0, Schema: public)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

In PRP #01 haben wir das Company Style-Profile in die Blog-Pipeline integriert. Das funktioniert — aber es gibt eine Einschraenkung: Das Style-Profile ist ein **einzelner Text** (~500-1000 Woerter), der die gesamte Schreibweise eines Unternehmens zusammenfasst. Fuer die KI ist das wie eine knappe Notiz.

Stell dir vor, du sollst im Stil eines Autors schreiben. PRP #01 gibt dir eine kurze Beschreibung: "Der Autor schreibt formell, nutzt Fachbegriffe, siezt die Leser." Das ist hilfreich — aber wie viel besser waere es, wenn du **10 echte Textbeispiele** des Autors lesen koenntest? Dann wuerdest du seinen Stil viel genauer treffen.

### Die Loesung

Wir bauen ein **RAG-System** (Retrieval-Augmented Generation) fuer Company Styles:

1. **Chunking:** Wenn eine Unternehmens-Website analysiert wird (Tavily Crawl), speichern wir die gecrawlten Texte nicht nur als Zusammenfassung, sondern als **einzelne Text-Chunks** (Absaetze/Abschnitte)
2. **Embedding:** Jeder Chunk wird in einen **Vektor** umgewandelt (eine lange Liste von Zahlen, die die Bedeutung des Textes repraesentiert)
3. **Speicherung:** Diese Vektoren werden in Supabase gespeichert (pgvector)
4. **Retrieval:** Wenn ein Blog generiert wird, suchen wir die **relevantesten Chunks** zum Blog-Thema — also die Textbeispiele, die am aehnlichsten zum Blog-Thema sind
5. **Augmentation:** Diese echten Textbeispiele werden der KI mitgegeben, sodass sie den Stil viel genauer imitieren kann

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **RAG** | "Retrieval-Augmented Generation" — eine KI-Technik, bei der man zuerst relevante Informationen aus einer Datenbank **abruft** (Retrieval) und dann der KI als Kontext **mitgibt** (Augmented), damit sie bessere Antworten **generiert** (Generation). Statt alles aus dem "Gedaechtnis" zu holen, schaut die KI in einer Wissensdatenbank nach. |
| **Embedding / Vektor** | Eine mathematische Darstellung von Text als Liste von Zahlen. "SEO Tipps fuer Anfaenger" koennte zum Vektor `[0.23, -0.45, 0.78, ...]` werden (1536 Zahlen). Texte mit aehnlicher Bedeutung haben aehnliche Vektoren. So kann der Computer "Aehnlichkeit" berechnen, ohne den Text zu "verstehen". |
| **Embedding-Modell** | Ein KI-Modell, das Text in Vektoren umwandelt. Wir nutzen OpenAI `text-embedding-3-small` (guenstig, schnell, 1536 Dimensionen) oder Voyage AI `voyage-3-lite`. |
| **pgvector** | Eine PostgreSQL-Extension (Erweiterung) die Vektor-Daten speichern und durchsuchen kann. Supabase hat pgvector bereits installiert — wir muessen es nur nutzen. |
| **Cosine Similarity / Kosinus-Aehnlichkeit** | Ein Mass fuer die Aehnlichkeit zweier Vektoren. Wert zwischen -1 und 1. Je naeher an 1, desto aehnlicher sind die Texte. Z.B. "SEO Tipps" und "Google Rankings verbessern" haetten eine hohe Aehnlichkeit (~0.85), waehrend "SEO Tipps" und "Kuchenrezept" niedrig waeren (~0.15). |
| **Chunk** | Ein Stueck Text. Statt einen ganzen 5000-Woerter-Artikel als einen Vektor zu speichern, teilen wir ihn in kleinere Stuecke (z.B. je 300-500 Woerter). Das ist praeziser, weil jeder Chunk ein bestimmtes Thema abdeckt. |
| **Dimension** | Die Laenge des Vektor-Arrays. `text-embedding-3-small` erzeugt Vektoren mit 1536 Dimensionen — also 1536 Zahlen pro Text. Mehr Dimensionen = mehr Nuancen, aber auch mehr Speicher. |
| **HNSW Index** | Ein spezieller Datenbank-Index fuer schnelle Vektor-Suche. Ohne Index muesste die Datenbank JEDEN Vektor mit der Suchanfrage vergleichen. Mit HNSW geht es viel schneller (logarithmisch statt linear). |
| **RPC (Remote Procedure Call)** | Eine Datenbank-Funktion, die man von aussen aufrufen kann. Supabase erlaubt es, eigene SQL-Funktionen zu erstellen und sie ueber die API aufzurufen: `supabase.rpc("match_style_chunks", {...})`. |
| **Similarity Search** | Suche nach den aehnlichsten Vektoren zu einem Suchanfrage-Vektor. "Finde mir die 5 Text-Chunks die am aehnlichsten zum Thema 'SEO Optimierung' sind." |

---

## Ziel

Die Company-Style-Personalisierung von einer einfachen Text-Zusammenfassung (PRP #01) zu einem echten RAG-System erweitern. Gecrawlte Website-Inhalte werden als Vektor-Embeddings gespeichert und bei der Blog-Generierung werden die thematisch relevantesten Text-Chunks abgerufen und der KI als echte Stilbeispiele mitgegeben.

## User Story

Als Blogreich-Nutzer
moechte ich, dass meine generierten Blogs nicht nur die allgemeine Tonalitaet meines Unternehmens treffen, sondern auch spezifische Formulierungen und Fachbegriffe verwenden, die auf meiner Website vorkommen
damit die Blogs sich anfuehlen als waeren sie von meinem internen Team geschrieben.

## Scope

### In Scope
- **Embedding-Generierung** bei Company-Website-Analyse (Tavily Crawl → Chunks → Embeddings → pgvector)
- **Supabase pgvector-Tabelle** `company_style_embeddings` mit Vektor-Spalte
- **RPC-Funktion** `match_style_chunks` fuer Similarity Search
- **Retrieval in Blog-Pipeline** die Top-5 relevantesten Chunks zum Blog-Thema abrufen
- **Kontext-Injection** die Chunks als Stilbeispiele in den System-Prompt einbauen
- **OpenAI Embedding API** (`text-embedding-3-small`, 1536 Dimensionen)
- **Neue ENV-Variable** `OPENAI_API_KEY` fuer Embeddings

### Out of Scope
- Eigenes Embedding-Modell trainieren
- Frontend-UI fuer Style-Chunks (kein Benutzer-Interface — alles automatisch im Hintergrund)
- Embeddings fuer Blog-Content (nur fuer Company-Style)
- Multi-Modal Embeddings (nur Text, keine Bilder)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/companies/service.py` | Nach Style-Analyse: Chunks erstellen + Embeddings generieren + in pgvector speichern | L117-198 (Phase 3: Analyse + Speichern) |
| `backend/app/blogs/service.py` | Vor Blog-Generierung: Top-5 Style-Chunks per Similarity Search abrufen + in System-Prompt injizieren | L197-230 (Style laden), PRP #01 Code |
| `backend/app/core/config.py` | Neue Settings: `openai_api_key` | Ende |
| `backend/pyproject.toml` | Neue Dependency: `openai` (fuer Embeddings) | L6-16 |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `backend/app/core/embeddings.py` | Zentraler Embedding-Service (Text → Vektor via OpenAI API) |

---

## Technischer Plan

### Schritt 1: Supabase — pgvector Tabelle und RPC-Funktion erstellen (MANUELL)

**Wo:** Supabase Dashboard → SQL Editor
**Was:** Tabelle `company_style_embeddings` mit Vektor-Spalte und eine RPC-Funktion fuer Similarity Search.

**Erklaerung fuer die Praktikantin:**
pgvector ist bereits in unserem Supabase-Projekt installiert (v0.8.0). Wir muessen nur eine Tabelle erstellen die Vektoren speichern kann, und eine Funktion die nach aehnlichen Vektoren suchen kann.

Stell dir die Tabelle als eine Bibliothek vor: Jedes "Buch" (Chunk) hat einen Titel, einen Text und einen "Fingerabdruck" (Vektor). Die Suchfunktion vergleicht den Fingerabdruck deiner Suchanfrage mit allen Fingerabdruecken in der Bibliothek und gibt die aehnlichsten zurueck.

**SQL:**
```sql
-- Tabelle fuer Style-Chunks mit Vektor-Embeddings
CREATE TABLE IF NOT EXISTS company_style_embeddings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
        -- Der Original-Textchunk (300-500 Woerter)
    metadata jsonb DEFAULT '{}',
        -- z.B. {"source_url": "...", "page_title": "...", "chunk_index": 0}
    embedding vector(1536) NOT NULL,
        -- Der Vektor (1536 Dimensionen fuer text-embedding-3-small)
    created_at timestamptz DEFAULT now()
);

-- Index fuer schnelle Vektor-Suche (HNSW = Hierarchical Navigable Small World)
CREATE INDEX IF NOT EXISTS idx_style_embeddings_vector
ON company_style_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Index fuer schnelle Abfragen pro Company
CREATE INDEX IF NOT EXISTS idx_style_embeddings_company
ON company_style_embeddings(company_id);

-- RLS (Row Level Security)
ALTER TABLE company_style_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own style embeddings"
ON company_style_embeddings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RPC-Funktion fuer Similarity Search
-- Aufruf: supabase.rpc("match_style_chunks", {query_embedding: [...], company_id: "...", match_count: 5})
CREATE OR REPLACE FUNCTION match_style_chunks(
    query_embedding vector(1536),
    target_company_id uuid,
    match_count int DEFAULT 5,
    match_threshold float DEFAULT 0.3
)
RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cse.id,
        cse.content,
        cse.metadata,
        1 - (cse.embedding <=> query_embedding) AS similarity
    FROM company_style_embeddings cse
    WHERE cse.company_id = target_company_id
      AND 1 - (cse.embedding <=> query_embedding) > match_threshold
    ORDER BY cse.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON TABLE company_style_embeddings IS 'Vector embeddings of company website content chunks for RAG-based style personalization.';
COMMENT ON FUNCTION match_style_chunks IS 'Find the most similar style chunks for a given query embedding and company.';
```

**Schritt-fuer-Schritt fuer die Praktikantin:**
1. Supabase Dashboard oeffnen
2. SQL Editor → New Query
3. Den GESAMTEN SQL-Code oben einfuegen
4. "Run" klicken
5. **Erwartet:** "Success. No rows returned"
6. Pruefe: Table Editor → `company_style_embeddings` sollte sichtbar sein mit einer `embedding` Spalte (Typ: vector)

**Done-Kriterien:**
- [ ] Tabelle `company_style_embeddings` existiert mit `embedding vector(1536)` Spalte
- [ ] HNSW Index existiert
- [ ] RLS aktiviert
- [ ] RPC-Funktion `match_style_chunks` existiert und ist aufrufbar

---

### Schritt 2: Backend — Embedding Service

**Datei:** `backend/app/core/embeddings.py` (NEU)
**Was:** Zentraler Service der Texte in Vektoren umwandelt (via OpenAI Embedding API).

**Erklaerung fuer die Praktikantin:**
Dieser Service ist wie ein "Uebersetzer" — er nimmt normalen Text und uebersetzt ihn in eine Liste von 1536 Zahlen (Vektor). Diese Zahlen repraesentieren die *Bedeutung* des Textes, nicht die Woerter selbst. Zwei Texte ueber das gleiche Thema haben aehnliche Zahlenlisten, auch wenn sie voellig unterschiedliche Woerter verwenden.

Wir nutzen die OpenAI Embedding API (`text-embedding-3-small`), weil:
- Sie ist die guenstigste Option (~$0.02 pro 1 Million Tokens)
- 1536 Dimensionen sind ein guter Kompromiss zwischen Qualitaet und Groesse
- Die Anthropic API bietet (Stand 2026) kein eigenes Embedding-Modell an

**Implementierung:**
```python
import openai
from app.core.config import get_settings

async def generate_embedding(text: str) -> list[float]:
    """Generate a 1536-dimensional embedding vector for a text.

    Uses OpenAI text-embedding-3-small model.
    """
    settings = get_settings()
    client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding

async def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for multiple texts in one API call.

    More efficient than calling generate_embedding() in a loop.
    Max 2048 texts per batch (OpenAI limit).
    """
    settings = get_settings()
    client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [item.embedding for item in response.data]
```

**Neue Dependency:** `openai` in `pyproject.toml`
```toml
"openai>=1.40",
```

**Neue Config:** in `config.py`
```python
openai_api_key: str = ""  # Fuer Embeddings (text-embedding-3-small)
```

**Neue ENV-Variable:** in `.env`
```env
OPENAI_API_KEY=sk-...
```

**Manueller Schritt fuer die Praktikantin — OpenAI API Key beschaffen:**
1. Gehe zu https://platform.openai.com/api-keys
2. Erstelle einen neuen API Key
3. Kopiere ihn und fuege in `.env` ein: `OPENAI_API_KEY=sk-...`
4. Lade $5-10 Guthaben auf (Embeddings sind sehr guenstig: ~$0.02 pro 1M Tokens, eine Website-Analyse kostet ca. $0.001)

**Done-Kriterien:**
- [ ] `generate_embedding("Hello")` gibt eine Liste mit 1536 Floats zurueck
- [ ] `generate_embeddings_batch(["Hello", "World"])` gibt 2 Embedding-Listen zurueck
- [ ] Fehlerbehandlung wenn API Key fehlt oder ungueltig
- [ ] `uv run mypy app/` fehlerfrei

---

### Schritt 3: Backend — Chunking und Embedding bei Company-Analyse

**Datei:** `backend/app/companies/service.py`
**Was:** Nach der Style-Analyse (Phase 3) die gecrawlten Website-Inhalte in Chunks aufteilen, Embeddings generieren und in `company_style_embeddings` speichern.

**Erklaerung fuer die Praktikantin:**
Aktuell passiert bei der Website-Analyse folgendes:
1. Tavily crawlt die Website → `all_content` (Liste von Seitentexten)
2. Claude analysiert den Content → `style_data` (Zusammenfassung)
3. `style_data` wird in `companies.style_profile` gespeichert

Wir fuegen einen **4. Schritt** hinzu:
4. `all_content` wird in Chunks aufgeteilt (je ~400 Woerter)
5. Jeder Chunk wird in einen Vektor umgewandelt (Embedding)
6. Alle Chunks+Vektoren werden in `company_style_embeddings` gespeichert

**Chunking-Strategie:**
```python
def _chunk_text(text: str, max_words: int = 400, overlap_words: int = 50) -> list[str]:
    """Split text into overlapping chunks of ~max_words.

    Overlap ensures that information at chunk boundaries isn't lost.
    """
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + max_words, len(words))
        chunk = " ".join(words[start:end])
        if len(chunk.strip()) > 50:  # Mindestens 50 Zeichen
            chunks.append(chunk)
        start += max_words - overlap_words  # Overlap
    return chunks
```

**Integration in `analyze_company_website()`:**
```python
# Nach der Style-Analyse (Phase 3), NEUER Phase 4:
# Phase 4: Chunk + Embed + Store
from app.core.embeddings import generate_embeddings_batch

# Bestehende Embeddings loeschen (bei Re-Analyse)
await db_delete("company_style_embeddings", {
    "company_id": company_id, "user_id": user_id
})

# Alle gecrawlten Inhalte chunken
all_chunks: list[dict] = []
for i, page_content in enumerate(all_content):
    chunks = _chunk_text(page_content)
    for j, chunk in enumerate(chunks):
        all_chunks.append({
            "content": chunk,
            "metadata": {"source_url": extract_urls[i] if i < len(extract_urls) else "", "chunk_index": j},
        })

# Embeddings generieren (max 100 Chunks — Kostenoptimierung)
chunks_to_embed = all_chunks[:100]
texts = [c["content"] for c in chunks_to_embed]
embeddings = await generate_embeddings_batch(texts)

# In Supabase speichern
for chunk, embedding in zip(chunks_to_embed, embeddings):
    await db_insert("company_style_embeddings", {
        "company_id": company_id,
        "user_id": user_id,
        "content": chunk["content"],
        "metadata": chunk["metadata"],
        "embedding": embedding,  # list[float] → pgvector
    })
```

**Done-Kriterien:**
- [ ] Website-Analyse erstellt Chunks aus gecrawlten Inhalten
- [ ] Jeder Chunk wird in einen Vektor umgewandelt
- [ ] Chunks+Vektoren werden in `company_style_embeddings` gespeichert
- [ ] Bei Re-Analyse werden alte Embeddings geloescht und neue erstellt
- [ ] Max 100 Chunks pro Company (Kostenkontrolle)
- [ ] Logging: `company.embeddings_created` mit Chunk-Anzahl

---

### Schritt 4: Backend — Style RAG in Blog-Pipeline

**Datei:** `backend/app/blogs/service.py`
**Was:** Vor der Blog-Generierung die Top-5 relevantesten Style-Chunks per Similarity Search abrufen und als Stilbeispiele in den System-Prompt injizieren.

**Erklaerung fuer die Praktikantin:**
Hier passiert die Magie: Wenn ein Blog zum Thema "SEO Tipps" generiert wird, suchen wir in den gespeicherten Website-Chunks des Unternehmens nach Texten, die thematisch am naechsten an "SEO" dran sind. Wenn das Unternehmen z.B. auf seiner Website einen Artikel ueber "Suchmaschinenoptimierung" hat, wird dieser Chunk gefunden und der KI als Beispiel gegeben: "So schreibt dieses Unternehmen ueber aehnliche Themen — imitiere diesen Stil."

**Flow:**
```python
# In generate_blog(), nach dem Laden des Style-Profiles:

style_examples: list[str] = []
if request.company_id:
    # 1. Embedding fuer den Blog-Titel generieren
    from app.core.embeddings import generate_embedding
    title_embedding = await generate_embedding(request.title)

    # 2. Similarity Search via Supabase RPC
    from app.core.supabase_client import rpc_call
    results = await rpc_call("match_style_chunks", {
        "query_embedding": title_embedding,
        "target_company_id": request.company_id,
        "match_count": 5,
        "match_threshold": 0.3,
    })

    if results:
        style_examples = [r["content"] for r in results]

# 3. Style-Beispiele in System-Prompt injizieren
if style_examples:
    examples_text = "\n\n---\n\n".join(style_examples[:5])
    style_context += f"\n\nECHTE TEXTBEISPIELE DES UNTERNEHMENS (imitiere diesen Stil!):\n{examples_text}"
```

**Neue Funktion in `supabase_client.py`:**
```python
async def rpc_call(function_name: str, params: dict) -> list[dict]:
    """Call a Supabase RPC function (e.g. for pgvector similarity search)."""
    def _call() -> Any:
        client = _get_client()
        return client.rpc(function_name, params).execute()
    result = await asyncio.to_thread(_call)
    return result.data or []
```

**Done-Kriterien:**
- [ ] Blog-Generierung ruft Similarity Search auf wenn `company_id` vorhanden UND Embeddings existieren
- [ ] Top-5 relevanteste Style-Chunks werden als Beispiele in den System-Prompt injiziert
- [ ] Wenn keine Embeddings existieren (Company nie analysiert), funktioniert alles wie bisher (Fallback)
- [ ] Wenn keine aehnlichen Chunks gefunden werden (threshold zu hoch), wird kein leerer Beispiel-Block eingefuegt
- [ ] Logging: `blog.style_rag_retrieved` mit Chunk-Anzahl und durchschnittlicher Similarity

---

### Schritt 5: Backend — Supabase Client erweitern

**Datei:** `backend/app/core/supabase_client.py`
**Was:** `rpc_call()` Funktion und `db_delete()` Funktion hinzufuegen (fuer Similarity Search und Chunk-Cleanup).

**Neue Funktionen:**
```python
async def rpc_call(function_name: str, params: dict[str, Any]) -> list[dict[str, Any]]:
    """Call a Supabase RPC function."""

async def db_delete(table: str, filters: dict[str, Any]) -> Any:
    """Delete rows from a Supabase table matching filters."""
```

**Done-Kriterien:**
- [ ] `rpc_call("match_style_chunks", {...})` funktioniert
- [ ] `db_delete("company_style_embeddings", {"company_id": "..."})` loescht korrekt
- [ ] `uv run mypy app/` fehlerfrei

---

## Datenbank-Aenderungen

### Neue Tabelle + RPC-Funktion (manuell in Supabase)

Siehe **Schritt 1** fuer die komplette SQL-Anleitung.

---

## API-Aenderungen

**Keine neuen Endpoints.** Die Embedding-Erstellung passiert automatisch bei `POST /api/companies/analyze` und das Retrieval passiert automatisch bei `POST /api/blogs/generate`. Der Nutzer merkt nichts — die Blogs werden einfach besser.

---

## Frontend-Aenderungen

**Keine.** Alles passiert im Hintergrund. Optional koennte man spaeter in der Company-Detail-Ansicht anzeigen: "42 Style-Chunks gespeichert" — aber das ist fuer diese PRP out of scope.

---

## Neue ENV-Variablen

```env
OPENAI_API_KEY=sk-...   # Fuer text-embedding-3-small (Embeddings)
```

---

## Kosten-Kalkulation

| Aktion | Kosten |
|--------|--------|
| Website analysieren (100 Chunks embedden) | ~$0.001 (vernachlaessigbar) |
| Blog generieren (1 Title-Embedding + Similarity Search) | ~$0.00001 |
| **Jaehrliche Kosten bei 1000 Companies** | **~$1** |

Embeddings sind extrem guenstig — die Kosten sind vernachlaessigbar im Vergleich zu Claude API Calls.

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Voraussetzung:** Backend laeuft, Supabase Tabelle + RPC existieren, OpenAI API Key in `.env`.

**Test 1: Company analysieren → Embeddings pruefen**
1. Ein Unternehmen mit Website-URL anlegen
2. "Analysieren" klicken
3. Warten bis Analyse fertig
4. In Supabase → Table Editor → `company_style_embeddings`
5. **Erwartet:** Mehrere Zeilen mit dem `company_id` des Unternehmens, jede mit einer `embedding` Spalte (viele Zahlen)

**Test 2: Blog mit RAG-Style generieren**
1. Blog Writer → Titel: "SEO Strategie fuer kleine Unternehmen"
2. Unternehmen aus Test 1 auswaehlen
3. Blog generieren
4. **Erwartet:** Blog klingt mehr nach dem Unternehmen als ohne RAG
5. In den Backend-Logs pruefen: `blog.style_rag_retrieved` zeigt an, wie viele Chunks gefunden wurden

**Test 3: Blog OHNE Company**
1. Blog Writer → Titel eingeben, KEIN Unternehmen waehlen
2. Blog generieren
3. **Erwartet:** Funktioniert wie bisher, kein RAG, kein Fehler

**Test 4: Company ohne Embeddings**
1. Ein Unternehmen anlegen OHNE Website-Analyse
2. Blog mit diesem Unternehmen generieren
3. **Erwartet:** Kein Fehler — Fallback auf Style-Profile-Text (PRP #01)

### Validierung

```bash
# Backend
cd backend && uv run ruff check . && uv run mypy app/ && uv run pytest -v

# Frontend (unveraendert)
cd project && npx tsc --noEmit && npm run build
```

---

## Risiken & Offene Fragen

### Risiken
1. **OpenAI Dependency:** Wir nutzen Anthropic fuer LLM-Calls und OpenAI nur fuer Embeddings. Das ist ein zusaetzlicher Anbieter. *Mitigation:* Embedding-Service ist abstrahiert — spaeter auf Voyage AI oder lokales Modell wechselbar.
2. **Embedding-Qualitaet fuer Deutsch:** `text-embedding-3-small` ist primaer englisch trainiert. *Mitigation:* Funktioniert gut fuer Deutsch (getestet), aber fuer maximale Qualitaet koennte man auf `text-embedding-3-large` oder Voyage `voyage-multilingual-2` upgraden.
3. **Supabase RPC + pgvector Latenz:** Similarity Search ueber pgvector kann bei vielen Vektoren langsam werden. *Mitigation:* HNSW Index beschleunigt die Suche; max 100 Chunks pro Company begrenzt die Datenmenge.
4. **Chunk-Ueberlappung:** Wenn Chunks ueberlappen, koennen redundante Ergebnisse zurueckkommen. *Mitigation:* Overlap ist bewusst (50 Woerter) fuer Kontext-Kontinuitaet; 5 Chunks sind wenig genug dass Redundanz akzeptabel ist.

### Offene Fragen
1. OpenAI oder Voyage AI fuer Embeddings? (Empfehlung: OpenAI `text-embedding-3-small` — am guenstigsten und am besten dokumentiert)
2. Max Chunks pro Company? (Empfehlung: 100 — deckt 40.000+ Woerter ab, mehr als genug fuer eine Website)
3. Chunk-Groesse? (Empfehlung: 400 Woerter mit 50 Woerter Overlap)
4. Similarity Threshold? (Empfehlung: 0.3 — niedrig genug fuer relevante Ergebnisse, hoch genug um Muell auszufiltern)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Supabase Tabelle + RPC (Manuell)
     ↓
Schritt 2: Embedding Service (Backend)
     ↓
Schritt 5: Supabase Client erweitern (Backend)
     ↓
Schritt 3: Chunking + Embedding bei Company-Analyse (Backend)
     ↓
Schritt 4: RAG Retrieval in Blog-Pipeline (Backend)
```

**Reihenfolge fuer Claude Code:** 2 → 5 → 3 → 4 (Backend) → 1 (Manuell/Supabase)

---

## Naechster Schritt

```bash
# Dieses PRP ausfuehren:
/02-execute docs/PRPs/PRP_12_Style_RAG_pgvector.md
```
