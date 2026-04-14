# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**Blogreich** — KI-gesteuerte Blog-Plattform mit Unternehmens-Personalisierung. Nutzer geben Blog-Titel ein, laden Unternehmensdaten hoch, und erhalten vollstaendige, SEO-optimierte Blog-Artikel mit automatisch generierten Bildern.

**Status:** Early Development (Greenfield)

## Repository Structure

```
Blogplattform/
├── project/                    # Frontend (React + Vite, Bolt.new-generiert)
│   ├── src/
│   │   ├── pages/              # 9 Seiten (Dashboard, BlogWriter, BlogEditor, MyBlogs, Companies, Keywords, Settings, Login, Register)
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui (Button, Card, Dialog, Input, Select, Tabs, Textarea, Badge)
│   │   │   └── layout/         # AppLayout, Sidebar
│   │   ├── lib/
│   │   │   ├── supabase.ts     # Supabase Client (Anon Key, CRUD-Operationen)
│   │   │   └── apiClient.ts    # Backend API Client (KI-Operationen, Bearer JWT)
│   │   ├── contexts/           # AuthContext, ThemeContext
│   │   └── types/index.ts      # Shared Types (Company, Blog, BlogImage, Keyword, KeywordCluster)
│   └── package.json
├── fastapi-starter-for-ai-coding-main/   # Backend-Basis (FastAPI Starter Template)
│   ├── app/
│   │   ├── core/               # Infrastruktur (config, database, logging, middleware)
│   │   ├── shared/             # Cross-feature utilities (pagination, timestamps)
│   │   └── main.py             # FastAPI Entry Point
│   ├── alembic/                # DB-Migrationen (NICHT genutzt — Supabase-SDK statt SQLAlchemy)
│   ├── CLAUDE.md               # Backend-spezifische Regeln
│   └── pyproject.toml
├── backend/                    # (wird erstellt) Blogreich FastAPI Backend fuer KI-Operationen
├── docs/
│   ├── PRDs/PRD_Blogplattform.md    # Produkt-Vision, Roadmap, DB-Schema, Tech Stack
│   └── PRPs/                        # Feature-Implementierungsplaene
└── .env                        # Root Env (Supabase, Anthropic, BFL, Tavily Keys)
```

## Architecture: Hybrid-Ansatz (KRITISCH)

```
Frontend (React/Vite, Port 5173)
  │
  ├── Supabase JS SDK ──→ Supabase DB (CRUD: companies, blogs, keywords)
  │                        Projekt: dcskfgpohcdaxrhiswnb.supabase.co
  ├── Supabase Auth    ──→ JWT Tokens (Anon Key im Frontend)
  │
  └── apiClient.ts ─────→ FastAPI Backend (Port 8123)
       │                    Auth: Bearer <supabase-jwt>
       │
       ├── POST /api/blogs/generate     → Anthropic Claude API
       ├── POST /api/companies/analyze  → Tavily Python SDK
       ├── POST /api/images/generate    → BFL FLUX.2 REST API
       └── POST /api/keywords/research  → Anthropic Claude API
```

**Regel:** Frontend macht CRUD direkt ueber Supabase (mit RLS). Backend ist NUR fuer KI-Operationen.

## Core Rules

### Multi-Tenancy (KRITISCH)
- JEDE DB-Query MUSS auf `user_id` filtern — sowohl Supabase-Queries im Frontend als auch Backend-Queries
- Supabase RLS (Row Level Security) ist aktiviert auf allen Tabellen
- Backend nutzt Service-Role-Key (bypassed RLS) → MUSS user_id manuell filtern

### Frontend Rules
- **CRUD-Operationen**: IMMER direkt ueber `@supabase/supabase-js` (`lib/supabase.ts`)
- **KI-Operationen**: IMMER ueber `apiClient.ts` (`apiGet`, `apiPost`, `apiPut`, `apiDelete`) → FastAPI Backend
- **Auth**: `useAuth()` Hook aus `contexts/AuthContext.tsx` — Supabase Auth
- **Routing**: React Router v7, `AppLayout` als Parent-Route fuer geschuetzte Seiten
- **UI**: shadcn/ui Komponenten in `components/ui/`, Tailwind CSS 3
- **Forms**: React Hook Form + Zod Validation
- **Path Alias**: `@/` = `project/src/`
- **Types**: Zentral in `types/index.ts` — Company, Blog, BlogImage, Keyword, KeywordCluster

### Backend Rules (FastAPI)
- **KEIN SQLAlchemy, KEIN Alembic** fuer Blogreich — nutze `supabase-py` mit Service-Role-Key
- **Vertical Slice Architecture**: Jedes Feature hat `schemas.py`, `service.py`, `routes.py`
- **Type Safety**: Strict Type Checking (MyPy + Pyright), alle Funktionen mit Type Hints
- **Logging**: structlog, Pattern `domain.component.action_state`
- **LLM Calls**: Direkt ueber `anthropic` Python SDK (KEIN Requesty, KEIN Proxy)
- **Bild-Generierung**: FLUX.2 API via `httpx` (Black Forest Labs, `x-key` Header)
- **Web-Crawling**: `tavily-python` SDK (Extract + Crawl)
- **Background Tasks**: `asyncio.create_task()` + Supabase Status-Updates
- **Auth**: Supabase JWT-Verifikation via JWKS Endpoint

### Database (Supabase)
- **Kern-Tabellen**: `profiles`, `companies`, `company_styles`, `blogs`, `blog_sections`, `blog_images`, `keywords`, `keyword_clusters`, `generation_jobs`, `crawl_results`
- Jede Tabelle hat `user_id` Column mit Index
- RLS Policies auf allen Tabellen
- Tabellen werden in Supabase-Dashboard erstellt, NICHT ueber Alembic

## Essential Commands

### Frontend
```bash
cd project
npm run dev          # Dev Server (Port 5173)
npm run build        # Production Build
npm run typecheck    # TypeScript Check (tsc --noEmit)
npm run lint         # ESLint
```

### Backend (nach Erstellung)
```bash
cd backend
uv run uvicorn app.main:app --reload --port 8123   # Dev Server
uv run ruff check .                                  # Linting
uv run mypy app/                                     # Type Check
uv run pytest -v                                     # Tests
```

## Environment Variables

### Frontend (`project/.env`)
```
VITE_SUPABASE_URL=https://dcskfgpohcdaxrhiswnb.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_API_URL=http://localhost:8123
```

### Backend (Root `.env`)
```
SUPABASE_URL=https://dcskfgpohcdaxrhiswnb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ANTHROPIC_API_KEY=<key>
BFL_API_KEY=<key>
TAVILY_API_KEY=<key>
```

## Workflow Commands

| Command | Beschreibung |
|---------|-------------|
| `/prime` | Kontext laden (PRD, PRP, CLAUDE.md) |
| `/01-plan` | Feature planen, PRP erstellen |
| `/02-execute` | PRP implementieren |
| `/03-validate` | Full-Stack Validierung (Linting, Types, Tests, Build) |
| `/04-review` | Skeptisches Code Review (separater Chat!) |
| `/05-commit` | Conventional Commit |
| `/07-bugfix` | Schneller Bugfix (Diagnose → Fix → Validate → Commit) |
| `/08-feature` | End-to-End Feature (Plan → Execute → Validate → Review → Commit) |
| `/09-screenshot-fix` | UI-Bug per Screenshot analysieren und fixen |
| `/10-evaluate-ui` | Evidenzbasierte UI-Evaluierung (separater Chat!) |
| `/prd-create` | Neues PRD erstellen |
| `/prd-update` | PRD aktualisieren |

## Key Documentation

- `docs/PRDs/PRD_Blogplattform.md` — Produkt-Vision, alle Features, DB-Schema, Roadmap
- `docs/PRPs/PRP_Backend_Integration.md` — Backend-Integrationsplan (Schritt-fuer-Schritt)
- `fastapi-starter-for-ai-coding-main/CLAUDE.md` — Backend Coding Standards (Vertical Slice, Logging, Testing)
