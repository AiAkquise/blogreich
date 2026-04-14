---
description: Screenshot-basierte Bug-Analyse und Fix fuer Blogreich
argument-hint: [Pfad zum Screenshot, z.B. /tmp/bug-screenshot.png]
---

# Screenshot Fix: UI-Bug analysieren und beheben

## Screenshot analysieren

Lies das Bild: `$ARGUMENTS`

Analysiere:
1. **Was ist das Problem?** — Beschreibe was im Screenshot falsch aussieht
2. **Welche Komponente?** — Identifiziere die betroffene UI-Komponente
3. **Erwartetes Verhalten** — Was sollte stattdessen zu sehen sein?

---

## Code-Recherche

Basierend auf der Analyse:

1. **Komponente finden** — Suche die relevante Datei in `project/src/`
2. **State/Props pruefen** — Welche Daten werden geladen? Wo kommt der Fehler her?
3. **Backend-API pruefen** — Falls Daten fehlen: Backend-Endpoint oder Supabase-Query checken

---

## Fix implementieren

### 1. Root Cause identifizieren

Finde die **Ursache**, nicht nur das Symptom:
- Fehlende Daten von Supabase oder Backend?
- Falsche Conditional Rendering Logik?
- CSS/Styling-Problem?
- State-Update fehlt?

### 2. Minimal Fix

**Kleinste moegliche Aenderung** die das Problem loest:
- 1-2 Dateien maximal
- Keine Refactorings
- Keine "waehrend wir dabei sind"-Aenderungen

### 3. Testen

Nach dem Fix:
```bash
cd project
npx tsc --noEmit
npm run build
```

---

## Output Report

```
Screenshot-Fix abgeschlossen

Problem: [Kurzbeschreibung]
Komponente: [Dateiname]

Root Cause:
[Erklaerung was falsch war]

Fix:
- [Datei 1] (Zeilen X-Y)
- [Datei 2] (Zeilen X-Y)

Validierung:
TypeScript / Build
```

**Naechster Schritt:** Manueller Test im Browser oder `/05-commit`
