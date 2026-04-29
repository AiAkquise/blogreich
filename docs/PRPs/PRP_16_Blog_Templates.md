# PRP #16: Blog Templates — Vordefinierte Artikel-Strukturen (How-To, Listicle, Guide, Vergleich, Review)

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P3 (Differenzierung — verbessert die Content-Qualitaet und UX)
**Geschaetzte Komplexitaet:** Medium
**Betroffene Dateien:** 5 (2 Backend + 2 Frontend + 1 Supabase)
**Abhaengigkeiten:** PRP #02 (Outline Editor — Templates definieren die Outline-Struktur vor)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Aktuell generiert Blogreich jeden Blog mit der gleichen Struktur: Einleitung → 5-7 H2-Abschnitte → Fazit. Das funktioniert fuer allgemeine Artikel, aber verschiedene Blog-Typen brauchen verschiedene Strukturen:

- Ein **"How-To"** Artikel braucht nummerierte Schritte, Materialien-Liste und Tipps-Box
- Eine **"Listicle"** (z.B. "10 beste Tools") braucht nummerierte Eintraege mit Pro/Contra
- Ein **"Ultimate Guide"** braucht ein Inhaltsverzeichnis, tiefe H3-Untergliederung und FAQ
- Ein **"Vergleich"** (z.B. "Tool A vs. Tool B") braucht eine Vergleichstabelle und Bewertungen
- Ein **"Produktreview"** braucht Bewertungskriterien, Pro/Contra-Liste und ein Fazit-Rating

Ohne Templates generiert die KI immer den gleichen generischen Aufbau — mit Templates wird jeder Blog-Typ optimal strukturiert.

### Die Loesung

Wir bauen ein **Template-System** mit 5 vorgefertigten Blog-Typen:

1. Der Nutzer waehlt im BlogWriter einen Template-Typ (oder "Kein Template")
2. Jedes Template hat einen eigenen **System-Prompt** (der der KI sagt, WIE der Artikel strukturiert sein soll) und eine **Outline-Vorlage** (die H2/H3-Struktur)
3. Die Templates sind in Supabase gespeichert — spaeter kann der Nutzer eigene Templates erstellen

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **Template** | Eine Vorlage / Schablone. Wie ein Formular das schon die Felder vorgibt — du musst nur noch ausfuellen. In unserem Fall: Die Struktur des Blog-Artikels ist vorgegeben (welche Abschnitte, in welcher Reihenfolge, mit welchen Inhalten). |
| **Listicle** | Ein Blog-Artikel in Listenform: "10 beste...", "7 Gruende warum...", "5 Tipps fuer...". Sehr beliebt bei Lesern und gut fuer SEO, weil Google die Listenpunkte als Featured Snippets anzeigen kann. |
| **How-To / Anleitung** | Ein Schritt-fuer-Schritt Artikel: "Wie man X macht". Hat nummerierte Schritte, oft mit Bildern pro Schritt. Google zeigt How-To-Artikel oft als Rich Snippets mit Schritten. |
| **Ultimate Guide** | Ein ausfuehrlicher, umfassender Artikel zu einem Thema. Normalerweise 3000-5000+ Woerter, mit Inhaltsverzeichnis und vielen Unterabschnitten. Positioniert den Autor als Experte. |
| **Vergleich / Comparison** | "Tool A vs. Tool B" oder "Die 5 besten CRM-Systeme im Vergleich". Enthaelt typischerweise eine Vergleichstabelle und individuelle Bewertungen. |
| **Produktreview** | Eine ausfuehrliche Bewertung eines einzelnen Produkts oder Dienstleistung. Enthaelt Bewertungskriterien, Pro/Contra, Preis-Leistungs-Verhaeltnis. |
| **Seed Data** | Vorgefertigte Daten die beim Erststart der App in die Datenbank geladen werden. Unsere 5 Templates sind Seed Data — sie muessen einmal per SQL eingefuegt werden. |
| **Outline-Vorlage** | Die vordefinierte H2/H3-Struktur eines Templates. Z.B. fuer How-To: "Voraussetzungen → Schritt 1 → Schritt 2 → ... → Haeufige Fehler → Fazit". |

---

## Ziel

Ein Template-System implementieren mit 5 vorgefertigten Blog-Typen (How-To, Listicle, Guide, Vergleich, Review), die jeweils einen optimierten System-Prompt und eine Outline-Vorlage mitbringen. Templates werden im BlogWriter als Option angeboten und beeinflussen die Outline- und Content-Generierung.

## User Story

Als Blogreich-Nutzer
moechte ich vor der Blog-Generierung einen Artikel-Typ waehlen koennen (z.B. "Listicle", "How-To Guide")
damit die Struktur meines Blogs zum Inhalt passt und professioneller wirkt.

## Scope

### In Scope
- **5 vorgefertigte Templates:** How-To, Listicle, Ultimate Guide, Vergleich, Produktreview
- **Supabase-Tabelle** `blog_templates` mit System-Prompt und Outline-Struktur pro Template
- **Seed Data** — die 5 Templates werden per SQL eingefuegt
- **Template-Auswahl** im BlogWriter (RadioGroup/Cards)
- **Template beeinflusst Outline-Generierung** (PRP #02) und Content-Generierung
- **Option "Kein Template"** — freie Generierung wie bisher

### Out of Scope
- Custom Templates (Nutzer erstellt eigene — spaeter)
- Template-Marketplace (vorgefertigte Templates von der Community — spaeter)
- Template-Vorschau (wie ein Beispiel-Blog pro Template aussieht — spaeter)
- Template-spezifisches Schema Markup (z.B. HowTo Schema — kommt mit PRP #14 Erweiterung)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/blogs/schemas.py` | `BlogGenerateRequest` + `OutlineRequest` erhalten `template_id: str | None` | L8-28 |
| `backend/app/blogs/prompts.py` | System-Prompts werden mit Template-Prompt angereichert; Outline-Builder beruecksichtigt Template-Struktur | L6-100 |
| `backend/app/blogs/service.py` | Template laden wenn `template_id` vorhanden; Template-Prompt in System-Prompt integrieren | L167-238 |
| `project/src/pages/BlogWriter.tsx` | Template-Auswahl UI (Cards/RadioGroup) im Advanced Tab | L247-396 |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| Keine neuen Dateien | Templates werden ueber bestehende Blog-Pipeline gesteuert |

---

## Technischer Plan

### Schritt 1: Supabase — blog_templates Tabelle + Seed Data (MANUELL)

**Wo:** Supabase Dashboard → SQL Editor
**Was:** Tabelle erstellen und die 5 Standard-Templates einfuegen.

**Erklaerung fuer die Praktikantin:**
Wir erstellen eine Tabelle die unsere Blog-Templates speichert. Dann fuegen wir die 5 vorgefertigten Templates als "Seed Data" ein — das sind die Startwerte die immer vorhanden sein muessen.

**SQL:**
```sql
-- Template-Tabelle
CREATE TABLE IF NOT EXISTS blog_templates (
    id text PRIMARY KEY,
        -- Einfache IDs: 'howto', 'listicle', 'guide', 'comparison', 'review'
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL DEFAULT 'FileText',
        -- Lucide Icon Name fuer die Frontend-Anzeige
    system_prompt_addition text NOT NULL,
        -- Wird an den bestehenden System-Prompt angehaengt
    outline_structure jsonb NOT NULL,
        -- Vordefinierte H2/H3 Struktur als JSON
    recommended_word_count int NOT NULL DEFAULT 3000,
    is_active boolean DEFAULT true,
    sort_order int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Kein RLS noetig — Templates sind global (nicht pro User)
-- Alle Nutzer sehen die gleichen Templates

COMMENT ON TABLE blog_templates IS 'Predefined blog article templates with structure and prompts.';

-- === SEED DATA: 5 Standard-Templates ===

INSERT INTO blog_templates (id, name, description, icon, system_prompt_addition, outline_structure, recommended_word_count, sort_order)
VALUES
(
    'howto',
    'How-To / Anleitung',
    'Schritt-fuer-Schritt Anleitungen mit nummerierten Schritten und Tipps.',
    'BookOpen',
    'TEMPLATE: HOW-TO / ANLEITUNG
Strukturiere den Artikel als Schritt-fuer-Schritt-Anleitung:
- Beginne mit einer Einfuehrung die erklaert WARUM der Leser das braucht
- Liste benoetigte Voraussetzungen/Materialien auf
- Nummeriere die Schritte klar (Schritt 1, Schritt 2, ...)
- Jeder Schritt hat eine klare Handlungsanweisung
- Fuege pro Schritt einen "Tipp" oder "Achtung" Hinweis ein wo sinnvoll
- Schliesse mit einer Zusammenfassung und "Naechste Schritte"',
    '[
        {"h2": "Was du brauchst (Voraussetzungen)", "h3": [], "key_points": ["Benoetigte Tools/Materialien", "Zeitaufwand", "Vorkenntnisse"]},
        {"h2": "Schritt 1: [wird von KI befuellt]", "h3": [], "key_points": ["Klare Handlungsanweisung"]},
        {"h2": "Schritt 2: [wird von KI befuellt]", "h3": [], "key_points": ["Klare Handlungsanweisung"]},
        {"h2": "Schritt 3: [wird von KI befuellt]", "h3": [], "key_points": ["Klare Handlungsanweisung"]},
        {"h2": "Schritt 4: [wird von KI befuellt]", "h3": [], "key_points": ["Klare Handlungsanweisung"]},
        {"h2": "Haeufige Fehler und wie du sie vermeidest", "h3": [], "key_points": ["Top 3-5 Fehler", "Loesungen"]},
        {"h2": "Naechste Schritte und Weiterbildung", "h3": [], "key_points": ["Was kommt nach dieser Anleitung?"]}
    ]',
    2500,
    1
),
(
    'listicle',
    'Listicle (Top-X Liste)',
    'Nummerierte Listen wie "10 beste...", "7 Gruende...", "5 Tipps fuer...".',
    'ListOrdered',
    'TEMPLATE: LISTICLE / TOP-X-LISTE
Strukturiere den Artikel als nummerierte Liste:
- Jeder Listenpunkt ist ein eigener H2-Abschnitt mit Nummer
- Beginne jeden Punkt mit dem Namen/Titel des Eintrags
- Erklaere bei jedem Punkt: Was ist es, warum ist es gut, fuer wen eignet es sich
- Fuege wo moeglich Pro/Contra oder Bewertungskriterien ein
- Ordne die Liste sinnvoll (z.B. vom Besten zum Schlechtesten, oder nach Preis)
- Schliesse mit einer Zusammenfassung: "Unser Fazit und Empfehlung"',
    '[
        {"h2": "1. [wird von KI befuellt]", "h3": ["Vorteile", "Nachteile", "Fuer wen geeignet?"], "key_points": []},
        {"h2": "2. [wird von KI befuellt]", "h3": ["Vorteile", "Nachteile", "Fuer wen geeignet?"], "key_points": []},
        {"h2": "3. [wird von KI befuellt]", "h3": ["Vorteile", "Nachteile", "Fuer wen geeignet?"], "key_points": []},
        {"h2": "4. [wird von KI befuellt]", "h3": ["Vorteile", "Nachteile", "Fuer wen geeignet?"], "key_points": []},
        {"h2": "5. [wird von KI befuellt]", "h3": ["Vorteile", "Nachteile", "Fuer wen geeignet?"], "key_points": []},
        {"h2": "Vergleichstabelle auf einen Blick", "h3": [], "key_points": ["Uebersicht aller Punkte als Tabelle"]},
        {"h2": "Unser Fazit und Empfehlung", "h3": [], "key_points": ["Beste Wahl fuer...", "Preis-Leistungs-Sieger", "Geheimtipp"]}
    ]',
    3000,
    2
),
(
    'guide',
    'Ultimate Guide',
    'Umfassender Leitfaden mit tiefgehender Abdeckung eines Themas.',
    'GraduationCap',
    'TEMPLATE: ULTIMATE GUIDE / UMFASSENDER LEITFADEN
Strukturiere den Artikel als ausfuehrlichen, autoritativen Guide:
- Beginne mit einem Ueberblick: Was wird der Leser lernen?
- Gliedere in logische Kapitel mit H2 und detaillierten H3-Unterabschnitten
- Jedes Kapitel soll eigenstaendig verstaendlich sein
- Fuege Experteneinschaetzungen, Statistiken und Best Practices ein
- Nutze Tabellen, Aufzaehlungen und Hervorhebungen fuer Uebersicht
- Beende mit einer Zusammenfassung der wichtigsten Erkenntnisse und Handlungsempfehlungen
- Ziel: Der Leser soll ALLES lernen was er zum Thema wissen muss',
    '[
        {"h2": "Was ist [Thema]? Definition und Grundlagen", "h3": ["Definition", "Warum ist es wichtig?", "Geschichte und Entwicklung"], "key_points": []},
        {"h2": "Die wichtigsten Konzepte verstehen", "h3": ["Konzept 1", "Konzept 2", "Konzept 3"], "key_points": []},
        {"h2": "Strategien und Best Practices", "h3": ["Strategie 1", "Strategie 2", "Strategie 3", "Haeufige Fehler"], "key_points": []},
        {"h2": "Tools und Ressourcen", "h3": ["Kostenlose Tools", "Premium-Tools", "Empfohlene Lernressourcen"], "key_points": []},
        {"h2": "Praxisbeispiele und Case Studies", "h3": ["Beispiel 1", "Beispiel 2", "Was wir daraus lernen"], "key_points": []},
        {"h2": "Fortgeschrittene Techniken", "h3": ["Technik 1", "Technik 2", "Wann welche Technik?"], "key_points": []},
        {"h2": "Zusammenfassung und Handlungsplan", "h3": ["Die 5 wichtigsten Takeaways", "Dein Aktionsplan fuer die naechsten 30 Tage"], "key_points": []}
    ]',
    4000,
    3
),
(
    'comparison',
    'Vergleich (A vs. B)',
    'Vergleichsartikel mit Gegenueberstellung und Bewertungstabelle.',
    'Scale',
    'TEMPLATE: VERGLEICHSARTIKEL
Strukturiere den Artikel als neutralen, fairen Vergleich:
- Beginne mit einer Kurzuebersicht: Was wird verglichen und warum?
- Stelle die Vergleichskriterien klar vor
- Beschreibe jede Option/jedes Produkt einzeln
- Erstelle eine direkte Gegenueberstellung (Tabelle wo moeglich)
- Gib fuer verschiedene Nutzungsszenarien Empfehlungen
- Bleibe neutral — kein Produkt bevorzugen ohne Begruendung
- Schliesse mit "Unsere Empfehlung" basierend auf dem Nutzer-Profil',
    '[
        {"h2": "Ueberblick: [A] vs. [B] im Vergleich", "h3": ["Kurzvorstellung A", "Kurzvorstellung B", "Unsere Vergleichskriterien"], "key_points": []},
        {"h2": "[A] im Detail", "h3": ["Features", "Preise", "Staerken", "Schwaechen"], "key_points": []},
        {"h2": "[B] im Detail", "h3": ["Features", "Preise", "Staerken", "Schwaechen"], "key_points": []},
        {"h2": "Direkter Vergleich: [A] vs. [B]", "h3": ["Funktionsvergleich", "Preisvergleich", "Benutzerfreundlichkeit", "Support und Community"], "key_points": ["Vergleichstabelle einfuegen"]},
        {"h2": "Fuer wen eignet sich welche Loesung?", "h3": ["Ideal fuer Anfaenger", "Ideal fuer Profis", "Ideal fuer Unternehmen"], "key_points": []},
        {"h2": "Unsere Empfehlung", "h3": [], "key_points": ["Klare Empfehlung mit Begruendung"]}
    ]',
    3000,
    4
),
(
    'review',
    'Produktreview',
    'Ausfuehrliche Bewertung eines Produkts oder Dienstleistung.',
    'Star',
    'TEMPLATE: PRODUKTREVIEW / BEWERTUNG
Strukturiere den Artikel als ausfuehrliche, ehrliche Bewertung:
- Beginne mit einer Zusammenfassung und Gesamtbewertung (Sterne/Punkte)
- Stelle das Produkt/die Dienstleistung vor (Was ist es? Fuer wen?)
- Bewerte systematisch nach Kriterien (z.B. 1-10 Punkte)
- Nenne klare Pro und Contra Punkte
- Beschreibe die eigene Erfahrung/Testbericht
- Vergleiche kurz mit Alternativen
- Gib ein Preis-Leistungs-Urteil
- Schliesse mit einer klaren Kauf-/Nicht-Kauf-Empfehlung',
    '[
        {"h2": "Auf einen Blick: Zusammenfassung und Bewertung", "h3": ["Gesamtbewertung", "Fuer wen geeignet?", "Preis"], "key_points": ["Bewertungstabelle: Kriterium → Punkte"]},
        {"h2": "Was ist [Produkt]? Vorstellung und Features", "h3": ["Kernfunktionen", "Besondere Merkmale", "Verfuegbare Plaene/Versionen"], "key_points": []},
        {"h2": "Unsere Erfahrung im Test", "h3": ["Einrichtung und Onboarding", "Tagesgebrauch", "Performance"], "key_points": []},
        {"h2": "Bewertung nach Kriterien", "h3": ["Benutzerfreundlichkeit", "Funktionsumfang", "Preis-Leistung", "Support"], "key_points": ["Je Kriterium: Punkte + Begruendung"]},
        {"h2": "Vor- und Nachteile", "h3": ["Vorteile (Pro)", "Nachteile (Contra)"], "key_points": []},
        {"h2": "Alternativen im Vergleich", "h3": ["Alternative 1", "Alternative 2"], "key_points": []},
        {"h2": "Fazit: Lohnt sich [Produkt]?", "h3": [], "key_points": ["Klare Empfehlung", "Fuer wen ja, fuer wen nein"]}
    ]',
    3500,
    5
)
ON CONFLICT (id) DO NOTHING;
```

**Schritt-fuer-Schritt fuer die Praktikantin:**
1. Supabase Dashboard → SQL Editor → New Query
2. Den GESAMTEN SQL-Code oben einfuegen
3. "Run" klicken
4. **Erwartet:** "Success. No rows returned"
5. Pruefe: Table Editor → `blog_templates` → 5 Zeilen sollten sichtbar sein

**Done-Kriterien:**
- [ ] Tabelle `blog_templates` existiert mit 5 Eintraegen
- [ ] Jeder Eintrag hat `system_prompt_addition`, `outline_structure`, `icon`
- [ ] `ON CONFLICT DO NOTHING` verhindert Duplikate bei erneutem Ausfuehren

---

### Schritt 2: Backend — Template in Blog-Pipeline integrieren

**Dateien:** `backend/app/blogs/schemas.py`, `backend/app/blogs/service.py`, `backend/app/blogs/prompts.py`
**Was:** Wenn ein `template_id` mitgegeben wird, Template aus Supabase laden und den System-Prompt + Outline entsprechend anpassen.

**Aenderung an Schemas:**
```python
class BlogGenerateRequest(BaseModel):
    # ... bestehende Felder ...
    template_id: str | None = None  # NEU: z.B. "howto", "listicle", "guide"

# Falls PRP #02 implementiert:
class OutlineRequest(BaseModel):
    # ... bestehende Felder ...
    template_id: str | None = None
```

**Aenderung an `generate_blog()` (service.py):**
```python
# Nach Style-Loading, vor Outline-Generierung:
template_data: dict | None = None
if request.template_id:
    template_result = await db_query("blog_templates", {"id": request.template_id})
    if template_result.data:
        template_data = template_result.data[0]

# Template-Prompt an System-Prompt anhaengen:
if template_data:
    styled_outline_prompt += f"\n\n{template_data['system_prompt_addition']}"
    styled_section_prompt += f"\n\n{template_data['system_prompt_addition']}"

# Outline: Template-Struktur als Basis nutzen (wenn kein User-Outline):
if request.outline:
    sections_spec = [s.model_dump() for s in request.outline]
elif template_data and template_data.get("outline_structure"):
    # Template-Outline als Ausgangspunkt fuer die Outline-Generierung
    # Die KI passt die "[wird von KI befuellt]" Platzhalter an den Titel an
    outline_prompt += f"\n\nVERWENDE DIESE STRUKTUR ALS BASIS (passe die Inhalte an den Titel an):\n{json.dumps(template_data['outline_structure'], ensure_ascii=False)}"
```

**Done-Kriterien:**
- [ ] Template wird aus Supabase geladen wenn `template_id` vorhanden
- [ ] Template-System-Prompt wird an bestehende Prompts angehaengt
- [ ] Template-Outline wird als Basis fuer die KI-Outline-Generierung genutzt
- [ ] Ohne `template_id` funktioniert alles wie bisher
- [ ] Ungueltiges `template_id` → wird ignoriert (Fallback auf Standard)

---

### Schritt 3: Backend — Templates API-Endpoint

**Datei:** `backend/app/blogs/routes.py`
**Was:** Einfacher GET-Endpoint der alle verfuegbaren Templates zurueckgibt. Kein separater Feature-Slice noetig — Templates sind Teil des Blogs-Features.

```python
@router.get("/templates")
async def list_templates() -> list[dict]:
    """List all available blog templates."""
    result = await db_query("blog_templates", {"is_active": True})
    return sorted(result.data or [], key=lambda t: t.get("sort_order", 0))
```

**Kein JWT noetig** — Templates sind global und oeffentlich.

**Done-Kriterien:**
- [ ] `GET /api/blogs/templates` gibt die 5 Templates zurueck
- [ ] Sortiert nach `sort_order`
- [ ] Inaktive Templates werden ausgeblendet
- [ ] Kein Auth erforderlich

---

### Schritt 4: Frontend — Template-Auswahl im BlogWriter

**Datei:** `project/src/pages/BlogWriter.tsx`
**Was:** Template-Auswahl als visuelles Card-Grid im Advanced Tab, VOR dem Titel-Eingabefeld.

**Erklaerung fuer die Praktikantin:**
Der Nutzer sieht zuerst die Template-Auswahl (5 Karten + "Kein Template"), waehlt einen Typ, und gibt dann seinen Titel ein. Das gewaehlte Template beeinflusst, wie der Blog strukturiert wird.

**Visuelles Design:**
```
┌─────────────────────────────────────────────────────────────┐
│ Artikel-Typ waehlen:                                         │
│                                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ 📝       │ │ 📋       │ │ 🎓       │ │ ⚖️       │        │
│ │ Frei     │ │ How-To   │ │ Listicle │ │ Guide    │        │
│ │ (kein    │ │ Schritt  │ │ Top-X    │ │ Umfas-   │        │
│ │ Template)│ │ fuer     │ │ Liste    │ │ send     │        │
│ │          │ │ Schritt  │ │          │ │          │        │
│ │  [aktiv] │ │          │ │          │ │          │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                             │
│ ┌──────────┐ ┌──────────┐                                  │
│ │ ⚖️       │ │ ⭐       │                                  │
│ │ Vergleich│ │ Review   │                                  │
│ │ A vs. B  │ │ Produkt- │                                  │
│ │          │ │ bewertung│                                  │
│ └──────────┘ └──────────┘                                  │
│                                                             │
│ Blog-Titel: [________________________________]              │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

**Implementierung:**
```typescript
const [templates, setTemplates] = useState<BlogTemplate[]>([]);
const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

useEffect(() => {
    apiGet<BlogTemplate[]>('/api/blogs/templates')
        .then(setTemplates)
        .catch(() => {});
}, []);

// Im API-Call:
template_id: isEasy ? null : selectedTemplate,
```

**Bestehende Komponenten:**
- `Card` mit Border-Highlight fuer aktive Auswahl
- Lucide Icons (dynamisch basierend auf `template.icon`)

**Done-Kriterien:**
- [ ] Templates werden beim Laden der Seite von der API geladen
- [ ] 6 Karten angezeigt (5 Templates + "Frei")
- [ ] Aktive Auswahl ist visuell hervorgehoben (Primary-Border)
- [ ] Gewaehltes `template_id` wird an die API uebergeben
- [ ] Default: "Frei" (kein Template)
- [ ] Easy Mode: Kein Template (wird ignoriert)
- [ ] `npx tsc --noEmit` fehlerfrei

---

### Schritt 5: Frontend — Template-Info im Outline-Editor

**Datei:** `project/src/pages/BlogWriter.tsx` (Outline-Editor-Bereich aus PRP #02)
**Was:** Wenn ein Template gewaehlt ist UND der Outline-Editor angezeigt wird, zeige einen Hinweis welches Template verwendet wird.

**UI:**
```
Gliederung bearbeiten (Template: How-To Anleitung)
Tipp: Die Gliederung basiert auf der How-To-Vorlage. Du kannst sie frei anpassen.
```

**Done-Kriterien:**
- [ ] Hinweis zeigt den Template-Namen
- [ ] Tipp erklaert, dass die Outline anpassbar ist
- [ ] Ohne Template: Kein Hinweis

---

## Datenbank-Aenderungen

### Neue Tabelle + Seed Data (manuell in Supabase)

Siehe **Schritt 1**.

---

## API-Aenderungen

### Neuer Endpoint

| Method | Path | Auth | Beschreibung |
|--------|------|:---:|-------------|
| `GET` | `/api/blogs/templates` | Nein | Alle aktiven Templates |

### Geaenderte Endpoints

| Method | Path | Aenderung |
|--------|------|----------|
| `POST` | `/api/blogs/generate` | Neuer optionaler Parameter `template_id` |
| `POST` | `/api/blogs/outline` | Neuer optionaler Parameter `template_id` |

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Test 1: How-To Template**
1. BlogWriter → Template "How-To" waehlen
2. Titel: "So erstellst du eine Content-Marketing-Strategie"
3. Blog generieren (oder Outline generieren)
4. **Erwartet:** Gliederung hat Schritte (Schritt 1, Schritt 2, ...) und "Haeufige Fehler" Section
5. **Erwartet:** Content ist als Anleitung formuliert

**Test 2: Listicle Template**
1. Template "Listicle" → Titel: "10 beste SEO-Tools 2026"
2. Generieren
3. **Erwartet:** 5-10 nummerierte H2-Abschnitte mit Pro/Contra

**Test 3: Kein Template**
1. Template "Frei" waehlen → beliebiger Titel
2. Generieren
3. **Erwartet:** Standard-Gliederung wie bisher (5-7 H2-Abschnitte)

**Test 4: Template + Outline Editor**
1. Template "Guide" waehlen, Outline generieren
2. **Erwartet:** Outline hat Guide-Struktur (Definition, Konzepte, Strategien, Tools...)
3. Outline bearbeiten (Abschnitt loeschen)
4. Blog generieren
5. **Erwartet:** Blog folgt der bearbeiteten Outline

### Validierung

```bash
cd backend && uv run ruff check . && uv run mypy app/ && uv run pytest -v
cd project && npx tsc --noEmit && npm run build
```

---

## Risiken & Offene Fragen

### Risiken
1. **KI ignoriert Template-Struktur:** Claude koennte die Template-Outline-Vorlage ignorieren und eine eigene Struktur erstellen. *Mitigation:* Starke Anweisung im System-Prompt ("VERWENDE DIESE STRUKTUR").
2. **Platzhalter nicht ersetzt:** Die `[wird von KI befuellt]` Platzhalter koennten wortwwertlich im Output erscheinen. *Mitigation:* Post-Processing das Platzhalter entfernt.
3. **Templates zu starr:** Manche Themen passen nicht gut in ein Template. *Mitigation:* "Frei" Option als Default; User kann Outline bearbeiten.

### Offene Fragen
1. Sollen Nutzer eigene Templates erstellen koennen? (Empfehlung: Spaeter)
2. Soll das empfohlene Wortanzahl pro Template automatisch gesetzt werden? (Empfehlung: Ja — `recommended_word_count` vom Template als Default)
3. Templates lokalisieren (DE/EN Versionen)? (Empfehlung: V1 nur DE, System-Prompts auf DE)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Supabase Tabelle + Seed Data (Manuell)
     ↓
Schritt 2: Backend — Pipeline-Integration
     ↓
Schritt 3: Backend — Templates API
     ↓
Schritt 4: Frontend — Template-Auswahl
     ↓
Schritt 5: Frontend — Template-Info im Outline Editor
```

**Reihenfolge fuer Claude Code:** 2 → 3 (Backend) → 1 (Manuell) → 4 → 5 (Frontend)

---

## Naechster Schritt

```bash
/02-execute docs/PRPs/PRP_16_Blog_Templates.md
```
