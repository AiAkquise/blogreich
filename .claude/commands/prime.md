---
description: Prime the conversation with full Blogreich project context
---

# Blogreich — Full Project Context

Du bist im Repo fuer **Blogreich**, eine KI-gesteuerte Blog-Plattform mit Unternehmens-Personalisierung. Lies die folgenden Dateien und mach dich mit dem gesamten Projekt vertraut, bevor du auf Anfragen antwortest.

## 1. Projekt-Dokumentation (IMMER zuerst lesen)

**Pflicht-Lektuere:**
- `docs/PRDs/PRD_Blogplattform.md` — Produkt-Vision, Features, Tech Stack, Roadmap, DB-Schema
- `docs/PRPs/` — Aktuelle PRPs (liste mit `ls` und lies die relevante)
- `fastapi-starter-for-ai-coding-main/CLAUDE.md` — Backend-Regeln & Best Practices (KRITISCH!)

## 2. Codebase verstehen

### Frontend (Bolt.new React App)

```bash
ls -1 project/src/pages/
ls -1 project/src/components/
ls -1 project/src/lib/
```

### Backend (FastAPI Starter)

```bash
ls -1 fastapi-starter-for-ai-coding-main/app/
ls -1 fastapi-starter-for-ai-coding-main/app/core/
```

### Projekt-Root

```bash
ls -1
```

## 3. Aktuelle PRPs & Tasks

Pruefe was gerade in Arbeit ist:

```bash
ls docs/PRPs/
```

Lies die relevante PRP-Datei — aber NUR als Kontext-Referenz.

## 4. Wichtige Architektur-Regeln

Diese Regeln IMMER beachten:

- **Hybrid-Architektur**: Frontend spricht Supabase direkt (CRUD) + FastAPI Backend (KI-Operationen)
- **Multi-Tenancy**: JEDE DB-Query MUSS auf `user_id` filtern
- **Vertical Slice Architecture**: Backend-Features haben `routes.py`, `service.py`, `schemas.py`
- **Backend nutzt supabase-py**: KEIN SQLAlchemy fuer Blogreich — Supabase Python SDK mit Service-Role-Key
- **Frontend Supabase SDK**: CRUD-Operationen direkt ueber `@supabase/supabase-js`
- **Backend API Client**: KI-Operationen ueber `apiClient.ts` → FastAPI (Port 8123)
- **LLM Calls**: Direkt ueber `anthropic` Python SDK (Claude API)
- **Bild-Generierung**: FLUX.2 API via `httpx` (Black Forest Labs)
- **Web-Crawling**: Tavily Python SDK

## 5. Abschluss-Bestaetigung

Nachdem du alles gelesen hast, antworte mit einer kurzen Zusammenfassung:
1. PRD-Status: Welche Features sind geplant, welche in Arbeit?
2. PRP-Status: Welche PRPs existieren und ihr Status
3. Letzter Git-Commit: `git log --oneline -3`
4. Offene Aenderungen: `git status`

**STOP: Warte jetzt auf die naechste Anweisung. Fange NICHT an zu coden.**
