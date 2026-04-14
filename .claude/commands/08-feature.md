---
description: End-to-End Feature-Entwicklung (Plan -> Execute -> Validate -> Review -> Commit)
argument-hint: [Feature-Beschreibung in 1-2 Saetzen]
---

# End-to-End Feature: Automatische Entwicklung

## Feature

$ARGUMENTS

---

Dieser Command fuehrt den gesamten Feature-Entwicklungsprozess automatisch durch.
**Nur fuer klar definierte Features nutzen.** Bei komplexen Features besser Schritt fuer Schritt.

---

## Schritt 1: Kontext laden

Lies:
- `docs/PRDs/PRD_Blogplattform.md` — Gesamtbild
- `fastapi-starter-for-ai-coding-main/CLAUDE.md` — Backend-Regeln
- `docs/PRPs/` — Bestehende PRPs

---

## Schritt 2: Planen (= /01-plan)

Fuehre den vollstaendigen Planning-Prozess aus:

1. **Codebase analysieren** — aehnliche Implementierungen finden, betroffene Dateien identifizieren
2. **Abhaengigkeiten pruefen** — neue Libraries, ENV-Variablen, DB-Tabellen
3. **PRP erstellen** — speichere als `docs/PRPs/PRP_[Feature_Name].md`

Zeige dem User eine **kurze Zusammenfassung** des Plans bevor du weitermachst:
- Betroffene Dateien (Anzahl)
- Neue Dateien (Anzahl)
- Geschaetzte Komplexitaet
- Hauptrisiken

**PAUSE: Warte auf Bestaetigung des Users bevor du mit Schritt 3 weitermachst.**

---

## Schritt 3: Implementieren (= /02-execute)

Implementiere nach dem PRP:
- Tasks der Reihe nach ausfuehren
- Blogreich-Regeln beachten (Multi-Tenancy, Hybrid-Architektur, Vertical Slice)
- Tests erstellen (Happy Path + Edge Case + Failure)

---

## Schritt 4: Validieren (= /03-validate)

```bash
# Backend (falls betroffen)
cd backend
uv run ruff check .
uv run mypy app/
uv run pytest -v

# Frontend (falls betroffen)
cd project
npx tsc --noEmit
npm run build
```

Bei Fehlern: fixen und erneut validieren.

---

## Schritt 5: Code Review (= /04-review)

Schnelles Review der Aenderungen:
- Multi-Tenancy OK?
- Auth korrekt?
- Keine Secrets im Code?
- Type Hints ueberall?
- Tests vorhanden?
- Hybrid-Architektur eingehalten?

---

## Schritt 6: Commit (= /05-commit)

```bash
git add .
git commit -m "feat(scope): [Feature-Beschreibung]

- [Detail 1]
- [Detail 2]
- Tests: X neue Tests"
```

---

## Abschluss

```
Feature-Entwicklung abgeschlossen

Feature: $ARGUMENTS

Schritte:
1. Kontext geladen (PRD + CLAUDE.md)
2. PRP erstellt: docs/PRPs/PRP_[Name].md
3. Implementiert: [X] Dateien erstellt, [Y] geaendert
4. Validiert: Tests + Linting + Types gruen
5. Reviewed: Keine kritischen Issues
6. Committed: [hash] — [message]

Erstellte Dateien:
- [Liste]

Tests:
- [Test-Datei] — X Tests
```
