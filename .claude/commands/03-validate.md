---
description: Full-Stack Validierung (Backend + Frontend) fuer Blogreich
---

# Validate: Blogreich Full-Stack Pruefung

Fuehre alle Validierungen der Reihe nach aus und berichte die Ergebnisse.

---

## 1. Backend Linting

```bash
cd backend && uv run ruff check .
```

**Erwartet:** "All checks passed!"

## 2. Backend Type Checking

```bash
cd backend && uv run mypy app/
```

**Erwartet:** "Success: no issues found"

## 3. Backend Tests

```bash
cd backend && uv run pytest -v
```

**Erwartet:** Alle Tests gruen

## 4. Frontend Type Checking

```bash
cd project && npx tsc --noEmit
```

**Erwartet:** Keine Fehler

## 5. Frontend Build

```bash
cd project && npm run build
```

**Erwartet:** Build erfolgreich, keine Fehler

## 6. Summary Report

```
Validierung Blogreich (Full-Stack)

Backend:
  Ruff:         X
  MyPy:         X
  Pytest:       X tests passed

Frontend:
  TypeScript:   X
  Build:        X

Status: ALL CHECKS PASSED / VALIDATION FAILED
```

Bei Fehlern: Details mit Dateiname, Zeilennummer und Beschreibung auflisten.
Bei Erfolg: **Naechster Schritt:** `/04-review` oder `/05-commit`
