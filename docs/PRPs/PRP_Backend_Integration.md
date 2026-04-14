# PRP: Backend-Integration & Blog-Automatisierung

## Status: DRAFT (v2 — optimiert 2026-04-14)
**Erstellt:** 2026-04-14
**Letzte Aktualisierung:** 2026-04-14
**Prioritaet:** P0

## Aenderungslog
| Datum | Aenderung |
|-------|-----------|
| 2026-04-14 v2 | FLUX.2 Signed-URL-Problem geloest (Supabase Storage), Modell auf `flux-2-pro-preview` aktualisiert, Tavily `map()` vor `extract()` hinzugefuegt, Anthropic Prompt Caching explizit, `asyncio.to_thread()` fuer supabase-py, Pydantic Validators, Error-Recovery in Pipeline, Frontend UI-Upgrade-Plan (shadcn/ui + MagicUI) |

## Ziel
Das bestehende Blogreich-Frontend (Bolt.new, React/Vite) mit einem FastAPI-Backend verbinden, das die KI-gesteuerte Blog-Generierung, Website-Analyse (Tavily), Bild-Generierung (FLUX.2) und Keyword-Recherche uebernimmt. Das Frontend spricht bereits Supabase direkt fuer CRUD-Operationen an -- das Backend wird NUR fuer KI-Operationen benoetigt.

## User Story
Als Blogreich-Nutzer
moechte ich einen Blog-Titel eingeben und einen vollstaendigen, SEO-optimierten Artikel mit Bildern erhalten
damit ich hochwertige Blog-Inhalte fuer mein Unternehmen ohne manuellen Aufwand erstellen kann.

## Architektur-Entscheidung: Hybrid-Ansatz

```
Frontend (React/Vite, Port 5173)
  |
  |-- Supabase JS SDK --> Supabase DB (CRUD: companies, blogs, keywords)
  |                       Projekt: dcskfgpohcdaxrhiswnb.supabase.co
  |-- Supabase Auth   --> JWT Tokens (Anon Key im Frontend)
  |
  |-- apiClient.ts ----> FastAPI Backend (Port 8123)
       |                    Auth: Bearer <supabase-jwt> im Header
       |
       |-- POST /api/blogs/generate     --> Anthropic Claude API
       |-- POST /api/companies/analyze  --> Tavily Python SDK
       |-- POST /api/images/generate    --> BFL FLUX.2 REST API (httpx)
       |-- POST /api/keywords/research  --> Anthropic Claude API
       |-- GET  /api/blogs/:id/status   --> Supabase (Job-Status lesen)
```

**Warum Hybrid:** Frontend macht alle CRUD-Ops direkt ueber Supabase (mit RLS). Backend liest/schreibt via Supabase Python SDK mit Service-Role-Key. Kein SQLAlchemy, keine doppelten Schema-Definitionen.

## Scope

### In Scope
- FastAPI-Backend mit `supabase-py` Client (KEIN SQLAlchemy, KEIN Alembic)
- Supabase JWT-Verifikation via JWKS Endpoint
- Blog-Generierung Pipeline (Anthropic `claude-sonnet-4-20250514`) mit Prompt Caching
- Website-Analyse (`tavily-python` SDK: map + extract + crawl)
- Bild-Generierung (BFL FLUX.2 REST API via `httpx`) + Supabase Storage Upload
- Keyword-Recherche + Scoring (Anthropic Claude)
- Frontend: Mock-Code durch apiClient-Calls ersetzen (4 Dateien)
- Frontend: UI-Upgrade mit offiziellen shadcn/ui Komponenten + MagicUI Effekte
- Background Tasks via `asyncio.create_task()` + Supabase Status-Updates
- `asyncio.to_thread()` Wrapper fuer synchrone supabase-py Calls

### Out of Scope
- SQLAlchemy / Alembic (Supabase-SDK reicht)
- Blog-Publishing / WordPress-Export
- SEO-Performance-Tracking
- Batch-Generierung
- Eigene User-Verwaltung

---

## Verfuegbare Credentials (alle vorhanden in `.env`)

Alle Keys sind in `/Users/adriangawin/Blogplattform/.env` konfiguriert:

| Key | Wert (gekuerzt) | Status |
|-----|-----------------|--------|
| `SUPABASE_URL` | `https://dcskfgpohcdaxrhiswnb.supabase.co` | Bereit |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...sfOdNf...` (service_role fuer Blogreich) | Bereit |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-Lhhpkg5C...` | Bereit |
| `BFL_API_KEY` | `bfl_9rWEwiK4EEj...` | Bereit |
| `TAVILY_API_KEY` | `tvly-dev-MOHSYzl...` | Bereit |

Das Backend liest die `.env` aus dem Root-Verzeichnis `/Users/adriangawin/Blogplattform/.env`. Kein Kopieren noetig -- Pydantic Settings mit `env_file="../../.env"` oder Symlink.

---

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Zeilen |
|-------|----------|--------|
| `project/src/pages/BlogWriter.tsx` | `simulateGeneration()` (Z.69-106) durch API-Call + Polling ersetzen | 69-106 |
| `project/src/pages/Companies.tsx` | `analyzeWebsite()` (Z.64-69) durch echten API-Call ersetzen | 64-69 |
| `project/src/pages/Keywords.tsx` | "Neue Recherche" Button mit API-Call verbinden | TBD |
| `project/src/pages/BlogEditor.tsx` | Bild-Generierung Button mit API-Call verbinden | TBD |

### Neue Dateien (erstellen)

```
backend/
├── .env                          # Echte Keys (gitignored)
├── .env.example                  # Template ohne Secrets
├── .gitignore
├── .python-version               # 3.12
├── pyproject.toml                # Dependencies
├── app/
│   ├── __init__.py
│   ├── main.py                   # FastAPI App + Lifespan + Router
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py             # Pydantic Settings
│   │   ├── auth.py               # JWT-Verifikation (Supabase JWKS)
│   │   ├── supabase_client.py    # supabase-py Client (Service Role)
│   │   └── logging.py            # structlog Setup
│   ├── blogs/
│   │   ├── __init__.py
│   │   ├── routes.py             # POST /generate, GET /status
│   │   ├── service.py            # Content-Pipeline (Claude)
│   │   ├── schemas.py            # Pydantic Request/Response
│   │   └── prompts.py            # System-Prompts fuer Gliederung, Abschnitte, etc.
│   ├── companies/
│   │   ├── __init__.py
│   │   ├── routes.py             # POST /analyze
│   │   ├── service.py            # Tavily Crawl + Style-Analyse
│   │   └── schemas.py
│   ├── images/
│   │   ├── __init__.py
│   │   ├── routes.py             # POST /generate
│   │   ├── service.py            # FLUX.2 API + Polling
│   │   └── schemas.py
│   └── keywords/
│       ├── __init__.py
│       ├── routes.py             # POST /research
│       ├── service.py            # Keyword-Recherche (Claude)
│       └── schemas.py
```

---

## Technischer Plan

### Schritt 1: Backend-Skeleton + Auth
**Dateien:** `backend/` (komplett neu)

**pyproject.toml Dependencies:**
```toml
[project]
name = "blogreich-api"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "supabase>=2.15.0",
    "anthropic>=0.52.0",
    "httpx>=0.28.0",
    "tavily-python>=0.5.0",
    "pydantic-settings>=2.8.0",
    "structlog>=25.1.0",
    "python-jose[cryptography]>=3.3.0",
]

[dependency-groups]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.24",
    "ruff>=0.8",
    "mypy>=1.13",
]
```

**app/core/config.py** — Pydantic Settings:
```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_name: str = "Blogreich API"
    version: str = "0.1.0"
    environment: str = "development"
    log_level: str = "INFO"
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Supabase (Blogreich-Projekt)
    supabase_url: str                # https://dcskfgpohcdaxrhiswnb.supabase.co
    supabase_service_role_key: str   # Service Role Key (aus .env)

    # Anthropic
    anthropic_api_key: str
    anthropic_model: str = "claude-sonnet-4-20250514"

    # BFL (FLUX.2)
    bfl_api_key: str
    bfl_model: str = "flux-2-pro-preview"  # flux-2-pro-preview (neuestes) | flux-2-pro (pinned) | flux-2-max | flux-2-klein-4b (schnell/guenstig)
    bfl_base_url: str = "https://api.bfl.ai/v1"

    # Supabase Storage
    supabase_storage_bucket: str = "blog-images"  # Bucket fuer generierte Bilder

    # Tavily
    tavily_api_key: str
```

**app/core/auth.py** — Supabase JWT-Verifikation:
```python
# Ansatz: JWKS Endpoint von Supabase nutzen (wie papagei.ai)
# URL: https://dcskfgpohcdaxrhiswnb.supabase.co/auth/v1/.well-known/jwks.json
# Token aus "Authorization: Bearer <jwt>" Header
# jose.jwt.decode() mit JWKS Public Key
# Extrahiert: user_id = payload["sub"]
#
# FastAPI Dependency:
# async def get_current_user_id(authorization: str = Header(...)) -> str
```

**app/core/supabase_client.py:**
```python
# supabase-py mit Service Role Key (bypassed RLS)
# from supabase import create_client
# client = create_client(settings.supabase_url, settings.supabase_service_role_key)
#
# WICHTIG: supabase-py ist synchron. In async-Kontexten immer mit
# asyncio.to_thread() wrappen, um den Event Loop nicht zu blockieren:
#
# async def db_update(table: str, data: dict, filters: dict) -> Any:
#     def _run() -> Any:
#         q = client.table(table).update(data)
#         for col, val in filters.items():
#             q = q.eq(col, val)
#         return q.execute()
#     return await asyncio.to_thread(_run)
#
# Verwendung: await db_update("blogs", {"status": "review"}, {"id": blog_id})
```

**app/main.py:**
```python
# FastAPI(title="Blogreich API", version="0.1.0", lifespan=lifespan)
# CORS: settings.allowed_origins
# Router: /api/blogs, /api/companies, /api/images, /api/keywords
# Health: GET /health
```

**Done-Kriterien:**
- [ ] `uv run uvicorn app.main:app --port 8123` startet fehlerfrei
- [ ] `GET /` gibt `{"message": "Blogreich API"}` zurueck
- [ ] `GET /health` gibt 200 zurueck
- [ ] CORS erlaubt Requests von `localhost:5173`
- [ ] Auth-Dependency extrahiert user_id aus gueltigem Supabase JWT
- [ ] `uv run ruff check .` und `uv run mypy app/` sind gruen

---

### Schritt 2: Blog-Generierung Pipeline (Kern-Feature)
**Dateien:** `backend/app/blogs/`

**API Endpoints:**

`POST /api/blogs/generate`
```python
from pydantic import model_validator

class BlogGenerateRequest(BaseModel):
    blog_id: str                                    # Frontend erstellt Blog vorab in Supabase
    title: str
    company_id: str | None = None
    language: Literal["de", "en"] = "de"
    tone: Literal["professional", "casual", "academic", "creative"] = "professional"
    target_word_count: int = Field(default=3000, ge=1000, le=5000)
    primary_keyword: str | None = None
    secondary_keywords: list[str] = []
    content_source: Literal["ai", "realtime", "url"] = "ai"
    source_url: str | None = None

    @model_validator(mode="after")
    def validate_source_url(self) -> "BlogGenerateRequest":
        """source_url ist Pflicht wenn content_source == 'url'."""
        if self.content_source == "url" and not self.source_url:
            raise ValueError("source_url ist erforderlich wenn content_source 'url' ist")
        return self

class BlogGenerateResponse(BaseModel):
    status: str = "started"
    message: str = "Blog-Generierung gestartet"
```

`GET /api/blogs/{blog_id}/status`
```python
class BlogStatusResponse(BaseModel):
    status: Literal["generating", "completed", "failed"]
    current_step: Literal["outline", "sections", "intro", "conclusion", "images", "done"] | None
    progress: float                                   # 0.0 - 1.0
    error: str | None = None
```

**Pipeline (service.py) — Sequentieller Ablauf als Background Task:**

```python
async def generate_blog(request: BlogGenerateRequest, user_id: str) -> None:
    """Runs as asyncio.create_task() — updates Supabase direkt.

    Error-Recovery: Einzelne Sections duerfen fehlschlagen — Pipeline faehrt fort.
    Nur bei kritischen Fehlern (Outline fehlschlaegt, alle Sections fehlschlagen) wird abgebrochen.
    """

    # 1. Status: generating, step: outline
    await update_blog_status(blog_id, "generating", "outline", 0.1)

    # 2. Kontext sammeln
    company = await load_company(company_id) if company_id else None
    style = company.style_profile if company else None

    # 3. Content-Source Material
    if content_source == "realtime":
        # Tavily Search: aktuelle Infos zum Thema
        tavily = TavilyClient(api_key=settings.tavily_api_key)
        search_results = await asyncio.to_thread(
            tavily.search, query=title, max_results=5
        )
        context_material = format_search_results(search_results)
    elif content_source == "url":
        # Tavily Extract: Inhalte von der URL
        tavily = TavilyClient(api_key=settings.tavily_api_key)
        extracted = await asyncio.to_thread(
            tavily.extract, urls=[source_url]
        )
        context_material = extracted["results"][0]["raw_content"]
    else:
        context_material = None

    # 4. Gliederung erstellen (Claude mit Prompt Caching)
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    outline = await asyncio.to_thread(
        client.messages.create,
        model=settings.anthropic_model,
        max_tokens=2000,
        system=[{
            "type": "text",
            "text": OUTLINE_SYSTEM_PROMPT,
            "cache_control": {"type": "ephemeral"}  # Prompt Caching: 90% guenstiger bei Wiederverwendung
        }],
        messages=[{"role": "user", "content": build_outline_prompt(
            title, keywords, style, context_material, target_word_count
        )}]
    )
    # Parse JSON: {"h1": "...", "sections": [{"h2": "...", "h3": [...]}]}
    await update_blog_status(blog_id, "generating", "sections", 0.2)

    # 5. Abschnitte schreiben (Claude, pro H2-Section) — mit Error Recovery
    sections_content = []
    failed_sections = []
    for i, section in enumerate(parsed_outline["sections"]):
        try:
            section_text = await asyncio.to_thread(
                client.messages.create,
                model=settings.anthropic_model,
                max_tokens=1500,
                system=[{
                    "type": "text",
                    "text": SECTION_SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"}
                }],
                messages=[{"role": "user", "content": build_section_prompt(
                    section, keywords, style, company
                )}]
            )
            sections_content.append(section_text)
        except Exception as e:
            logger.warning("blog.section_generation_failed", section_index=i, error=str(e))
            failed_sections.append(i)
            sections_content.append(f"<!-- Section {i+1} fehlgeschlagen: wird nachgereicht -->")
        progress = 0.2 + (0.5 * (i + 1) / len(parsed_outline["sections"]))
        await update_blog_status(blog_id, "generating", "sections", progress)

    # 6. Einleitung (Claude)
    await update_blog_status(blog_id, "generating", "intro", 0.75)
    intro = await asyncio.to_thread(client.messages.create, ...)

    # 7. Fazit (Claude)
    await update_blog_status(blog_id, "generating", "conclusion", 0.85)
    conclusion = await asyncio.to_thread(client.messages.create, ...)

    # 8. Zusammenbauen
    full_content = assemble_markdown(intro, sections_content, conclusion)
    word_count = len(full_content.split())
    seo_score = calculate_seo_score(full_content, primary_keyword, secondary_keywords)

    # 9. In Supabase speichern (via asyncio.to_thread)
    await db_update("blogs", {
        "content": full_content,
        "actual_word_count": word_count,
        "seo_score": seo_score,
        "status": "review",
        "failed_sections": failed_sections if failed_sections else None,
    }, {"id": blog_id})

    await update_blog_status(blog_id, "completed", "done", 1.0)
```

> **Prompt Caching Hinweis:** System-Prompts werden mit `cache_control: {"type": "ephemeral"}` markiert.
> Bei wiederholten Calls (z.B. 5-7 Section-Calls mit gleichem `SECTION_SYSTEM_PROMPT`) werden
> gecachte Tokens zu 90% reduziertem Preis verarbeitet. Das spart ~$0.02-0.04 pro Blog.

**prompts.py — System-Prompts (aus n8n-Workflow uebernommen + optimiert):**
- `OUTLINE_SYSTEM_PROMPT`: SEO-Gliederungs-Ersteller (5-7 H2, je 2-4 H3, JSON-Output)
- `SECTION_SYSTEM_PROMPT`: Blog-Abschnitt-Writer (450-600 Woerter, Storytelling, direkte Ansprache)
- `INTRO_SYSTEM_PROMPT`: Packende Einleitung (200-280 Woerter, Hook + Preview)
- `CONCLUSION_SYSTEM_PROMPT`: Fazit mit CTA (200-280 Woerter, Zusammenfassung + Bullet Points)

Die Prompts basieren auf den detaillierten System-Prompts aus `BLOG Automatisierung (1).json` (n8n Nodes: "Blog-Gliederung Agent", "Abschnitt schreiben Agent", "Einleitung schreiben Agent", "Fazit schreiben").

**Done-Kriterien:**
- [ ] POST /api/blogs/generate startet Background-Task, antwortet sofort
- [ ] GET /api/blogs/{id}/status zeigt Echtzeit-Fortschritt (outline -> sections -> intro -> conclusion -> done)
- [ ] Blog in Supabase hat nach Abschluss echten Markdown-Content mit H1/H2/H3
- [ ] Wortanzahl im Bereich +/- 20% des Ziels
- [ ] Content-Source "realtime" liefert aktuelle Infos via Tavily Search
- [ ] Content-Source "url" extrahiert und nutzt URL-Content als Basis

---

### Schritt 3: Website-Analyse (Tavily)
**Dateien:** `backend/app/companies/`

**API:** `POST /api/companies/analyze`
```python
class CompanyAnalyzeRequest(BaseModel):
    company_id: str
    website_urls: list[str] = Field(..., min_length=1, max_length=5)

class CompanyAnalyzeResponse(BaseModel):
    style_profile: str              # Menschenlesbarer Style-Text
    style_data: dict                # Strukturierte JSON-Daten
    pages_analyzed: int
    sitemap_urls: list[str]         # NEU: Entdeckte URLs via map()
```

**Service-Ablauf (3 Phasen: Map -> Extract -> Analyse):**
```python
async def analyze_company_website(urls: list[str], company_id: str) -> dict:
    tavily = TavilyClient(api_key=settings.tavily_api_key)

    # Phase 1: Sitemap Discovery mit map() — URLs intelligent auswählen
    # map() liefert die Seitenstruktur der Website, ohne Content herunterzuladen.
    # So koennen wir gezielt die relevantesten Seiten identifizieren.
    discovered_urls = []
    for url in urls:
        sitemap = await asyncio.to_thread(
            tavily.map,
            url=url,
            max_depth=1,
            max_breadth=20,
            limit=30,
            query="Find about page, services page, blog posts, team page"
        )
        discovered_urls.extend(sitemap.get("urls", []))

    # Phase 2: Extract von den relevantesten Seiten (max 10)
    # Priorisiere: /about, /ueber-uns, /leistungen, /services, /blog
    priority_patterns = ["/about", "/ueber", "/leistung", "/service", "/blog", "/team"]
    relevant_urls = [u for u in discovered_urls if any(p in u.lower() for p in priority_patterns)]
    extract_urls = (relevant_urls[:5] or discovered_urls[:5]) + urls  # Original-URLs immer dabei
    extract_urls = list(dict.fromkeys(extract_urls))[:10]  # Deduplizieren, max 10

    all_content = []
    for batch in [extract_urls[i:i+5] for i in range(0, len(extract_urls), 5)]:
        result = await asyncio.to_thread(tavily.extract, urls=batch)
        for r in result.get("results", []):
            if r.get("raw_content"):
                all_content.append(r["raw_content"])

    # Phase 3: Claude Style-Analyse mit Prompt Caching
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    analysis = await asyncio.to_thread(
        client.messages.create,
        model=settings.anthropic_model,
        max_tokens=1500,
        system=[{
            "type": "text",
            "text": STYLE_ANALYSIS_SYSTEM_PROMPT,
            "cache_control": {"type": "ephemeral"}
        }],
        messages=[{"role": "user", "content": "\n\n---\n\n".join(all_content[:5])}]  # Max 5 Seiten
    )

    # In Supabase speichern
    await db_update("companies", {
        "style_profile": {"text": analysis_text, "data": structured_data}
    }, {"id": company_id})

    # Crawl-Ergebnisse fuer spaetere Verwendung speichern
    await db_insert("crawl_results", {
        "company_id": company_id,
        "user_id": user_id,
        "urls_discovered": discovered_urls[:50],
        "urls_analyzed": extract_urls,
        "pages_count": len(all_content),
    })
```

**Tavily API Referenz:**
| Methode | Zweck | Parameter |
|---------|-------|-----------|
| `map(url)` | Sitemap Discovery (schnell, kein Content) | `max_depth`, `max_breadth`, `limit`, `query`, `select_paths` |
| `extract(urls)` | Content von spezifischen URLs extrahieren | `urls` (max 20), `include_images` |
| `crawl(url)` | Deep Crawl mit Content (langsamer) | `max_depth`, `max_breadth`, `limit`, `query`, `select_paths`, `select_domains` |
| `search(query)` | Web-Suche (fuer Realtime-Content) | `query`, `max_results`, `search_depth` |

**Done-Kriterien:**
- [ ] API nutzt `map()` zur Sitemap-Discovery vor `extract()`
- [ ] Relevante Seiten werden intelligent priorisiert (About, Services, Blog)
- [ ] Claude analysiert und erstellt Schreibstil-Profil
- [ ] Style-Profil in Supabase companies.style_profile gespeichert
- [ ] Crawl-Ergebnisse in crawl_results Tabelle fuer spaetere Nutzung
- [ ] Antwort in unter 30 Sekunden

---

### Schritt 4: Bild-Generierung (FLUX.2)
**Dateien:** `backend/app/images/`

**API:** `POST /api/images/generate`
```python
class ImageGenerateRequest(BaseModel):
    blog_id: str
    prompts: list[str] | None = None    # Explizite Prompts ODER auto
    auto_generate: bool = True           # Claude generiert Prompts aus Blog-Content
    count: int = Field(default=3, ge=1, le=5)
    model: Literal["flux-2-pro-preview", "flux-2-klein-4b"] = "flux-2-pro-preview"

    @model_validator(mode="after")
    def validate_prompts(self) -> "ImageGenerateRequest":
        """Wenn auto_generate=False, muessen Prompts angegeben werden."""
        if not self.auto_generate and not self.prompts:
            raise ValueError("prompts erforderlich wenn auto_generate=False")
        return self

class ImageResult(BaseModel):
    id: str
    image_url: str          # Permanente Supabase Storage URL
    original_bfl_url: str   # Temporaere BFL URL (verfaellt nach 10 Min)
    prompt: str
    position: str

class ImageGenerateResponse(BaseModel):
    images: list[ImageResult]
```

**FLUX.2 API Integration (httpx, NICHT SDK):**

> **KRITISCH: BFL Signed URLs verfallen nach 10 Minuten!**
> Bilder muessen sofort heruntergeladen und in Supabase Storage hochgeladen werden.
> Nur die Supabase-URL wird in `blog_images.image_url` gespeichert.

```python
async def generate_image(prompt: str, blog_id: str, position: str) -> ImageResult:
    """Generiert ein Bild via FLUX.2 API und speichert es in Supabase Storage.

    FLUX.2 API Workflow:
    1. POST https://api.bfl.ai/v1/flux-2-pro-preview
       Headers: x-key: <BFL_API_KEY>, Content-Type: application/json
       Body: {"prompt": "...", "width": 1440, "height": 810}
       Response: {"id": "task-uuid", "polling_url": "https://api.bfl.ai/v1/get_result?id=task-uuid"}

    2. Poll GET polling_url alle 1s bis status != "Pending"
       Response (fertig): {"id": "...", "status": "Ready", "result": {"sample": "https://...image.jpg"}}

    3. Download Bild von BFL URL (verfaellt nach 10 Min!)
    4. Upload in Supabase Storage Bucket "blog-images"

    FLUX.2 Modelle:
    - flux-2-pro-preview: Neuestes, empfohlen (5 Credits / $0.05)
    - flux-2-pro: Pinned Version (5 Credits / $0.05)
    - flux-2-max: Hoechste Qualitaet (10 Credits / $0.10)
    - flux-2-klein-4b: Schnell & guenstig fuer Previews (0.5 Credits / $0.005)

    Aufloesung: Min 64x64, Max 4MP (2048x2048), empfohlen bis 2MP.
    Output ist immer ein Vielfaches von 16px.
    """
    async with httpx.AsyncClient(timeout=90.0) as http:
        # 1. Submit
        response = await http.post(
            f"{settings.bfl_base_url}/{settings.bfl_model}",
            headers={"x-key": settings.bfl_api_key, "Content-Type": "application/json"},
            json={"prompt": prompt, "width": 1440, "height": 810}
        )
        response.raise_for_status()
        task = response.json()
        polling_url = task["polling_url"]

        # 2. Poll (max 60s, alle 1s — BFL empfiehlt 0.5s)
        bfl_image_url: str | None = None
        for _ in range(60):
            await asyncio.sleep(1)
            result = await http.get(
                polling_url,
                headers={"x-key": settings.bfl_api_key, "accept": "application/json"}
            )
            data = result.json()
            if data["status"] == "Ready":
                bfl_image_url = data["result"]["sample"]
                break
            if data["status"] in ("Error", "Failed"):
                raise RuntimeError(f"FLUX.2 error: {data}")

        if not bfl_image_url:
            raise TimeoutError("FLUX.2 image generation timed out after 60s")

        # 3. Download von BFL (URL verfaellt nach 10 Min!)
        img_response = await http.get(bfl_image_url)
        img_response.raise_for_status()
        img_bytes = img_response.content

    # 4. Upload in Supabase Storage
    file_name = f"{blog_id}/{position}_{uuid4().hex[:8]}.jpg"
    await asyncio.to_thread(
        supabase.storage.from_(settings.supabase_storage_bucket).upload,
        file_name,
        img_bytes,
        {"content-type": "image/jpeg"}
    )
    permanent_url = f"{settings.supabase_url}/storage/v1/object/public/{settings.supabase_storage_bucket}/{file_name}"

    return ImageResult(
        id=str(uuid4()),
        image_url=permanent_url,           # Permanente URL!
        original_bfl_url=bfl_image_url,    # Nur fuer Debug/Logging
        prompt=prompt,
        position=position,
    )
```

**Done-Kriterien:**
- [ ] API generiert Bilder via FLUX.2 und gibt permanente URLs zurueck
- [ ] Bilder in Supabase Storage Bucket "blog-images" gespeichert
- [ ] Bilder in Supabase blog_images Tabelle referenziert (permanente URL)
- [ ] Auto-generate: Claude erstellt passende Prompts aus Blog-Content
- [ ] Timeout-Handling funktioniert (60s max)
- [ ] BFL signed URLs werden NIE als permanente Referenz gespeichert

---

### Schritt 5: Keyword-Recherche
**Dateien:** `backend/app/keywords/`

**API:** `POST /api/keywords/research`
```python
class KeywordResearchRequest(BaseModel):
    company_id: str
    topic: str | None = None    # Optional, sonst AI-generiert

class KeywordResult(BaseModel):
    keyword: str
    score: int                  # 1-10

class KeywordResearchResponse(BaseModel):
    cluster_name: str
    primary_keyword: str
    keywords: list[KeywordResult]
```

**Service-Ablauf (2-3 Claude-Calls mit Prompt Caching):**
1. **Topic finden** (wenn keins gegeben): Company-Daten -> Claude -> 1 Thema (3-5 Woerter)
2. **Keywords + Scoring in EINEM Call**: Topic + Company -> Claude -> 20-30 Long-Tail Keywords MIT Score 1-10
   - Optimierung gegenueber n8n: Statt 30+ einzelne Scoring-Calls wird alles in einem JSON-Response erledigt
   - System-Prompt mit `cache_control: {"type": "ephemeral"}` fuer guenstigere Wiederverwendung
3. Filter Score >= 7, Cluster bilden, in Supabase speichern (via `asyncio.to_thread()`)

**Done-Kriterien:**
- [ ] API generiert Keywords mit Scores
- [ ] Keywords und Cluster in Supabase gespeichert
- [ ] Mindestens 10 Keywords mit Score >= 7

---

### Schritt 6: Frontend Mock-Code ersetzen
**Dateien:** 4 Seiten im Frontend

**BlogWriter.tsx** (Zeile 69-106 — `simulateGeneration` ersetzen):
```typescript
// VORHER: setTimeout-Fake + statischer Lorem-Ipsum Content
// NACHHER:
const generateBlog = async (blogTitle: string, cId: string, isEasy: boolean) => {
  setGenerating(true);
  setCurrentStep(0);

  // 1. Blog in Supabase erstellen (wie bisher)
  const { data: blog } = await supabase.from('blogs').insert({...}).select().maybeSingle();

  // 2. Backend-Job starten
  await apiPost('/api/blogs/generate', {
    blog_id: blog.id, title: blogTitle, company_id: cId || null,
    language, tone, target_word_count: wordCount,
    primary_keyword: primaryKeyword, secondary_keywords: secondaryKeywords,
    content_source: contentSource, source_url: sourceUrl
  });

  // 3. Polling (alle 2s)
  const poll = setInterval(async () => {
    const status = await apiGet<BlogStatusResponse>(`/api/blogs/${blog.id}/status`);
    // Map step -> index: outline=0, sections=1, intro=2, conclusion=2, images=3, done=3
    const stepMap = { outline: 0, sections: 1, intro: 2, conclusion: 2, images: 3, done: 3 };
    setCurrentStep(stepMap[status.current_step] ?? 0);

    if (status.status === 'completed') {
      clearInterval(poll);
      setGenerating(false);
      navigate(`/blog/${blog.id}/edit`);
    }
    if (status.status === 'failed') {
      clearInterval(poll);
      setGenerating(false);
      toast.error(status.error || 'Generierung fehlgeschlagen');
    }
  }, 2000);
};
```

**Companies.tsx** (Zeile 64-69 — `analyzeWebsite` ersetzen):
```typescript
// VORHER: setTimeout + hardcoded string
// NACHHER:
const analyzeWebsite = async () => {
  setAnalyzing(true);
  try {
    const result = await apiPost<CompanyAnalyzeResponse>('/api/companies/analyze', {
      company_id: editingCompanyId,  // muss beim Erstellen erst gespeichert werden
      website_urls: websiteUrls
    });
    setStyleProfile(result.style_profile);
  } catch (e) {
    toast.error('Website-Analyse fehlgeschlagen');
  }
  setAnalyzing(false);
};
```

**Keywords.tsx** — "Neue Recherche" Button:
```typescript
const startResearch = async () => {
  setResearching(true);
  const result = await apiPost<KeywordResearchResponse>('/api/keywords/research', {
    company_id: selectedCompanyId, topic: topicInput || null
  });
  // Keywords refreshen
  fetchKeywords();
  setResearching(false);
};
```

**Done-Kriterien:**
- [ ] Blog-Generierung end-to-end funktioniert (Frontend -> Backend -> Supabase -> Frontend)
- [ ] Website-Analyse liefert echtes Style-Profil
- [ ] Keyword-Recherche funktioniert
- [ ] Keine Mock-Daten/setTimeout mehr im Frontend
- [ ] Progress-Anzeige reflektiert echten Backend-Fortschritt

---

### Schritt 7: Frontend UI-Upgrade (shadcn/ui + MagicUI)
**Dateien:** `project/src/components/`, `project/src/pages/`

Das aktuelle Frontend nutzt handgeschriebene Custom-Komponenten (Button, Card, etc.). Fuer ein professionelleres Erscheinungsbild werden offizielle shadcn/ui Komponenten und MagicUI Effekte integriert.

**Phase 1: shadcn/ui Komponenten ersetzen (Fundament)**

```bash
# Installation der offiziellen shadcn/ui Komponenten
npx shadcn@latest init
npx shadcn@latest add sidebar table progress skeleton form sonner \
  spinner slider tooltip dropdown-menu pagination combobox command \
  sheet hover-card avatar breadcrumb chart empty
```

| Alte Komponente | Neue Komponente | Betroffene Seiten |
|---|---|---|
| Custom `<table>` HTML | `@shadcn/table` | MyBlogs, Keywords |
| Custom Sidebar | `@shadcn/sidebar` (Block: sidebar-07, collapsible mit Icons) | AppLayout |
| Native `<input range>` | `@shadcn/slider` | BlogWriter (Wortanzahl) |
| Custom Dropdown | `@shadcn/dropdown-menu` | BlogEditor (Export) |
| Custom Select | `@shadcn/combobox` (mit Suche) | BlogWriter, Companies (Unternehmens-Auswahl) |
| Custom Pagination | `@shadcn/pagination` | MyBlogs |
| Custom Empty States | `@shadcn/empty` | Alle Listen-Seiten |
| Fehlt | `@shadcn/skeleton` | Alle Seiten beim Laden |
| Fehlt | `@shadcn/sonner` | Toast-Notifications ueberall |
| Fehlt | `@shadcn/tooltip` | Editor-Toolbar, Dashboard-Icons |
| Fehlt | `@shadcn/breadcrumb` | BlogEditor (Dashboard > Blogs > Titel) |
| Fehlt | `@shadcn/sheet` | Mobile Sidebar |
| Fehlt | `@shadcn/command` | Globale Suche (Cmd+K) |
| Fehlt | `@shadcn/chart` | Dashboard Analytics |

**Phase 2: MagicUI Effekte (Visual Polish)**

```bash
# MagicUI Komponenten
npx shadcn@latest add "https://magicui.design/r/shimmer-button"
npx shadcn@latest add "https://magicui.design/r/number-ticker"
npx shadcn@latest add "https://magicui.design/r/border-beam"
npx shadcn@latest add "https://magicui.design/r/animated-circular-progress-bar"
npx shadcn@latest add "https://magicui.design/r/magic-card"
npx shadcn@latest add "https://magicui.design/r/blur-fade"
npx shadcn@latest add "https://magicui.design/r/confetti"
npx shadcn@latest add "https://magicui.design/r/animated-gradient-text"
npx shadcn@latest add "https://magicui.design/r/animated-shiny-text"
npx shadcn@latest add "https://magicui.design/r/dot-pattern"
npx shadcn@latest add "https://magicui.design/r/animated-list"
npx shadcn@latest add "https://magicui.design/r/hyper-text"
```

| Komponente | Einsatzort | Effekt |
|---|---|---|
| `ShimmerButton` | "Blog generieren" Button | Schimmernder Lichteffekt = Premium-CTA |
| `NumberTicker` | Dashboard Stats (Gesamt, Entwuerfe, etc.) | Animierter Zaehler beim Laden |
| `BorderBeam` | Generierungs-Card waehrend Blog erstellt wird | Leuchtender Rahmen = "aktiver Prozess" |
| `AnimatedCircularProgressBar` | SEO-Score im BlogEditor | Kreisfoermige Visualisierung statt Balken |
| `MagicCard` | Company Cards, Schnellaktionen-Cards | Spotlight-Effekt folgt Maus |
| `BlurFade` | Seiten-Transitions, Listen-Items | Smooth Fade-In beim Erscheinen |
| `Confetti` | Nach erfolgreicher Blog-Generierung | Delight-Moment bei Fertigstellung |
| `AnimatedGradientText` | "Blogreich" Branding in Sidebar | Visueller Wiedererkennungswert |
| `AnimatedShinyText` | "KI-generiert" Badges | Subtiler Shimmer = "powered by AI" |
| `DotPattern` | Login/Register Hintergrund | Tiefe und Struktur |
| `AnimatedList` | Generierungs-Log (Steps) | Items erscheinen nacheinander |
| `HyperText` | Step-Labels bei Generierung | Text-Scramble -> Reveal |

**Seiten-spezifische Upgrades:**

**Dashboard.tsx:**
- Stats-Cards: `NumberTicker` fuer animierte Zahlen + `MagicCard` fuer Hover-Spotlight
- Schnellaktionen: `MagicCard` mit `BlurFade` Stagger-Animation
- Letzte Blogs: `@shadcn/hover-card` fuer Blog-Preview on Hover
- NEU: `@shadcn/chart` fuer Blog-Activity Timeline

**BlogWriter.tsx:**
- "Blog generieren": `ShimmerButton` statt normaler Button
- Generierungs-Progress: `BorderBeam` um die Progress-Card + `AnimatedList` + `HyperText` fuer Steps
- Bei Fertigstellung: `Confetti` Trigger
- Unternehmens-Auswahl: `@shadcn/combobox` mit Suchfunktion
- Wortanzahl: `@shadcn/slider` mit Label

**BlogEditor.tsx:**
- SEO-Score: `AnimatedCircularProgressBar` statt linearem Balken
- Toolbar: `@shadcn/tooltip` fuer alle Buttons
- Export: `@shadcn/dropdown-menu`
- Navigation: `@shadcn/breadcrumb` (Dashboard > Blogs > Titel)

**MyBlogs.tsx:**
- Tabelle: `@shadcn/table` mit sortierbar
- Pagination: `@shadcn/pagination`
- Laden: `@shadcn/skeleton` Rows

**Companies.tsx:**
- Cards: `MagicCard` mit Spotlight-Hover
- Avatar: `@shadcn/avatar` mit Firmeninitialen
- Dialog: `BlurFade` Animation beim Oeffnen

**Keywords.tsx:**
- Tabelle: `@shadcn/table`
- Score: Mini-`@shadcn/progress` Balken

**Login/Register:**
- Hintergrund: `DotPattern` oder `GridPattern`
- Formular: `@shadcn/form` mit Zod-Validation

**Done-Kriterien:**
- [ ] Alle Custom-UI-Komponenten durch offizielle shadcn/ui ersetzt
- [ ] MagicUI Effekte auf allen Hauptseiten integriert
- [ ] Blog-Generierung hat visuelles Feedback (BorderBeam, HyperText, Confetti)
- [ ] Dashboard Stats animiert (NumberTicker)
- [ ] SEO-Score als Kreisdiagramm (AnimatedCircularProgressBar)
- [ ] Mobile-Responsive mit Sheet-Sidebar
- [ ] Globale Suche via Cmd+K (Command)
- [ ] Loading-Skeletons auf allen Seiten
- [ ] Keine visuellen Regressionen nach UI-Upgrade

---

## Datenbank-Aenderungen

Alle Tabellen existieren bereits in Supabase. Erweiterungen:

```sql
-- generation_jobs: Tracking fuer async Blog-Generierung
create table if not exists generation_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  blog_id uuid references blogs(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  current_step text,
  progress float default 0,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table generation_jobs enable row level security;
create policy "Users see own jobs" on generation_jobs for all using (auth.uid() = user_id);
create index idx_generation_jobs_blog_id on generation_jobs(blog_id);

-- blogs: Neues Feld fuer fehlgeschlagene Sections (Error Recovery)
alter table blogs add column if not exists failed_sections int[] default null;
```

### Supabase Storage Setup (im Dashboard)

```sql
-- Storage Bucket fuer generierte Bilder (im Dashboard oder via SQL)
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true);

-- Policy: Jeder kann lesen (public), nur authentifizierte User koennen uploaden
create policy "Public read" on storage.objects for select
  using (bucket_id = 'blog-images');

create policy "Authenticated upload" on storage.objects for insert
  with check (bucket_id = 'blog-images' and auth.role() = 'authenticated');

-- Backend mit Service-Role-Key bypassed RLS, braucht keine extra Policy
```

---

## API-Zusammenfassung

| Method | Path | Zweck | Auth | Dauer |
|--------|------|-------|------|-------|
| POST | `/api/blogs/generate` | Blog-Generierung starten (Background) | JWT | ~200ms Response, 30-90s Job |
| GET | `/api/blogs/{blog_id}/status` | Generierungs-Fortschritt abfragen | JWT | <100ms |
| POST | `/api/companies/analyze` | Website crawlen + Style-Profil | JWT | 10-30s |
| POST | `/api/images/generate` | Blog-Bilder generieren | JWT | 15-60s |
| POST | `/api/keywords/research` | Keyword-Recherche + Clustering | JWT | 10-20s |
| GET | `/health` | Health Check | - | <50ms |

---

## Environment Variables

Backend liest aus Root-`.env` (`/Users/adriangawin/Blogplattform/.env`):

```bash
# === Bereits in .env vorhanden ===
SUPABASE_URL=https://dcskfgpohcdaxrhiswnb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...(vorhanden)
ANTHROPIC_API_KEY=sk-ant-api03-...(vorhanden)
BFL_API_KEY=bfl_9rWEwi...(vorhanden)
TAVILY_API_KEY=tvly-dev-...(vorhanden)

# === Noch hinzufuegen in .env ===
ANTHROPIC_MODEL=claude-sonnet-4-20250514
BFL_MODEL=flux-2-pro-preview
BFL_BASE_URL=https://api.bfl.ai/v1
SUPABASE_STORAGE_BUCKET=blog-images
APP_NAME=Blogreich API
VERSION=0.1.0
ENVIRONMENT=development
LOG_LEVEL=INFO
ALLOWED_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

**Config-Pfad:** `backend/app/core/config.py` nutzt `SettingsConfigDict(env_file="../../.env")` um die Root-.env zu lesen.

---

## Testing-Strategie

| Typ | Was testen | Tool |
|-----|-----------|------|
| Unit | Prompt-Building, Markdown-Assembly, SEO-Score-Berechnung | pytest |
| Unit | FLUX.2 Polling-Logik, Timeout-Handling, Storage Upload | pytest + httpx mock |
| Unit | Pydantic Validators (source_url, prompts) | pytest |
| Unit | Error-Recovery (Section fehlschlaegt, Pipeline laeuft weiter) | pytest |
| Integration | Supabase Read/Write via `asyncio.to_thread()` | pytest-asyncio + echte DB |
| Integration | Auth JWT-Verifikation | pytest + Supabase JWT |
| Integration | Supabase Storage Upload/Download | pytest + echtes Storage |
| E2E (manuell) | Blog-Generierung Frontend -> Backend -> Supabase -> Frontend | Browser |
| UI (manuell) | shadcn/ui + MagicUI Komponenten, Responsive, Dark Mode | Browser |

## Validierung
```bash
# Backend
cd backend && uv run ruff check . && uv run mypy app/ && uv run pytest -v

# Frontend
cd project && npm run typecheck && npm run build

# Smoke Test
curl http://localhost:8123/health
curl -H "Authorization: Bearer <jwt>" http://localhost:8123/api/blogs/test-id/status

# Storage Test (nach Schritt 4)
curl -I "${SUPABASE_URL}/storage/v1/object/public/blog-images/test.jpg"
```

---

## Risiken & Offene Fragen

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|------------|
| Claude Rate Limits (5-8 Calls pro Blog) | Mittel | Retry mit exponential Backoff (`anthropic` SDK built-in), Prompt Caching senkt Kosten um ~90% |
| FLUX.2 Polling-Timeout (>60s) | Niedrig | 60s Timeout, Frontend zeigt "Bilder werden nachgeliefert" |
| ~~FLUX.2 Signed URLs verfallen nach 10 Min~~ | ~~Hoch~~ | **GELOEST:** Bilder werden sofort in Supabase Storage hochgeladen |
| Tavily Crawl langsam bei grossen Sites | Mittel | `map()` zuerst (schnell), dann gezielt `extract()` auf relevante Seiten |
| Einzelne Blog-Section fehlschlaegt | Niedrig | Error-Recovery: Pipeline faehrt fort, fehlende Sections werden markiert |
| ~~3 API-Keys fehlen~~ | ~~Hoch~~ | Alle Keys vorhanden in .env |
| supabase-py blockiert Event Loop | Mittel | Alle Calls via `asyncio.to_thread()` gewrapped |

**Offene Fragen:**
1. ~~Supabase Service-Role-Key sicher?~~ Ja, nur im Backend, nie im Frontend
2. ~~Sollen Bilder in Supabase Storage?~~ **JA** — BFL URLs verfallen nach 10 Min, Supabase Storage ist Pflicht
3. ~~Soll der Blog-Content mit Prompt Caching generiert werden?~~ **JA** — System-Prompts mit `cache_control: {"type": "ephemeral"}` markiert
4. Supabase Storage Bucket "blog-images" muss im Dashboard erstellt werden (public read, authenticated write)

---

## Naechste Schritte

Alle Keys sind vorhanden -- keine Blocker mehr.

1. `/02-execute docs/PRPs/PRP_Backend_Integration.md` -- Schritt 1-3 (Backend Skeleton + Auth + Blog Pipeline + Tavily)
2. Context Reset nach Schritt 3
3. Neuer Chat: Schritt 4-5 (FLUX.2 Bilder mit Storage Upload + Keywords)
4. Context Reset nach Schritt 5
5. Neuer Chat: Schritt 6 (Frontend Mock-Code ersetzen durch API-Calls)
6. Context Reset nach Schritt 6
7. Neuer Chat: Schritt 7 (Frontend UI-Upgrade: shadcn/ui + MagicUI)

**Voraussetzungen fuer Schritt 4 (im Supabase Dashboard):**
- [ ] Storage Bucket "blog-images" erstellen (public read)
- [ ] RLS Policy fuer Storage Objects anlegen
