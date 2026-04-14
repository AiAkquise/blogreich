---
description: Feature planen und PRP erstellen fuer Blogreich
argument-hint: [Feature-Beschreibung in 1-2 Saetzen]
---

# Feature-Planung: PRP erstellen

## Feature

$ARGUMENTS

## Anweisungen

Du erstellst einen vollstaendigen **PRP (Product Requirements Prompt)** fuer dieses Feature.
Der PRP muss so detailliert sein, dass ein anderer Claude Code Agent ihn ohne Kontext umsetzen kann.

**In dieser Phase wird KEIN Code geschrieben. Nur Analyse und Planung.**

---

## Phase 1: Kontext laden

Lies diese Dateien in dieser Reihenfolge:

1. **PRD**: `docs/PRDs/PRD_Blogplattform.md` — Gesamtbild, Features, Tech Stack, DB-Schema
2. **Backend-Regeln**: `fastapi-starter-for-ai-coding-main/CLAUDE.md`
3. **Bestehende PRPs**: `ls docs/PRPs/` — pruefe ob bereits ein PRP fuer dieses Feature existiert

## Phase 2: Codebase-Analyse

### 2a. Aehnliche Implementierungen finden

Suche im Codebase nach verwandten Patterns:

```bash
# Frontend: Bestehende Seiten und Komponenten
ls project/src/pages/
ls project/src/components/

# Backend: Feature-Slices
ls fastapi-starter-for-ai-coding-main/app/
```

### 2b. Betroffene Dateien identifizieren

Fuer jede betroffene Datei:
- Vollstaendigen Pfad notieren
- Relevante Zeilen lesen
- Bestehende Patterns extrahieren (Naming, Error Handling, Auth)

### 2c. Abhaengigkeiten pruefen

- Neue Libraries noetig? → `pyproject.toml` / `package.json` pruefen
- Neue ENV-Variablen? → `.env` pruefen
- Neue DB-Tabellen? → Supabase-Schema in PRD lesen
- Neue API-Routen? → Backend `main.py` Router-Registrierung pruefen

## Phase 3: Externe Recherche (bei Bedarf)

Falls das Feature externe APIs oder Libraries nutzt:
- Offizielle Dokumentation lesen (Fetch URLs)
- Best Practices recherchieren
- Bekannte Probleme und Workarounds identifizieren

## Phase 4: PRP erstellen

Speichere als: `docs/PRPs/PRP_[Feature_Name].md`

### PRP-Template

```markdown
# PRP: [Feature Name]

## Status: DRAFT
**Erstellt:** [Datum]
**Prioritaet:** P0/P1/P2/P3

## Ziel
[Was soll gebaut werden und warum — 2-3 Saetze]

## User Story
Als [Benutzertyp]
moechte ich [Aktion/Ziel]
damit [Nutzen/Wert]

## Scope

### In Scope
- [Feature-Aspekt 1]
- [Feature-Aspekt 2]

### Out of Scope
- [Was NICHT gebaut wird]

## Betroffene Dateien

### Bestehende Dateien (aendern)
| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|

### Neue Dateien (erstellen)
| Datei | Zweck |
|-------|-------|

## Technischer Plan

### Schritt 1: [Name]
**Dateien:** [Pfade]
**Was:** [Detaillierte Beschreibung]
**Pattern-Referenz:** [Verweis auf bestehenden Code als Vorlage]

**Done-Kriterien:**
- [ ] [Testbare Bedingung 1]
- [ ] [Testbare Bedingung 2]
- [ ] [Validierung: z.B. TypeScript fehlerfrei, Test gruen]

### Schritt 2: [Name]
...

## Datenbank-Aenderungen
[SQL fuer neue Tabellen/Spalten, oder "Keine"]

## API-Aenderungen
[Neue Endpoints mit Method, Path, Request/Response Body, oder "Keine"]

## Frontend-Aenderungen
[Neue Pages/Components, oder "Keine"]

## Testing-Strategie
- Unit Tests: [Was testen]
- Integration Tests: [Was testen]
- Manueller Test: [Schritte]

## Validierung
\`\`\`bash
# Backend
cd backend && uv run ruff check . && uv run mypy app/ && uv run pytest -v

# Frontend
cd project && npx tsc --noEmit && npm run build
\`\`\`

## Risiken & Offene Fragen
- [Risiko 1]
- [Offene Frage 1]
```

## Phase 5: Bestaetigung

Nach PRP-Erstellung:

1. PRP gespeichert als `docs/PRPs/PRP_[Name].md`
2. Alle betroffenen Dateien mit Pfaden und Zeilen referenziert
3. Technischer Plan hat konkrete Schritte mit Code-Referenzen
4. **Jeder Schritt hat testbare Done-Kriterien**
5. Ein anderer Agent koennte den PRP ohne Kontext implementieren
6. Testing-Strategie definiert

**Zusammenfassung ausgeben:**
- PRP-Pfad
- Geschaetzte Komplexitaet (Low/Medium/High)
- Anzahl betroffener Dateien
- Hauptrisiken
- **Context Reset empfohlen?** (Ja wenn 5+ Schritte)

**Naechster Schritt:** `/02-execute docs/PRPs/PRP_[Name].md`
