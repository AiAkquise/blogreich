# PRP #08: Landing Page — Oeffentliche Marketing-Website mit MagicUI

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P1 (Markteintritt — ohne oeffentliche Website kein Marketing moeglich)
**Geschaetzte Komplexitaet:** Medium
**Betroffene Dateien:** 4 (nur Frontend, kein Backend)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Blogreich hat aktuell keine oeffentliche Website. Wenn jemand unsere URL oeffnet, wird er direkt zum Login weitergeleitet. Das ist schlecht weil:
- Potenzielle Kunden koennen nicht sehen, was Blogreich ist, bevor sie sich anmelden
- Wir koennen kein Marketing machen (Google Ads, LinkedIn Posts) — der Link fuehrt zu einem Login-Screen
- Es gibt keine Pricing-Seite — niemand weiss, was Blogreich kostet
- Es fehlt Social Proof (Testimonials, Nutzerzahlen, Feature-Showcase)

Jeder Konkurrent (GravityWrite, Koala, Jasper) hat eine aufwendig gestaltete Landing Page mit Animationen, Feature-Showcase und Pricing-Tabellen.

### Die Loesung

Wir bauen eine **oeffentliche Landing Page** auf der Route `/` mit folgenden Sektionen:
1. **Hero** — Headline, Subtext, CTA-Button ("Kostenlos starten")
2. **Feature-Bento-Grid** — Die 4 Kern-Features in einem animierten Raster
3. **Wie es funktioniert** — 3-Schritt-Erklaerung (Titel → Personalisierung → Blog)
4. **Pricing** — 3 Plaene (Starter, Professional, Agency)
5. **FAQ** — Haeufig gestellte Fragen
6. **CTA Footer** — Letzter Aufruf zur Anmeldung

Wir nutzen **MagicUI** fuer die visuellen Effekte (animierte Texte, Border Beams, Bento Grid) und **shadcn/ui** fuer die Basis-Komponenten (Cards, Buttons, Badges).

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **Landing Page** | Die erste Seite, die ein Besucher sieht wenn er die Website oeffnet. Sie soll den Besucher ueberzeugen, sich anzumelden. Wie ein Schaufenster — es muss ansprechend sein und sofort zeigen, was das Produkt kann. |
| **MagicUI** | Eine Sammlung von vorgefertigten React-Komponenten mit coolen Animationen und Effekten. Man installiert sie mit einem Befehl und kann sie sofort nutzen. Wie ein LEGO-Set fuer animierte Websites. |
| **shadcn/ui** | Unsere Basis-UI-Bibliothek fuer Buttons, Cards, Inputs etc. MagicUI ergaenzt shadcn/ui mit Animation und visuellen Effekten. |
| **Bento Grid** | Ein Layout-Pattern, das Features in unterschiedlich grossen Kacheln anzeigt (wie ein japanisches Bento-Box-Essen — verschiedene Faecher mit verschiedenen Inhalten). Popularisiert von Apple. |
| **Hero Section** | Der grosse, prominente Bereich ganz oben auf einer Landing Page. Enthaelt normalerweise die Hauptbotschaft, eine kurze Beschreibung und einen "Call to Action" Button. |
| **CTA (Call to Action)** | Ein Button oder Link, der den Besucher zu einer Handlung auffordert: "Kostenlos starten", "Demo anfordern", "Jetzt registrieren". Die wichtigste Conversion-Massnahme auf einer Landing Page. |
| **Responsive Design** | Die Seite sieht auf allen Bildschirmgroessen gut aus — Desktop, Tablet, Handy. Tailwind CSS macht das einfach mit Klassen wie `md:grid-cols-3` (3 Spalten ab mittlerer Bildschirmgroesse). |
| **Route** | Eine URL-Pfad-Zuordnung. `/` = Landing Page, `/login` = Login, `/dashboard` = Dashboard. React Router entscheidet anhand der URL, welche Seite angezeigt wird. |
| **Oeffentliche Route** | Eine Route, die ohne Login erreichbar ist. Im Gegensatz zu `/dashboard` (braucht Login) ist `/` fuer alle offen. |
| **Framer Motion / `motion`** | Eine Animations-Library fuer React. Ermoeglicht sanfte Ein-/Ausblendeffekte, Scroll-Animationen und Uebergangseffekte. Bereits im Projekt installiert als `motion`. |

---

## Ziel

Eine visuell ansprechende, oeffentliche Landing Page bauen, die Blogreich als Produkt praesentiert, die USP klar kommuniziert und Besucher zur Anmeldung motiviert. Die Seite nutzt MagicUI-Komponenten fuer Premium-Animationen und ist die Grundlage fuer kuenftiges Marketing.

## User Story

Als potenzieller Blogreich-Nutzer
moechte ich auf der Website sofort verstehen, was Blogreich ist, was es kann und was es kostet
damit ich entscheiden kann, ob ich mich anmelden moechte.

## Scope

### In Scope
- Oeffentliche Route `/` (ohne Auth)
- Hero Section mit AnimatedGradientText und ShimmerButton
- Feature Bento Grid mit 4 Kern-Features
- "Wie es funktioniert" 3-Schritt-Sektion
- Pricing-Tabelle (3 Plaene — statisch, ohne Stripe-Integration)
- FAQ-Sektion (Accordion)
- Footer mit CTA
- Responsive Design (Mobile + Desktop)
- Dark Mode Support
- MagicUI Komponenten installieren

### Out of Scope
- Stripe-Integration (kommt in PRP #09)
- Blog/Content-Marketing-Sektion (spaeter)
- Mehrsprachigkeit der Landing Page (V1 nur Deutsch)
- SEO Meta-Tags optimieren (spaeter)
- Cookie-Banner / DSGVO (spaeter)
- Impressum / Datenschutz Seiten (spaeter — Inhalte muessen vom Anwalt kommen)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `project/src/App.tsx` | Neue Route `/` fuer Landing Page (oeffentlich, ohne AppLayout); Wildcard `*` → `/` statt `/dashboard` fuer nicht-eingeloggte User | L20-33 |
| `project/package.json` | MagicUI Komponenten sind "copy-paste" (via shadcn CLI), keine npm-Dependency noetig | — |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `project/src/pages/Landing.tsx` | Die Landing Page selbst (alle Sektionen) |
| `project/src/components/ui/animated-gradient-text.tsx` | MagicUI Komponente (via `npx shadcn@latest add`) |
| `project/src/components/ui/bento-grid.tsx` | MagicUI Komponente |
| `project/src/components/ui/shimmer-button.tsx` | MagicUI Komponente |
| `project/src/components/ui/number-ticker.tsx` | MagicUI Komponente |
| `project/src/components/ui/grid-pattern.tsx` | MagicUI Hintergrund-Pattern |

---

## Technischer Plan

### Schritt 1: MagicUI Komponenten installieren

**Was:** MagicUI Komponenten ueber die shadcn CLI installieren. MagicUI ist KEINE npm-Dependency — die Komponenten werden als Dateien in `components/ui/` kopiert (genau wie shadcn/ui).

**Erklaerung fuer die Praktikantin:**
MagicUI funktioniert anders als normale npm-Pakete. Statt `npm install magicui` fuehrt man fuer jede Komponente einen Befehl aus, der den Quellcode direkt in dein Projekt kopiert. So hast du volle Kontrolle ueber den Code und kannst ihn anpassen.

**Manueller Schritt:**
1. Oeffne ein Terminal
2. Navigiere zum Frontend-Ordner: `cd project`
3. Fuehre folgende Befehle nacheinander aus:

```bash
npx shadcn@latest add "@magicui/animated-gradient-text"
npx shadcn@latest add "@magicui/bento-grid"
npx shadcn@latest add "@magicui/shimmer-button"
npx shadcn@latest add "@magicui/number-ticker"
npx shadcn@latest add "@magicui/grid-pattern"
npx shadcn@latest add "@magicui/border-beam"
```

4. Bei jeder Installation: Wenn gefragt wird ob Dateien ueberschrieben werden sollen, mit "Yes" bestaetigen
5. **Pruefe:** Im Ordner `project/src/components/ui/` sollten jetzt die neuen Dateien sichtbar sein

**Hinweis:** `border-beam.tsx` existiert bereits (wurde fuer die Image-Progress-UI installiert). Die anderen sind neu.

**Done-Kriterien:**
- [ ] Alle 6 MagicUI Komponenten sind in `components/ui/` installiert
- [ ] `npx tsc --noEmit` laeuft ohne Fehler
- [ ] `npm run build` laeuft ohne Fehler

---

### Schritt 2: Landing Page Seite erstellen

**Datei:** `project/src/pages/Landing.tsx` (NEU)
**Was:** Die komplette Landing Page mit allen Sektionen.

**Erklaerung fuer die Praktikantin:**
Das ist die groesste Datei in diesem PRP — eine einzelne React-Seite mit mehreren Sektionen. Jede Sektion ist eine eigene Funktion (Komponente) innerhalb der Datei. Die Seite ist "statisch" — sie laedt keine Daten aus dem Backend oder der Datenbank.

**Sektionen-Aufbau:**

#### Sektion 1: Hero
```
┌─────────────────────────────────────────────────────────────┐
│                    [Grid Pattern Hintergrund]                │
│                                                             │
│          ✨ KI-gesteuerte Blog-Plattform                    │
│                                                             │
│     Der einzige Blog-Generator, der wie                     │
│       DEIN Unternehmen schreibt                             │
│                                                             │
│  Analysiert deine Website. Lernt deinen Stil.               │
│  Generiert SEO-optimierte Blogs mit Bildern.                │
│                                                             │
│        [✨ Kostenlos starten]    [Demo ansehen]              │
│                                                             │
│     Bereits 50+ Blogs generiert  |  4.8/5 Bewertung        │
└─────────────────────────────────────────────────────────────┘
```

- `AnimatedGradientText` fuer den Tagline-Badge
- `ShimmerButton` fuer den primaeren CTA
- `GridPattern` als Hintergrund
- `NumberTicker` fuer animierte Statistiken

#### Sektion 2: Feature Bento Grid
```
┌─────────────────────────────────────────────────────────────┐
│  Features die den Unterschied machen                         │
│                                                             │
│  ┌──────────────────────┐  ┌─────────────────────────────┐ │
│  │ 🏢 Unternehmens-     │  │ 📝 SEO-optimierte Blogs     │ │
│  │    Personalisierung   │  │    SERP-Analyse, Keywords   │ │
│  │    Website-Analyse    │  │    Entity-Coverage           │ │
│  │    Style-Profiling    │  │                              │ │
│  └──────────────────────┘  └─────────────────────────────┘ │
│  ┌─────────────────────────────┐  ┌──────────────────────┐ │
│  │ 🖼️ KI-Bilder pro Abschnitt  │  │ 🔗 WordPress 1-Click │ │
│  │    FLUX.2 Bildgenerierung   │  │    Direkt publizieren │ │
│  └─────────────────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- `BentoGrid` + `BentoCard` von MagicUI
- 4 Features: Personalisierung, SEO, Bilder, WordPress

#### Sektion 3: Wie es funktioniert (3 Schritte)
```
┌─────────────────────────────────────────────────────────────┐
│  So einfach geht's                                           │
│                                                             │
│  ① Titel eingeben    →    ② KI analysiert    →    ③ Fertig! │
│  Blog-Thema waehlen     Dein Stil, SEO,        Blog mit    │
│                          Keywords               Bildern     │
└─────────────────────────────────────────────────────────────┘
```

- Einfache shadcn/ui Cards mit Icons und Text
- `motion` fuer Scroll-Einblendeffekte (Fade-In bei Scroll)

#### Sektion 4: Pricing
```
┌─────────────────────────────────────────────────────────────┐
│  Einfache, transparente Preise                               │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐        │
│  │ Starter      │  │ Professional │  │ Agency      │        │
│  │ 19 EUR/mo    │  │ 49 EUR/mo    │  │ 149 EUR/mo  │        │
│  │              │  │ ⭐ Beliebt   │  │              │        │
│  │ 10 Blogs     │  │ 30 Blogs     │  │ 100 Blogs   │        │
│  │ 1 Firma      │  │ 3 Firmen     │  │ 15 Firmen   │        │
│  │ 30 Bilder    │  │ 100 Bilder   │  │ 300 Bilder  │        │
│  │              │  │ SEO-Analyse  │  │ Bulk Gen    │        │
│  │              │  │ WP Publish   │  │ API Access  │        │
│  │ [Starten]    │  │ [Starten]    │  │ [Starten]   │        │
│  └─────────────┘  └──────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

- shadcn/ui Cards mit `BorderBeam` Effekt auf dem "Professional" Plan
- Statische Preise (Stripe-Integration kommt in PRP #09)
- Alle Buttons verlinken aktuell auf `/register`

#### Sektion 5: FAQ
```
┌─────────────────────────────────────────────────────────────┐
│  Haeufig gestellte Fragen                                    │
│                                                             │
│  ▸ Was ist Blogreich?                                       │
│  ▸ Wie funktioniert die Unternehmens-Personalisierung?      │
│  ▸ Welche Sprachen werden unterstuetzt?                     │
│  ▸ Kann ich den Blog vor der Veroeffentlichung bearbeiten?  │
│  ▸ Wie kündige ich mein Abo?                                │
└─────────────────────────────────────────────────────────────┘
```

- Einfaches Accordion-Pattern (kein shadcn Accordion noetig — `details`/`summary` HTML reicht)

#### Sektion 6: CTA Footer
```
┌─────────────────────────────────────────────────────────────┐
│  Bereit, bessere Blogs zu schreiben?                         │
│                                                             │
│  [✨ Jetzt kostenlos starten]                                │
│                                                             │
│  Blogreich  |  Impressum  |  Datenschutz  |  AGB           │
└─────────────────────────────────────────────────────────────┘
```

**Done-Kriterien:**
- [ ] Alle 6 Sektionen sind implementiert
- [ ] Seite ist responsive (Mobile + Desktop)
- [ ] Dark Mode wird unterstuetzt
- [ ] MagicUI Effekte funktionieren (AnimatedGradientText animiert, ShimmerButton schimmert, NumberTicker zaehlt hoch)
- [ ] Alle CTA-Buttons verlinken auf `/register`
- [ ] Seite laedt keine Backend-Daten (rein statisch)
- [ ] `npx tsc --noEmit` fehlerfrei

---

### Schritt 3: Routing anpassen

**Datei:** `project/src/App.tsx`
**Was:** Neue oeffentliche Route `/` fuer die Landing Page. Die Wildcard `*` soll nicht-eingeloggte User auf `/` leiten (statt `/dashboard`).

**Erklaerung fuer die Praktikantin:**
Aktuell leitet die App alle unbekannten URLs auf `/dashboard` weiter (Zeile 32). Das bedeutet, wenn jemand `blogreich.de` oeffnet, sieht er sofort das Dashboard (oder den Login, wenn er nicht eingeloggt ist). Das wollen wir aendern: `blogreich.de` soll die Landing Page zeigen, und nur eingeloggte User sollen ins Dashboard kommen.

**Aktuelle Routing-Struktur (App.tsx Zeile 20-33):**
```tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route element={<AppLayout />}>
    <Route path="/dashboard" element={<Dashboard />} />
    // ... geschuetzte Routen
  </Route>
  <Route path="*" element={<Navigate to="/dashboard" replace />} />
</Routes>
```

**Neue Routing-Struktur:**
```tsx
<Routes>
  <Route path="/" element={<Landing />} />           {/* NEU: oeffentlich */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route element={<AppLayout />}>
    <Route path="/dashboard" element={<Dashboard />} />
    // ... geschuetzte Routen
  </Route>
  <Route path="*" element={<Navigate to="/" replace />} /> {/* GEAENDERT: → / */}
</Routes>
```

**Done-Kriterien:**
- [ ] `/` zeigt die Landing Page (oeffentlich, kein Login noetig)
- [ ] `/login` und `/register` funktionieren wie bisher
- [ ] `/dashboard` und alle geschuetzten Routen funktionieren wie bisher (nur mit Login)
- [ ] Unbekannte URLs leiten auf `/` statt `/dashboard`
- [ ] Eingeloggte User koennen `/` aufrufen und sehen die Landing Page (kein Redirect)

---

### Schritt 4: Navigation auf der Landing Page

**Datei:** `project/src/pages/Landing.tsx`
**Was:** Eine einfache Top-Navigation (Navbar) auf der Landing Page mit Logo, Sections-Links und Login/Register Buttons.

**Navigation:**
```
┌─────────────────────────────────────────────────────────────┐
│ Blogreich    Features  Preise  FAQ       [Login] [Starten]  │
└─────────────────────────────────────────────────────────────┘
```

- Logo links (Text "Blogreich" oder spaeter Bild)
- Anker-Links zu Sektionen (`#features`, `#pricing`, `#faq`)
- Login-Button → `/login`
- "Kostenlos starten" Button → `/register`
- Sticky Header (bleibt oben beim Scrollen)
- Transparent-zu-Weiss Uebergang beim Scrollen

**Done-Kriterien:**
- [ ] Navbar ist sticky (bleibt oben)
- [ ] Anker-Links scrollen sanft zu den Sektionen
- [ ] Login und Register Buttons funktionieren
- [ ] Mobile: Hamburger-Menue (oder vereinfachte Navbar)

---

## Datenbank-Aenderungen

**Keine.**

---

## API-Aenderungen

**Keine.** Die Landing Page ist rein statisch (Frontend-only).

---

## Frontend-Aenderungen

### Neue Dateien
- `project/src/pages/Landing.tsx` — Landing Page
- 5-6 MagicUI Komponenten in `components/ui/`

### Geaenderte Dateien
- `project/src/App.tsx` — Routing

### MagicUI Komponenten (via shadcn CLI installieren)
- `animated-gradient-text` — Animierter Gradient-Text fuer Hero-Badge
- `bento-grid` — Feature-Grid Layout
- `shimmer-button` — Animierter CTA-Button
- `number-ticker` — Animierte Zaehler (Statistiken)
- `grid-pattern` — Hintergrund-Pattern fuer Hero
- `border-beam` — Leuchtender Rand-Effekt (bereits vorhanden)

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Voraussetzung:** Frontend laeuft lokal (`cd project && npm run dev`).

**Test 1: Landing Page oeffnen**
1. Oeffne http://localhost:5173/
2. **Erwartet:** Landing Page wird angezeigt (NICHT Login/Dashboard)
3. Scrolle durch alle Sektionen
4. **Erwartet:** Hero, Features, Wie es funktioniert, Pricing, FAQ, Footer

**Test 2: Navigation**
1. Klicke auf "Features" in der Navbar
2. **Erwartet:** Sanftes Scrollen zur Feature-Sektion
3. Klicke auf "Login"
4. **Erwartet:** Weiterleitung zur Login-Seite

**Test 3: CTA-Buttons**
1. Klicke auf "Kostenlos starten" (Hero)
2. **Erwartet:** Weiterleitung zu `/register`
3. Klicke auf "Starten" bei einem Pricing-Plan
4. **Erwartet:** Weiterleitung zu `/register`

**Test 4: Responsive Design**
1. Oeffne die Browser-DevTools (F12)
2. Aktiviere den "Responsive Design Mode" (Handy-Icon)
3. Waehle verschiedene Geraete (iPhone, iPad)
4. **Erwartet:** Seite sieht auf allen Groessen gut aus, kein Overflow

**Test 5: Dark Mode**
1. Aktiviere Dark Mode in den Browser-/System-Einstellungen
2. **Erwartet:** Landing Page hat dunklen Hintergrund, helle Texte

**Test 6: Animationen**
1. Oeffne die Landing Page
2. **Erwartet:** AnimatedGradientText animiert sich (Farbverlauf bewegt sich)
3. **Erwartet:** ShimmerButton hat einen Schimmer-Effekt
4. **Erwartet:** NumberTicker zaehlt Zahlen hoch
5. Scrolle langsam
6. **Erwartet:** Sektionen blenden sanft ein (Framer Motion)

### Validierung

```bash
# Frontend
cd project && npx tsc --noEmit && npm run build
```

---

## Risiken & Offene Fragen

### Risiken
1. **MagicUI Kompatibilitaet**: MagicUI Komponenten koennten mit unserer Tailwind/React Version inkompatibel sein. *Mitigation:* Einzeln installieren und jeweils testen.
2. **Performance**: Viele Animationen koennen auf schwachen Geraeten langsam sein. *Mitigation:* `motion`-Animationen mit `prefers-reduced-motion` Media Query respektieren.
3. **Content nicht final**: Texte, Preise und FAQ-Inhalte muessen spaeter vom Marketing/Adrian finalisiert werden. *Mitigation:* Platzhalter-Texte verwenden, die leicht austauschbar sind.

### Offene Fragen
1. Pricing-Betraege final? (Empfehlung: 19/49/149 EUR wie in PRP_Marktanalyse vorgeschlagen — koennen spaeter angepasst werden)
2. Logo vorhanden? (Empfehlung: Text "Blogreich" als Platzhalter, Logo spaeter einfuegen)
3. Screenshots/Mockups der App auf der Landing Page zeigen? (Empfehlung: Ja, wenn vorhanden — sonst Platzhalter-Bilder)
4. Soll die Landing Page auch ohne JS funktionieren (SSR)? (Empfehlung: Nein — SPA reicht fuer V1)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: MagicUI Komponenten installieren
     ↓
Schritt 2: Landing.tsx erstellen (alle Sektionen)
     ↓
Schritt 3: App.tsx Routing anpassen
     ↓
Schritt 4: Navigation auf der Landing Page
```

**Reihenfolge fuer Claude Code:** 1 → 3 → 2 → 4

(Routing zuerst anpassen, damit die Landing Page sofort sichtbar ist waehrend sie gebaut wird)

**Hinweis:** Schritt 1 (MagicUI installieren) kann von der Praktikantin manuell ausgefuehrt werden, ODER Claude Code nutzt `npx shadcn@latest add @magicui/...` im Bash.

---

## Naechster Schritt

```bash
# Dieses PRP ausfuehren:
/02-execute docs/PRPs/PRP_08_Landing_Page.md
```
