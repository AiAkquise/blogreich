# PRP #17: API fuer Drittanbieter — REST API mit API-Keys, Rate Limiting und Swagger Docs

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P3 (Differenzierung — ermoeglicht Integrationen mit Zapier, Make, n8n und eigenen Apps)
**Geschaetzte Komplexitaet:** Medium
**Betroffene Dateien:** 7 (4 Backend + 2 Frontend + 1 Supabase)
**Abhaengigkeiten:** PRP #06 (Stabilitaet/Hardening — Rate Limiting Infrastruktur), PRP #09 (Stripe — Usage Tracking)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Aktuell kann Blogreich nur ueber das Frontend genutzt werden — ein Mensch sitzt vor dem Computer und klickt Buttons. Aber viele Nutzer wollen Blogreich **programmatisch** nutzen:

- Eine **Agentur** will Blogs automatisch aus einem Projektmanagement-Tool (Asana, Monday) erstellen
- Ein **Entwickler** will Blogreich in seine eigene App einbauen
- Ein **Automatisierer** will Blogreich mit **Zapier**, **Make** oder **n8n** verbinden (z.B. "Wenn ein neues Keyword in meiner Google Search Console auftaucht → erstelle automatisch einen Blog")
- Ein **KI-Tool** will Blogreich als MCP-Server oder Tool nutzen

Koala bietet eine API an ("Write an entire article with a single API call"), SEOwriting hat sogar einen WordPress MCP Server. Ohne API verlieren wir Power-User und Agenturen.

### Die Loesung

Wir bauen eine **oeffentliche REST API** mit:

1. **API-Keys** statt JWT-Tokens: Externe Systeme koennen sich nicht per Supabase einloggen, also brauchen sie eigene Schluessel
2. **Versionierte Endpoints:** `/api/v1/blogs/generate` — damit wir spaeter `/api/v2/` machen koennen ohne bestehende Integrationen zu brechen
3. **Rate Limiting pro API-Key:** Jeder Key hat ein eigenes Limit (abhaengig vom Plan)
4. **Swagger/OpenAPI Dokumentation:** Eine interaktive API-Dokumentation die Entwickler sofort nutzen koennen
5. **API-Key Management:** Nutzer koennen in den Settings API-Keys erstellen, benennen und widerrufen

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **REST API** | Eine standardisierte Schnittstelle fuer Software-Kommunikation. "REST" steht fuer "Representational State Transfer". Es nutzt HTTP-Methoden (GET, POST, PUT, DELETE) und URLs. Unsere interne API ist bereits eine REST API — wir machen sie jetzt oeffentlich und dokumentiert. |
| **API-Key** | Ein geheimer Schluessel (langer Zufallsstring wie `blr_sk_a1b2c3d4e5f6...`) den ein Nutzer generiert und in seinen Requests mitschickt. Wie ein Passwort fuer Maschinen. Im Gegensatz zu JWT-Tokens ist ein API-Key langlebig (muss nicht alle paar Minuten erneuert werden). |
| **Key Hash** | Wir speichern NICHT den API-Key direkt in der Datenbank — sondern nur seinen "Fingerabdruck" (Hash). So kann niemand die Keys lesen, selbst wenn die Datenbank gehackt wird. Wenn ein Request kommt, hashen wir den mitgeschickten Key und vergleichen mit dem gespeicherten Hash. |
| **Bearer Token** | Ein Authentifizierungs-Schema: Der API-Key wird im HTTP-Header mitgeschickt als `Authorization: Bearer blr_sk_a1b2c3d4...`. So weiss der Server, wer den Request macht. |
| **Swagger / OpenAPI** | Ein Standard fuer API-Dokumentation. FastAPI generiert automatisch eine interaktive Swagger-Seite unter `/docs` — dort koennen Entwickler die API direkt im Browser testen. Wir muessen nur die Endpoints sauber dokumentieren. |
| **Versionierung (v1)** | API-URLs enthalten eine Versionsnummer: `/api/v1/blogs/generate`. Wenn wir spaeter die API aendern, machen wir `/api/v2/...` — die alte Version funktioniert weiter. So brechen wir keine bestehenden Integrationen. |
| **Zapier / Make / n8n** | Automatisierungs-Plattformen: Der Nutzer verbindet verschiedene Apps miteinander ("Wenn X passiert, dann tue Y"). Z.B. "Wenn ein Formular ausgefuellt wird (Google Forms), erstelle einen Blog (Blogreich) und poste ihn (WordPress)". Dafuer braucht Blogreich eine API. |
| **Webhook (Ausgang)** | Eine Benachrichtigung die BLOGREICH an ein externes System schickt wenn etwas passiert. Z.B. "Blog wurde fertig generiert" → Blogreich ruft eine URL auf die der Nutzer angegeben hat. Unterschied zu Stripe-Webhooks (PRP #09): Dort schickt STRIPE an UNS, hier schicken WIR nach AUSSEN. |
| **Idempotency Key** | Ein eindeutiger Schluessel pro Request der sicherstellt, dass der gleiche Request nicht doppelt ausgefuehrt wird. Wenn ein Netzwerkfehler auftritt und der Client den Request wiederholt, erkennt der Server: "Das hab ich schon gemacht" und gibt das gespeicherte Ergebnis zurueck. |

---

## Ziel

Eine oeffentliche, versionierte REST API implementieren mit API-Key-Authentifizierung, plan-basiertem Rate Limiting, interaktiver Swagger-Dokumentation und einem Key-Management-UI in den Settings.

## User Story

Als Blogreich-Agentur-Nutzer
moechte ich Blogs per API-Call erstellen koennen
damit ich Blogreich in meine bestehenden Workflows (Zapier, n8n, eigene Tools) integrieren kann.

Als Entwickler
moechte ich eine gut dokumentierte API mit Swagger-Docs haben
damit ich schnell eine Integration bauen kann ohne Support kontaktieren zu muessen.

## Scope

### In Scope
- **API-Key-System:** Erstellen, benennen, widerrufen von API-Keys in den Settings
- **API-Key Auth Middleware:** Bearer Token Authentifizierung fuer `/api/v1/*` Endpoints
- **Versionierte Endpoints:** `/api/v1/blogs/generate`, `/api/v1/blogs/{id}`, `/api/v1/blogs/{id}/status`
- **Rate Limiting pro Key:** Plan-basiert (Starter: 100 Calls/Tag, Pro: 500, Agency: 2000)
- **Swagger/OpenAPI Docs:** Unter `/api/v1/docs` erreichbar
- **Key-Management UI:** In der Settings-Seite (erstellen, umbenennen, loeschen, letzte Nutzung)
- **Usage Tracking:** API-Calls zaehlen gegen das Plan-Limit (PRP #09)

### Out of Scope
- MCP Server (Model Context Protocol — spaeter)
- OAuth2 Flow (zu komplex fuer V1, API-Keys reichen)
- Webhooks (ausgehend — Blogreich benachrichtigt externe Systeme — spaeter)
- SDK / Client Libraries (Python SDK, JS SDK — spaeter)
- API Analytics Dashboard (welche Endpoints werden wie oft genutzt — spaeter)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/main.py` | v1-Router registrieren, separate Swagger-Instanz fuer `/api/v1/docs` | L27-44 |
| `backend/app/core/config.py` | API Rate Limits pro Plan | Ende |
| `project/src/pages/Settings.tsx` | Neuer Abschnitt "API-Keys" mit Key-Management | Gesamte Datei |
| `project/src/types/index.ts` | Neue Types: `ApiKey` | Ende |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `backend/app/api_v1/` | Neuer Feature-Slice fuer die oeffentliche API |
| `backend/app/api_v1/__init__.py` | Package-Init |
| `backend/app/api_v1/auth.py` | API-Key Authentifizierung Middleware |
| `backend/app/api_v1/routes.py` | Versionierte API-Endpoints |
| `backend/app/api_v1/schemas.py` | API-spezifische Pydantic-Schemas |
| `backend/app/api_v1/key_management.py` | API-Key CRUD (erstellen, hashen, validieren) |

---

## Technischer Plan

### Schritt 1: Supabase — api_keys Tabelle erstellen (MANUELL)

**SQL:**
```sql
CREATE TABLE IF NOT EXISTS api_keys (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL DEFAULT 'Default Key',
        -- Frei waehlbarer Name, z.B. "Zapier Integration", "n8n Workflow"
    key_prefix text NOT NULL,
        -- Erste 8 Zeichen des Keys fuer Anzeige: "blr_sk_a1b2..."
    key_hash text NOT NULL,
        -- SHA-256 Hash des vollstaendigen Keys
    rate_limit_daily int NOT NULL DEFAULT 100,
        -- Calls pro Tag (abhaengig vom Plan)
    calls_today int DEFAULT 0,
    calls_today_reset_at date DEFAULT CURRENT_DATE,
    last_used_at timestamptz DEFAULT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id
ON api_keys(user_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash
ON api_keys(key_hash);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys"
ON api_keys FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE api_keys IS 'API keys for third-party integrations. Keys are stored as SHA-256 hashes.';
```

**Schritt-fuer-Schritt fuer die Praktikantin:**
1. Supabase Dashboard → SQL Editor → New Query
2. SQL einfuegen → Run
3. **Erwartet:** "Success"
4. Pruefe: Table Editor → `api_keys` sichtbar

**Done-Kriterien:**
- [ ] Tabelle existiert mit `key_hash` und `key_prefix` Spalten
- [ ] Index auf `key_hash` fuer schnelle Lookups
- [ ] RLS aktiviert

---

### Schritt 2: Backend — API-Key Management Service

**Datei:** `backend/app/api_v1/key_management.py` (NEU)
**Was:** Funktionen zum Erstellen, Validieren und Widerrufen von API-Keys.

**Erklaerung fuer die Praktikantin:**
API-Keys funktionieren so:
1. **Erstellen:** Wir generieren einen zufaelligen Key (z.B. `blr_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`), zeigen ihn dem Nutzer EINMAL an, und speichern nur den Hash in der Datenbank.
2. **Validieren:** Wenn ein API-Call kommt, hashen wir den mitgeschickten Key und suchen den Hash in der Datenbank. Wenn gefunden → erlauben. Wenn nicht → 401 Unauthorized.
3. **Widerrufen:** Wir setzen `is_active = false` — der Key funktioniert sofort nicht mehr.

Warum Hashing? Weil wir den echten Key NICHT in der Datenbank haben wollen. Wenn jemand die Datenbank hackt, sieht er nur Hashes — nutzlos.

**Key-Format:** `blr_sk_` + 32 zufaellige Zeichen = `blr_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- `blr_` = Blogreich Praefix (damit man sofort erkennt woher der Key kommt)
- `sk_` = "Secret Key" (wie bei Stripe)
- 32 Zeichen = 192 Bit Entropie (praktisch unknackbar)

**Kernfunktionen:**
```python
import hashlib
import secrets

def generate_api_key() -> tuple[str, str, str]:
    """Generate a new API key.

    Returns (full_key, key_prefix, key_hash).
    The full_key is shown to the user ONCE and never stored.
    """
    random_part = secrets.token_hex(16)  # 32 hex chars
    full_key = f"blr_sk_{random_part}"
    key_prefix = full_key[:14] + "..."   # "blr_sk_a1b2c3..."
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    return full_key, key_prefix, key_hash

async def validate_api_key(key: str) -> dict | None:
    """Validate an API key and return the associated user data.

    Returns {user_id, key_id, rate_limit_daily, calls_today} or None.
    """
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    result = await db_query("api_keys", {"key_hash": key_hash, "is_active": True})
    if not result.data:
        return None
    key_data = result.data[0]

    # Daily Rate Limit Reset
    if str(key_data.get("calls_today_reset_at")) != str(date.today()):
        await db_update("api_keys", {
            "calls_today": 0,
            "calls_today_reset_at": str(date.today()),
        }, {"id": key_data["id"]})
        key_data["calls_today"] = 0

    # Rate Limit Check
    if key_data["calls_today"] >= key_data["rate_limit_daily"]:
        return None  # Oder raise spezifischen Error

    # Usage zaehlen
    await db_update("api_keys", {
        "calls_today": key_data["calls_today"] + 1,
        "last_used_at": datetime.utcnow().isoformat(),
    }, {"id": key_data["id"]})

    return key_data
```

**Done-Kriterien:**
- [ ] `generate_api_key()` gibt Key, Prefix und Hash zurueck
- [ ] `validate_api_key()` findet den Key per Hash-Lookup
- [ ] Rate Limit wird pro Tag gezaehlt und zurueckgesetzt
- [ ] Inaktive Keys werden abgelehnt
- [ ] `uv run mypy app/` fehlerfrei

---

### Schritt 3: Backend — API-Key Auth Middleware

**Datei:** `backend/app/api_v1/auth.py` (NEU)
**Was:** FastAPI Dependency die API-Keys aus dem `Authorization` Header extrahiert und validiert.

**Erklaerung fuer die Praktikantin:**
Unsere interne API nutzt JWT-Tokens (Supabase Login). Die oeffentliche API nutzt API-Keys. Beides kommt im gleichen Header (`Authorization: Bearer ...`), aber wir unterscheiden sie am Prefix:
- `Bearer ey...` = JWT-Token (Supabase)
- `Bearer blr_sk_...` = API-Key (Blogreich)

Die v1-Endpoints nutzen eine EIGENE Auth-Dependency statt `get_current_user_id()`:

```python
from fastapi import Header, HTTPException

async def get_api_user_id(
    authorization: str = Header(..., description="Bearer blr_sk_..."),
) -> str:
    """Extract and verify user_id from API key."""
    if not authorization.startswith("Bearer blr_sk_"):
        raise HTTPException(status_code=401, detail="Invalid API key format. Use: Bearer blr_sk_...")

    key = authorization.removeprefix("Bearer ")
    key_data = await validate_api_key(key)
    if not key_data:
        raise HTTPException(status_code=401, detail="Invalid or expired API key")

    return key_data["user_id"]
```

**Done-Kriterien:**
- [ ] `get_api_user_id()` extrahiert API-Key aus Header
- [ ] Ungueltige Keys → 401
- [ ] Rate Limit ueberschritten → 429
- [ ] Gibt `user_id` zurueck (damit alle bestehenden Queries weiterhin funktionieren)

---

### Schritt 4: Backend — Versionierte API-Endpoints

**Datei:** `backend/app/api_v1/routes.py` (NEU)
**Was:** Die oeffentlichen API-Endpoints unter `/api/v1/`.

**Erklaerung fuer die Praktikantin:**
Die v1-Endpoints sind DUENNERE Versionen unserer internen Endpoints. Sie nutzen die gleiche Blog-Pipeline (`generate_blog()`), aber mit API-Key Auth statt JWT und mit expliziterer Dokumentation.

**Endpoints:**

```python
router = APIRouter(prefix="/api/v1")

@router.post("/blogs/generate", summary="Generate a blog article")
async def api_generate_blog(
    body: ApiBlogGenerateRequest,
    user_id: str = Depends(get_api_user_id),
) -> ApiBlogGenerateResponse:
    """Generate a complete blog article with AI.

    The blog is created as a draft. Use GET /blogs/{id} to retrieve it.
    Generation takes 1-3 minutes. Poll /blogs/{id}/status for progress.
    """

@router.get("/blogs/{blog_id}", summary="Get a blog article")
async def api_get_blog(
    blog_id: str,
    user_id: str = Depends(get_api_user_id),
) -> ApiBlogResponse:
    """Retrieve a blog article with its content."""

@router.get("/blogs/{blog_id}/status", summary="Get generation status")
async def api_get_status(
    blog_id: str,
    user_id: str = Depends(get_api_user_id),
) -> ApiBlogStatusResponse:
    """Check the generation status of a blog."""

@router.get("/blogs", summary="List all blogs")
async def api_list_blogs(
    user_id: str = Depends(get_api_user_id),
    limit: int = 20,
    offset: int = 0,
) -> ApiListResponse:
    """List all blogs for the authenticated user."""
```

**Registrierung in main.py:**
```python
from app.api_v1.routes import router as api_v1_router
app.include_router(api_v1_router, tags=["API v1"])
```

**Done-Kriterien:**
- [ ] `POST /api/v1/blogs/generate` erstellt einen Blog via API-Key
- [ ] `GET /api/v1/blogs/{id}` gibt Blog-Content zurueck
- [ ] `GET /api/v1/blogs/{id}/status` gibt Generierungsstatus zurueck
- [ ] `GET /api/v1/blogs` listet alle Blogs
- [ ] Alle Endpoints nutzen API-Key Auth (nicht JWT)
- [ ] Swagger Docs unter `/docs` zeigen die v1-Endpoints mit Beschreibungen

---

### Schritt 5: Backend — API-Key CRUD Routes (fuer Settings)

**Datei:** Integration in bestehende Routes oder eigener Router
**Was:** Endpoints fuer Key-Verwaltung (erstellen, listen, loeschen). Diese nutzen JWT-Auth (der Nutzer verwaltet seine Keys im Frontend).

```python
# Unter /api/keys (JWT-Auth, NICHT API-Key-Auth)
@router.post("/keys", summary="Create a new API key")
@router.get("/keys", summary="List all API keys")
@router.delete("/keys/{key_id}", summary="Revoke an API key")
```

**Wichtig:** Der `POST /keys` Endpoint gibt den vollen Key EINMAL zurueck. Danach ist er nur noch als Prefix sichtbar (`blr_sk_a1b2c3...`).

**Done-Kriterien:**
- [ ] `POST /api/keys` erstellt Key und gibt ihn einmalig zurueck
- [ ] `GET /api/keys` listet alle Keys (nur Prefix, NICHT den vollen Key)
- [ ] `DELETE /api/keys/{id}` deaktiviert den Key
- [ ] JWT-Auth (Nutzer muss eingeloggt sein)

---

### Schritt 6: Frontend — API-Key Management in Settings

**Datei:** `project/src/pages/Settings.tsx`
**Was:** Neuer Abschnitt "API-Keys" wo Nutzer ihre Keys verwalten koennen.

**Visuelles Design:**
```
┌──────────────────────────────────────────────────┐
│ 🔑 API-Keys                                      │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ "Zapier Integration"                          │ │
│ │ blr_sk_a1b2c3... │ Erstellt: 28.04.2026     │ │
│ │ Letzte Nutzung: vor 2 Stunden               │ │
│ │ Calls heute: 42/500          [Widerrufen]    │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ [+ Neuen API-Key erstellen]                      │
│                                                  │
│ ⚠️ Dein API Key: blr_sk_a1b2c3d4e5f6g7h8...     │
│ Kopiere ihn jetzt — er wird nur einmal angezeigt!│
│ [Kopieren]                                       │
│                                                  │
│ 📖 API-Dokumentation: /api/v1/docs              │
└──────────────────────────────────────────────────┘
```

**Flow:**
1. Nutzer klickt "+ Neuen API-Key erstellen"
2. Dialog: Name eingeben (z.B. "Zapier Integration")
3. Backend erstellt Key und gibt ihn zurueck
4. **WICHTIG:** Key wird einmalig angezeigt mit "Kopieren" Button und Warnung
5. Nach Schliessen des Dialogs: Key ist nur noch als Prefix sichtbar

**Done-Kriterien:**
- [ ] Key-Liste zeigt alle aktiven Keys (Name, Prefix, Erstelldatum, letzte Nutzung)
- [ ] Neuer Key wird einmalig vollstaendig angezeigt mit Copy-Button
- [ ] Warnung: "Dieser Key wird nur einmal angezeigt"
- [ ] "Widerrufen" Button deaktiviert den Key sofort
- [ ] Link zur API-Dokumentation (`/api/v1/docs`)
- [ ] `npx tsc --noEmit` fehlerfrei

---

### Schritt 7: Backend — Swagger-Dokumentation aufhuebschen

**Datei:** `backend/app/main.py` und `backend/app/api_v1/routes.py`
**Was:** Die automatisch generierte Swagger-Dokumentation mit Beschreibungen, Beispielen und Auth-Infos anreichern.

**Erklaerung fuer die Praktikantin:**
FastAPI generiert automatisch Swagger-Docs unter `/docs`. Aber ohne zusaetzliche Beschreibungen sind die Docs karg. Wir fuegen hinzu:
- Beschreibung der API auf der Hauptseite
- Beispiel-Requests und -Responses fuer jeden Endpoint
- Authentifizierungs-Anleitung
- Error-Codes Erklaerung

**FastAPI App-Beschreibung:**
```python
app = FastAPI(
    title="Blogreich API",
    version="1.0.0",
    description="""
## Blogreich Public API

Generiere SEO-optimierte Blog-Artikel mit KI-gesteuerter Unternehmens-Personalisierung.

### Authentifizierung

Alle Endpoints erfordern einen API-Key im `Authorization` Header:

```
Authorization: Bearer blr_sk_dein_api_key_hier
```

API-Keys koennen im Blogreich Dashboard unter Einstellungen → API-Keys erstellt werden.

### Rate Limits

| Plan         | Calls/Tag |
|:---:|:---:|
| Starter      | 100       |
| Professional | 500       |
| Agency       | 2000      |
""",
)
```

**Done-Kriterien:**
- [ ] `/docs` zeigt beschriebene API mit Auth-Anleitung
- [ ] Jeder Endpoint hat `summary` und `description`
- [ ] Beispiel-Responses sind sichtbar
- [ ] Rate Limit Info ist dokumentiert

---

## Datenbank-Aenderungen

### Neue Tabelle (manuell in Supabase)

Siehe **Schritt 1**.

---

## API-Aenderungen

### Neue oeffentliche Endpoints (API-Key Auth)

| Method | Path | Beschreibung |
|--------|------|-------------|
| `POST` | `/api/v1/blogs/generate` | Blog generieren |
| `GET` | `/api/v1/blogs/{id}` | Blog abrufen |
| `GET` | `/api/v1/blogs/{id}/status` | Generierungs-Status |
| `GET` | `/api/v1/blogs` | Alle Blogs listen |

### Neue interne Endpoints (JWT Auth)

| Method | Path | Beschreibung |
|--------|------|-------------|
| `POST` | `/api/keys` | API-Key erstellen |
| `GET` | `/api/keys` | Alle Keys listen |
| `DELETE` | `/api/keys/{id}` | Key widerrufen |

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Test 1: API-Key erstellen**
1. Settings → API-Keys → "Neuen Key erstellen"
2. Name: "Test Key"
3. **Erwartet:** Key wird einmalig angezeigt (z.B. `blr_sk_a1b2c3d4...`)
4. Key kopieren!

**Test 2: API-Call mit Key (per curl)**
```bash
curl -X POST http://localhost:8123/api/v1/blogs/generate \
  -H "Authorization: Bearer blr_sk_DEIN_KEY_HIER" \
  -H "Content-Type: application/json" \
  -d '{"title": "API Test Blog", "language": "de", "tone": "professional"}'
```
**Erwartet:** `{"blog_id": "uuid...", "status": "started"}`

**Test 3: API-Call ohne Key**
```bash
curl -X GET http://localhost:8123/api/v1/blogs
```
**Erwartet:** `{"detail": "Invalid API key format..."}`

**Test 4: Rate Limit**
1. API-Call 101 Mal hintereinander ausfuehren (Starter Limit: 100/Tag)
2. **Erwartet:** Ab Call 101: HTTP 429 "Rate limit exceeded"

**Test 5: Key widerrufen**
1. Settings → API-Keys → "Widerrufen"
2. API-Call mit dem widerrufenen Key
3. **Erwartet:** HTTP 401 "Invalid or expired API key"

**Test 6: Swagger Docs**
1. Oeffne `http://localhost:8123/docs`
2. **Erwartet:** Interaktive API-Dokumentation mit allen v1-Endpoints

### Validierung

```bash
cd backend && uv run ruff check . && uv run mypy app/ && uv run pytest -v
cd project && npx tsc --noEmit && npm run build
```

---

## Risiken & Offene Fragen

### Risiken
1. **Key-Leak:** Nutzer koennte seinen API-Key versehentlich in oeffentlichem Code committen. *Mitigation:* Key-Prefix `blr_sk_` ermoeglicht automatische Erkennung durch GitHub Secret Scanning.
2. **Missbrauch:** Ein Nutzer koennte seinen Key weitergeben. *Mitigation:* Usage Tracking zeigt ungewoehnliche Nutzung; Key kann jederzeit widerrufen werden.
3. **Performance:** Hash-Lookup bei jedem Request. *Mitigation:* Index auf `key_hash` Spalte; bei Bedarf In-Memory Cache mit TTL.
4. **Backward Compatibility:** Wenn wir v2 machen, muss v1 weiter funktionieren. *Mitigation:* Separate Router, klare Versionierung von Anfang an.

### Offene Fragen
1. Max API-Keys pro Nutzer? (Empfehlung: 5 — verhindert Key-Proliferation)
2. Soll die API auch Bilder generieren koennen? (Empfehlung: Spaeter — V1 nur Blogs)
3. API-Key-Rotation (automatisches Ablaufdatum)? (Empfehlung: Nein in V1 — Keys laufen nicht ab, nur manuelles Widerrufen)
4. Zapier/Make App bauen? (Empfehlung: Spaeter — erst API, dann offizielle App-Listings)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Supabase Tabelle (Manuell)
     ↓
Schritt 2: Key Management Service (Backend)
     ↓
Schritt 3: API-Key Auth Middleware (Backend)
     ↓
Schritt 4: v1 API-Endpoints (Backend)
     ↓
Schritt 5: Key CRUD Routes (Backend)
     ↓
Schritt 6: Settings UI (Frontend)
     ↓
Schritt 7: Swagger Docs (Backend)
```

**Reihenfolge fuer Claude Code:** 2 → 3 → 4 → 5 → 7 (Backend) → 1 (Manuell) → 6 (Frontend)

---

## Naechster Schritt

```bash
/02-execute docs/PRPs/PRP_17_API_Drittanbieter.md
```
