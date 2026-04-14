---
description: PRD (Product Requirements Document) von Grund auf erstellen
argument-hint: [Projektname und kurze Beschreibung]
---

# PRD erstellen: Neues Produkt dokumentieren

## Produkt

$ARGUMENTS

## Anweisungen

Du erstellst ein vollstaendiges **PRD (Product Requirements Document)** fuer dieses Produkt.
Das PRD ist das zentrale Wahrheitsdokument — es beschreibt WAS gebaut wird, WARUM und in welchem ZUSTAND es ist.

**In dieser Phase wird KEIN Code geschrieben. Nur Analyse, Recherche und Dokumentation.**

**Unterschied PRP vs. PRD:**
- **PRP** = Product Requirements Prompt — Plan fuer EIN Feature (taktisch, fuer Claude Code)
- **PRD** = Product Requirements Document — Gesamtbild des PRODUKTS (strategisch, fuer Menschen + AI)

---

## Phase 1: Bestandsaufnahme

### 1a. Existiert bereits eine Codebase?

```bash
ls -1
cat README.md 2>/dev/null || echo "Kein README"
```

**Wenn Codebase vorhanden:**
- Lies README, CLAUDE.md, package.json/pyproject.toml
- Identifiziere: Tech Stack, Projekt-Struktur, existierende Features
- Lies bestehende Docs: `ls docs/` oder aehnliche Ordner
- Pruefe Git-Historie: `git log --oneline -20`

**Wenn Greenfield (kein Code):**
- Frage den User nach Vision, Zielgruppe, Kern-Features
- Recherchiere Wettbewerber/Markt falls noetig

### 1b. Aktuelle PRPs/Feature-Docs sammeln

```bash
ls docs/PRPs/ 2>/dev/null
ls docs/PRDs/ 2>/dev/null
```

---

## Phase 2: User-Interview (kurz)

Falls die Bestandsaufnahme Luecken hat, frage den User gezielt:

1. **Zielgruppe:** Wer nutzt das Produkt?
2. **Kernproblem:** Welches Problem wird geloest?
3. **Differenzierung:** Was unterscheidet euch vom Wettbewerb?
4. **Monetarisierung:** Wie verdient das Produkt Geld?
5. **Aktueller Status:** MVP, Beta, Production?

**Maximal 3-5 Fragen — nicht alles auf einmal.**

---

## Phase 3: PRD schreiben

Speichere als: `docs/PRDs/PRD_[Projektname].md`

### PRD-Template

```markdown
# Product Requirements Document: [Produktname]
## [Untertitel]

**Version:** 1.0
**Erstellt:** [Datum]
**Letzte Aktualisierung:** [Datum]
**Autor:** [Name/Team]
**Status:** [Early Development / Beta / Production]

---

## Executive Summary

[2-3 Saetze: Was ist das Produkt, fuer wen, warum?]

### Repository-Struktur

[Projekt-Struktur mit kurzer Beschreibung pro Verzeichnis]

### Kern-Features

| Feature | Status | Beschreibung |
|---------|--------|--------------|

### Infrastruktur-Status

| Service | Provider | Region | Status |
|---------|----------|--------|--------|

---

## Aktueller Stand

### 1. [Komponente 1] — [Status]

**Pfad:** `[Verzeichnis]`
**Tech Stack:** [Technologien]

---

## Geplante Features

### A. [Feature Name]

**Prioritaet:** 3/2/1 Sterne
**Ziel:** [1-2 Saetze]

| Komponente | Kategorie | Beschreibung |
|------------|-----------|--------------|

---

## Technischer Stack

### Frontend / Backend / Infrastruktur

| Technologie | Beschreibung |
|-------------|-------------|

---

## Datenbank-Schema

### Kern-Tabellen

| Tabelle | Beschreibung |
|---------|-------------|

---

## Roadmap: Meilensteine

### Meilenstein 1: [Name]

| Task | Kategorie | Aufwand | Status |
|------|-----------|--------|--------|

---

## PRP-Referenz

| PRP | Feature | Status |
|-----|---------|--------|

---

## Externe Services & APIs

| Service | Zweck | Env Vars |
|---------|-------|----------|
```

---

## Phase 4: Qualitaetspruefung

1. **Vollstaendigkeit:** Jedes existierende Feature ist dokumentiert mit korrektem Status
2. **Korrektheit:** Tech Stack, Ports, URLs, Env Vars stimmen mit Code ueberein
3. **Status-Ehrlichkeit:** Keine Features als "Live" markiert die es nicht sind
4. **Roadmap-Realismus:** Meilensteine sind nach Abhaengigkeiten sortiert
5. **Alleinstehend:** Ein neuer Entwickler kann das PRD lesen und das Produkt verstehen

---

## Phase 5: Output

**Zusammenfassung ausgeben:**
- PRD-Pfad
- Anzahl dokumentierter Features (Live / In Arbeit / Geplant)
- Empfehlungen: Was sollte als naechstes gebaut werden?

**Naechster Schritt:** Feature planen mit `/01-plan [Feature]` oder PRD aktuell halten mit `/prd-update`
