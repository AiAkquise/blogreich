# PRP #10: Mehrsprachigkeit — Blog-Generierung in 5 Sprachen

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P2 (Markterweiterung — DACH-Start ist deutsch/englisch, danach weitere Sprachen)
**Geschaetzte Komplexitaet:** Low
**Betroffene Dateien:** 4 (2 Backend + 2 Frontend)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Aktuell kann Blogreich Blogs nur auf Deutsch und Englisch generieren. Das ist fuer den DACH-Markt erstmal ok, aber:
- Viele DACH-Unternehmen haben auch eine franzoesische, spanische oder italienische Website (Schweiz, internationale Kunden)
- GravityWrite bietet 5+ Sprachen an
- Koala bietet "multiple languages" an
- SEOwriting bietet sogar 48 Sprachen an

### Die Loesung

Wir erweitern die Sprachauswahl auf **5 Sprachen**: Deutsch, Englisch, Franzoesisch, Spanisch, Italienisch. Die technische Aenderung ist minimal — die KI (Claude) beherrscht alle diese Sprachen nativ. Wir muessen nur:
1. Die Sprach-Optionen im Frontend erweitern (von 2 auf 5)
2. Den Backend-Schema-Validator erweitern (von `de|en` auf `de|en|fr|es|it`)
3. Die System-Prompts sprachbewusster machen (damit Claude wirklich in der Zielsprache schreibt und nicht in deutsch anfaengt)

### Warum ist das so einfach?

Die gesamte Sprach-Infrastruktur existiert bereits:
- Das Backend akzeptiert einen `language` Parameter in der Blog-Generierung
- Jeder Prompt-Builder uebergibt `Sprache: {language}` an Claude
- Das Frontend hat ein Sprach-Dropdown im Blog Writer
- Die Datenbank speichert die Sprache pro Blog (`blogs.language`)

Wir muessen nur die **erlaubten Werte** erweitern und die **Prompts optimieren** fuer nicht-deutsche Sprachen.

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **Literal Type** | Ein Python-Typ, der nur bestimmte Werte erlaubt. `Literal["de", "en"]` bedeutet: Nur "de" oder "en" sind gueltig. Wenn jemand "fr" schickt, gibt es einen Fehler. Wir aendern das zu `Literal["de", "en", "fr", "es", "it"]`. |
| **System-Prompt** | Die Grundanweisung an die KI. Aktuell sind unsere System-Prompts auf Deutsch geschrieben ("Du bist ein professioneller Blog-Autor"). Fuer andere Sprachen muessen wir Claude explizit sagen: "Schreibe den GESAMTEN Output auf Franzoesisch" — sonst koennte Claude teilweise Deutsch schreiben. |
| **Locale / Sprachcode** | Ein standardisierter Code fuer Sprachen: `de` = Deutsch, `en` = Englisch, `fr` = Franzoesisch, `es` = Spanisch, `it` = Italienisch. Diese Codes folgen dem ISO 639-1 Standard. |
| **i18n / Internationalisierung** | Abkuerzung fuer "Internationalization" (18 Buchstaben zwischen i und n). Bedeutet: Software so bauen, dass sie mehrere Sprachen unterstuetzen kann. In unserem Fall geht es NUR um die Blog-GENERIERUNG in verschiedenen Sprachen — die Blogreich-UI bleibt auf Deutsch. |

---

## Ziel

Die Blog-Generierung um 3 weitere Sprachen erweitern (Franzoesisch, Spanisch, Italienisch) und die Prompts so optimieren, dass Claude den gesamten Blog konsistent in der gewaehlten Sprache schreibt — inklusive Ueberschriften, Aufzaehlungen und Fachbegriffe.

## User Story

Als Blogreich-Nutzer mit internationalen Kunden
moechte ich Blogs auch auf Franzoesisch, Spanisch und Italienisch generieren koennen
damit ich Content fuer verschiedene Maerkte erstellen kann, ohne separate Tools zu brauchen.

## Scope

### In Scope
- Sprachauswahl erweitern: DE, EN, FR, ES, IT (5 Sprachen)
- Backend-Schema erweitern (`Literal["de", "en", "fr", "es", "it"]`)
- System-Prompts sprachbewusster machen (explizite Anweisung: "Schreibe ALLES auf [Sprache]")
- Frontend-Dropdown erweitern (5 Optionen statt 2)
- Sprachspezifische Prompt-Optimierung (z.B. "Sie/Tu" im Franzoesischen)

### Out of Scope
- UI-Uebersetzung der Blogreich-App (die App bleibt auf Deutsch)
- Weitere Sprachen ueber die 5 hinaus (spaeter einfach erweiterbar)
- Automatische Sprach-Erkennung der Company-Website
- Blog-Uebersetzung (bestehenden Blog in andere Sprache uebersetzen)
- RTL-Sprachen (Arabisch, Hebraeisch — erfordert Layout-Aenderungen)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/blogs/schemas.py` | `language` Literal erweitern auf 5 Sprachen | L14 |
| `backend/app/blogs/prompts.py` | System-Prompts um sprachspezifische Anweisung erweitern; Language-Label-Mapping | L6-72 (System-Prompts), L81-171 (Prompt-Builder) |
| `project/src/pages/BlogWriter.tsx` | Sprach-Dropdown auf 5 Optionen erweitern | L312-316 (Select-Optionen) |
| `project/src/types/index.ts` | `Blog.language` Type aktualisieren (optional) | Language-Feld im Blog-Type |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| Keine | — |

---

## Technischer Plan

### Schritt 1: Backend — Schema erweitern

**Datei:** `backend/app/blogs/schemas.py`
**Was:** Den `language` Literal-Typ von 2 auf 5 Sprachen erweitern.

**Erklaerung fuer die Praktikantin:**
Aktuell steht in Zeile 14:
```python
language: Literal["de", "en"] = "de"
```
Das bedeutet: Nur "de" und "en" sind erlaubt. Wenn jemand "fr" schickt, bekommt er einen Fehler (HTTP 422 "Validation Error"). Wir erweitern das auf:
```python
language: Literal["de", "en", "fr", "es", "it"] = "de"
```

Jetzt sind auch "fr" (Franzoesisch), "es" (Spanisch) und "it" (Italienisch) gueltig.

**Wichtig:** Auch das `OutlineRequest` Schema (aus PRP #02) muss die gleiche Erweiterung bekommen, falls es bereits implementiert ist.

**Done-Kriterien:**
- [ ] `language` akzeptiert `"de"`, `"en"`, `"fr"`, `"es"`, `"it"`
- [ ] Default bleibt `"de"`
- [ ] `uv run mypy app/` fehlerfrei
- [ ] API gibt 422 bei ungueltiger Sprache (z.B. `"jp"`)

---

### Schritt 2: Backend — Prompts sprachbewusst machen

**Datei:** `backend/app/blogs/prompts.py`
**Was:** Die System-Prompts und Prompt-Builder so anpassen, dass Claude den gesamten Blog konsistent in der gewaehlten Sprache schreibt.

**Erklaerung fuer die Praktikantin:**
Das Problem: Unsere System-Prompts sind auf Deutsch geschrieben ("Du bist ein professioneller Blog-Autor"). Wenn der Nutzer "Franzoesisch" waehlt, bekommt Claude die deutsche Anweisung UND soll auf Franzoesisch schreiben. Das funktioniert meistens, aber manchmal "vergisst" Claude die Sprache und schreibt Teile auf Deutsch. Die Loesung: Wir fuegen eine **explizite, starke Sprachanweisung** hinzu.

**Neues Language-Mapping:**
```python
LANGUAGE_LABELS: dict[str, str] = {
    "de": "Deutsch",
    "en": "Englisch / English",
    "fr": "Franzoesisch / Francais",
    "es": "Spanisch / Espanol",
    "it": "Italienisch / Italiano",
}

LANGUAGE_INSTRUCTIONS: dict[str, str] = {
    "de": "",  # Default — System-Prompts sind bereits auf Deutsch
    "en": "\n\nIMPORTANT: Write the ENTIRE output in English. All headings, content, lists, and examples must be in English. Do not mix languages.",
    "fr": "\n\nIMPORTANT: Redige TOUT le contenu en francais. Tous les titres, le contenu, les listes et les exemples doivent etre en francais. Ne melange pas les langues.",
    "es": "\n\nIMPORTANTE: Escribe TODO el contenido en espanol. Todos los titulos, el contenido, las listas y los ejemplos deben estar en espanol. No mezcles idiomas.",
    "it": "\n\nIMPORTANTE: Scrivi TUTTO il contenuto in italiano. Tutti i titoli, il contenuto, gli elenchi e gli esempi devono essere in italiano. Non mischiare le lingue.",
}
```

**Aenderung an System-Prompts:**
Die `build_style_system_prompt()` Funktion (aus PRP #01) oder die System-Prompts direkt erhalten die Sprachanweisung am Ende:

```python
def _get_system_prompt_with_language(base_prompt: str, language: str) -> str:
    """Append language instruction to system prompt if not German."""
    instruction = LANGUAGE_INSTRUCTIONS.get(language, "")
    return base_prompt + instruction
```

**Aenderung an Prompt-Buildern:**
Die User-Prompts sollen den lesbaren Sprachnamen verwenden statt den Code:
```python
# Vorher:
parts.append(f"Sprache: {language}")

# Nachher:
parts.append(f"Sprache: {LANGUAGE_LABELS.get(language, language)}")
```

**Done-Kriterien:**
- [ ] System-Prompts enthalten sprachspezifische Anweisung fuer EN/FR/ES/IT
- [ ] Fuer Deutsch (de) aendert sich nichts (leere Anweisung)
- [ ] Sprachanweisung ist sowohl in der Zielsprache ALS AUCH auf Deutsch/Englisch formuliert (damit Claude es sicher versteht)
- [ ] Prompt-Builder zeigen lesbaren Sprachnamen statt Code
- [ ] `uv run ruff check .` fehlerfrei

---

### Schritt 3: Frontend — Sprach-Dropdown erweitern

**Datei:** `project/src/pages/BlogWriter.tsx`
**Was:** Das Sprach-Select von 2 auf 5 Optionen erweitern.

**Erklaerung fuer die Praktikantin:**
In Zeile 312-316 gibt es aktuell:
```tsx
<Select
  label="Sprache"
  value={language}
  onChange={(e) => setLanguage(e.target.value)}
  options={[
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'Englisch' },
  ]}
/>
```

Wir erweitern die `options` Liste:
```tsx
options={[
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Francais' },
  { value: 'es', label: 'Espanol' },
  { value: 'it', label: 'Italiano' },
]}
```

**Hinweis:** Die Labels sind absichtlich in der jeweiligen Sprache geschrieben (nicht "Franzoesisch" sondern "Francais"). Das ist internationaler Standard — Nutzer erkennen ihre Sprache schneller wenn sie in ihrer Sprache steht.

**Done-Kriterien:**
- [ ] Sprach-Dropdown zeigt 5 Optionen
- [ ] Labels sind in der jeweiligen Sprache
- [ ] Default bleibt "Deutsch"
- [ ] Easy Mode nutzt weiterhin "de" als Default (Zeile 114: `language: isEasy ? 'de' : language`)
- [ ] `npx tsc --noEmit` fehlerfrei

---

### Schritt 4: Qualitaetspruefung der Sprach-Ausgabe

**Was:** Manuelles Testen der Blog-Generierung in jeder neuen Sprache. Dies ist ein reiner Test-Schritt — kein Code.

**Erklaerung fuer die Praktikantin:**
Claude ist sehr gut in mehreren Sprachen, aber es gibt Nuancen. Wir muessen pruefen:
- Schreibt Claude wirklich ALLES in der gewaehlten Sprache? (Keine deutschen Ueberschriften in einem franzoesischen Blog)
- Sind die Ueberschriften idiomatisch? (Nicht wortwoertlich uebersetzt)
- Stimmt die Ansprache? (Franzoesisch: "vous" vs. "tu"; Spanisch: "usted" vs. "tu")

**Test-Matrix:**

| Sprache | Test-Titel | Pruefen |
|---------|-----------|---------|
| Franzoesisch | "10 conseils pour ameliorer votre SEO" | H2s auf Franzoesisch? Vous-Ansprache? |
| Spanisch | "10 consejos para mejorar tu SEO" | H2s auf Spanisch? Tu/Usted konsistent? |
| Italienisch | "10 consigli per migliorare il tuo SEO" | H2s auf Italienisch? Formell/informell? |
| Englisch | "10 Tips to Improve Your SEO" | Kein Deutsch eingemischt? |
| Deutsch | "10 Tipps fuer besseres SEO" | Unveraendert wie bisher? |

**Done-Kriterien:**
- [ ] Jede Sprache wurde mindestens einmal getestet
- [ ] Kein Sprachmix in der Ausgabe
- [ ] Ueberschriften sind in der korrekten Sprache
- [ ] Blog-Qualitaet ist in allen Sprachen akzeptabel

---

## Datenbank-Aenderungen

**Keine.** Die `blogs.language` Spalte in Supabase ist bereits ein `text`-Feld und akzeptiert beliebige Werte. Die Validierung passiert im Backend (Pydantic Schema), nicht in der Datenbank.

---

## API-Aenderungen

### Geaenderte Endpoints

| Method | Path | Aenderung |
|--------|------|----------|
| `POST` | `/api/blogs/generate` | `language` akzeptiert jetzt `"fr"`, `"es"`, `"it"` zusaetzlich |
| `POST` | `/api/blogs/outline` | Gleiche Erweiterung (falls PRP #02 bereits implementiert) |

---

## Frontend-Aenderungen

### Geaenderte Datei
- `project/src/pages/BlogWriter.tsx` — Sprach-Dropdown (5 statt 2 Optionen)

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Voraussetzung:** Backend + Frontend laufen lokal.

**Test 1: Franzoesischer Blog**
1. Blog Writer oeffnen
2. Titel: "Les meilleures pratiques SEO en 2026"
3. Sprache: "Francais" waehlen
4. Blog generieren
5. **Erwartet:** Gesamter Blog auf Franzoesisch (Titel, Ueberschriften, Text, Fazit)
6. **Pruefen:** Keine deutschen Woerter oder Saetze im Text

**Test 2: Spanischer Blog**
1. Titel: "Guia completa de marketing digital"
2. Sprache: "Espanol"
3. Generieren
4. **Erwartet:** Gesamter Blog auf Spanisch

**Test 3: Italienischer Blog**
1. Titel: "Come migliorare la tua strategia di content marketing"
2. Sprache: "Italiano"
3. Generieren
4. **Erwartet:** Gesamter Blog auf Italienisch

**Test 4: Deutsch bleibt gleich**
1. Titel: "SEO Tipps fuer 2026"
2. Sprache: "Deutsch"
3. Generieren
4. **Erwartet:** Kein Unterschied zu vorher

**Test 5: Easy Mode**
1. Easy Mode Tab waehlen
2. Titel eingeben, Generieren
3. **Erwartet:** Blog auf Deutsch (Easy Mode nutzt immer "de")

**Test 6: Ungueltige Sprache (API-Test)**
1. Per Postman/curl: `POST /api/blogs/generate` mit `"language": "jp"`
2. **Erwartet:** HTTP 422 "Validation Error"

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
1. **Sprachqualitaet variiert**: Claude ist am besten auf Englisch, gut auf Deutsch/Franzoesisch/Spanisch, etwas schwaecher auf Italienisch. *Mitigation:* Die starke Sprachanweisung im System-Prompt hilft. Bei Qualitaetsproblemen koennen sprachspezifische Prompt-Tweaks gemacht werden.
2. **SEO-Analyse auf nicht-deutschen Sprachen**: Die SERP-Analyse (PRP #03) sucht mit Tavily. Tavily liefert fuer franzoesische/spanische Keywords moeglicherweise weniger relevante Ergebnisse als fuer deutsche/englische. *Mitigation:* Tavily unterstuetzt mehrere Sprachen — Ergebnisse pruefen.
3. **Company Style-Profile auf Deutsch**: Wenn ein Unternehmen ein deutsches Style-Profile hat, aber ein franzoesischer Blog generiert wird, koennte der Stil nicht gut uebertragen werden. *Mitigation:* Akzeptable Limitierung fuer V1. Style-Profile in der Blog-Sprache waere ideal, aber komplex.

### Offene Fragen
1. Sollen weitere Sprachen hinzugefuegt werden? (Empfehlung: Ja, spaeter — PT, NL, PL, SV sind einfach erweiterbar)
2. Soll die Landing Page mehrsprachig sein? (Empfehlung: Nein, V1 nur Deutsch)
3. Soll die Sprache pro Unternehmen oder pro Blog gewaehlt werden? (Aktuell: pro Blog — das ist flexibler)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Backend Schema erweitern
     ↓
Schritt 2: Prompts sprachbewusst machen
     ↓
Schritt 3: Frontend Dropdown erweitern
     ↓
Schritt 4: Qualitaetspruefung (manuell)
```

**Reihenfolge fuer Claude Code:** 1 → 2 → 3 (dann manuelle Tests)

---

## Naechster Schritt

```bash
# Dieses PRP ausfuehren:
/02-execute docs/PRPs/PRP_10_Mehrsprachigkeit.md
```
