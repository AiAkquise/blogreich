---
description: Schneller Bugfix-Workflow fuer Blogreich (Diagnose -> Fix -> Validate -> Commit)
argument-hint: [Bug-Beschreibung]
---

# Bugfix: Schneller Fix ohne PRP

## Problem

$ARGUMENTS

---

## Phase 1: Diagnose

### 1a. Kontext laden

Lies die relevanten Dateien basierend auf dem Bug:
- Backend-Bug → `fastapi-starter-for-ai-coding-main/CLAUDE.md`
- Frontend-Bug → `project/src/pages/` und relevante Komponenten
- Architektur-Frage → `docs/PRDs/PRD_Blogplattform.md`

### 1b. Fehlerquelle finden

```bash
# Letzte Aenderungen pruefen
git log --oneline -10
git diff HEAD~1 --stat

# Relevante Dateien suchen
grep -r "[Suchbegriff]" project/src/ --include="*.tsx" -l
grep -r "[Suchbegriff]" backend/app/ --include="*.py" -l
```

### 1c. Root Cause identifizieren

- **Symptom** beschreiben (was passiert?)
- **Erwartetes Verhalten** (was sollte passieren?)
- **Root Cause** (warum passiert es?)
- **Betroffene Dateien** (welche Dateien muessen geaendert werden?)

## Phase 2: Fix implementieren

- Minimaler Fix — nur das Noetigste aendern
- Keine Refactorings in einem Bugfix
- Bestehende Tests nicht schwaechen
- Regression-Test hinzufuegen falls sinnvoll

## Phase 3: Validieren

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

## Phase 4: Committen

```bash
git add .
git commit -m "fix(scope): [kurze Beschreibung]

- Root Cause: [was war das Problem]
- Fix: [was wurde geaendert]"
```

## Output

```
Bugfix abgeschlossen

Problem: [Beschreibung]
Root Cause: [Ursache]
Fix: [Was geaendert wurde]
Dateien: [geaenderte Dateien]
Tests: Alle gruen
Commit: [hash] — [message]
```
