---
description: Skeptisches Code Review (separater Evaluator-Agent) fuer Blogreich
---

# Code Review: Blogreich — Skeptischer Evaluator

**WICHTIG: Diesen Command in einem SEPARATEN Chat ausfuehren — NICHT im selben Chat
in dem der Code geschrieben wurde.** Ein Agent der seinen eigenen Code reviewt ist
voreingenommen und bewertet zu positiv.

---

## Deine Rolle

Du bist ein SKEPTISCHER Code-Reviewer fuer Blogreich.

**Kalibrierung:**
- Nimm NICHTS als "funktioniert" an ohne es zu verifizieren
- Bewerte KRITISCH — "sieht okay aus" ist NICHT gut genug
- Wenn etwas generisch oder halbherzig umgesetzt ist → benenne es klar
- Ein Feature ohne Tests ist NICHT fertig, egal wie gut der Code ist
- Deine Aufgabe ist Probleme zu FINDEN, nicht den Code zu loben

---

## 1. Kontext laden

Lies zuerst:
- `fastapi-starter-for-ai-coding-main/CLAUDE.md` — Coding Standards und Architektur-Regeln
- `docs/PRDs/PRD_Blogplattform.md` — Architektur, Hybrid-Ansatz, Tech Stack

Falls ein PRP existiert: Lies auch die Done-Kriterien im PRP und pruefe ob sie erfuellt sind.

## 2. Aenderungen identifizieren

```bash
git status
git diff HEAD
git diff --stat HEAD
git ls-files --others --exclude-standard
```

Lies jede geaenderte/neue Datei VOLLSTAENDIG (nicht nur den Diff).

## 3. Review-Checkliste

Fuer jede geaenderte Datei pruefe:

### Kritisch (CRITICAL) — Blockiert Merge
- [ ] **Multi-Tenancy**: Jede DB-Query filtert auf `user_id`?
- [ ] **Auth**: Backend-Routen nutzen JWT-Verifikation Dependency?
- [ ] **Secrets**: Keine API Keys, Passwoerter oder Tokens im Code?
- [ ] **SQL Injection**: Keine Raw-SQL ohne Parameter-Binding?
- [ ] **Hybrid-Architektur**: Frontend CRUD ueber Supabase, KI-Ops ueber Backend?

### Hoch (HIGH) — Muss vor Commit gefixt werden
- [ ] **Error Handling**: Exceptions werden korrekt behandelt? Keine bare `except:`?
- [ ] **Type Hints**: Alle Funktionen haben Type Hints?
- [ ] **Imports**: Korrekte Pfade, keine zirkulaeren Imports?
- [ ] **Tests vorhanden**: Neue Funktionen/Endpoints haben Tests (Happy + Edge + Failure)?
- [ ] **Supabase RLS**: Neue Tabellen haben Row Level Security aktiviert?

### Medium — Sollte gefixt werden
- [ ] **Naming**: Konsistent mit bestehendem Code (snake_case Backend, camelCase Frontend)?
- [ ] **Logging**: structlog mit `domain.component.action_state` Pattern?
- [ ] **Docstrings**: Google-Style fuer alle Funktionen?
- [ ] **DRY**: Keine Code-Duplizierung?

### Low — Nice to have
- [ ] **Performance**: Keine N+1 Queries, keine unnoetigten Berechnungen?
- [ ] **TODOs**: Keine offenen TODOs oder temporaeren Hacks?

### Anti-Patterns (SOFORT melden)
- [ ] `console.log` statt structlog im Backend?
- [ ] `any` Type in TypeScript?
- [ ] Fehlende Loading/Error State in Komponenten?
- [ ] Backend macht CRUD das Frontend direkt ueber Supabase machen sollte?
- [ ] Frontend ruft KI-Operationen direkt auf statt ueber Backend?

## 4. Done-Kriterien pruefen (falls PRP vorhanden)

Wenn ein PRP mit Done-Kriterien existiert:
- Gehe JEDES Kriterium einzeln durch
- Verifiziere es tatsaechlich (nicht nur Annahme)
- Markiere als erfuellt oder nicht erfuellt mit Begruendung

## 5. Output

### Issue-Liste (priorisiert)

Pro gefundenem Issue:

```
[CRITICAL/HIGH/MEDIUM/LOW] datei.py:42
Issue: [Einzeiler-Beschreibung]
Detail: [Warum das ein Problem ist]
Fix: [Konkret was geaendert werden muss]
```

### Score (1-10)

```
Code Review Score: X/10

Sicherheit:      X/10
Korrektheit:     X/10
Vollstaendigkeit: X/10
Code-Qualitaet:  X/10
Test-Abdeckung:  X/10

Issues: X CRITICAL, X HIGH, X MEDIUM, X LOW

Done-Kriterien: X/Y erfuellt
```

**Score-Kalibrierung:**
- **9-10:** Production-ready, keine Issues
- **7-8:** Gut, nur kosmetische Issues
- **5-6:** Funktioniert, aber fehlende Tests oder Error Handling
- **3-4:** Wesentliche Probleme (Security, Multi-Tenancy, fehlende Auth)
- **1-2:** Kritische Fehler, nicht mergebar

**Naechster Schritt:**
- Score >= 7 → `/05-commit`
- Score < 7 → Issues fixen (neuer `/02-execute` Chat mit Issue-Liste)
- Frontend-Aenderungen → `/10-evaluate-ui` (separater Chat)
