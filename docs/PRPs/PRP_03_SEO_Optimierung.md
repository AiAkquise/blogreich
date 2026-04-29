# PRP #03: SEO-Optimierung — SERP-Analyse und intelligenter SEO-Score

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P0 (Markt-Minimum — kein Blog-Tool ohne SEO-Optimierung)
**Geschaetzte Komplexitaet:** High
**Betroffene Dateien:** 6 (3 Backend + 3 Frontend)
**Abhaengigkeiten:** Idealerweise nach PRP #01 (Style Pipeline) und PRP #02 (Outline Editor)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Aktuell hat Blogreich eine sehr einfache SEO-Bewertung: Der "SEO-Score" zaehlt nur, ob das Keyword im Text vorkommt und ob es genuegend H2-Ueberschriften gibt. Das ist wie ein Schulzeugnis, das nur prueft, ob der Schueler seinen Namen auf das Blatt geschrieben hat — es sagt nichts ueber die tatsaechliche Qualitaet aus.

Jeder Wettbewerber (Koala, SEOwriting, Writesonic) analysiert **vor** der Blog-Generierung die aktuellen Top-10 Google-Ergebnisse fuer das Ziel-Keyword. Warum? Weil Google bereits "gesagt" hat, welche Inhalte fuer dieses Keyword relevant sind. Wenn wir wissen, welche Themen, Fragen und Begriffe die Top-10 abdecken, koennen wir unseren Blog so schreiben, dass er eine **bessere Chance hat zu ranken**.

### Die Loesung

Wir bauen eine **SERP-Analyse-Pipeline** (SERP = Search Engine Results Page = Google-Suchergebnisseite):

1. **Vor der Blog-Generierung:** Tavily durchsucht das Web nach dem Haupt-Keyword und liefert die Top-10 Ergebnisse (Titel, Snippets, URLs)
2. **KI-Analyse der SERP:** Claude analysiert die Top-10 und extrahiert:
   - Welche **Entities** (Fachbegriffe, Personen, Tools) tauchen haeufig auf?
   - Welche **semantischen Keywords** (verwandte Begriffe) sollten enthalten sein?
   - Welche **Fragen** stellen Nutzer zu diesem Thema? (fuer FAQ-Sections)
   - Welche **Content-Luecken** gibt es? (Was decken die Top-10 NICHT ab?)
3. **Integration in die Blog-Pipeline:** Diese SERP-Daten werden in die Prompts injiziert, sodass der generierte Blog die wichtigsten Themen abdeckt
4. **Verbesserter SEO-Score:** Nach der Generierung wird geprueft, wie viele der empfohlenen Entities und Keywords tatsaechlich im Blog vorkommen

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **SERP** | "Search Engine Results Page" — die Google-Suchergebnisseite. Wenn du "SEO Tipps" googelst, ist die Seite mit den 10 blauen Links die SERP. |
| **Entity** | Ein konkreter "Gegenstand" in einem Text — z.B. ein Tool-Name ("Ahrefs"), eine Person ("John Mueller"), ein Konzept ("Core Web Vitals"). Google erkennt Entities und versteht so den Kontext eines Textes. |
| **Semantische Keywords** | Begriffe, die thematisch zusammenhaengen. Fuer "SEO" waeren das z.B. "Ranking", "Backlinks", "Meta-Tags". Google erwartet, dass ein guter Artikel ueber SEO auch diese verwandten Begriffe enthaelt. |
| **Content Gap / Inhaltsluecke** | Ein Thema, das die aktuellen Top-10 nicht oder nur schlecht abdecken. Wenn wir diese Luecke fuellen, haben wir einen Vorteil gegenueber der Konkurrenz. |
| **Tavily Search API** | Ein Webdienst, der das Internet durchsucht und strukturierte Ergebnisse zurueckliefert. Aehnlich wie Google, aber speziell fuer KI-Anwendungen gebaut. Wir nutzen es bereits fuer die "Realtime-Info" Content-Quelle und die Website-Analyse. |
| **Keyword-Dichte** | Wie oft ein bestimmtes Keyword im Verhaeltnis zur Gesamtwoerteranzahl vorkommt. Z.B. wenn "SEO" 15 Mal in einem 1500-Woerter-Artikel vorkommt, ist die Dichte 1%. Zu viel = "Keyword-Stuffing" (schlecht), zu wenig = Google erkennt das Thema nicht. Ideal: 1-2%. |
| **Prompt Injection** | Hier im positiven Sinne: Wir "injizieren" (fuegen ein) die SERP-Analyse-Daten in den Prompt, damit die KI weiss, welche Begriffe und Themen sie verwenden soll. |
| **JSONB** | Ein Datentyp in PostgreSQL (unserer Datenbank). JSONB speichert strukturierte Daten (wie ein verschachteltes Formular) und erlaubt schnelle Abfragen. Wir nutzen es, um die SERP-Analyse-Ergebnisse zu speichern. |

---

## Ziel

Die Blog-Generierungs-Pipeline um eine SERP-Analyse erweitern, die vor der Content-Erstellung die Top-10-Suchergebnisse fuer das Haupt-Keyword analysiert und die gewonnenen Insights (Entities, semantische Keywords, Fragen) in die Prompts integriert. Der SEO-Score wird von einer simplen Heuristik zu einer evidenzbasierten Bewertung aufgewertet.

## User Story

Als Blogreich-Nutzer
moechte ich, dass mein generierter Blog-Artikel die gleichen Themen und Begriffe abdeckt wie die aktuellen Top-10 bei Google
damit mein Artikel eine realistische Chance hat, gut zu ranken — und nicht nur "gut klingt".

## Scope

### In Scope
- **SERP-Analyse via Tavily Search API** fuer das Haupt-Keyword (Top-10-Ergebnisse)
- **KI-Extraktion** von Entities, semantischen Keywords und Nutzerfragen aus den SERP-Daten
- **Integration in Blog-Pipeline**: SERP-Daten in Outline- und Section-Prompts injizieren
- **Verbesserter SEO-Score** basierend auf Entity-Coverage und Keyword-Abdeckung
- **SEO-Panel im BlogEditor** das zeigt, welche Keywords/Entities abgedeckt sind und welche fehlen
- **SERP-Daten in Supabase speichern** (fuer spaetere Referenz und Analytics)

### Out of Scope
- AEO/GEO Optimierung fuer KI-Suche (kommt in PRP #14)
- Schema Markup / Structured Data (kommt in PRP #14)
- Backlink-Analyse
- Keyword-Schwierigkeits-Score (erfordert kostenpflichtige SEO-APIs wie Ahrefs)
- Live-SERP-Tracking (wie Writesonic)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/blogs/service.py` | Neue Funktion `_analyze_serp()`, SERP-Daten in Pipeline integrieren, SEO-Score-Berechnung verbessern | L79-106 (`_get_context_material`), L108-149 (`_calculate_seo_score`), L167-342 (`generate_blog`) |
| `backend/app/blogs/prompts.py` | Neue Funktion `build_serp_analysis_prompt()`, Outline/Section-Prompts um SERP-Daten erweitern | L74-100, L103-133 |
| `backend/app/blogs/schemas.py` | Neue Schemas: `SerpAnalysis`, `SerpEntity`, `SerpKeyword`; BlogGenerateRequest um `serp_data` erweitern | Gesamte Datei |
| `project/src/pages/BlogEditor.tsx` | SEO-Panel mit Keyword/Entity-Checkliste, verbesserter SEO-Score | L129-144 (`calculateSeoScore`) |
| `project/src/types/index.ts` | Neue Types fuer SERP-Daten | Ende der Datei |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `project/src/components/SeoPanel.tsx` | Wiederverwendbare SEO-Anzeige-Komponente (Keyword-Checkliste, Entity-Coverage, Score-Visualisierung) |

---

## Technischer Plan

### Schritt 1: Backend — SERP-Analyse Schemas

**Datei:** `backend/app/blogs/schemas.py`
**Was:** Neue Pydantic-Schemas, die die Ergebnisse der SERP-Analyse strukturieren.

**Erklaerung fuer die Praktikantin:**
Die SERP-Analyse liefert viele verschiedene Daten (Entities, Keywords, Fragen). Damit wir diese Daten ueberall im System einheitlich nutzen koennen, definieren wir "Schemas" — wie Formulare, die genau festlegen, welche Felder es gibt und welchen Typ sie haben.

**Neue Schemas:**
```python
class SerpEntity(BaseModel):
    """An entity found in top SERP results."""
    name: str                       # z.B. "Google Search Console"
    frequency: int                  # In wie vielen Top-10 Ergebnissen kommt es vor
    category: str                   # z.B. "tool", "concept", "person", "metric"

class SerpKeyword(BaseModel):
    """A semantic keyword extracted from SERP analysis."""
    keyword: str                    # z.B. "On-Page SEO"
    relevance: float                # 0.0-1.0 (wie relevant fuer das Thema)

class SerpAnalysis(BaseModel):
    """Complete SERP analysis result."""
    entities: list[SerpEntity]           # Wichtige Entities aus Top-10
    semantic_keywords: list[SerpKeyword] # Verwandte Suchbegriffe
    user_questions: list[str]            # Haeufige Nutzerfragen
    content_gaps: list[str]              # Themen die Top-10 nicht abdecken
    avg_word_count: int                  # Durchschnittliche Wortanzahl der Top-10
    top_h2_headings: list[str]           # Haeufigste H2-Ueberschriften in Top-10
```

**Done-Kriterien:**
- [ ] Alle Schemas definiert mit korrekten Typen
- [ ] `uv run mypy app/` fehlerfrei
- [ ] `uv run ruff check .` fehlerfrei

---

### Schritt 2: Backend — SERP-Analyse Funktion

**Datei:** `backend/app/blogs/service.py`
**Was:** Neue async Funktion `_analyze_serp()` die:
1. Tavily Search API aufruft fuer das Haupt-Keyword (Top-10)
2. Die Ergebnisse an Claude schickt zur Analyse
3. Strukturierte SERP-Daten zurueckgibt

**Erklaerung fuer die Praktikantin:**
Diese Funktion ist das "Gehirn" der SEO-Optimierung. Sie macht zwei Dinge nacheinander:
1. **Web-Suche:** Fragt Tavily "Was sind die Top-10 Google-Ergebnisse fuer [Keyword]?"
2. **KI-Analyse:** Gibt diese Ergebnisse an Claude und fragt "Welche Entities, Keywords und Fragen sind am wichtigsten?"

Das Ergebnis ist eine strukturierte Analyse, die spaeter in die Blog-Prompts eingebaut wird.

**Tavily Search API Aufruf:**
```python
tavily = TavilyClient(api_key=settings.tavily_api_key)
results = await asyncio.to_thread(
    tavily.search,
    query=primary_keyword,
    max_results=10,
    search_depth="advanced",     # Tiefere Analyse, bessere Ergebnisse
    include_raw_content=False,   # Nur Snippets, nicht ganze Seiten (spart Tokens)
)
```

**Claude-Analyse Prompt:**
```python
SERP_ANALYSIS_SYSTEM_PROMPT = """\
Du bist ein SEO-Experte. Analysiere die folgenden Top-10 Suchergebnisse \
fuer ein Keyword und extrahiere SEO-relevante Informationen.

OUTPUT-FORMAT (strikt JSON):
{
  "entities": [{"name": "...", "frequency": 3, "category": "tool|concept|person|metric"}],
  "semantic_keywords": [{"keyword": "...", "relevance": 0.9}],
  "user_questions": ["Frage 1?", "Frage 2?"],
  "content_gaps": ["Thema das fehlt 1", "Thema das fehlt 2"],
  "avg_word_count": 2500,
  "top_h2_headings": ["Ueberschrift 1", "Ueberschrift 2"]
}
"""
```

**Funktion:**
```python
async def _analyze_serp(
    primary_keyword: str,
    language: str = "de",
) -> dict[str, Any] | None:
    """Analyze SERP for a keyword and extract SEO insights.

    Returns structured analysis or None if keyword is not provided
    or analysis fails.
    """
    if not primary_keyword:
        return None

    # 1. Tavily Search
    # 2. Format results for Claude
    # 3. Claude analysis
    # 4. Parse JSON response
    # 5. Return structured data
```

**Done-Kriterien:**
- [ ] Funktion ruft Tavily Search API auf und erhaelt Top-10 Ergebnisse
- [ ] Funktion sendet SERP-Daten an Claude und erhaelt JSON-Analyse
- [ ] Funktion gibt `None` zurueck wenn kein `primary_keyword` angegeben
- [ ] Funktion faengt Fehler ab und gibt `None` zurueck (Blog wird trotzdem generiert, nur ohne SERP-Daten)
- [ ] Logging: `blog.serp_analysis_started`, `blog.serp_analysis_completed`, `blog.serp_analysis_failed`

---

### Schritt 3: Backend — SERP-Daten in Blog-Pipeline integrieren

**Datei:** `backend/app/blogs/service.py` und `backend/app/blogs/prompts.py`
**Was:** Die SERP-Analyse-Ergebnisse in die Outline- und Section-Prompts einbauen, damit die KI die SEO-relevanten Begriffe und Themen beruecksichtigt.

**Erklaerung fuer die Praktikantin:**
Stell dir vor, du sollst einen Aufsatz ueber "SEO" schreiben. Ohne Recherche schreibst du, was dir einfaellt. MIT Recherche (= SERP-Analyse) weisst du: "Die besten Artikel erwaehnen Google Search Console, Core Web Vitals und Backlinks. Die Leser fragen oft: Wie lange dauert SEO? Und kein Artikel erklaert den Unterschied zwischen On-Page und Technical SEO gut." Mit diesen Infos wird dein Aufsatz viel besser — und genau das machen wir fuer die KI.

**Aenderung in `generate_blog()` (service.py):**
```python
# Nach dem Laden des Style-Profiles, VOR dem Outline:
serp_data: dict[str, Any] | None = None
if request.primary_keyword:
    await update_blog_status(blog_id, user_id, "running", "serp_analysis", 0.05)
    serp_data = await _analyze_serp(request.primary_keyword, request.language)

# SERP-Daten an Prompt-Builder weitergeben:
outline_prompt = build_outline_prompt(
    title=request.title,
    ...,
    serp_data=serp_data,  # NEU
)
```

**Aenderung in Prompt-Buildern (prompts.py):**

`build_outline_prompt()` bekommt neuen Parameter `serp_data`:
```python
if serp_data:
    parts.append("\n--- SEO-ANALYSE DER TOP-10 SUCHERGEBNISSE ---")
    if serp_data.get("semantic_keywords"):
        kws = [k["keyword"] for k in serp_data["semantic_keywords"][:15]]
        parts.append(f"Wichtige semantische Keywords (integrieren!): {', '.join(kws)}")
    if serp_data.get("entities"):
        ents = [e["name"] for e in serp_data["entities"][:10]]
        parts.append(f"Wichtige Entities (erwaehnen!): {', '.join(ents)}")
    if serp_data.get("user_questions"):
        qs = serp_data["user_questions"][:5]
        parts.append(f"Nutzerfragen (beantworten!): {'; '.join(qs)}")
    if serp_data.get("content_gaps"):
        gaps = serp_data["content_gaps"][:3]
        parts.append(f"Content-Luecken (abdecken fuer Wettbewerbsvorteil!): {'; '.join(gaps)}")
    if serp_data.get("top_h2_headings"):
        h2s = serp_data["top_h2_headings"][:8]
        parts.append(f"Haeufige H2-Ueberschriften der Top-10: {', '.join(h2s)}")
```

`build_section_prompt()` bekommt ebenfalls `serp_data` um die semantischen Keywords pro Abschnitt verfuegbar zu machen.

**Done-Kriterien:**
- [ ] SERP-Analyse wird vor der Outline-Generierung durchgefuehrt (wenn Keyword vorhanden)
- [ ] SERP-Daten sind in den Outline- und Section-Prompts sichtbar
- [ ] Pipeline funktioniert auch ohne SERP-Daten (kein Keyword = kein SERP-Schritt)
- [ ] Neuer Progress-Step "serp_analysis" im Status-Tracking

---

### Schritt 4: Backend — Verbesserter SEO-Score

**Datei:** `backend/app/blogs/service.py`
**Was:** Die bestehende `_calculate_seo_score()` Funktion durch eine evidenzbasierte Version ersetzen, die prueft, wie viele der empfohlenen SERP-Entities und Keywords tatsaechlich im generierten Blog vorkommen.

**Erklaerung fuer die Praktikantin:**
Der alte SEO-Score war wie eine Checkliste mit 3 Punkten: "Hat Ueberschriften? Ja. Hat genug Woerter? Ja. Erwaehnt das Keyword? Ja. → 80 Punkte." Der neue Score ist wie eine detaillierte Pruefung: "Von 10 empfohlenen Entities sind 7 im Text enthalten (70%). Von 15 semantischen Keywords sind 12 drin (80%). Keyword-Dichte ist 1.5% (ideal). → 82 Punkte." Das ist viel aussagekraeftiger.

**Neue Score-Berechnung:**
```python
def _calculate_seo_score(
    content: str,
    primary_keyword: str | None,
    secondary_keywords: list[str],
    serp_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Calculate evidence-based SEO score.

    Returns dict with:
      - score: int (0-100)
      - details: dict with breakdown
      - missing_entities: list of entities not found in content
      - missing_keywords: list of keywords not found in content
    """
```

**Score-Gewichtung:**
| Kategorie | Max. Punkte | Erklaerung |
|-----------|:-----------:|-----------|
| Keyword-Praesenz | 15 | Haupt-Keyword im Titel, H2s und Text |
| Keyword-Dichte | 10 | 1-2% ist ideal, zu viel/wenig = Abzug |
| Sekundaere Keywords | 10 | Anteil der gefundenen Sekundaer-Keywords |
| Entity-Coverage | 20 | Wie viele SERP-Entities sind im Text? |
| Semantic Keywords | 20 | Wie viele semantische Keywords sind abgedeckt? |
| Struktur | 10 | H2/H3-Anzahl, Listenelemente, Absatzlaenge |
| Wortanzahl | 10 | Verglichen mit Durchschnitt der Top-10 |
| Nutzer-Fragen | 5 | Werden Nutzerfragen beantwortet? |
| **Gesamt** | **100** | |

**SERP-Daten speichern:**
Nach der Berechnung werden die SERP-Daten und der detaillierte Score in Supabase gespeichert:
```python
await db_update("blogs", {
    "seo_score": score_result["score"],
    "seo_data": {
        "serp_analysis": serp_data,
        "score_details": score_result["details"],
        "missing_entities": score_result["missing_entities"],
        "missing_keywords": score_result["missing_keywords"],
    },
}, {"id": blog_id, "user_id": user_id})
```

**Done-Kriterien:**
- [ ] Neue `_calculate_seo_score()` beruecksichtigt SERP-Daten wenn vorhanden
- [ ] Score-Berechnung gibt detailliertes Dict zurueck (nicht nur int)
- [ ] Fallback auf einfache Berechnung wenn keine SERP-Daten vorhanden
- [ ] SERP-Daten und Score-Details werden in `blogs.seo_data` gespeichert (JSONB)

---

### Schritt 5: Supabase — seo_data Spalte hinzufuegen

**Wo:** Supabase Dashboard (manueller Schritt)
**Was:** Neue JSONB-Spalte `seo_data` zur `blogs`-Tabelle hinzufuegen.

**Schritt-fuer-Schritt Anleitung fuer die Praktikantin:**

1. Oeffne das Supabase Dashboard: https://supabase.com/dashboard
2. Waehle das Blogreich-Projekt (dcskfgpohcdaxrhiswnb)
3. Klicke links auf "SQL Editor" (das Icon mit dem Datenbank-Symbol)
4. Klicke auf "New Query" (neues Abfrage-Fenster)
5. Kopiere folgenden SQL-Code und fuege ihn ein:

```sql
-- Neue Spalte fuer detaillierte SEO-Daten (SERP-Analyse + Score-Details)
ALTER TABLE blogs
ADD COLUMN IF NOT EXISTS seo_data jsonb DEFAULT NULL;

-- Kommentar zur Dokumentation
COMMENT ON COLUMN blogs.seo_data IS 'SERP analysis data and detailed SEO score breakdown. Contains: serp_analysis (entities, keywords, questions), score_details (category breakdown), missing_entities, missing_keywords.';
```

6. Klicke auf "Run" (gruener Button)
7. **Erwartet:** "Success. No rows returned" — das ist korrekt!
8. Pruefe: Gehe zu "Table Editor" → "blogs" → die Spalte `seo_data` sollte jetzt sichtbar sein

**Done-Kriterien:**
- [ ] `blogs.seo_data` Spalte existiert in Supabase (Typ: jsonb, nullable)
- [ ] Bestehende Blogs haben `null` als Wert (kein Datenverlust)

---

### Schritt 6: Frontend — SeoPanel Komponente

**Datei:** `project/src/components/SeoPanel.tsx` (NEU)
**Was:** Eine React-Komponente, die den SEO-Score visuell aufbereitet anzeigt — mit einer Checkliste, welche Keywords und Entities abgedeckt sind und welche fehlen.

**Erklaerung fuer die Praktikantin:**
Der SEO-Score war bisher nur eine Zahl (z.B. "72"). Jetzt zeigen wir dem Nutzer genau, WARUM der Score so ist: "7 von 10 Entities abgedeckt", "Keyword-Dichte: 1.5% (gut)", "Diese 3 Begriffe fehlen noch: ..."

**Visuelles Design:**
```
┌─────────────────────────────────────────┐
│ SEO Score: 82/100              [●●●●●○] │
│                                         │
│ Keyword-Analyse                         │
│ ✅ "SEO Tipps" — 12x erwaehnt (1.2%)  │
│ ✅ "Google Ranking" — 5x erwaehnt      │
│ ❌ "Meta-Tags" — nicht erwaehnt        │
│                                         │
│ Entity-Coverage (7/10)                  │
│ ✅ Google Search Console                │
│ ✅ Core Web Vitals                      │
│ ✅ Backlinks                            │
│ ❌ PageSpeed Insights                   │
│ ❌ Schema Markup                        │
│ ❌ Google Analytics                     │
│                                         │
│ Empfehlungen:                           │
│ • Erwaehne "PageSpeed Insights" im Text │
│ • Fuege eine FAQ-Section hinzu          │
└─────────────────────────────────────────┘
```

**Props:**
```typescript
interface SeoPanelProps {
  seoScore: number;
  seoData: {
    serp_analysis?: {
      entities: Array<{ name: string; frequency: number; category: string }>;
      semantic_keywords: Array<{ keyword: string; relevance: number }>;
      user_questions: string[];
      content_gaps: string[];
    };
    score_details?: Record<string, number>;
    missing_entities?: string[];
    missing_keywords?: string[];
  } | null;
  content: string;                // Aktueller Blog-Content (fuer Live-Abgleich)
  primaryKeyword: string | null;
}
```

**Bestehende Komponenten nutzen:**
- `Card`, `CardContent` — Container
- `Badge` — fuer Score-Visualisierung (gruen/gelb/rot)
- `Check`, `X` Icons von Lucide — fuer die Checkliste

**Done-Kriterien:**
- [ ] Score-Anzeige mit Farb-Coding (gruen >= 70, gelb 40-69, rot < 40)
- [ ] Keyword-Checkliste zeigt abgedeckte und fehlende Keywords
- [ ] Entity-Checkliste zeigt abgedeckte und fehlende Entities
- [ ] Empfehlungen basierend auf fehlenden Elementen
- [ ] Live-Update: Wenn Nutzer den Blog-Text im Editor aendert, aktualisiert sich die Checkliste
- [ ] `npx tsc --noEmit` fehlerfrei

---

### Schritt 7: Frontend — SeoPanel in BlogEditor integrieren

**Datei:** `project/src/pages/BlogEditor.tsx`
**Was:** Die bestehende einfache SEO-Score-Anzeige (Zeile 129-144) durch das neue SeoPanel ersetzen. Die `seo_data` aus Supabase laden und an das Panel uebergeben.

**Erklaerung fuer die Praktikantin:**
Der BlogEditor ist die Seite, auf der der Nutzer seinen generierten Blog sieht und bearbeiten kann. Aktuell zeigt er nur "SEO: 72" als Badge. Nach der Aenderung zeigt er ein detailliertes Panel mit Checklisten und Empfehlungen.

**Aenderungen:**
1. Blog-Query um `seo_data` erweitern (Zeile 102-115 — `seo_data` ist automatisch in `SELECT *`)
2. `Blog` Type um `seo_data` erweitern (in `types/index.ts`)
3. Bestehende `calculateSeoScore()` durch SeoPanel ersetzen
4. SeoPanel als aufklappbares Panel in der Sidebar (oder unter dem Editor) einbauen

**Done-Kriterien:**
- [ ] SeoPanel wird im BlogEditor angezeigt wenn `seo_data` vorhanden
- [ ] Fallback auf einfachen Score wenn `seo_data` null (aeltere Blogs)
- [ ] Live-Checkliste: Wenn Nutzer Keywords manuell im Editor hinzufuegt, aendert sich die Checkliste sofort
- [ ] `npx tsc --noEmit` und `npm run build` fehlerfrei

---

### Schritt 8: Backend — Progress-Step "serp_analysis" hinzufuegen

**Datei:** `backend/app/blogs/schemas.py`
**Was:** Den neuen SERP-Analyse-Schritt im Status-Tracking hinzufuegen, damit das Frontend den Fortschritt korrekt anzeigen kann.

**Aenderung:**
```python
class BlogStatusResponse(BaseModel):
    current_step: Literal[
        "serp_analysis",  # NEU
        "outline", "sections", "intro", "conclusion", "images", "done"
    ] | None = None
```

**Frontend-Anpassung in BlogWriter.tsx:**
```typescript
const stepMap: Record<string, number> = {
    serp_analysis: 0,  // NEU
    outline: 1,
    sections: 2,
    intro: 3,
    conclusion: 3,
    images: 4,
    done: 4,
};

const STEPS = [
    'SEO-Analyse läuft...',          // NEU
    'Gliederung wird erstellt...',
    'Abschnitte werden geschrieben...',
    'Einleitung & Fazit...',
    'Blog fertig!',
];
```

**Done-Kriterien:**
- [ ] `serp_analysis` ist ein valider `current_step` Wert
- [ ] Frontend zeigt "SEO-Analyse laeuft..." als ersten Progress-Step
- [ ] `uv run mypy app/` fehlerfrei

---

## Datenbank-Aenderungen

### Neue Spalte (manuell in Supabase)

```sql
ALTER TABLE blogs
ADD COLUMN IF NOT EXISTS seo_data jsonb DEFAULT NULL;
```

Siehe **Schritt 5** fuer die Schritt-fuer-Schritt-Anleitung.

---

## API-Aenderungen

### Geaenderte Endpoints

| Method | Path | Aenderung |
|--------|------|----------|
| `POST` | `/api/blogs/generate` | SERP-Analyse wird automatisch durchgefuehrt wenn `primary_keyword` vorhanden |
| `GET` | `/api/blogs/{id}/status` | Neuer `current_step` Wert: `serp_analysis` |

**Kein neuer Endpoint noetig** — die SERP-Analyse ist ein interner Pipeline-Schritt, nicht ein separater API-Call.

---

## Frontend-Aenderungen

### Neue Komponente
- `project/src/components/SeoPanel.tsx` — SEO-Analyse-Anzeige mit Checklisten

### Geaenderte Dateien
- `project/src/pages/BlogEditor.tsx` — SeoPanel einbinden
- `project/src/pages/BlogWriter.tsx` — Progress-Steps anpassen
- `project/src/types/index.ts` — `Blog` Type um `seo_data` erweitern

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Voraussetzung:** Backend + Frontend laufen, Supabase `seo_data` Spalte existiert.

**Test 1: Blog mit Keyword generieren**
1. Blog Writer oeffnen
2. Titel: "10 Tipps fuer besseres SEO" eingeben
3. Haupt-Keyword: "SEO Tipps" eingeben
4. Blog generieren
5. **Erwartet:** Progress zeigt "SEO-Analyse laeuft..." als ersten Schritt
6. **Erwartet:** Im Blog-Editor zeigt das SEO-Panel Entities und Keywords an
7. **Erwartet:** Checkliste zeigt gruene Haken fuer abgedeckte und rote X fuer fehlende Begriffe

**Test 2: Blog OHNE Keyword generieren**
1. Blog Writer oeffnen, Titel eingeben, KEIN Keyword
2. Blog generieren
3. **Erwartet:** Kein SERP-Analyse-Schritt, einfacher SEO-Score wie bisher, kein SeoPanel (oder einfaches Panel)

**Test 3: Blog manuell verbessern**
1. Blog im Editor oeffnen (mit SEO-Panel)
2. Einen fehlenden Entity-Begriff manuell in den Text einfuegen
3. **Erwartet:** Checkliste aktualisiert sich sofort (roter X wird gruener Haken)

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
1. **Tavily-Kosten steigen**: Jeder Blog mit Keyword = 1 Tavily Search Call + 1 Claude Call fuer Analyse. *Mitigation:* SERP-Analyse nur wenn Keyword vorhanden, Ergebnisse in `seo_data` cachen.
2. **SERP-Analyse dauert zu lang**: Tavily Search + Claude Analyse zusammen ~5-10 Sekunden. *Mitigation:* Parallel zur Context-Material-Beschaffung ausfuehren (`asyncio.gather`).
3. **Tavily liefert schlechte Ergebnisse fuer deutsche Keywords**: Tavily ist primaer englischsprachig. *Mitigation:* `search_depth="advanced"` nutzen, deutsche Ergebnisse explizit anfordern.
4. **Claude JSON-Parsing fehlschlaegt**: Die SERP-Analyse-Response koennte kein valides JSON sein. *Mitigation:* Bestehende `_extract_json()` Funktion + Fallback auf `None`.

### Offene Fragen
1. Soll die SERP-Analyse auch im Outline-Endpoint (PRP #02) verfuegbar sein? (Empfehlung: Ja — SERP-Daten helfen auch bei der Gliederungs-Erstellung)
2. Soll der Nutzer die SERP-Analyse VOR der Generierung sehen koennen? (Empfehlung: Spaeter — in V1 ist sie ein interner Pipeline-Schritt)
3. Maximum Entities/Keywords im Prompt? (Empfehlung: Top 10 Entities, Top 15 Keywords — sonst wird der Prompt zu lang)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: SERP-Schemas (Backend)
     ↓
Schritt 2: _analyze_serp() Funktion (Backend)
     ↓
Schritt 3: Pipeline-Integration (Backend + Prompts)
     ↓
Schritt 4: Verbesserter SEO-Score (Backend)
     ↓
Schritt 5: Supabase seo_data Spalte (Manuell)
     ↓
Schritt 6: SeoPanel Komponente (Frontend)
     ↓
Schritt 7: BlogEditor Integration (Frontend)
     ↓
Schritt 8: Progress-Step anpassen (Backend + Frontend)
```

**Reihenfolge fuer Claude Code:** 1 → 2 → 3 → 4 → 8 (Backend komplett) → 5 (Manuell) → 6 → 7 (Frontend komplett)

**Hinweis:** Schritt 5 (Supabase SQL) muss von der Praktikantin manuell ausgefuehrt werden, BEVOR das Frontend getestet wird.

---

## Naechster Schritt

```bash
# Dieses PRP ausfuehren:
/02-execute docs/PRPs/PRP_03_SEO_Optimierung.md
```
