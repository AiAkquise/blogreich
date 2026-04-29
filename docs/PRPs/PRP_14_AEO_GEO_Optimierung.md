# PRP #14: AEO/GEO Optimierung — Content fuer KI-Suche und Schema Markup

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P2 (Skalierung — Emerging Trend, Differenzierer gegenueber Koala/GravityWrite)
**Geschaetzte Komplexitaet:** Medium
**Betroffene Dateien:** 6 (3 Backend + 2 Frontend + 1 Supabase)
**Abhaengigkeiten:** PRP #03 (SEO Optimierung — baut auf SERP-Analyse auf)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Die Art, wie Menschen Informationen im Internet finden, veraendert sich grundlegend. Frueher hat man etwas bei Google gesucht und auf einen der 10 blauen Links geklickt. Heute fragen immer mehr Menschen direkt eine KI:
- "ChatGPT, was sind die besten SEO-Tipps?"
- "Perplexity, wie erstelle ich einen Blog?"
- "Google AI Overview, welche Tools brauche ich fuer Content Marketing?"

Diese KI-Systeme **zitieren** Quellen — wenn dein Blog-Artikel als Quelle zitiert wird, bekommst du Traffic. Aber dein Artikel muss dafuer bestimmte Kriterien erfuellen:
- **Klare, direkte Antworten** auf haeufige Fragen (FAQ-Sections)
- **Strukturierte Daten** (Schema Markup), damit KI-Systeme den Inhalt maschinell verstehen
- **Autoritaets-Signale** (E-E-A-T: Experience, Expertise, Authoritativeness, Trustworthiness)

Aktuell optimiert Blogreich nur fuer **traditionelles SEO** (Google-Suchergebnisse). SEOwriting.ai ist der einzige Wettbewerber der bereits fuer KI-Suche optimiert — das ist eine Chance fuer Blogreich.

### Die Loesung

Wir erweitern die Blog-Generierung um drei Aspekte:

1. **FAQ-Section Generator:** Am Ende jedes Blogs wird automatisch eine FAQ-Sektion generiert mit den 5-7 haeufigsten Fragen zum Thema (basierend auf SERP-Analyse aus PRP #03)
2. **Schema Markup Generator:** Fuer jeden Blog wird automatisch JSON-LD Schema Markup generiert (Article + FAQPage), das KI-Systemen hilft den Content zu verstehen
3. **AEO-Optimierung in Prompts:** Die Blog-Prompts werden so angepasst, dass der generierte Content "KI-zitierbar" ist (klare Definitionen, direkte Antworten, Quellenangaben)

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **AEO** | "Answer Engine Optimization" — Optimierung fuer KI-Suchmaschinen (ChatGPT, Perplexity, Google AI). Ziel: Von der KI als Quelle zitiert werden. Wie SEO, aber statt fuer Google optimierst du fuer KI-Antwort-Engines. |
| **GEO** | "Generative Engine Optimization" — ein anderer Name fuer das gleiche Konzept. Wird von Writesonic popularisiert. AEO und GEO sind austauschbar. |
| **Schema Markup / Structured Data** | Ein Code-Snippet (JSON-LD Format), das Suchmaschinen und KI-Systemen sagt, was der Inhalt einer Seite IST. Z.B. "Diese Seite ist ein Artikel, geschrieben am 29.04.2026, vom Autor 'Max Mustermann', mit diesen FAQs." Ohne Schema Markup muss die KI den Text selbst interpretieren — mit Schema Markup bekommt sie die Infos auf dem Silbertablett. |
| **JSON-LD** | "JSON for Linked Data" — ein Format fuer Schema Markup. Es wird als `<script type="application/ld+json">` Tag in den HTML-Code eingefuegt. Sieht aus wie normales JSON, wird aber von Google und KI-Systemen gelesen. |
| **Article Schema** | Ein Schema-Typ der beschreibt, dass eine Seite ein Artikel ist: Titel, Autor, Datum, Beschreibung, Bild-URL. Google zeigt Artikel mit Schema oft als "Rich Snippets" in den Suchergebnissen an (mit Bild, Datum, Autor). |
| **FAQPage Schema** | Ein Schema-Typ der beschreibt, dass eine Seite FAQ enthaelt: Frage 1 + Antwort 1, Frage 2 + Antwort 2. Google kann FAQs direkt in den Suchergebnissen anzeigen (Aufklapp-Boxen). KI-Systeme zitieren FAQ-Antworten besonders gerne. |
| **E-E-A-T** | "Experience, Expertise, Authoritativeness, Trustworthiness" — Googles Qualitaetskriterien fuer Content. KI-Suchmaschinen nutzen aehnliche Kriterien um zu entscheiden, welche Quellen sie zitieren. |
| **Rich Snippets** | Erweiterte Suchergebnis-Darstellungen bei Google: Sterne-Bewertungen, FAQ-Aufklapp-Boxen, Rezept-Karten, Artikel-Vorschauen. Schema Markup macht Rich Snippets moeglich. |
| **Perplexity / ChatGPT Search** | KI-Suchmaschinen die Fragen beantworten und dabei Quellen-Links angeben. Wenn dein Blog als Quelle zitiert wird, bekommst du "KI-Traffic". |

---

## Ziel

Die Blog-Generierung um AEO/GEO-Optimierung erweitern: Automatische FAQ-Sections basierend auf SERP-Nutzerfragen, Schema Markup (Article + FAQPage als JSON-LD), und AEO-optimierte Prompts die den Content "KI-zitierbar" machen.

## User Story

Als Blogreich-Nutzer
moechte ich, dass meine generierten Blogs nicht nur bei Google ranken, sondern auch von ChatGPT, Perplexity und Google AI als Quelle zitiert werden
damit ich Traffic aus ALLEN Suchkanaelen bekomme — nicht nur aus der klassischen Google-Suche.

## Scope

### In Scope
- **FAQ-Section:** Automatisch 5-7 FAQs am Ende jedes Blogs generieren (basierend auf SERP `user_questions` aus PRP #03)
- **Schema Markup:** JSON-LD fuer `Article` und `FAQPage` Schema automatisch generieren
- **Schema-Speicherung:** `blogs.schema_markup` JSONB-Spalte in Supabase
- **AEO-Prompt-Optimierung:** Blog-Prompts enthalten Anweisungen fuer KI-zitierbare Inhalte
- **Schema im HTML-Export:** Schema Markup wird beim HTML/WordPress-Export eingebettet
- **Frontend:** Schema-Vorschau und FAQ-Editor im BlogEditor

### Out of Scope
- KI-Sichtbarkeits-Tracking (wie Writesonic — das waere ein eigenes Produkt)
- HowTo / Recipe / Product Review Schema (nur Article + FAQPage fuer V1)
- Automatische Schema-Validierung gegen Google Rich Results Test
- Perplexity/ChatGPT API Integration (wir optimieren den Content, nicht die Messung)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/blogs/service.py` | FAQ-Generation + Schema-Generation als Pipeline-Schritte; AEO-Hints in Prompts | L276-320 (nach Conclusion) |
| `backend/app/blogs/prompts.py` | AEO-Anweisungen in System-Prompts; neuer FAQ-Prompt-Builder | L6-72, neue Funktionen |
| `project/src/pages/BlogEditor.tsx` | FAQ-Sektion anzeigen/editieren; Schema-Vorschau; Schema in Export einbetten | Export-Bereich, Preview |
| `project/src/lib/markdown.ts` | HTML-Export mit Schema Markup `<script>` Tag anreichern (PRP #04) | Export-Funktionen |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `backend/app/blogs/schema_markup.py` | Schema Markup Generator (Article + FAQPage JSON-LD) |
| `project/src/components/FaqEditor.tsx` | Einfacher FAQ-Editor (Frage/Antwort editieren, hinzufuegen, loeschen) |

---

## Technischer Plan

### Schritt 1: Supabase — schema_markup Spalte hinzufuegen (MANUELL)

**Wo:** Supabase Dashboard → SQL Editor

**SQL:**
```sql
ALTER TABLE blogs
ADD COLUMN IF NOT EXISTS schema_markup jsonb DEFAULT NULL;

ALTER TABLE blogs
ADD COLUMN IF NOT EXISTS faq_content jsonb DEFAULT NULL;

COMMENT ON COLUMN blogs.schema_markup IS 'JSON-LD Schema Markup (Article + FAQPage) for search engines and AI citation.';
COMMENT ON COLUMN blogs.faq_content IS 'FAQ section data: [{question: str, answer: str}]. Used for FAQPage schema and FAQ section in blog.';
```

**Schritt-fuer-Schritt fuer die Praktikantin:**
1. Supabase Dashboard → SQL Editor → New Query
2. SQL oben einfuegen → Run
3. **Erwartet:** "Success. No rows returned"
4. Pruefe: Table Editor → `blogs` → Spalten `schema_markup` und `faq_content` sichtbar

**Done-Kriterien:**
- [ ] Beide Spalten existieren (Typ: jsonb, nullable)
- [ ] Bestehende Blogs haben `null` (kein Datenverlust)

---

### Schritt 2: Backend — AEO-Anweisungen in Blog-Prompts

**Datei:** `backend/app/blogs/prompts.py`
**Was:** Die System-Prompts um AEO-spezifische Anweisungen erweitern, damit Claude Content generiert der von KI-Systemen bevorzugt zitiert wird.

**Erklaerung fuer die Praktikantin:**
KI-Suchmaschinen zitieren bevorzugt Content der:
- **Klare Definitionen** enthaelt ("SEO ist die Optimierung von...")
- **Direkte Antworten** auf Fragen gibt (nicht um den heissen Brei redet)
- **Strukturiert** ist (Ueberschriften, Listen, Tabellen)
- **Autoritaet** ausstrahlt (Zahlen, Quellen, Expertenwissen)

Wir fuegen diese Anweisungen zu den bestehenden System-Prompts hinzu.

**Ergaenzung an `SECTION_SYSTEM_PROMPT`:**
```python
AEO_INSTRUCTIONS = """
AEO-OPTIMIERUNG (fuer KI-Suchmaschinen wie ChatGPT, Perplexity, Google AI):
- Beginne wichtige Abschnitte mit einer klaren Definition oder direkten Antwort
- Verwende "Was ist...?", "Wie funktioniert...?" Strukturen
- Fuege konkrete Zahlen, Statistiken und Fakten ein
- Formuliere Kernaussagen als eigenstaendige, zitierbare Saetze
- Vermeide vage Aussagen — sei spezifisch und praezise
"""
```

Diese `AEO_INSTRUCTIONS` werden an die bestehenden System-Prompts angehaengt (aehnlich wie Style-Instructions in PRP #01).

**Done-Kriterien:**
- [ ] `AEO_INSTRUCTIONS` sind in den Section- und Outline-Prompts enthalten
- [ ] Generierter Content enthaelt klarere Definitionen und direktere Antworten
- [ ] Keine Aenderung am Output-Format (weiterhin Markdown)

---

### Schritt 3: Backend — FAQ-Section Generator

**Datei:** `backend/app/blogs/service.py`
**Was:** Neuer Pipeline-Schritt nach der Conclusion: FAQ-Section mit 5-7 Fragen und Antworten generieren.

**Erklaerung fuer die Praktikantin:**
FAQs sind Gold fuer KI-Suchmaschinen. Wenn jemand ChatGPT fragt "Was ist SEO?", zitiert ChatGPT bevorzugt Seiten die diese Frage explizit beantworten. Wir generieren FAQs basierend auf:
1. Den `user_questions` aus der SERP-Analyse (PRP #03) — das sind Fragen die echte Nutzer stellen
2. Falls keine SERP-Daten vorhanden: Claude generiert allgemeine FAQs zum Blog-Thema

**Neuer Prompt-Builder:**
```python
FAQ_SYSTEM_PROMPT = """\
Du bist ein SEO- und AEO-Experte. \
Erstelle FAQ-Eintraege (Frage + Antwort) fuer einen Blog-Artikel.

REGELN:
- 5-7 Fragen die ein Leser zum Thema haben koennte
- Antworten: 2-4 Saetze, praezise und direkt
- Beginne jede Antwort mit einer klaren Aussage (nicht "Es kommt darauf an...")
- Nutze die gleiche Sprache und Tonalitaet wie der Blog
- Wenn Nutzerfragen aus der SERP-Analyse vorhanden sind, nutze diese als Basis

OUTPUT-FORMAT (strikt JSON):
[
  {"question": "Was ist...?", "answer": "... ist..."},
  {"question": "Wie funktioniert...?", "answer": "... funktioniert so:..."}
]
"""
```

**Pipeline-Integration (nach Conclusion, vor Assemble):**
```python
# FAQ generieren
await update_blog_status(blog_id, user_id, "running", "faq", 0.88)

faq_prompt = build_faq_prompt(
    title=request.title,
    outline_summary=outline_summary,
    user_questions=serp_data.get("user_questions", []) if serp_data else [],
    language=request.language,
)
faq_text = await asyncio.to_thread(_call_claude, styled_faq_prompt, faq_prompt, 1500)
faq_data = _extract_json(faq_text)  # list[{question, answer}]

# FAQ als Markdown an Content anhaengen
faq_markdown = _format_faq_markdown(faq_data)
# faq_data separat in blogs.faq_content speichern (fuer Schema Markup)
```

**FAQ Markdown Format:**
```markdown
## Haeufig gestellte Fragen (FAQ)

### Was ist SEO?
SEO (Search Engine Optimization) ist die Optimierung von Webseiten fuer Suchmaschinen...

### Wie lange dauert SEO?
Erste Ergebnisse sind typischerweise nach 3-6 Monaten sichtbar...
```

**Done-Kriterien:**
- [ ] FAQ wird nach Conclusion generiert (5-7 Fragen)
- [ ] Wenn SERP `user_questions` vorhanden, werden diese als Basis genutzt
- [ ] FAQ wird als Markdown an den Blog angehaengt
- [ ] FAQ-Daten werden separat in `blogs.faq_content` gespeichert (JSON)
- [ ] Neuer Progress-Step "faq" im Status-Tracking

---

### Schritt 4: Backend — Schema Markup Generator

**Datei:** `backend/app/blogs/schema_markup.py` (NEU)
**Was:** Generiert JSON-LD Schema Markup fuer Article und FAQPage.

**Erklaerung fuer die Praktikantin:**
Schema Markup ist ein standardisiertes Format das Suchmaschinen sagt: "Diese Seite ist ein Artikel ueber [Thema], geschrieben am [Datum], mit diesen FAQs." Es wird als unsichtbares `<script>` Tag in den HTML-Code eingefuegt — der Leser sieht es nicht, aber Google und KI-Systeme lesen es.

Wir generieren zwei Schema-Typen:
1. **Article:** Beschreibt den Blog-Artikel (Titel, Autor, Datum, Beschreibung)
2. **FAQPage:** Beschreibt die FAQ-Section (Frage/Antwort-Paare)

**Implementierung:**
```python
def generate_article_schema(
    title: str,
    description: str,
    date_published: str,
    date_modified: str,
    author_name: str = "Blogreich",
    word_count: int = 0,
    language: str = "de",
    image_url: str | None = None,
) -> dict:
    """Generate Article JSON-LD schema."""
    schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description[:160],
        "datePublished": date_published,
        "dateModified": date_modified,
        "author": {
            "@type": "Person",
            "name": author_name,
        },
        "wordCount": word_count,
        "inLanguage": language,
    }
    if image_url:
        schema["image"] = image_url
    return schema

def generate_faq_schema(faqs: list[dict]) -> dict | None:
    """Generate FAQPage JSON-LD schema from FAQ data."""
    if not faqs:
        return None
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": faq["question"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq["answer"],
                },
            }
            for faq in faqs
        ],
    }

def generate_combined_schema(
    title: str, description: str, date_published: str,
    date_modified: str, author_name: str, word_count: int,
    language: str, image_url: str | None, faqs: list[dict],
) -> list[dict]:
    """Generate combined Article + FAQPage schema."""
    schemas = [generate_article_schema(...)]
    faq_schema = generate_faq_schema(faqs)
    if faq_schema:
        schemas.append(faq_schema)
    return schemas
```

**Integration in Pipeline (nach FAQ-Generierung):**
```python
# Schema Markup generieren
schema_data = generate_combined_schema(
    title=request.title,
    description=full_content[:300],
    date_published=datetime.utcnow().isoformat(),
    date_modified=datetime.utcnow().isoformat(),
    author_name="Blogreich",  # Spaeter: Company Name oder User Name
    word_count=word_count,
    language=request.language,
    image_url=None,  # Spaeter: erstes Blog-Bild
    faqs=faq_data if isinstance(faq_data, list) else [],
)

# Speichern
blog_update_data["schema_markup"] = schema_data
blog_update_data["faq_content"] = faq_data
```

**Done-Kriterien:**
- [ ] `generate_article_schema()` gibt valides JSON-LD zurueck
- [ ] `generate_faq_schema()` gibt valides FAQPage JSON-LD zurueck
- [ ] Schema wird in `blogs.schema_markup` gespeichert
- [ ] Schema folgt dem schema.org Standard
- [ ] `uv run mypy app/` fehlerfrei

---

### Schritt 5: Frontend — FAQ-Editor Komponente

**Datei:** `project/src/components/FaqEditor.tsx` (NEU)
**Was:** Ein einfacher Editor fuer FAQ-Eintraege im BlogEditor: Fragen und Antworten bearbeiten, hinzufuegen, loeschen.

**Erklaerung fuer die Praktikantin:**
Die automatisch generierten FAQs sind gut, aber manchmal will der Nutzer eine Frage umformulieren oder eine eigene hinzufuegen. Der FAQ-Editor zeigt die Fragen als editierbare Liste — aehnlich wie der Outline-Editor aus PRP #02.

**Visuelles Design:**
```
┌──────────────────────────────────────────────────┐
│ FAQ-Section (5 Fragen)                           │
│                                                  │
│ ┌────────────────────────────────────────── [✕] │
│ │ F: Was ist SEO?                                │
│ │ A: SEO ist die Optimierung von Webseiten...    │
│ └────────────────────────────────────────────── │
│ ┌────────────────────────────────────────── [✕] │
│ │ F: Wie lange dauert SEO?                       │
│ │ A: Erste Ergebnisse sind nach 3-6 Monaten...   │
│ └────────────────────────────────────────────── │
│                                                  │
│ [+ Frage hinzufuegen]                            │
└──────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface FaqItem {
  question: string;
  answer: string;
}

interface FaqEditorProps {
  faqs: FaqItem[];
  onChange: (faqs: FaqItem[]) => void;
}
```

**Done-Kriterien:**
- [ ] FAQ-Eintraege sind editierbar (Frage + Antwort)
- [ ] Eintraege koennen geloescht werden (mindestens 2)
- [ ] Neue Eintraege koennen hinzugefuegt werden (maximal 10)
- [ ] Aenderungen werden an Parent-Komponente weitergegeben (`onChange`)
- [ ] `npx tsc --noEmit` fehlerfrei

---

### Schritt 6: Frontend — Schema in BlogEditor + Export integrieren

**Dateien:** `project/src/pages/BlogEditor.tsx`, `project/src/lib/markdown.ts`
**Was:** FAQ-Editor im BlogEditor anzeigen; Schema Markup im HTML/WordPress-Export einbetten.

**BlogEditor-Aenderungen:**
1. `faq_content` aus Blog-Daten laden
2. FAQ-Editor als aufklappbare Sektion unter dem Markdown-Editor anzeigen
3. "FAQ speichern" Button der die bearbeiteten FAQs + neues Schema Markup in Supabase speichert
4. FAQ-Aenderungen aktualisieren auch den Markdown-Content (FAQ-Section am Ende)

**Export-Aenderungen (markdown.ts):**
```typescript
export function markdownToHtmlWithSchema(
  markdown: string,
  schemaMarkup: object[] | null,
): string {
  let html = markdownToHtml(markdown);
  if (schemaMarkup) {
    const schemaScript = schemaMarkup
      .map(s => `<script type="application/ld+json">${JSON.stringify(s, null, 2)}</script>`)
      .join('\n');
    html = schemaScript + '\n' + html;
  }
  return html;
}
```

Dieser erweiterte Export wird fuer den HTML- und WordPress-Export genutzt (PRP #04).

**Done-Kriterien:**
- [ ] FAQ-Editor sichtbar im BlogEditor (aufklappbar)
- [ ] FAQs koennen bearbeitet und gespeichert werden
- [ ] HTML-Export enthaelt Schema Markup als `<script type="application/ld+json">`
- [ ] WordPress-Export enthaelt Schema Markup
- [ ] Markdown-Export enthaelt KEIN Schema (nur reiner Text)
- [ ] `npx tsc --noEmit` und `npm run build` fehlerfrei

---

## Datenbank-Aenderungen

### Neue Spalten (manuell in Supabase)

Siehe **Schritt 1** fuer SQL.

---

## API-Aenderungen

### Geaenderte Endpoints

| Method | Path | Aenderung |
|--------|------|----------|
| `POST` | `/api/blogs/generate` | Neuer Pipeline-Schritt: FAQ + Schema Markup Generierung |
| `GET` | `/api/blogs/{id}/status` | Neuer `current_step` Wert: `faq` |

---

## Frontend-Aenderungen

### Neue Komponente
- `project/src/components/FaqEditor.tsx`

### Geaenderte Dateien
- `project/src/pages/BlogEditor.tsx` — FAQ-Editor einbinden
- `project/src/lib/markdown.ts` — Schema in HTML-Export

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Test 1: Blog mit FAQ generieren**
1. Blog Writer → Titel + Haupt-Keyword eingeben
2. Blog generieren
3. **Erwartet:** Am Ende des Blogs gibt es eine "Haeufig gestellte Fragen" Section mit 5-7 Fragen
4. Im BlogEditor: FAQ-Sektion ist editierbar

**Test 2: Schema Markup pruefen**
1. Blog im Editor → HTML exportieren
2. Exportierte HTML-Datei oeffnen (Texteditor)
3. **Erwartet:** Am Anfang der Datei `<script type="application/ld+json">` mit Article + FAQPage Schema
4. Optional: Schema validieren auf https://validator.schema.org (JSON-LD einfuegen)

**Test 3: FAQ bearbeiten**
1. Im BlogEditor: FAQ-Editor oeffnen
2. Eine Frage umformulieren
3. Eine Frage loeschen
4. Eine neue Frage hinzufuegen
5. Speichern
6. **Erwartet:** Markdown-Content wird aktualisiert, Schema Markup wird neu generiert

**Test 4: Blog ohne Keyword (keine SERP-Daten)**
1. Blog generieren OHNE Haupt-Keyword
2. **Erwartet:** FAQ wird trotzdem generiert (Claude denkt sich Fragen aus)
3. **Erwartet:** Schema Markup wird trotzdem generiert

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
1. **Schema Markup wird nicht erkannt:** Wenn der Nutzer den Blog nicht als HTML mit Schema deployt (z.B. nur Markdown kopiert), bringt das Schema nichts. *Mitigation:* Klarer Hinweis im Export-Dialog: "HTML-Export enthaelt SEO-Schema Markup".
2. **FAQ-Qualitaet:** Claude koennte generische FAQs generieren die wenig Mehrwert bieten. *Mitigation:* SERP `user_questions` als Basis nutzen — das sind echte Nutzerfragen.
3. **Schema-Validierungsfehler:** Das generierte Schema koennte Fehler enthalten die Google ablehnt. *Mitigation:* Schema-Generierung ist deterministisch (kein LLM), also einfach testbar. Unit Tests fuer Schema-Output.
4. **Zusaetzliche API-Kosten:** Ein extra Claude-Call fuer FAQ-Generation pro Blog (~$0.005). *Mitigation:* Akzeptabel — FAQ ist ein hochwertiges Feature.

### Offene Fragen
1. Soll die FAQ im Blog-Content oder separat gespeichert werden? (Empfehlung: Beides — Markdown-Content enthaelt die FAQ als H2-Section, `faq_content` speichert die strukturierten Daten fuer Schema Markup)
2. Sollen aeltere Blogs nachtraeglich FAQs und Schema bekommen? (Empfehlung: Spaeter — per Button im Editor "FAQ generieren")
3. Author-Name im Schema: Company Name oder User Name? (Empfehlung: Company Name wenn vorhanden, sonst "Blogreich")
4. HowTo Schema fuer How-To-Artikel? (Empfehlung: Spaeter — V1 nur Article + FAQ)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Supabase Spalten (Manuell)
     ↓
Schritt 2: AEO-Prompts (Backend)
     ↓
Schritt 3: FAQ Generator (Backend)
     ↓
Schritt 4: Schema Markup Generator (Backend)
     ↓
Schritt 5: FAQ-Editor Komponente (Frontend)
     ↓
Schritt 6: Schema in Editor + Export (Frontend)
```

**Reihenfolge fuer Claude Code:** 4 → 2 → 3 (Backend) → 1 (Manuell) → 5 → 6 (Frontend)

---

## Naechster Schritt

```bash
# Dieses PRP ausfuehren:
/02-execute docs/PRPs/PRP_14_AEO_GEO_Optimierung.md
```
