# PRP #15: AI Blog Agent — Autonome Blog-Erstellung mit PydanticAI

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P3 (Differenzierung — ersetzt die urspruengliche n8n-Automatisierung mit einer In-Platform-Loesung)
**Geschaetzte Komplexitaet:** High
**Betroffene Dateien:** 9 (5 Backend + 3 Frontend + 1 Supabase)
**Abhaengigkeiten:** PRP #03 (SEO), PRP #07 (WordPress Publishing), PRP #11 (Bulk Generation)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Blogreich wurde urspruenglich gebaut, um die n8n-Automatisierung zu ersetzen (siehe PRD: "BLOG Automatisierung"). Die n8n-Automatisierung konnte:
- Woechtentlich Keyword-Recherche durchfuehren
- Automatisch Blog-Themen finden
- Blogs generieren und in Airtable speichern

Aber n8n war starr, hatte kein Frontend und war auf ein Unternehmen hardcoded. Blogreich hat jetzt ein Frontend — aber der **autonome Workflow** fehlt noch. Ein Nutzer muss jeden Blog manuell starten. Fuer Agenturen die 100+ Blogs/Monat brauchen ist das immer noch zu viel Handarbeit.

### Die Loesung

Wir bauen einen **AI Blog Agent** — ein autonomes System das nach einem konfigurierbaren Zeitplan:

1. **Themen recherchiert:** Sucht per Tavily nach aktuellen Trends und Topics zum Themenbereich des Unternehmens
2. **Blog-Titel generiert:** Claude schlaegt 3-5 Titel vor, waehlt den besten basierend auf SEO-Potential
3. **Blog generiert:** Nutzt die bestehende `generate_blog()` Pipeline
4. **Optional publiziert:** Schickt den fertigen Blog an WordPress (PRP #07)

Der Nutzer konfiguriert den Agent einmal ("Erstelle woechentlich 2 Blogs zum Thema SEO fuer mein Unternehmen") und der Agent arbeitet selbststaendig.

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **AI Agent** | Ein KI-System das eigenstaendig Entscheidungen trifft und Aktionen ausfuehrt. Im Gegensatz zu einem einfachen KI-Aufruf ("Schreibe einen Blog") kann ein Agent mehrere Schritte planen und ausfuehren: "Recherchiere Themen → Waehle das beste → Generiere Blog → Publiziere." Er handelt autonom, nicht auf Knopfdruck. |
| **PydanticAI** | Ein Python-Framework von den Machern von Pydantic (unserer Daten-Validierungs-Library). Es ermoeglicht es, KI-Agenten mit "Tools" (Werkzeugen) zu bauen. Der Agent entscheidet selbst, wann er welches Tool benutzt. Z.B. Tool "search_topics" oder Tool "generate_blog". |
| **Tool (im Agent-Kontext)** | Eine Funktion die der Agent aufrufen kann. Wie ein Werkzeug im Werkzeugkasten: Der Agent (Handwerker) entscheidet, ob er den Hammer (search_topics) oder den Schraubenzieher (generate_blog) braucht. |
| **FunctionToolset** | Eine PydanticAI-Klasse die mehrere Tools zusammenfasst. Man registriert Funktionen mit dem `@toolset.tool` Decorator und gibt das Toolset dem Agenten. |
| **RunContext / Dependencies** | Kontext-Daten die der Agent bei jedem Tool-Aufruf mitbekommt (z.B. `user_id`, `company_id`). Wie ein Ausweis den der Handwerker bei sich traegt — jedes Tool kann pruefen, fuer wen es arbeitet. |
| **Cron / Scheduler** | Ein System das Aufgaben zu festgelegten Zeiten ausfuehrt. "Jeden Montag um 9 Uhr" oder "alle 3 Tage". Der Name kommt vom Unix-Befehl `cron`. Wir nutzen entweder Supabase `pg_cron` oder einen Python-basierten Scheduler. |
| **pg_cron** | Eine PostgreSQL-Extension die Cron-Jobs direkt in der Datenbank ausfuehrt. Supabase bietet pg_cron an — wir koennen es nutzen um eine Datenbank-Funktion regelmaessig aufzurufen, die dann unseren Agent startet. |
| **Supabase Edge Function** | Serverlose Funktionen die in Supabase laufen (Deno/TypeScript). Alternativ zum pg_cron koennen wir eine Edge Function als Scheduler nutzen. |
| **Autonomie vs. Human-in-the-Loop** | "Autonom" bedeutet der Agent handelt komplett selbststaendig. "Human-in-the-Loop" bedeutet der Mensch prueft Zwischenergebnisse bevor der Agent weitermacht. Unsere V1 ist **semi-autonom**: Der Agent generiert Blogs als Entwuerfe — der Nutzer prueft und veroeffentlicht manuell. |

---

## Ziel

Einen konfigurierbaren AI Blog Agent bauen, der mit PydanticAI implementiert ist und nach einem Zeitplan (taeglich, woechentlich) automatisch Themen recherchiert, Blog-Titel generiert und Blogs erstellt. Der Agent nutzt die bestehende Blog-Pipeline und arbeitet semi-autonom (Blogs als Entwuerfe, Nutzer prueft).

## User Story

Als Blogreich-Nutzer mit regelmaessigem Content-Bedarf
moechte ich einen KI-Agenten konfigurieren der automatisch Blogs fuer mich erstellt
damit ich nicht jeden Blog manuell starten muss und mein Content-Kalender sich von selbst fuellt.

## Scope

### In Scope
- **PydanticAI Agent** mit 3 Tools: `search_topics`, `generate_blog_titles`, `create_blog`
- **Agent-Konfiguration:** Nutzer definiert Unternehmen, Themenbereich, Frequenz, Anzahl Blogs
- **Scheduler:** Automatischer Start nach Zeitplan (taeglich/woechentlich/monatlich)
- **Agent-Log:** Protokoll aller Agent-Ausfuehrungen und generierten Blogs
- **Frontend:** Konfigurations-Seite und Ausfuehrungs-Protokoll
- **Semi-autonom:** Alle Blogs werden als Entwuerfe erstellt (Nutzer prueft vor Veroeffentlichung)
- **Supabase-Tabelle:** `agent_schedules` fuer Konfiguration und `agent_runs` fuer Protokoll

### Out of Scope
- Vollautonome Veroeffentlichung (kein automatisches WordPress-Publishing in V1)
- Agent-Marketplace (vorgefertigte Agent-Templates fuer verschiedene Branchen)
- Multi-Agent-Systeme (ein Agent der andere Agents koordiniert)
- Echtzeit-Steuerung des Agents waehrend der Ausfuehrung (Start/Stop/Pause)
- Agent-Feedback-Loop (Agent lernt aus Nutzer-Korrekturen)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/main.py` | Agent-Router registrieren | L41-44 |
| `backend/pyproject.toml` | `pydantic-ai` Dependency | L6-16 |
| `project/src/App.tsx` | Neue Route `/agent` | L20-33 |
| Sidebar/AppLayout | Neuer Nav-Eintrag "Blog Agent" | Nav-Links |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `backend/app/agent/` | Neuer Feature-Slice |
| `backend/app/agent/__init__.py` | Package-Init |
| `backend/app/agent/schemas.py` | Pydantic-Schemas fuer Agent-Config und Runs |
| `backend/app/agent/blog_agent.py` | Der PydanticAI Agent mit Tools |
| `backend/app/agent/scheduler.py` | Cron-Scheduler fuer automatische Ausfuehrung |
| `backend/app/agent/routes.py` | API-Endpoints |
| `project/src/pages/AgentConfig.tsx` | Frontend: Agent-Konfiguration und Protokoll |

---

## Technischer Plan

### Schritt 1: Supabase — Tabellen erstellen (MANUELL)

**SQL:**
```sql
-- Agent-Konfigurationen (was soll der Agent tun?)
CREATE TABLE IF NOT EXISTS agent_schedules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name text NOT NULL DEFAULT 'Blog Agent',
    topic_scope text NOT NULL,
        -- z.B. "SEO, Content Marketing, Online Marketing"
    frequency text NOT NULL DEFAULT 'weekly',
        -- 'daily', 'weekly', 'biweekly', 'monthly'
    blogs_per_run int NOT NULL DEFAULT 2,
        -- 1-5 Blogs pro Ausfuehrung
    language text NOT NULL DEFAULT 'de',
    tone text NOT NULL DEFAULT 'professional',
    target_word_count int NOT NULL DEFAULT 3000,
    is_active boolean DEFAULT true,
    last_run_at timestamptz DEFAULT NULL,
    next_run_at timestamptz DEFAULT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_schedules_user_id
ON agent_schedules(user_id);

ALTER TABLE agent_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own agent schedules"
ON agent_schedules FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Agent-Ausfuehrungsprotokoll (was hat der Agent getan?)
CREATE TABLE IF NOT EXISTS agent_runs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id uuid NOT NULL REFERENCES agent_schedules(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'running',
        -- 'running', 'completed', 'failed'
    topics_researched jsonb DEFAULT '[]',
        -- z.B. [{"topic": "SEO Trends", "source": "tavily", "score": 0.85}]
    titles_generated jsonb DEFAULT '[]',
        -- z.B. [{"title": "10 SEO Tipps", "selected": true}]
    blogs_created uuid[] DEFAULT '{}',
        -- IDs der erstellten Blogs
    error text DEFAULT NULL,
    duration_seconds int DEFAULT 0,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_schedule_id
ON agent_runs(schedule_id);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own agent runs"
ON agent_runs FOR SELECT
USING (auth.uid() = user_id);

COMMENT ON TABLE agent_schedules IS 'Configuration for automated blog generation agents.';
COMMENT ON TABLE agent_runs IS 'Execution log of agent runs with topics, titles, and created blogs.';
```

**Done-Kriterien:**
- [ ] Beide Tabellen existieren mit korrekten Constraints
- [ ] RLS aktiviert

---

### Schritt 2: Backend — PydanticAI Agent mit Tools

**Datei:** `backend/app/agent/blog_agent.py` (NEU)
**Was:** Der Kern-Agent mit 3 Tools: Topic-Recherche, Titel-Generierung, Blog-Erstellung.

**Erklaerung fuer die Praktikantin:**
PydanticAI erlaubt uns, einen Agent mit "Werkzeugen" zu definieren. Der Agent bekommt eine Aufgabe ("Erstelle 2 Blogs zum Thema SEO") und entscheidet selbst, welche Tools er in welcher Reihenfolge benutzt:
1. Zuerst: `search_topics` — Tavily-Websuche nach aktuellen Trends
2. Dann: `generate_titles` — Claude generiert 5 Titel-Vorschlaege
3. Zuletzt: `create_blog` — Startet die Blog-Pipeline fuer die besten Titel

**Implementierung:**
```python
from dataclasses import dataclass
from pydantic_ai import Agent, FunctionToolset, RunContext

@dataclass
class AgentDeps:
    """Dependencies passed to all agent tools."""
    user_id: str
    company_id: str
    schedule_id: str
    run_id: str
    language: str
    tone: str
    target_word_count: int

toolset = FunctionToolset()

@toolset.tool
async def search_topics(
    ctx: RunContext[AgentDeps],
    topic_area: str,
    num_results: int = 10,
) -> str:
    """Search the web for trending topics and blog ideas in a specific area.

    Use this tool first to find current, relevant topics for the blog.
    Returns a list of trending topics with titles and descriptions.
    """
    from tavily import TavilyClient
    tavily = TavilyClient(api_key=settings.tavily_api_key)
    results = await asyncio.to_thread(
        tavily.search, query=f"best blog topics {topic_area} 2026",
        max_results=num_results, search_depth="advanced",
    )
    # Format results for the agent
    formatted = []
    for r in results.get("results", []):
        formatted.append(f"- {r.get('title', '')}: {r.get('content', '')[:200]}")
    return "\n".join(formatted)

@toolset.tool
async def generate_titles(
    ctx: RunContext[AgentDeps],
    topics_summary: str,
    num_titles: int = 5,
) -> str:
    """Generate blog title suggestions based on researched topics.

    Use this tool after search_topics to create specific blog titles.
    Returns a numbered list of title suggestions with SEO keywords.
    """
    # Claude generiert Titel-Vorschlaege basierend auf der Recherche
    prompt = f"""Basierend auf diesen aktuellen Trends und Themen:
{topics_summary}

Generiere {num_titles} Blog-Titel-Vorschlaege die:
- SEO-optimiert sind (klares Haupt-Keyword)
- Aktuell und relevant sind
- Zum Unternehmen passen (Sprache: {ctx.deps.language})

Format: Eine nummerierte Liste mit Titel und Haupt-Keyword.
"""
    result = await asyncio.to_thread(_call_claude, TITLE_GEN_PROMPT, prompt, 500)
    return result

@toolset.tool
async def create_blog(
    ctx: RunContext[AgentDeps],
    title: str,
    primary_keyword: str = "",
) -> str:
    """Create a blog post using the Blogreich pipeline.

    Use this tool to create the actual blog content.
    The blog will be created as a draft (not published).
    Returns the blog ID.
    """
    # Blog in Supabase erstellen
    blog = await db_insert("blogs", {
        "user_id": ctx.deps.user_id,
        "company_id": ctx.deps.company_id,
        "title": title,
        "status": "draft",
        "language": ctx.deps.language,
        "tone": ctx.deps.tone,
        "target_word_count": ctx.deps.target_word_count,
        "primary_keyword": primary_keyword,
        "content_source": "ai",
    })
    blog_id = blog.data[0]["id"]

    # Blog-Pipeline starten (synchron im Agent-Kontext)
    request = BlogGenerateRequest(
        blog_id=blog_id, title=title,
        company_id=ctx.deps.company_id,
        language=ctx.deps.language, tone=ctx.deps.tone,
        target_word_count=ctx.deps.target_word_count,
        primary_keyword=primary_keyword,
    )
    await generate_blog(request, ctx.deps.user_id)

    return f"Blog '{title}' erstellt (ID: {blog_id})"

# Der Agent selbst
blog_agent = Agent(
    "anthropic:claude-sonnet-4-20250514",
    toolsets=[toolset],
    deps_type=AgentDeps,
    system_prompt="""\
Du bist ein Content-Stratege der autonome Blog-Erstellung durchfuehrt.

WORKFLOW:
1. Recherchiere aktuelle Trends zum gegebenen Themenbereich (search_topics)
2. Generiere Blog-Titel-Vorschlaege basierend auf der Recherche (generate_titles)
3. Erstelle die besten Blogs als Entwuerfe (create_blog)

REGELN:
- Erstelle nur die angeforderte Anzahl Blogs
- Waehle die Titel mit dem hoechsten SEO-Potential
- Vermeide Duplikate (kein Blog-Titel den es schon gibt)
- Jeder Blog muss ein klares Haupt-Keyword haben
""",
)
```

**Done-Kriterien:**
- [ ] `blog_agent` ist ein funktionsfaehiger PydanticAI Agent
- [ ] 3 Tools registriert und aufrufbar
- [ ] Agent nutzt Claude Sonnet als LLM
- [ ] Tools nutzen `RunContext[AgentDeps]` fuer User/Company-Kontext
- [ ] `uv run mypy app/` fehlerfrei

---

### Schritt 3: Backend — Agent-Ausfuehrungs-Service

**Datei:** `backend/app/agent/schemas.py` + Integration in `blog_agent.py`
**Was:** Funktion die einen Agent-Run startet, den Agent ausfuehrt, und das Protokoll speichert.

**Kernfunktion:**
```python
async def execute_agent_run(schedule_id: str, user_id: str) -> str:
    """Execute a single agent run based on a schedule configuration.

    1. Load schedule config from Supabase
    2. Create agent_runs record
    3. Run the PydanticAI agent
    4. Update run record with results
    5. Update schedule.last_run_at + next_run_at
    """
```

**Done-Kriterien:**
- [ ] `execute_agent_run()` liest Schedule, startet Agent, speichert Ergebnis
- [ ] `agent_runs` Record wird mit Topics, Titles und Blog-IDs befuellt
- [ ] Fehler werden im Run-Record gespeichert (kein Crash)
- [ ] `schedule.last_run_at` und `next_run_at` werden aktualisiert

---

### Schritt 4: Backend — Scheduler (Cron)

**Datei:** `backend/app/agent/scheduler.py` (NEU)
**Was:** Ein einfacher Scheduler der faellige Agent-Runs automatisch startet.

**Erklaerung fuer die Praktikantin:**
Der Scheduler ist wie ein Wecker: Er prueft regelmaessig ob ein Agent "dran" ist (ob `next_run_at` in der Vergangenheit liegt). Wenn ja, startet er den Agent-Run. Es gibt verschiedene Wege das umzusetzen:

- **Option A: Python-Scheduler** — Ein Background-Task der alle 15 Minuten prueft (einfach, aber braucht laufenden Server)
- **Option B: Supabase pg_cron** — Die Datenbank startet den Job (zuverlaessiger, aber komplexer)
- **Option C: AWS EventBridge** — AWS startet den Job (best practice fuer Production)

Fuer V1 nutzen wir **Option A** (Python asyncio Background-Task im FastAPI Startup).

**Implementierung:**
```python
import asyncio

_scheduler_task: asyncio.Task | None = None

async def _scheduler_loop() -> None:
    """Check for due agent runs every 15 minutes."""
    while True:
        try:
            # Finde alle Schedules wo next_run_at <= jetzt UND is_active = true
            due_schedules = await db_query("agent_schedules", {
                "is_active": True,
                # next_run_at <= now() — muss als RPC oder Raw-Query implementiert werden
            })
            for schedule in due_schedules:
                if schedule["next_run_at"] and schedule["next_run_at"] <= datetime.utcnow():
                    await execute_agent_run(schedule["id"], schedule["user_id"])
        except Exception as e:
            logger.error("agent.scheduler_check_failed", error=str(e))
        await asyncio.sleep(900)  # 15 Minuten warten

async def start_scheduler() -> None:
    """Start the scheduler as a background task."""
    global _scheduler_task
    _scheduler_task = asyncio.create_task(_scheduler_loop())

async def stop_scheduler() -> None:
    """Stop the scheduler."""
    if _scheduler_task:
        _scheduler_task.cancel()
```

**Integration in `main.py` Lifespan:**
```python
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    setup_logging(settings.log_level)
    await start_scheduler()  # NEU
    yield
    await stop_scheduler()   # NEU
```

**Done-Kriterien:**
- [ ] Scheduler startet beim App-Start
- [ ] Scheduler prueft alle 15 Minuten auf faellige Runs
- [ ] Faellige Runs werden automatisch gestartet
- [ ] Scheduler faengt Fehler ab (kein App-Crash)
- [ ] Scheduler stoppt sauber beim App-Shutdown

---

### Schritt 5: Backend — Agent Routes

**Datei:** `backend/app/agent/routes.py` (NEU)
**Was:** API-Endpoints fuer Agent-Konfiguration und manuelle Ausfuehrung.

**Endpoints:**
```python
@router.post("/schedules")        # Agent-Schedule erstellen
@router.get("/schedules")         # Alle Schedules des Nutzers
@router.put("/schedules/{id}")    # Schedule aktualisieren (an/aus, Frequenz)
@router.delete("/schedules/{id}") # Schedule loeschen
@router.post("/schedules/{id}/run")  # Manuell ausfuehren (fuer Tests)
@router.get("/runs")              # Ausfuehrungs-Protokoll
@router.get("/runs/{id}")         # Details eines Runs
```

**Done-Kriterien:**
- [ ] CRUD fuer Schedules funktioniert
- [ ] Manueller Run startet den Agent sofort
- [ ] Run-Protokoll zeigt alle Ausfuehrungen mit Details
- [ ] Alle Endpoints JWT-geschuetzt
- [ ] Rate Limiting: Manueller Run max 5/hour

---

### Schritt 6: Frontend — AgentConfig Seite

**Datei:** `project/src/pages/AgentConfig.tsx` (NEU)
**Was:** Konfigurations-Seite fuer den Blog Agent mit Schedule-Management und Ausfuehrungs-Protokoll.

**Visuelles Design:**
```
┌─────────────────────────────────────────────────────────────┐
│ Blog Agent                                                   │
│                                                             │
│ ┌─ Konfiguration ────────────────────────────────────────┐ │
│ │ Unternehmen: [Dropdown]                                  │ │
│ │ Themenbereich: [Content Marketing, SEO, Online Strat...] │ │
│ │ Frequenz: [Woechentlich ▾]  Blogs pro Run: [2 ▾]        │ │
│ │ Sprache: [DE ▾]  Ton: [Professional ▾]                   │ │
│ │                                                          │ │
│ │ [Agent aktivieren]  [Jetzt ausfuehren]                   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ Letzte Ausfuehrungen ─────────────────────────────────┐ │
│ │ 28.04.2026 09:15 — ✅ 2 Blogs erstellt (45 Sek)        │ │
│ │   Topics: SEO Trends, KI im Marketing                   │ │
│ │   Blogs: "10 SEO Tipps" [Edit], "KI Tools Guide" [Edit] │ │
│ │                                                          │ │
│ │ 21.04.2026 09:15 — ✅ 2 Blogs erstellt (52 Sek)        │ │
│ │   Topics: Content Strategie, Blog Optimization          │ │
│ │   Blogs: "Content Plan 2026" [Edit], "Blog SEO" [Edit]  │ │
│ └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Done-Kriterien:**
- [ ] Schedule erstellen/bearbeiten/loeschen funktioniert
- [ ] "Jetzt ausfuehren" startet einen manuellen Run
- [ ] Protokoll zeigt alle bisherigen Runs mit Topics, Titeln und Blog-Links
- [ ] Status-Anzeige: Naechste geplante Ausfuehrung
- [ ] `npx tsc --noEmit` und `npm run build` fehlerfrei

---

### Schritt 7: Routing und Navigation

**Dateien:** `project/src/App.tsx`, Sidebar
**Was:** Neue Route `/agent` und Nav-Eintrag.

```tsx
<Route path="/agent" element={<AgentConfig />} />
// Sidebar: { name: 'Blog Agent', href: '/agent', icon: Bot }
```

**Done-Kriterien:**
- [ ] `/agent` Route geschuetzt (nur eingeloggte Nutzer)
- [ ] Sidebar zeigt "Blog Agent" mit Bot-Icon

---

## Datenbank-Aenderungen

### Neue Tabellen (manuell in Supabase)

Siehe **Schritt 1**.

---

## API-Aenderungen

### Neue Endpoints

| Method | Path | Beschreibung |
|--------|------|-------------|
| `POST` | `/api/agent/schedules` | Schedule erstellen |
| `GET` | `/api/agent/schedules` | Alle Schedules |
| `PUT` | `/api/agent/schedules/{id}` | Schedule aktualisieren |
| `DELETE` | `/api/agent/schedules/{id}` | Schedule loeschen |
| `POST` | `/api/agent/schedules/{id}/run` | Manueller Run |
| `GET` | `/api/agent/runs` | Ausfuehrungs-Protokoll |
| `GET` | `/api/agent/runs/{id}` | Run-Details |

---

## Neue Dependencies

```toml
"pydantic-ai>=0.1",    # Agent Framework
```

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Test 1: Agent manuell ausfuehren**
1. Agent Config oeffnen (`/agent`)
2. Neuen Schedule erstellen: Unternehmen waehlen, Themenbereich "SEO", 2 Blogs
3. "Jetzt ausfuehren" klicken
4. **Erwartet:** Agent recherchiert Topics, generiert Titel, erstellt 2 Blogs
5. **Erwartet:** Protokoll zeigt Run mit Details
6. **Erwartet:** 2 neue Blogs in "Meine Blogs" (Status: Entwurf)

**Test 2: Automatische Ausfuehrung**
1. Schedule erstellen mit Frequenz "Taeglich"
2. Warten bis `next_run_at` erreicht ist (oder Server neustarten)
3. **Erwartet:** Agent fuehrt automatisch aus, Protokoll zeigt neuen Run

**Test 3: Fehlerbehandlung**
1. Schedule erstellen mit ungueltigem Themenbereich (z.B. leer)
2. Manuell ausfuehren
3. **Erwartet:** Fehler wird im Protokoll angezeigt, kein Crash

### Validierung

```bash
cd backend && uv run ruff check . && uv run mypy app/ && uv run pytest -v
cd project && npx tsc --noEmit && npm run build
```

---

## Risiken & Offene Fragen

### Risiken
1. **PydanticAI Stabilitaet:** PydanticAI ist relativ neu (2025). *Mitigation:* Nur Kern-Features nutzen (Agent + Tools), keine experimentellen APIs.
2. **Scheduler-Zuverlaessigkeit:** Python-Scheduler laeuft nur wenn der Server laeuft. Bei Neustart werden faellige Runs nachgeholt, aber bei laengerem Ausfall gehen sie verloren. *Mitigation:* `next_run_at` in DB → bei Restart werden verpasste Runs nachgeholt.
3. **Agent-Kosten:** Jeder Run = 1 Tavily Search + 2-3 Claude Calls + N Blog-Generierungen. Bei taeglich 2 Blogs = ~$1-2/Tag. *Mitigation:* Usage Tracking (PRP #09) zaehlt Agent-Blogs gegen Plan-Limit.
4. **Agent-Qualitaet:** Autonome Titel-Auswahl koennte schlecht sein. *Mitigation:* Semi-autonom — Blogs als Entwuerfe, Nutzer prueft.

### Offene Fragen
1. Soll der Nutzer die generierten Titel vor der Blog-Erstellung sehen und genehmigen koennen? (Empfehlung: Spaeter — V1 ist semi-autonom mit Entwuerfen)
2. Max Runs pro Tag/Woche? (Empfehlung: Durch Plan-Limits abgedeckt)
3. Soll der Agent auch Bilder generieren? (Empfehlung: Nein — zu teuer fuer automatische Runs)
4. Scheduler: Python oder pg_cron? (Empfehlung: Python fuer V1, pg_cron oder AWS EventBridge fuer Production)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Supabase Tabellen (Manuell)
     ↓
Schritt 2: PydanticAI Agent + Tools (Backend)
     ↓
Schritt 3: Agent-Ausfuehrungs-Service (Backend)
     ↓
Schritt 4: Scheduler (Backend)
     ↓
Schritt 5: Agent Routes (Backend)
     ↓
Schritt 6: AgentConfig Seite (Frontend)
     ↓
Schritt 7: Routing + Navigation (Frontend)
```

**Reihenfolge fuer Claude Code:** 2 → 3 → 4 → 5 (Backend) → 1 (Manuell) → 6 → 7 (Frontend)

---

## Naechster Schritt

```bash
/02-execute docs/PRPs/PRP_15_AI_Blog_Agent.md
```
