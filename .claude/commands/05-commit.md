---
description: Git Commit mit Conventional Format fuer Blogreich
argument-hint: [optional: spezifische Dateien]
---

# Commit: Git Aenderungen committen

## Dateien

Spezifizierte Dateien: $ARGUMENTS
(Wenn keine angegeben: alle Aenderungen committen)

---

## 1. Status pruefen

```bash
git status
git diff --stat HEAD
```

## 2. Commit-Typ bestimmen

| Typ | Wann |
|-----|------|
| `feat` | Neues Feature |
| `fix` | Bug Fix |
| `refactor` | Code Refactoring (keine Feature-Aenderung) |
| `docs` | Nur Dokumentation |
| `test` | Tests hinzufuegen/aktualisieren |
| `chore` | Wartung (Dependencies, Config) |
| `style` | CSS/UI-Aenderungen |
| `perf` | Performance-Verbesserung |

**Scope** (optional): `backend`, `frontend`, `blog-writer`, `companies`, `images`, `keywords`, `auth`, `infra`

## 3. Stagen + Committen

```bash
# Spezifische Dateien oder alle:
git add $ARGUMENTS   # oder: git add .

# Conventional Commit:
git commit -m "type(scope): kurze beschreibung

- Detail 1
- Detail 2"
```

## 4. Bestaetigung

```bash
git log -1 --oneline
git show --stat HEAD
```

**Output:**
- Commit Hash
- Commit Message
- Geaenderte Dateien (Anzahl + Insertions/Deletions)

**Naechster Schritt:** `git push` oder weiter entwickeln
