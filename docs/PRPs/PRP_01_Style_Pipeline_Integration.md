# PRP #01: Style-Pipeline-Integration — Unternehmens-Personalisierung in Blog-Generierung

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P0 (BLOCKER — ohne das funktioniert der USP von Blogreich nicht)
**Geschaetzte Komplexitaet:** Medium
**Betroffene Dateien:** 3 (Backend)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Blogreich hat ein einzigartiges Feature: Wenn ein Nutzer sein Unternehmen anlegt und die Website-URL eingibt, analysiert unsere Plattform die Website automatisch. Dabei wird ein **Style-Profil** erstellt — also eine Beschreibung, wie das Unternehmen schreibt:

- Duzt oder siezt das Unternehmen seine Leser?
- Schreibt es formell oder locker?
- Welche Fachbegriffe nutzt es?
- Was sind die Kernwerte der Marke?
- Wie lang sind die Saetze typischerweise?

Dieses Style-Profil wird in der Datenbank gespeichert. **Aber:** Wenn dann ein Blog generiert wird, werden diese wertvollen Informationen nur teilweise genutzt. Die Einleitung und das Fazit werden komplett OHNE den Unternehmensstil geschrieben. Und die strukturierten Daten (Tonalitaet, Ansprache-Form, Fachvokabular etc.) werden ignoriert — nur ein kurzer Zusammenfassungstext wird verwendet.

Das ist, als haettest du einen Personal Trainer engagiert, der dich analysiert hat, aber beim Training nur die Haelfte seiner Notizen nutzt.

### Die Loesung

Wir bauen die Style-Profile-Integration richtig ein:

1. **Alle Prompts bekommen den Unternehmensstil** — nicht nur Outline und Sections, sondern auch Einleitung und Fazit
2. **Die strukturierten Daten werden genutzt** — Tonalitaet, Ansprache (Du/Sie), Fachvokabular, Schreibrichtlinien
3. **Der Stil kommt in den System-Prompt** — das ist die "Grundanweisung" an die KI, die bei jedem Schritt gleich bleibt und deshalb von Anthropic gecacht werden kann (= schneller und guenstiger)

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **System-Prompt** | Die Grundanweisung, die der KI sagt, WER sie ist und WIE sie sich verhalten soll. Wie eine Jobbeschreibung fuer einen Mitarbeiter. |
| **User-Prompt** | Die konkrete Aufgabe, die der KI gegeben wird. Wie ein einzelner Arbeitsauftrag. |
| **Prompt Caching** | Wenn der System-Prompt bei mehreren Anfragen gleich bleibt, muss Anthropic ihn nicht jedes Mal neu verarbeiten. Das spart Geld (~90% guenstiger fuer den gecachten Teil) und ist schneller. |
| **`cache_control: ephemeral`** | Ein Befehl an Anthropic, der sagt: "Speichere diesen Teil fuer 5 Minuten im Cache". So koennen wir den gleichen System-Prompt fuer Outline, Sections, Intro und Conclusion wiederverwenden, ohne ihn jedes Mal neu zu verarbeiten. |
| **Supabase** | Unsere Datenbank in der Cloud. Hier speichern wir alles — Unternehmen, Blogs, Style-Profile. |
| **Vertical Slice** | Unser Architektur-Pattern: Jedes Feature (Blogs, Companies, Images) hat seinen eigenen Ordner mit eigenen Dateien. |
| **Pipeline** | Die Blog-Generierung laeuft in mehreren Schritten nacheinander: Outline → Sections → Intro → Conclusion → Zusammenbauen. Wie ein Fliessband in einer Fabrik. |

---

## Ziel

Das Company Style-Profile soll in ALLE Schritte der Blog-Generierungs-Pipeline integriert werden — nicht nur als kurzer Text, sondern mit den strukturierten Analyse-Daten (Tonalitaet, Ansprache-Form, Fachvokabular, Markenwerte, Schreibrichtlinien). Der Stil soll im System-Prompt stehen, damit Anthropic Prompt Caching nutzen kann.

## User Story

Als Blogreich-Nutzer
moechte ich, dass mein generierter Blog-Artikel den Schreibstil meines Unternehmens widerspiegelt — in Einleitung, Hauptteil UND Fazit
damit der Artikel klingt, als haette ich ihn selbst geschrieben und nicht eine generische KI.

## Scope

### In Scope
- Style-Profile in System-Prompts verlagern (statt User-Prompts)
- Strukturierte Style-Daten nutzen (tonality, formality_level, address_form, vocabulary, brand_values, writing_guidelines)
- Style in ALLE Pipeline-Schritte integrieren (Outline, Sections, Intro, Conclusion)
- Prompt Caching fuer den Style-enriched System-Prompt
- `_call_claude()` Funktion anpassen fuer dynamische System-Prompts

### Out of Scope
- pgvector Embeddings / RAG (kommt in PRP #12)
- Neue UI-Elemente im Frontend (keine Frontend-Aenderungen noetig)
- Aenderungen am Company-Analyse-Prozess (Tavily, Style-Generierung)
- Neue Supabase-Tabellen

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/blogs/service.py` | `_call_claude()` erhaelt optionalen `style_context` Parameter; Style-Laden robuster machen; Style an Intro/Conclusion weitergeben | L48-66 (`_call_claude`), L198-208 (Style laden), L276-308 (Intro/Conclusion) |
| `backend/app/blogs/prompts.py` | Neue Funktion `build_style_system_prompt()` die den Base-System-Prompt mit Style-Daten anreichert; `build_intro_prompt` und `build_conclusion_prompt` erhalten `style_profile` Parameter | L6-72 (System-Prompts), L136-171 (Intro/Conclusion Prompt Builder) |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| Keine | — |

---

## Technischer Plan

### Schritt 1: Style-Loading robuster machen

**Datei:** `backend/app/blogs/service.py`
**Was:** Das Style-Profile wird aktuell aus `companies.style_profile` geladen. Das Format ist `{"text": "...", "data": {...}}`. Wir muessen BEIDE Teile extrahieren — den Text UND die strukturierten Daten. Aktuell wird nur `text` genutzt.

**Aktuelle Logik (Zeile 198-208):**
```python
style_profile: str | None = None
if request.company_id:
    result = await db_query("companies", {"id": request.company_id, "user_id": user_id})
    if result.data:
        company_data = result.data[0]
        sp = company_data.get("style_profile")
        if sp and isinstance(sp, dict):
            style_profile = sp.get("text")
```

**Neue Logik:**
```python
style_context: str | None = None
if request.company_id:
    result = await db_query("companies", {"id": request.company_id, "user_id": user_id})
    if result.data:
        company_data = result.data[0]
        sp = company_data.get("style_profile")
        if sp and isinstance(sp, dict):
            style_context = _build_style_context(sp)

def _build_style_context(style_profile: dict) -> str:
    """Build a rich style context string from structured style data."""
    # Nutze die strukturierten Daten aus style_profile["data"]
    # Fallback auf style_profile["text"] wenn "data" fehlt
```

**Pattern-Referenz:** Das Company-Analyse-Service speichert in Zeile 179-183 von `companies/service.py`:
```python
{"style_profile": {"text": style_text, "data": style_data}}
```
wobei `style_data` die Felder `tonality`, `formality_level`, `address_form`, `vocabulary`, `brand_values`, `writing_guidelines` enthaelt.

**Done-Kriterien:**
- [ ] Wenn `style_profile["data"]` vorhanden ist, werden alle strukturierten Felder genutzt
- [ ] Wenn nur `style_profile["text"]` vorhanden ist (Fallback), wird dieser verwendet
- [ ] Wenn `style_profile` fehlt oder `None` ist, laeuft die Pipeline trotzdem (kein Fehler)
- [ ] Log-Eintrag zeigt, ob Style-Profile geladen wurde oder nicht

---

### Schritt 2: Style-aware System-Prompt Builder

**Datei:** `backend/app/blogs/prompts.py`
**Was:** Neue Funktion `build_style_system_prompt()`, die einen Base-System-Prompt mit dem Style-Kontext anreichert. Statt den Style im User-Prompt zu haben, kommt er in den System-Prompt — so wird er von Anthropic Prompt Caching profitieren.

**Erklaerung fuer die Praktikantin:**
Stell dir vor, der System-Prompt ist die "Persoenlichkeit" der KI. Aktuell sagen wir der KI nur "Du bist ein Blog-Autor" (das ist der Base-Prompt). Mit dieser Aenderung sagen wir ihr: "Du bist ein Blog-Autor, der im Stil von [Unternehmen X] schreibt — mit diesen Fachbegriffen, in dieser Tonalitaet, mit dieser Ansprache-Form." Das ist viel praeziser.

**Neue Funktion:**
```python
def build_style_system_prompt(base_prompt: str, style_context: str | None) -> str:
    """Enrich a base system prompt with company style context.

    If style_context is provided, it is appended to the base prompt
    with clear instructions for the LLM to follow the company's
    writing style consistently.
    """
    if not style_context:
        return base_prompt

    return f"""{base_prompt}

UNTERNEHMENS-SCHREIBSTIL (WICHTIG — befolge diese Vorgaben):
{style_context}

Wende diesen Schreibstil konsequent an: Tonalitaet, Ansprache-Form, \
Fachvokabular und Markenstimme muessen sich im gesamten Text widerspiegeln."""
```

**Aenderungen an bestehenden Prompt-Buildern:**
- `build_outline_prompt`: `style_profile` Parameter ENTFERNEN (kommt jetzt in System-Prompt)
- `build_section_prompt`: `style_profile` Parameter ENTFERNEN
- `build_intro_prompt`: Keine Aenderung noetig (Style kommt via System-Prompt)
- `build_conclusion_prompt`: Keine Aenderung noetig (Style kommt via System-Prompt)

**Done-Kriterien:**
- [ ] `build_style_system_prompt()` existiert und funktioniert
- [ ] Wenn `style_context` None ist, wird der Base-Prompt unveraendert zurueckgegeben
- [ ] Der Style-Text ist klar als Anweisung formatiert (nicht nur angehaengt)
- [ ] `style_profile` Parameter aus `build_outline_prompt` und `build_section_prompt` entfernt
- [ ] Keine Duplikation — Style steht ENTWEDER im System-Prompt ODER im User-Prompt, nicht in beiden

---

### Schritt 3: _call_claude mit dynamischem System-Prompt

**Datei:** `backend/app/blogs/service.py`
**Was:** Die `_call_claude()` Funktion bekommt bereits einen `system_prompt` Parameter. Aktuell ist dieser immer einer der statischen Prompts (OUTLINE_SYSTEM_PROMPT, SECTION_SYSTEM_PROMPT etc.). Jetzt wird der System-Prompt VOR dem Aufruf mit `build_style_system_prompt()` angereichert.

**Erklaerung fuer die Praktikantin:**
Die Funktion `_call_claude()` ist wie ein Telefon zur KI. Aktuell geben wir ihr immer die gleiche Visitenkarte (System-Prompt). Jetzt geben wir ihr eine personalisierte Visitenkarte, auf der auch der Stil des Unternehmens steht. Die KI liest die Karte und weiss dann, WIE sie schreiben soll.

**Aenderung in generate_blog():**

Die Style-enriched System-Prompts werden VOR der Pipeline erstellt und dann fuer alle 4 Schritte wiederverwendet:

```python
# Nach dem Laden des Style-Profiles:
from app.blogs.prompts import build_style_system_prompt

styled_outline_prompt = build_style_system_prompt(OUTLINE_SYSTEM_PROMPT, style_context)
styled_section_prompt = build_style_system_prompt(SECTION_SYSTEM_PROMPT, style_context)
styled_intro_prompt = build_style_system_prompt(INTRO_SYSTEM_PROMPT, style_context)
styled_conclusion_prompt = build_style_system_prompt(CONCLUSION_SYSTEM_PROMPT, style_context)

# Dann in den Pipeline-Schritten:
outline_text = await asyncio.to_thread(
    _call_claude, styled_outline_prompt, outline_prompt, 2000
)
# ... analog fuer sections, intro, conclusion
```

**Prompt Caching Erklaerung:**
Weil alle 4 Schritte denselben `style_context`-Abschnitt im System-Prompt haben, wird Anthropic diesen Teil nach dem ersten Aufruf cachen. Die nachfolgenden Aufrufe (Sections, Intro, Conclusion) sind dann ~90% guenstiger fuer den gecachten Teil. Das `cache_control: {"type": "ephemeral"}` in `_call_claude()` aktiviert dieses Caching bereits.

**Done-Kriterien:**
- [ ] Alle 4 Pipeline-Schritte (Outline, Sections, Intro, Conclusion) erhalten den Style-enriched System-Prompt
- [ ] Wenn kein Company/Style ausgewaehlt ist, werden die Original-System-Prompts unveraendert verwendet
- [ ] Die `style_profile` Parameter werden aus `build_outline_prompt()` und `build_section_prompt()` User-Prompts entfernt (keine Duplikation)
- [ ] Prompt Caching funktioniert (erkennbar an `cache_creation_input_tokens` und `cache_read_input_tokens` in der API-Response — kann in Logs geprueft werden)

---

### Schritt 4: _build_style_context Helper-Funktion

**Datei:** `backend/app/blogs/service.py`
**Was:** Die neue Funktion, die aus den strukturierten Style-Daten einen lesbaren Kontext-String baut.

**Erklaerung fuer die Praktikantin:**
Die Datenbank speichert den Schreibstil als strukturierte Daten (wie ein ausgefuelltes Formular). Die KI braucht aber Fliesstext. Diese Funktion wandelt das "Formular" in einen lesbaren Text um, den die KI verstehen kann.

**Implementierung:**
```python
def _build_style_context(style_profile: dict[str, Any]) -> str:
    """Build a rich style context string from structured style profile data.

    Extracts and formats tonality, formality, address form, vocabulary,
    brand values, and writing guidelines into a cohesive instruction
    for the LLM.
    """
    data = style_profile.get("data", {})
    text = style_profile.get("text", "")

    if not data:
        return text  # Fallback auf reinen Text

    parts: list[str] = []

    if summary := data.get("summary"):
        parts.append(f"Zusammenfassung: {summary}")
    if tonality := data.get("tonality"):
        parts.append(f"Tonalitaet: {tonality}")
    if formality := data.get("formality_level"):
        parts.append(f"Formalitaetsgrad: {formality}")
    if address := data.get("address_form"):
        label = {"du": "Du-Ansprache", "Sie": "Sie-Ansprache", "neutral": "Neutrale Ansprache"}
        parts.append(f"Ansprache: {label.get(address, address)}")
    if sentence_style := data.get("sentence_style"):
        parts.append(f"Satzstil: {sentence_style}")
    if vocab := data.get("vocabulary"):
        if isinstance(vocab, list) and vocab:
            parts.append(f"Fachvokabular (unbedingt verwenden): {', '.join(vocab)}")
    if values := data.get("brand_values"):
        if isinstance(values, list) and values:
            parts.append(f"Markenwerte: {', '.join(values)}")
    if themes := data.get("content_themes"):
        if isinstance(themes, list) and themes:
            parts.append(f"Kernthemen: {', '.join(themes)}")
    if guidelines := data.get("writing_guidelines"):
        parts.append(f"Schreibrichtlinien: {guidelines}")

    return "\n".join(parts) if parts else text
```

**Done-Kriterien:**
- [ ] Funktion gibt lesbaren String zurueck wenn `data` vorhanden
- [ ] Funktion faellt auf `text` zurueck wenn `data` leer oder fehlt
- [ ] Funktion gibt leeren String zurueck wenn sowohl `data` als auch `text` fehlen
- [ ] Alle 9 Felder (summary, tonality, formality_level, address_form, sentence_style, vocabulary, brand_values, content_themes, writing_guidelines) werden extrahiert wenn vorhanden
- [ ] Listen (vocabulary, brand_values, content_themes) werden korrekt als komma-separierte Strings formatiert

---

### Schritt 5: Logging fuer Style-Pipeline

**Datei:** `backend/app/blogs/service.py`
**Was:** Log-Eintraege hinzufuegen, die zeigen ob und welcher Stil geladen wurde. Wichtig fuer Debugging und um zu verstehen, ob die Personalisierung greift.

**Erklaerung fuer die Praktikantin:**
Logs sind wie ein Tagebuch fuer die Software. Wenn etwas nicht funktioniert, koennen wir in den Logs nachschauen, was passiert ist. Hier loggen wir: "Style-Profile geladen fuer Firma X" oder "Kein Style-Profile vorhanden, nutze Standard-Stil."

**Done-Kriterien:**
- [ ] Log-Eintrag wenn Style-Profile erfolgreich geladen wird (mit company_id, hat style_data: ja/nein)
- [ ] Log-Eintrag wenn kein Style-Profile vorhanden (company_id gesetzt aber kein style_profile)
- [ ] Log-Eintrag wenn kein company_id angegeben (Standard-Stil wird verwendet)
- [ ] Log-Events folgen dem Naming-Pattern: `blog.style_profile_loaded`, `blog.style_profile_missing`, `blog.style_profile_skipped`

---

## Datenbank-Aenderungen

**Keine.** Das bestehende `companies.style_profile` JSONB-Feld wird bereits korrekt befuellt durch den Company-Analyse-Prozess. Wir aendern nur, wie die Blog-Pipeline diese Daten LIEST und NUTZT.

---

## API-Aenderungen

**Keine.** Die bestehende `POST /api/blogs/generate` API bleibt unveraendert. Der `company_id` Parameter wird bereits akzeptiert. Die Aenderungen sind rein intern in der Pipeline-Logik.

---

## Frontend-Aenderungen

**Keine.** Das Frontend sendet bereits `company_id` im BlogWriter-Formular. Die Aenderungen sind rein Backend-seitig.

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Voraussetzung:** Backend laeuft lokal (`cd backend && uv run uvicorn app.main:app --reload --port 8123`)

**Test 1: Blog MIT Unternehmensstil**
1. Im Frontend ein Unternehmen anlegen (z.B. "Test GmbH") mit einer Website-URL
2. "Analysieren" klicken und warten bis das Style-Profile erstellt ist
3. Im Blog Writer: Titel eingeben, das Unternehmen auswaehlen
4. Blog generieren
5. **Erwartet:** Der generierte Blog sollte den Stil des Unternehmens widerspiegeln (Ansprache, Tonalitaet, Fachvokabular)
6. **Pruefen:** Auch Einleitung und Fazit sollten den Stil haben (vorher war das nicht der Fall!)

**Test 2: Blog OHNE Unternehmensstil**
1. Im Blog Writer: Titel eingeben, KEIN Unternehmen auswaehlen
2. Blog generieren
3. **Erwartet:** Blog wird im Standard-Stil generiert (kein Fehler!)

**Test 3: Logs pruefen**
1. Terminal anschauen wo das Backend laeuft
2. **Erwartet:** Log-Eintraege wie `blog.style_profile_loaded` oder `blog.style_profile_skipped`

### Unit Tests (fuer Claude Code)

```bash
cd backend && uv run pytest -v
```

- `_build_style_context()` mit vollstaendigen Daten
- `_build_style_context()` mit fehlendem `data` Feld (Fallback)
- `_build_style_context()` mit leerem `data`
- `build_style_system_prompt()` mit und ohne Style-Kontext

### Validierung

```bash
# Backend
cd backend && uv run ruff check . && uv run mypy app/ && uv run pytest -v

# Frontend (sollte unveraendert durchlaufen)
cd project && npx tsc --noEmit && npm run build
```

---

## Risiken & Offene Fragen

### Risiken
1. **System-Prompt wird zu lang**: Wenn das Style-Profile sehr ausfuehrlich ist (z.B. 2000+ Woerter), koennte der System-Prompt sehr gross werden. *Mitigation:* Style-Kontext auf max. 1500 Zeichen begrenzen.
2. **Style-Profile-Format inkonsistent**: Aeltere Companies koennten ein anderes Format haben (z.B. nur String statt Dict). *Mitigation:* Robustes Fallback-Handling (bereits in Plan).
3. **Prompt Caching Cache-Miss**: Wenn der Style-Kontext sich zwischen Aufrufen aendert, gibt es keinen Cache-Hit. *Mitigation:* Style-Kontext bleibt konstant fuer alle 4 Pipeline-Schritte eines Blogs.

### Offene Fragen
1. Soll der Style-Kontext eine maximale Laenge haben? (Empfehlung: Ja, max. 1500 Zeichen)
2. Sollen wir in Zukunft A/B-Tests machen koennen (Blog mit vs. ohne Stil)? (Fuer spaeter)

---

## Abhaengigkeits-Diagramm

```
Schritt 4: _build_style_context()
     ↓
Schritt 2: build_style_system_prompt()
     ↓
Schritt 1: Style-Loading in generate_blog()
     ↓
Schritt 3: Pipeline-Schritte mit dynamischen System-Prompts
     ↓
Schritt 5: Logging
```

**Reihenfolge fuer Claude Code:** 4 → 2 → 1 → 3 → 5

---

## Naechster Schritt

```bash
# Dieses PRP ausfuehren:
/02-execute docs/PRPs/PRP_01_Style_Pipeline_Integration.md
```
