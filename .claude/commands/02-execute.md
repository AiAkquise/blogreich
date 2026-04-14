---
description: PRP oder Handoff implementieren fuer Blogreich
argument-hint: [Pfad zur PRP- oder Handoff-Datei, z.B. docs/PRPs/PRP_Backend_Integration.md]
---

# Execute: PRP implementieren

## Plan lesen

Lies die PRP/Handoff-Datei: `$ARGUMENTS`

**Handoff erkennen:** Wenn die Datei unter `docs/handoffs/` liegt, ist dies eine
Fortsetzung nach einem Context Reset. Lies das Handoff-Artefakt und arbeite ab dem
dort angegebenen "Naechster Schritt" weiter. Die referenzierte PRP-Datei ebenfalls lesen.

Lies zusaetzlich:
- `fastapi-starter-for-ai-coding-main/CLAUDE.md` — Backend-Regeln (Vertical Slice, Patterns)
- `docs/PRDs/PRD_Blogplattform.md` — Architektur-Ueberblick
- Alle im PRP referenzierten Dateien (mit Zeilennummern)

---

## Ausfuehrungs-Regeln

### Blogreich-spezifische Regeln (IMMER beachten)

- **Hybrid-Architektur**: Frontend → Supabase (CRUD), Frontend → Backend (KI-Ops)
- **Multi-Tenancy**: JEDE DB-Query MUSS auf `user_id` filtern
- **Backend nutzt supabase-py**: KEIN SQLAlchemy — Supabase Python SDK mit Service-Role-Key
- **Vertical Slice**: Backend-Features folgen `schemas.py → service.py → routes.py`
- **Type Hints**: Ueberall, Google-Style Docstrings
- **Logging**: structlog, Pattern `domain.component.action_state`
- **LLM Calls**: Direkt ueber `anthropic` Python SDK
- **Frontend CRUD**: Supabase JS SDK direkt (NICHT ueber Backend)
- **Frontend KI-Ops**: Ueber `apiClient.ts` → FastAPI Backend

---

## Implementierung

### 1. Tasks der Reihe nach ausfuehren

Fuer JEDEN Schritt im PRP:

**a)** Referenzierte bestehende Dateien lesen (Patterns verstehen)
**b)** Implementieren — exakt nach PRP-Spezifikation
**c)** Nach jeder Datei: Syntax + Imports pruefen
**d)** Done-Kriterien des Schritts abhaken (wenn im PRP vorhanden)

### 2. Context Reset Check (nach jedem 2-3 Schritte-Block)

Bei PRPs mit 5+ Schritten: Nach Schritt 2-3 pruefe ob ein Context Reset sinnvoll ist.

**Wenn ja — Handoff-Artefakt erstellen:**

Erstelle/aktualisiere `docs/handoffs/HANDOFF_[PRP-Name].md`:

```markdown
# Handoff: [PRP-Name]

## PRP-Referenz
docs/PRPs/PRP_[Name].md

## Abgeschlossene Schritte
- [x] Schritt 1: [Name]
- [x] Schritt 2: [Name]
- [ ] Schritt 3: [Name]

## Aktueller State
- [Was funktioniert, welche Endpoints/Komponenten existieren]
- [Test-Status: X/Y gruen]
- [Offene Issues oder Warnungen]

## Naechster Schritt
Schritt 3: [Name]

## Kontext fuer naechsten Agent
- [Wichtige Architektur-Entscheidungen die getroffen wurden]
- [Bestehende Patterns die wiederverwendet werden sollen]
```

Sage dem User: **"Context Reset empfohlen. Starte einen neuen Chat und fuehre aus:
`/02-execute docs/handoffs/HANDOFF_[Name].md`"**

### 3. Tests erstellen

Nach allen Implementierungs-Tasks (oder nach jedem Block vor Context Reset):
- Test-Dateien wie im PRP spezifiziert erstellen
- Mindestens: 1x Happy Path, 1x Edge Case, 1x Failure Case

### 4. Validierung ausfuehren

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

Bei Fehlern: fixen und erneut ausfuehren bis alles gruen ist.

### 5. Done-Kriterien pruefen

Gehe die Done-Kriterien jedes implementierten Schritts durch:
- [ ] Jedes Kriterium einzeln verifizieren
- [ ] Bei UI-Kriterien: Hinweis geben dass `/10-evaluate-ui` empfohlen wird

### 6. Finale Pruefung

- Alle Schritte aus dem PRP (bzw. Handoff-Block) erledigt
- Done-Kriterien aller Schritte abgehakt
- Alle Tests erstellt und gruen
- Ruff + MyPy + Pytest gruen (Backend)
- TypeScript + Build gruen (Frontend, falls betroffen)
- Code folgt Projekt-Conventions
- Handoff-Artefakt aktualisiert (falls Context Reset folgt)

---

## Output Report

```
Implementierung abgeschlossen

PRP: [Name]
Schritte: [X von Y abgeschlossen]

Erstellte Dateien:
- [Pfad 1]
- [Pfad 2]

Geaenderte Dateien:
- [Pfad 1] (Zeilen X-Y)

Done-Kriterien:
- [x] [Kriterium 1]
- [x] [Kriterium 2]

Tests:
- [Test-Datei] — X Tests, alle gruen

Validierung:
Backend Ruff / MyPy / Pytest
Frontend TypeScript / Build
```

**Naechster Schritt:**
- Alle Schritte fertig → `/04-review` (separater Chat!) oder `/05-commit`
- Weitere Schritte offen → Context Reset + `/02-execute docs/handoffs/HANDOFF_[Name].md`
- Frontend-Aenderungen → `/10-evaluate-ui` (UI-Qualitaetspruefung)
