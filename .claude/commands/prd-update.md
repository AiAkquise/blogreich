---
description: Bestehende PRD von Blogreich aktualisieren — Feature-Status, Infra, Roadmap synchronisieren
---

# PRD aktualisieren: Blogreich

## Anweisungen

Du aktualisierst die bestehende **PRD** (`docs/PRDs/PRD_Blogplattform.md`) auf den aktuellen Stand.

**In dieser Phase wird NUR die PRD-Datei geaendert. Kein Code, keine anderen Dateien.**

---

## Phase 1: Aktuelle Wahrheit sammeln

### 1a. Codebase lesen (Wahrheitsquelle #1)

```bash
# Frontend-Struktur
ls project/src/pages/
ls project/src/components/
ls project/src/lib/

# Backend-Struktur
ls backend/app/ 2>/dev/null || ls fastapi-starter-for-ai-coding-main/app/

# Root
ls -1
```

Lies relevante Dateien: `package.json`, `pyproject.toml`, `.env.example`

### 1b. Git-Historie lesen (Wahrheitsquelle #2)

```bash
# Alle Commits seit letzter PRD-Aktualisierung
PRD_DATE=$(grep "Letzte Aktualisierung:" docs/PRDs/PRD_Blogplattform.md | head -1 | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}')
echo "PRD zuletzt aktualisiert: $PRD_DATE"
git log --oneline --since="$PRD_DATE" | head -50
```

### 1c. PRPs pruefen (Wahrheitsquelle #3)

```bash
ls -1 docs/PRPs/
```

Fuer jeden PRP: Ist das Feature jetzt live, in Arbeit, oder noch geplant?

### 1d. Aktuelle PRD lesen

Lies `docs/PRDs/PRD_Blogplattform.md` vollstaendig.

---

## Phase 2: Delta identifizieren

### Typische Drift-Bereiche

| Bereich | Pruefung | Quelle |
|---------|---------|--------|
| **Feature-Status** | Features die als "geplant" markiert sind aber jetzt live | Git Log + Code |
| **DB-Schema** | Neue Tabellen, geaenderte Spalten | Supabase / Code |
| **API-Routen** | Neue Endpoints | Backend routes.py |
| **Frontend-Seiten** | Neue Seiten, entfernte Seiten | project/src/pages/ |
| **Externe Services** | Neue APIs, geaenderte Keys | .env / config.py |
| **Roadmap** | Erledigte Meilensteine, neue Prioritaeten | PRPs + Git |
| **Tech Stack** | Neue Dependencies | pyproject.toml, package.json |
| **PRP-Referenz** | Neue PRPs, abgeschlossene PRPs | docs/PRPs/ |

---

## Phase 3: PRD aktualisieren

### Regeln

1. **Version bumpen:** Erhoehe die Versionsnummer
2. **Datum aktualisieren:** `Letzte Aktualisierung` auf heute setzen
3. **Status-Ehrlichkeit:** Nur Features als Live markieren die tatsaechlich funktionieren
4. **Nicht aufblaehen:** PRD ist eine Zusammenfassung
5. **Veraltetes entfernen:** Erledigte Roadmap-Meilensteine in "Abgeschlossen" verschieben
6. **Konsistenz:** Zahlen muessen mit Code uebereinstimmen

---

## Phase 4: Validierung

1. **Feature-Counts:** Anzahl Seiten, Services, Tabellen stimmen
2. **Keine Zombie-Features:** Nichts als "geplant" was laengst live ist
3. **Keine Phantome:** Nichts als "live" was es nicht gibt
4. **Versionsnummer:** Gebumpt
5. **Datum:** Aktualisiert

---

## Phase 5: Output

```
PRD-Update abgeschlossen

Version: [alt] -> [neu]
Datum: [alt] -> [neu]

Wichtigste Aenderungen:
- [Feature X]: Geplant -> Live
- [Feature Y]: Neu dokumentiert
- [Roadmap]: [X] Meilensteine als erledigt markiert

Statistik:
- Features Live: [X] (vorher: [Y])
- Features In Arbeit: [X]
- Features Geplant: [X]
```

**Naechster Schritt:** `/05-commit` um die PRD-Aenderungen zu committen
