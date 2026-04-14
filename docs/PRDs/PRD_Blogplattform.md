# Product Requirements Document: Blogreich

## KI-gesteuerte Blog-Plattform mit Unternehmens-Personalisierung

**Version:** 1.0
**Erstellt:** 2026-04-13
**Letzte Aktualisierung:** 2026-04-13
**Autor:** Adrian Gawin
**Status:** Early Development (Greenfield)

---

## Executive Summary

Blogreich ist ein internes Tool zur automatisierten Erstellung hochwertiger, SEO-optimierter Blog-Artikel. Im Gegensatz zur bestehenden n8n-Automatisierung bietet sie ein vollwertiges Frontend (inspiriert von GravityWrite), in dem Nutzer Blog-Titel eingeben, Unternehmensdaten hochladen und den Schreibstil per Website-Analyse (Tavily) personalisieren konnen. Bilder werden automatisch per FLUX.2 (Black Forest Labs) generiert. Langfristig kann die Plattform auch extern als SaaS angeboten werden.

### Repository-Struktur

```
Blogplattform/
├── docs/
│   └── PRDs/                    # Product Requirements Documents
├── fastapi-starter-for-ai-coding-main/   # Backend-Basis (FastAPI Starter)
│   ├── app/
│   │   ├── core/                # Infrastruktur (config, database, logging, middleware)
│   │   ├── shared/              # Cross-feature utilities (pagination, timestamps)
│   │   └── main.py              # FastAPI Entry Point
│   ├── alembic/                 # Datenbank-Migrationen
│   ├── pyproject.toml
│   └── CLAUDE.md
├── frontend/                    # React + TypeScript + Vite (NEU)
│   ├── src/
│   │   ├── components/          # shadcn/ui + MagicUI Komponenten
│   │   ├── pages/               # Seiten (Dashboard, Blog Writer, etc.)
│   │   ├── lib/                 # API Client, Utilities
│   │   └── contexts/            # Auth, Notifications
│   └── index.html
└── BLOG Automatisierung (1).json  # Referenz: bestehende n8n-Automatisierung
```

### Kern-Features

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| Blog Writer (Advanced) | ⬜ Geplant | Titel eingeben, Einstellungen wahlen, Blog generieren lassen |
| Easy Blog Writer | ⬜ Geplant | Vereinfachter Modus mit 1-Click-Generierung |
| Unternehmens-Profil | ⬜ Geplant | Firmendaten hochladen, Website crawlen mit Tavily |
| KI-Themenvorschlage | ⬜ Geplant | SEO-basierte Themen- und Keyword-Recherche |
| Bild-Generierung | ⬜ Geplant | Automatische Blog-Bilder via FLUX.2 API |
| Content-Quellen | ⬜ Geplant | KI-generiert, Realtime-Info, URL-basiert |
| Blog-Editor | ⬜ Geplant | Markdown-Editor mit Live-Preview zum Nachbearbeiten |
| Blog-Verwaltung | ⬜ Geplant | Dashboard mit allen Blogs, Status, Filter |
| Auth & Multi-Tenant | ⬜ Geplant | Supabase Auth, Nutzer-Isolation |
| Style-Personalisierung | ⬜ Geplant | Schreibstil basierend auf Unternehmens-Website |

### Infrastruktur-Status

| Service | Provider | Region | Status |
|---------|----------|--------|--------|
| Backend API | FastAPI (lokal) | - | ⬜ Geplant |
| Frontend | React + Vite (lokal) | - | ⬜ Geplant |
| Datenbank | Supabase (PostgreSQL) | eu-central | ⬜ Geplant |
| Vektor-DB | Supabase (pgvector) | eu-central | ⬜ Geplant |
| Bild-Generierung | Black Forest Labs (FLUX.2) | - | ⬜ Geplant |
| Web-Crawling | Tavily API | - | ⬜ Geplant |
| LLM | Claude API (Anthropic) | - | ⬜ Geplant |

---

## Aktueller Stand

### 1. Bestehende n8n-Automatisierung -- Referenz

**Pfad:** `BLOG Automatisierung (1).json`
**Tech Stack:** n8n, Perplexity API, Claude Haiku, Airtable

Die bestehende Automatisierung besteht aus 5 Workflows:

| Workflow | Funktion | Nodes |
|----------|----------|-------|
| 1. Keyword-Generierung | Wochentlicher Schedule -> Perplexity Topic Research -> Keyword-Recherche -> LLM-Scoring (1-10) -> Filter (Score >= 7) -> Airtable | 8 |
| 2. Blog-Content-Generierung | Cluster aus Airtable -> Blog-Gliederung Agent -> Abschnitt-Writer (Loop) -> Einleitung -> Fazit -> Airtable | 10 |
| 3. Bild-Generierung | Blog-Inhalte -> Bild-Prompts -> Generierung | geplant |
| 4. Blog-Publishing | Content -> Veroffentlichung | geplant |
| 5. Performance-Tracking | SEO-Metriken nachverfolgen | geplant |

**Schwachen der n8n-Losung (Motivation fur Neubau):**
- Kein Frontend / keine UI fur Einstellungen
- Starr: Ein Unternehmen (Wahlreich e.K.) hardcoded
- Kein Unternehmens-Profil oder Website-Analyse
- Keine Bildgenerierung integriert
- Kein Editor zum Nachbearbeiten
- Airtable als Datenbank ist limitiert

### 2. FastAPI Starter -- Backend-Basis

**Pfad:** `fastapi-starter-for-ai-coding-main/`
**Tech Stack:** Python 3.12+, FastAPI, SQLAlchemy 2.0 (async), Alembic, PostgreSQL, structlog

Bereitgestellte Infrastruktur:
- Vertical Slice Architecture
- Async Database mit Connection Pooling
- Structured Logging mit Request-Korrelation
- Health Checks (`/health`, `/health/db`, `/health/ready`)
- Pagination & Timestamp Mixins
- Strict Type Checking (MyPy + Pyright)
- Docker + Docker Compose

---

## Geplante Features

### A. Blog Writer (Kern-Feature)

**Prioritat:** ★★★
**Ziel:** Nutzer gibt Blog-Titel + Einstellungen ein und erhalt einen vollstandigen, SEO-optimierten Blog-Artikel mit Bildern.

| Komponente | Kategorie | Beschreibung |
|------------|-----------|--------------|
| Titel-Eingabe | Frontend | Input-Feld mit Auto-Suggest ("Suggest Topics by AI") |
| Content-Quelle | Frontend | Dropdown: "KI-generiert", "Realtime-Info", "Von URL" (wie GravityWrite) |
| Sprache & Ton | Frontend | Dropdown fur Sprache, Tonalitat, Zielgruppe |
| Wortanzahl | Frontend | Slider/Select fur Ziel-Wortanzahl (1000-5000) |
| Keyword-Eingabe | Frontend | Optional: Primary + Secondary Keywords |
| Gliederungs-Preview | Frontend | Generierte Gliederung anzeigen, bearbeiten, dann Content generieren |
| Content-Generierung | Backend | Claude API: Gliederung -> Abschnitte -> Einleitung -> Fazit (Pipeline) |
| Bild-Generierung | Backend | FLUX.2 API: Automatische Header- und Section-Bilder |
| Markdown-Editor | Frontend | Generiertes Ergebnis bearbeiten, Bilder repositionieren |
| Export | Backend | HTML, Markdown, WordPress-kompatibel |

### B. Unternehmens-Profil & Style-Personalisierung

**Prioritat:** ★★★
**Ziel:** Blogs werden im Stil und Ton des jeweiligen Unternehmens geschrieben, basierend auf Website-Analyse.

| Komponente | Kategorie | Beschreibung |
|------------|-----------|--------------|
| Firmendaten-Formular | Frontend | Name, Branche, Zielgruppe, Hauptangebote, Firmenbeschreibung |
| Website-URL-Eingabe | Frontend | Nutzer gibt Website-Links ein |
| Tavily Website-Crawl | Backend | `tavily_client.crawl(url, instructions="...")` - extrahiert Seiteninhalte |
| Tavily Extract | Backend | `POST /extract` - gezielter Content von spezifischen URLs |
| Style-Analyse | Backend | LLM analysiert gecrawlte Inhalte: Tonalitat, Fachbegriffe, Stil |
| Style-Profil speichern | Backend | Vektorisiert in Supabase pgvector fur RAG-Abruf |
| Profil-Verwaltung | Frontend | Mehrere Unternehmens-Profile anlegen, bearbeiten, loschen |

**Tavily API Integration:**
- **Extract Endpoint:** `POST https://api.tavily.com/extract` - Extrahiert Inhalte von spezifischen URLs
- **Crawl Endpoint:** `POST https://api.tavily.com/crawl` - Durchsucht Website mit konfigurierbarem `max_depth`, `max_breadth`, `select_paths`
- **Auth:** Bearer Token (`tvly-YOUR_API_KEY`)
- **Python SDK:** `from tavily import TavilyClient`

### C. FLUX.2 Bild-Generierung

**Prioritat:** ★★★
**Ziel:** Automatische, hochwertige Blog-Bilder passend zum Content.

| Komponente | Kategorie | Beschreibung |
|------------|-----------|--------------|
| Prompt-Generierung | Backend | LLM generiert Bild-Prompts aus Blog-Kontext |
| FLUX.2 API Call | Backend | `POST https://api.bfl.ai/v1/flux-2-pro` mit Prompt + Einstellungen |
| Async Polling | Backend | Task-ID erhalten -> Polling auf `polling_url` bis Bild fertig |
| Bild-Storage | Backend | Bilder in Supabase Storage speichern |
| Bild-Auswahl | Frontend | Generierte Bilder anzeigen, auswahlen, regenerieren |
| Bildbearbeitung | Backend | Optional: FLUX.2 Image-to-Image fur Anpassungen |

**FLUX.2 API Integration:**
- **Empfohlenes Modell:** FLUX.2 [PRO] (`/v1/flux-2-pro`) - Bestes Preis/Qualitat-Verhaltnis
- **Schnelles Modell:** FLUX.2 [Klein 4B] (`/v1/flux-2-klein-4b`) - Fur Previews
- **Hochstes Qualitat:** FLUX.2 [MAX] (`/v1/flux-2-max`)
- **Pricing:** 1 Credit = $0.01 USD
- **Auth:** Header `x-key: ${BFL_API_KEY}`
- **Workflow:** POST Request -> Task-ID -> Poll `polling_url` -> Bild-URL

### D. SEO-Keyword-Recherche

**Prioritat:** ★★
**Ziel:** Automatische Keyword-Recherche und Topic-Vorschlage basierend auf Unternehmensprofil.

| Komponente | Kategorie | Beschreibung |
|------------|-----------|--------------|
| Topic-Suggest | Backend | LLM generiert Themenvorschlage basierend auf Firmenprofil + Trends |
| Keyword-Research | Backend | Long-Tail-Keywords zu gewahltem Thema |
| Keyword-Scoring | Backend | Relevanz-Bewertung (1-10) basierend auf Business-Fit |
| Keyword-Clustering | Backend | Keywords zu Themen-Clustern gruppieren |
| Cluster-Dashboard | Frontend | Ubersicht aller Cluster mit Status |

### E. Blog-Verwaltung & Dashboard

**Prioritat:** ★★
**Ziel:** Zentrale Ubersicht uber alle Blogs, Unternehmen, und Generierungshistorie.

| Komponente | Kategorie | Beschreibung |
|------------|-----------|--------------|
| Blog-Liste | Frontend | Tabelle mit allen Blogs, Status, Datum, Unternehmen |
| Status-Tracking | Backend | Entwurf -> In Generierung -> Review -> Veroffentlicht |
| Blog-Detail | Frontend | Vollstandiger Blog mit Editor, Bildern, SEO-Score |
| Unternehmen-Filter | Frontend | Blogs nach Unternehmen filtern |
| Analytics | Frontend | Wortanzahl, Keywords, Generierungsdauer |

### F. Easy Blog Writer (Vereinfacht)

**Prioritat:** ★
**Ziel:** 1-Click Blog-Generierung fur schnelle Ergebnisse.

| Komponente | Kategorie | Beschreibung |
|------------|-----------|--------------|
| Einfaches Formular | Frontend | Nur Titel + Unternehmen + "Generieren" Button |
| Default-Einstellungen | Backend | Vordefinierte Tonalitat, Wortanzahl, Sprache |
| Schnelle Pipeline | Backend | Alles automatisch ohne Zwischenschritte |

---

## Technischer Stack

### Frontend

| Technologie | Beschreibung |
|-------------|-------------|
| React 18 + TypeScript | UI Framework (wie papagei.ai) |
| Vite | Build Tool mit HMR |
| Tailwind CSS 4 | Utility-First CSS mit `@tailwindcss/vite` Plugin |
| shadcn/ui | UI-Komponenten: form, card, input, select, dialog, tabs, sidebar, table, button, dropdown-menu, sheet, badge, progress, skeleton, sonner (toasts) |
| MagicUI | Landing-Page Effekte: bento-grid, animated-gradient-text, animated-shiny-text, grid-pattern |
| React Hook Form + Zod | Formular-Validierung |
| React Router v7 | Client-Side Routing |
| Recharts | Analytics-Charts |

### Backend

| Technologie | Beschreibung |
|-------------|-------------|
| Python 3.12+ | Laufzeitumgebung |
| FastAPI | Async Web Framework (Port 8123) |
| SQLAlchemy 2.0 (async) | ORM mit asyncpg Driver |
| Alembic | Datenbank-Migrationen |
| Pydantic v2 | Request/Response Validierung + Settings |
| structlog | Structured JSON Logging |
| anthropic SDK | Claude API fur Content-Generierung |
| tavily-python | Website-Crawling und Content-Extraktion |
| httpx | Async HTTP Client (FLUX.2 API) |
| uv | Package Manager |
| Ruff | Linting + Formatting |
| MyPy + Pyright | Strict Type Checking |

### Infrastruktur

| Service | Provider | Beschreibung |
|---------|----------|-------------|
| Datenbank | Supabase (PostgreSQL) | Relationale Daten + pgvector fur Embeddings |
| Auth | Supabase Auth | JWT-basierte Authentifizierung, JWKS-Verifikation |
| Storage | Supabase Storage | Generierte Bilder, Uploads |
| Bild-KI | Black Forest Labs | FLUX.2 API fur Blog-Bilder |
| Web-Crawling | Tavily | Website-Content-Extraktion |
| LLM | Anthropic (Claude) | Content-Generierung, Style-Analyse, SEO |
| Containerisierung | Docker + Docker Compose | Lokale Entwicklung + Deployment |

---

## Datenbank-Schema

### Kern-Tabellen

| Tabelle | Beschreibung |
|---------|-------------|
| `profiles` | Nutzer-Profile (Supabase Auth Extension) |
| `companies` | Unternehmens-Profile (Name, Branche, Zielgruppe, etc.) |
| `company_styles` | Analysierte Schreibstile pro Unternehmen |
| `company_style_embeddings` | Vektorisierte Style-Daten (pgvector) |
| `blogs` | Blog-Artikel (Titel, Content, Status, Bilder, SEO-Daten) |
| `blog_sections` | Einzelne Blog-Abschnitte (H2/H3, Content) |
| `blog_images` | Generierte Bilder pro Blog (URL, Prompt, Position) |
| `keywords` | Recherchierte Keywords mit Score |
| `keyword_clusters` | Themen-Cluster aus Keywords |
| `generation_jobs` | Async Job-Tracking (Blog-Generierung, Bild-Generierung) |
| `crawl_results` | Gecrawlte Website-Inhalte (Tavily) |

### Multi-Tenant Isolation

- Jede Tabelle hat `user_id` Column mit Index (wie papagei.ai)
- Supabase RLS (Row Level Security) fur zusatzliche DB-Ebene Isolation
- Backend: `get_current_user()` Dependency filtert alle Queries nach `user_id`

---

## Ubernahme von papagei.ai

Folgende Patterns und Komponenten konnen direkt ubernommen werden:

| Komponente | Quelle (papagei.ai) | Anpassung |
|------------|---------------------|-----------|
| Auth-System | `backend/app/core/auth.py` | Supabase JWT + JWKS Verifikation 1:1 |
| User-Management | `backend/app/users/` | Profiles + Rollen |
| API Client | `frontend/src/lib/apiClient.ts` | `apiFetch` Wrapper mit JWT |
| Auth Context | `frontend/src/contexts/AuthContext` | Login/Logout/Session |
| Notification Context | `frontend/src/contexts/NotificationContext` | Toast-System |
| Theme Context | `frontend/src/contexts/ThemeContext` | Dark/Light Mode |
| TimestampMixin | `backend/app/shared/models.py` | `created_at`/`updated_at` |
| PaginatedResponse | `backend/app/shared/schemas.py` | Pagination Pattern |
| ErrorResponse | `backend/app/shared/schemas.py` | Standardisierte Fehler |
| Tailwind Config | `frontend/src/index.css` | HSL Design Tokens, shadcn Theme |
| Vertical Slice Pattern | `backend/app/` Struktur | Feature-Ordner mit models/schemas/routes/service |
| Docker Setup | `docker-compose.yml` | Multi-Stage Build |

---

## Roadmap: Meilensteine

### Meilenstein 1: Foundation (MVP Backend + Frontend Shell)

| Task | Kategorie | Aufwand | Status |
|------|-----------|--------|--------|
| FastAPI Starter konfigurieren (Supabase DB) | Backend | S | ⬜ |
| React + Vite + Tailwind 4 + shadcn Setup | Frontend | S | ⬜ |
| Supabase Projekt erstellen (Auth + DB) | Infra | S | ⬜ |
| Auth-System von papagei.ai portieren | Full-Stack | M | ⬜ |
| Datenbank-Schema: companies, blogs, keywords | Backend | M | ⬜ |
| Basic Layout: Sidebar + Routing | Frontend | S | ⬜ |

### Meilenstein 2: Blog Writer Core

| Task | Kategorie | Aufwand | Status |
|------|-----------|--------|--------|
| Blog-Writer Formular (Titel, Optionen) | Frontend | M | ⬜ |
| Content-Generierung Pipeline (Claude API) | Backend | L | ⬜ |
| Gliederung -> Abschnitte -> Zusammenbau | Backend | L | ⬜ |
| Async Job-System fur Generierung | Backend | M | ⬜ |
| Progress-Anzeige im Frontend | Frontend | S | ⬜ |
| Markdown-Editor mit Live-Preview | Frontend | M | ⬜ |

### Meilenstein 3: Unternehmens-Personalisierung

| Task | Kategorie | Aufwand | Status |
|------|-----------|--------|--------|
| Company CRUD (Formular + API) | Full-Stack | M | ⬜ |
| Tavily Integration (Crawl + Extract) | Backend | M | ⬜ |
| Style-Analyse per LLM | Backend | M | ⬜ |
| pgvector Embeddings fur Style-RAG | Backend | M | ⬜ |
| Style in Content-Pipeline integrieren | Backend | S | ⬜ |

### Meilenstein 4: Bild-Generierung

| Task | Kategorie | Aufwand | Status |
|------|-----------|--------|--------|
| FLUX.2 API Integration | Backend | M | ⬜ |
| Bild-Prompt-Generierung aus Blog-Kontext | Backend | S | ⬜ |
| Async Polling + Supabase Storage Upload | Backend | M | ⬜ |
| Bild-Auswahl/-Regenerierung UI | Frontend | M | ⬜ |

### Meilenstein 5: SEO & Keyword-Recherche

| Task | Kategorie | Aufwand | Status |
|------|-----------|--------|--------|
| Topic-Suggest API | Backend | M | ⬜ |
| Keyword-Research + Scoring | Backend | M | ⬜ |
| Keyword-Clustering | Backend | S | ⬜ |
| Cluster-Dashboard UI | Frontend | M | ⬜ |

### Meilenstein 6: Dashboard & Polish

| Task | Kategorie | Aufwand | Status |
|------|-----------|--------|--------|
| Blog-Verwaltung (Liste, Filter, Status) | Full-Stack | M | ⬜ |
| Export (HTML, Markdown, WordPress) | Backend | M | ⬜ |
| Easy Blog Writer Modus | Full-Stack | S | ⬜ |
| Analytics & Statistiken | Full-Stack | M | ⬜ |
| Landing Page mit MagicUI Effekten | Frontend | S | ⬜ |

---

## PRP-Referenz

| PRP | Feature | Status |
|-----|---------|--------|
| - | Noch keine PRPs erstellt | ⬜ |

*Empfehlung: Erste PRP fur "Blog Writer Core" (Meilenstein 2) erstellen mit `/01-plan`*

---

## Externe Services & APIs

| Service | Zweck | Env Vars |
|---------|-------|----------|
| Supabase | Auth, DB, Storage, Vektoren | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` |
| Anthropic (Claude) | Content-Generierung, Style-Analyse | `ANTHROPIC_API_KEY` |
| Black Forest Labs (FLUX.2) | Blog-Bild-Generierung | `BFL_API_KEY` |
| Tavily | Website-Crawling, Content-Extraktion | `TAVILY_API_KEY` |

---

## Zusatzliche Ideen

| Idee | Beschreibung | Prioritat |
|------|-------------|-----------|
| WordPress-Plugin | Direktes Publishing von der Plattform zu WordPress | ★ |
| Batch-Generierung | Mehrere Blogs auf einmal generieren (wie n8n-Workflow) | ★★ |
| SEO-Score-Analyse | Generierter Blog wird auf SEO-Qualitat gepruft | ★★ |
| Interne Verlinkung | Automatische Vorschlage fur interne Links zwischen Blogs | ★ |
| A/B Titel-Testing | Mehrere Titel generieren, besten wahlen | ★ |
| Social Media Snippets | Aus Blog automatisch Social-Media-Posts generieren | ★ |
| Plagiatsprufung | Content auf Einzigartigkeit prufen vor Veroffentlichung | ★★ |
| Mehrsprachigkeit | Blogs in mehreren Sprachen generieren (DE, EN, etc.) | ★ |
| Template-System | Vordefinierte Blog-Templates (How-To, Listicle, Guide) | ★★ |
