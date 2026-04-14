---
description: Evidenzbasierte UI-Evaluierung fuer Blogreich
argument-hint: [URL oder Pfad, z.B. http://localhost:5173/blog-writer oder /dashboard]
---

# UI-Evaluierung: Blogreich — Evidenzbasierter Evaluator

**WICHTIG: Diesen Command in einem SEPARATEN Chat ausfuehren — NICHT im selben Chat
in dem der Code geschrieben wurde.** Selbst-Bewertung von UI ist strukturell unzuverlaessig.

---

## Deine Rolle

Du bist ein SKEPTISCHER, evidenzbasierter UI-Reviewer fuer Blogreich.

**Kalibrierung:**
- Jeder Score MUSS mit konkreten Tool-Daten belegt sein — keine reinen Meinungen
- Standard-Shadcn ohne Anpassung = "AI Slop" → Score <= 4/10
- Fehlende States (Loading, Error, Empty) = Feature ist unfertig
- "Sieht okay aus" ohne Beleg ist keine gueltige Bewertung

---

## 0. Kontext laden

Lies zuerst:
- `project/src/index.css` — Tailwind Config, CSS-Variablen, Theme
- `docs/PRDs/PRD_Blogplattform.md` — Design-Referenzen (GravityWrite-inspiriert)

**URL bestimmen:**
- Argument angegeben (`$ARGUMENTS`)? → Nutze diese URL direkt
- Nur Pfad angegeben (z.B. `/blog-writer`)? → Basis: `http://localhost:5173` + Pfad
- Kein Argument? → Evaluiere `http://localhost:5173` (Landing/Dashboard)

Falls ein PRP existiert: Lies zusaetzlich die UI-spezifischen Done-Kriterien.

---

## 1. Component Audit (Shadcn + MagicUI)

### 1a. Shadcn Component Audit

Fuer die zu evaluierende Seite: identifiziere die 3-5 am haeufigsten genutzten UI-Komponenten.

Fuer jede Komponente:
1. Lies die Implementation in `project/src/components/ui/[component].tsx`
2. Pruefe ob projektspezifische Anpassungen vorhanden sind
3. Vergleiche mit Standard-Shadcn Defaults

**AI-Slop-Indikatoren (sofort melden):**
- Shadcn-Standard-Klassen ohne Ueberschreibung
- Keine Dark-Mode Varianten
- Fehlende Brand-Farben als Akzente

### 1b. MagicUI Audit

1. Welche MagicUI-Komponenten sind bereits eingebunden?
2. Welche wuerden die Seite verbessern?
   - **Blog Writer:** AnimatedGradientText, ShimmerButton, Progress-Animationen
   - **Dashboard:** AnimatedNumber, BorderBeam auf aktiven Cards
   - **Landing Page:** Marquee, TypingAnimation, NumberTicker, GridPattern

---

## 2. Visual & UX Evaluation (Playwright MCP)

### 2a. Desktop Screenshots

```
1. browser_navigate → [URL]
2. browser_resize → 1440 x 900 (Desktop)
3. browser_take_screenshot → "desktop.png"
4. browser_snapshot → Accessibility-Tree
```

### 2b. Mobile Optimization Audit

**Viewports pruefen:**

```
# iPhone SE (kleinstes aktuelles)
browser_resize → 375 x 667
browser_take_screenshot → "mobile-375.png"

# iPhone 14 Pro
browser_resize → 393 x 852
browser_take_screenshot → "mobile-393.png"

# Tablet
browser_resize → 768 x 1024
browser_take_screenshot → "tablet-768.png"
```

**Checkliste Mobile:**
- Kein horizontaler Scroll?
- Cards/Grid stapeln sich vertikal?
- Touch Targets >= 44x44px?
- Basis-Schriftgroesse >= 16px?
- Formulare: korrekte Input-Types (email, tel, number)?
- Modals: fullscreen oder max-h mit scroll?

### 2c. Interaktion testen

- Buttons klicken → oeffnet der richtige Modal/Dialog?
- Formulare → Labels, Placeholder, Validierung vorhanden?
- Hover-States → visuelle Reaktion?

### 2d. Technische Checks

```
browser_console_messages → level: "error"
browser_network_requests → includeStatic: false
```

---

## 3. Bewertung

### Design Quality (30%)
- Brand-Farben als Akzente?
- Visuelle Hierarchie erkennbar?
- Typografie konsistent?

### Originality (25%)
- AI-Slop-Findings: Wie viele unmodifizierte Shadcn-Defaults?
- MagicUI-Nutzung: Animationen vorhanden und zweckorientiert?
- Unterscheidet sich von einem Standard-SaaS-Template?

### Craft (20%)
- Spacing konsistent?
- Dark Mode vollstaendig?
- Keine JS-Fehler?
- Mobile: Kein Horizontal-Scroll, keine abgeschnittenen Elemente?
- Mobile: Touch Targets korrekt?

### Functionality (25%)
- Loading/Error/Empty States vorhanden?
- User versteht sofort die Primaer-Aktion?
- Accessibility: aria-labels, Keyboard-Navigation?
- Mobile: Formulare mit korrekten Input-Types?

---

## 4. Output

```
UI-Evaluierung: [URL]

COMPONENT AUDIT:
Shadcn-Konformitaet:  X/5 Komponenten angepasst
MagicUI-Nutzung:      [Genutzte Komponenten / "Keine"]
AI-Slop-Findings:     [Anzahl + konkreter Befund]

VISUAL CHECK:
Desktop / Dark Mode / Mobile (375/393/768)
Console-Fehler: X | Fehlgeschlagene Requests: X

Design Quality:   X/10 — [Begruendung]
Originality:      X/10 — [Begruendung]
Craft:            X/10 — [Begruendung]
Functionality:    X/10 — [Begruendung]

Gewichteter Gesamt-Score: X.X/10
```

### Priorisierte Issue-Liste

```
[CRITICAL/HIGH/MEDIUM/LOW] datei.tsx:42
Issue: [Beschreibung]
Fix: [Konkret was geaendert werden muss]
```

**Naechster Schritt:**
- Score >= 7 → `/05-commit`
- Score < 7 → Issues als Input fuer `/02-execute` (neuer Chat)
