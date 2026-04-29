# PRP #06: Stabilitaet & Hardening — Rate Limiting, Error Monitoring, Auth-Fixes

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P1 (Launch-Voraussetzung — ohne das kein Production-Betrieb)
**Geschaetzte Komplexitaet:** Medium
**Betroffene Dateien:** 6 (5 Backend + 1 Frontend)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Blogreich funktioniert aktuell lokal — aber es ist NICHT bereit fuer echte Nutzer. Warum? Weil es keine Schutzmechanismen gibt:

1. **Kein Rate Limiting:** Jeder kann unsere API unbegrenzt aufrufen. Ein boesartiger Nutzer (oder ein fehlerhaftes Script) koennte tausende Blog-Generierungen starten und unsere Anthropic-Rechnung in die Hoehe treiben. Oder ein DDOS-Angriff (viele Anfragen gleichzeitig) koennte den Server zum Absturz bringen.

2. **Kein Error Monitoring:** Wenn etwas schiefgeht, erfahren wir es erst wenn ein Nutzer sich beschwert. Wir sehen nicht, welche Fehler auftreten, wie oft, und wo genau im Code. Das ist wie ein Auto ohne Armaturenbrett — man faehrt blind.

3. **JWKS-Cache ohne TTL:** Unser Authentifizierungs-System speichert die Supabase-Schluessel einmal und vergisst nie zu aktualisieren. Wenn Supabase seine Schluessel rotiert (was regelmaessig passiert), koennen sich Nutzer nicht mehr einloggen — bis wir den Server neu starten.

4. **Keine Request Deduplication:** Wenn ein Nutzer mehrmals schnell auf "Blog generieren" klickt, starten mehrere parallele Generierungen fuer den gleichen Blog. Das kostet unnoetig Geld und kann zu Datenkonflikten fuehren.

### Die Loesung

Wir fuegen vier Sicherheits- und Stabilitaets-Layer hinzu:
1. **slowapi** — begrenzt die Anzahl API-Aufrufe pro Nutzer pro Zeitraum
2. **Sentry** — ueberwacht automatisch alle Fehler und schickt Benachrichtigungen
3. **JWKS TTL** — aktualisiert die Auth-Schluessel alle 60 Minuten
4. **Request Dedup** — verhindert doppelte Blog-Generierungen

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **Rate Limiting** | Begrenzung der Anfragen pro Nutzer. Z.B. "Maximal 10 Blog-Generierungen pro Stunde". Wie ein Tuerverschluss in einem Club — wenn zu viele Leute reinkommen, wird der Einlass gestoppt. |
| **DDOS-Angriff** | "Distributed Denial of Service" — ein Angriff, bei dem tausende Computer gleichzeitig Anfragen an einen Server schicken, um ihn zu ueberlasten. Rate Limiting schuetzt davor. |
| **slowapi** | Eine Python-Library, die Rate Limiting fuer FastAPI implementiert. Sie zaehlt, wie viele Anfragen ein Nutzer in einem bestimmten Zeitraum macht, und blockiert weitere wenn das Limit erreicht ist. |
| **Sentry** | Ein Cloud-Dienst fuer Error Monitoring. Wenn in unserer App ein Fehler passiert, schickt Sentry automatisch eine Benachrichtigung (per E-Mail oder Slack) mit allen Details: Was ist passiert, wo im Code, welcher Nutzer war betroffen, wie oft tritt es auf. |
| **DSN** | "Data Source Name" — eine URL, die Sentry identifiziert, an welches Projekt die Fehlermeldungen geschickt werden. Sieht aus wie: `https://abc123@sentry.io/456`. |
| **Error Boundary** | Eine React-Komponente, die Fehler im Frontend auffaengt und eine benutzerfreundliche Fehlermeldung anzeigt, statt dass die ganze Seite weiss wird. Wie ein Sicherheitsnetz im Zirkus. |
| **JWKS** | "JSON Web Key Set" — eine Liste von kryptografischen Schluesseln, die Supabase bereitstellt. Wir nutzen sie, um JWT-Tokens (Login-Tokens) zu verifizieren. |
| **TTL** | "Time To Live" — wie lange ein gespeicherter Wert gueltig ist. Danach wird er neu geladen. Wie ein Haltbarkeitsdatum auf Lebensmitteln. |
| **Cache Invalidation** | Das gezielte "Vergessen" eines gespeicherten Werts, damit er beim naechsten Zugriff neu geladen wird. "Es gibt nur zwei schwere Probleme in der Informatik: Cache Invalidation und Namensgebung." |
| **Deduplication / Dedup** | Verhindern, dass die gleiche Aktion zweimal ausgefuehrt wird. Wie ein Briefkasten, der keine Duplikat-Briefe annimmt. |
| **asyncio Lock** | Ein Python-Mechanismus, der sicherstellt, dass nur ein Task gleichzeitig einen bestimmten Code-Abschnitt ausfuehren kann. Wie eine Einzel-Toilettenkabine — wenn jemand drin ist, muss der naechste warten. |
| **Middleware** | Code, der JEDE API-Anfrage durchlaeuft, bevor sie den eigentlichen Endpoint erreicht. Wie die Sicherheitskontrolle am Flughafen — jeder muss durch, bevor er ins Flugzeug steigt. |

---

## Ziel

Die Blogreich-API fuer den Produktionsbetrieb absichern: Rate Limiting gegen Missbrauch und Ueberlastung, Error Monitoring fuer proaktive Fehlerbehebung, JWKS-Cache mit TTL fuer zuverlaessige Authentifizierung, und Request Deduplication gegen doppelte Blog-Generierungen.

## User Story

Als Blogreich-Betreiber
moechte ich, dass die Plattform sich selbst vor Missbrauch schuetzt und mich automatisch ueber Fehler informiert
damit ich ruhig schlafen kann waehrend echte Nutzer die Plattform nutzen.

## Scope

### In Scope
- **Rate Limiting** mit `slowapi` (pro Nutzer, pro Endpoint, konfigurierbar)
- **Error Monitoring** mit `sentry-sdk[fastapi]` (Backend) und `@sentry/react` (Frontend)
- **JWKS-Cache TTL** (60 Minuten, dann automatisch neu laden)
- **Request Deduplication** fuer Blog-Generierung (kein doppelter Start)
- **Neue ENV-Variablen:** `SENTRY_DSN`, `SENTRY_ENVIRONMENT`

### Out of Scope
- API-Key basiertes Rate Limiting (kommt in PRP #17 mit API fuer Drittanbieter)
- IP-basiertes Blocking (kommt mit AWS WAF beim Hosting)
- Uptime Monitoring (kommt mit AWS CloudWatch)
- Usage-basierte Abrechnung (kommt in PRP #09 Stripe)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/main.py` | Sentry Init, slowapi Middleware registrieren, Rate Limit Error Handler | Gesamte Datei (57 Zeilen) |
| `backend/app/core/auth.py` | JWKS-Cache mit TTL (time-based Expiry) | L14-31 (`_jwks_cache`, `_get_jwks`) |
| `backend/app/core/config.py` | Neue Settings: `sentry_dsn`, `rate_limit_*` | Ende der Datei |
| `backend/app/blogs/routes.py` | Rate Limiting Decorator auf Endpoints, Request Dedup auf `/generate` | L17-36 |
| `backend/pyproject.toml` | Neue Dependencies: `slowapi`, `sentry-sdk[fastapi]` | L6-16 |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `backend/app/core/rate_limit.py` | Zentrale Rate-Limiter-Konfiguration und Hilfsfunktionen |
| `project/src/components/ErrorBoundary.tsx` | React Error Boundary fuer Frontend-Fehlerbehandlung |

---

## Technischer Plan

### Schritt 1: Dependencies installieren

**Datei:** `backend/pyproject.toml`
**Was:** `slowapi` und `sentry-sdk[fastapi]` als Dependencies hinzufuegen.

**Erklaerung fuer die Praktikantin:**
Wir installieren zwei neue "Pakete" (Libraries):
- `slowapi` — zaehlt API-Aufrufe und blockiert bei Ueberschreitung
- `sentry-sdk` — schickt Fehler automatisch an den Sentry-Cloud-Dienst

**Manueller Schritt (falls die Praktikantin es ausfuehrt):**
1. Oeffne `backend/pyproject.toml` in einem Texteditor
2. Fuege in der `dependencies`-Liste hinzu (nach `python-jose`):
   ```
   "slowapi>=0.1.9",
   "sentry-sdk[fastapi]>=2.0",
   ```
3. Speichern
4. Im Terminal: `cd backend && uv sync`
5. **Pruefe:** `uv run python -c "import slowapi; import sentry_sdk; print('OK')"` sollte "OK" ausgeben

**Done-Kriterien:**
- [ ] `slowapi` und `sentry-sdk[fastapi]` in `pyproject.toml`
- [ ] `uv sync` laeuft ohne Fehler
- [ ] Beide Libraries sind importierbar

---

### Schritt 2: Konfiguration erweitern

**Datei:** `backend/app/core/config.py`
**Was:** Neue Einstellungen fuer Sentry und Rate Limiting.

**Erklaerung fuer die Praktikantin:**
Wir fuegen neue Konfigurationswerte hinzu. Diese werden aus der `.env`-Datei gelesen. So koennen wir die Werte aendern, ohne den Code zu aendern — z.B. unterschiedliche Limits fuer Entwicklung und Produktion.

**Neue Settings:**
```python
# Sentry
sentry_dsn: str = ""  # Leer = Sentry deaktiviert (fuer lokale Entwicklung)
sentry_environment: str = "development"
sentry_traces_sample_rate: float = 0.1  # 10% der Requests tracken

# Rate Limiting
rate_limit_generate: str = "10/hour"    # Blog-Generierung: max 10 pro Stunde
rate_limit_outline: str = "30/hour"     # Outline-Generierung: max 30 pro Stunde
rate_limit_analyze: str = "5/hour"      # Company-Analyse: max 5 pro Stunde
rate_limit_default: str = "60/minute"   # Alle anderen Endpoints
```

**Neue ENV-Variablen in `.env`:**
```
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
```

**Manueller Schritt fuer die Praktikantin — Sentry Account anlegen:**
1. Gehe zu https://sentry.io und erstelle einen kostenlosen Account
2. Erstelle ein neues Projekt: Waehle "FastAPI" als Plattform
3. Kopiere die DSN (sieht aus wie `https://abc123@o456.ingest.sentry.io/789`)
4. Fuege sie in die `.env`-Datei ein: `SENTRY_DSN=https://abc123@...`
5. Erstelle ein zweites Projekt fuer das Frontend: Waehle "React"
6. Notiere die Frontend-DSN separat

**Done-Kriterien:**
- [ ] Neue Settings in `config.py` definiert
- [ ] Alle Settings haben sinnvolle Defaults (Sentry deaktiviert wenn leer)
- [ ] `uv run mypy app/` fehlerfrei

---

### Schritt 3: Rate Limiting Setup

**Datei:** `backend/app/core/rate_limit.py` (NEU)
**Was:** Zentraler Rate Limiter mit slowapi. Die Konfiguration wird aus den Settings geladen.

**Erklaerung fuer die Praktikantin:**
`slowapi` funktioniert so: Jede API-Anfrage bekommt einen "Schluessel" (normalerweise die User-ID oder IP-Adresse). Der Limiter zaehlt, wie viele Anfragen mit diesem Schluessel in einem Zeitraum kamen. Wenn das Limit erreicht ist, antwortet die API mit Fehler 429 ("Too Many Requests") statt die Anfrage auszufuehren.

Wir nutzen die **User-ID aus dem JWT-Token** als Schluessel — so hat jeder eingeloggte Nutzer sein eigenes Limit.

**Implementierung:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

def _get_user_id_or_ip(request: Request) -> str:
    """Extract user ID from JWT for rate limiting, fallback to IP."""
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        # Schnelle User-ID Extraktion ohne volle Verifikation
        # (die volle Verifikation macht der Endpoint selbst)
        try:
            from jose import jwt
            token = auth.removeprefix("Bearer ")
            payload = jwt.get_unverified_claims(token)
            return payload.get("sub", get_remote_address(request))
        except Exception:
            pass
    return get_remote_address(request)

limiter = Limiter(key_func=_get_user_id_or_ip)
```

**Done-Kriterien:**
- [ ] `limiter` Instanz existiert und nutzt User-ID als Key
- [ ] Fallback auf IP-Adresse wenn kein JWT vorhanden
- [ ] `uv run mypy app/` fehlerfrei

---

### Schritt 4: Sentry und Rate Limiting in main.py integrieren

**Datei:** `backend/app/main.py`
**Was:** Sentry SDK initialisieren und slowapi Middleware registrieren.

**Erklaerung fuer die Praktikantin:**
Die `main.py` ist der "Eingang" unserer App — hier wird alles gestartet. Wir fuegen zwei Dinge hinzu:
1. **Sentry Init:** Beim App-Start wird Sentry konfiguriert. Ab dann werden alle Fehler automatisch erfasst.
2. **slowapi State + Error Handler:** Die Rate-Limiting-Middleware wird registriert. Wenn jemand sein Limit ueberschreitet, bekommt er eine saubere Fehlermeldung.

**Aenderungen:**
```python
import sentry_sdk
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.rate_limit import limiter

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    setup_logging(settings.log_level)

    # Sentry initialisieren (nur wenn DSN konfiguriert)
    if settings.sentry_dsn:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.sentry_environment,
            traces_sample_rate=settings.sentry_traces_sample_rate,
            send_default_pii=False,  # Keine persoenlichen Daten senden
        )
    yield

# Nach app = FastAPI(...):
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

**Done-Kriterien:**
- [ ] Sentry wird initialisiert wenn `SENTRY_DSN` gesetzt
- [ ] Sentry wird NICHT initialisiert wenn `SENTRY_DSN` leer (lokale Entwicklung)
- [ ] Rate Limit Exceeded gibt HTTP 429 mit verstaendlicher Fehlermeldung zurueck
- [ ] App startet ohne Fehler: `uv run uvicorn app.main:app --port 8123`

---

### Schritt 5: Rate Limiting auf Endpoints anwenden

**Dateien:** `backend/app/blogs/routes.py`, `backend/app/companies/routes.py`, `backend/app/images/routes.py`, `backend/app/keywords/routes.py`
**Was:** Rate-Limiting-Decorators auf die teuersten Endpoints setzen.

**Erklaerung fuer die Praktikantin:**
Nicht jeder Endpoint braucht das gleiche Limit. Blog-Generierung ist teuer (kostet Geld fuer Claude + FLUX.2), also limitieren wir auf 10/Stunde. Status-Abfragen sind billig, also 60/Minute.

**Beispiel fuer blogs/routes.py:**
```python
from app.core.rate_limit import limiter

@router.post("/generate", response_model=BlogGenerateResponse)
@limiter.limit("10/hour")
async def start_blog_generation(
    request: Request,            # NEU: Request-Objekt fuer slowapi
    body: BlogGenerateRequest,   # Umbenannt von 'request' zu 'body'
    user_id: str = Depends(get_current_user_id),
) -> BlogGenerateResponse:
```

**Limits pro Endpoint:**
| Endpoint | Limit | Begruendung |
|----------|-------|-------------|
| `POST /api/blogs/generate` | 10/hour | Teuer (Claude + FLUX.2) |
| `POST /api/blogs/outline` | 30/hour | Mittel (1 Claude Call) |
| `GET /api/blogs/*/status` | 60/minute | Billig (nur DB-Read) |
| `POST /api/companies/analyze` | 5/hour | Teuer (Tavily + Claude) |
| `POST /api/images/generate` | 10/hour | Teuer (FLUX.2) |
| `POST /api/keywords/research` | 10/hour | Mittel (Claude) |

**Done-Kriterien:**
- [ ] Alle teuren Endpoints haben Rate Limiting
- [ ] `GET`-Endpoints (Status, Health) haben grosszuegigere Limits
- [ ] HTTP 429 Antwort wenn Limit ueberschritten
- [ ] Rate Limits sind ueber Settings konfigurierbar (nicht hardcoded)
- [ ] `uv run mypy app/` fehlerfrei

---

### Schritt 6: JWKS-Cache mit TTL

**Datei:** `backend/app/core/auth.py`
**Was:** Den JWKS-Cache von "einmal laden, nie aktualisieren" auf "alle 60 Minuten neu laden" umstellen.

**Erklaerung fuer die Praktikantin:**
Aktuell (Zeile 14-31) wird der JWKS einmal geladen und fuer immer gecacht. Das ist problematisch:
- Supabase rotiert seine Schluessel regelmaessig
- Wenn ein Schluessel rotiert wird und unser Cache den alten Schluessel hat, schlaegt die JWT-Verifikation fehl
- Alle Nutzer bekommen dann "Invalid token" Fehler bis der Server neugestartet wird

Die Loesung: Wir speichern neben dem JWKS auch den Zeitpunkt, wann er geladen wurde. Wenn 60 Minuten vergangen sind, laden wir ihn neu.

**Aktuelle Logik (zu ersetzen):**
```python
_jwks_cache: dict[str, Any] | None = None

async def _get_jwks() -> dict[str, Any]:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    # ... fetch ...
```

**Neue Logik:**
```python
import time

_jwks_cache: dict[str, Any] | None = None
_jwks_cache_time: float = 0.0
_JWKS_TTL_SECONDS: float = 3600.0  # 60 Minuten

async def _get_jwks() -> dict[str, Any]:
    global _jwks_cache, _jwks_cache_time
    now = time.monotonic()

    if _jwks_cache is not None and (now - _jwks_cache_time) < _JWKS_TTL_SECONDS:
        return _jwks_cache

    # Cache ist leer oder abgelaufen → neu laden
    settings = get_settings()
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_time = now
        logger.info("auth.jwks_refreshed", url=jwks_url)
        return _jwks_cache
```

**Done-Kriterien:**
- [ ] JWKS-Cache wird nach 60 Minuten automatisch neu geladen
- [ ] `time.monotonic()` wird statt `time.time()` verwendet (immun gegen Systemzeit-Aenderungen)
- [ ] Wenn der Refresh fehlschlaegt, wird der alte Cache weiter verwendet (graceful degradation)
- [ ] Log-Eintrag `auth.jwks_refreshed` bei jedem Neuladen

---

### Schritt 7: Request Deduplication fuer Blog-Generierung

**Datei:** `backend/app/blogs/routes.py`
**Was:** Verhindern, dass fuer denselben Blog mehrere Generierungs-Tasks parallel laufen.

**Erklaerung fuer die Praktikantin:**
Wenn ein Nutzer zweimal schnell auf "Blog generieren" klickt, starten aktuell zwei parallele Generierungen fuer denselben Blog. Das kostet doppelt so viel Geld und kann dazu fuehren, dass beide Generierungen gleichzeitig in die Datenbank schreiben und sich gegenseitig ueberschreiben.

Die Loesung: Wir merken uns, welche Blog-IDs gerade generiert werden. Wenn eine zweite Anfrage fuer dieselbe Blog-ID kommt, lehnen wir sie ab mit "Blog wird bereits generiert".

**Implementierung:**
```python
# Am Anfang der Datei:
_generating_blogs: set[str] = set()

@router.post("/generate", response_model=BlogGenerateResponse)
@limiter.limit("10/hour")
async def start_blog_generation(
    request: Request,
    body: BlogGenerateRequest,
    user_id: str = Depends(get_current_user_id),
) -> BlogGenerateResponse:
    if body.blog_id in _generating_blogs:
        raise HTTPException(
            status_code=409,
            detail="Blog wird bereits generiert"
        )
    _generating_blogs.add(body.blog_id)

    async def _run_and_cleanup() -> None:
        try:
            await generate_blog(body, user_id)
        finally:
            _generating_blogs.discard(body.blog_id)

    asyncio.create_task(_run_and_cleanup())
    return BlogGenerateResponse()
```

**Done-Kriterien:**
- [ ] Zweiter Generate-Aufruf fuer denselben `blog_id` gibt HTTP 409 zurueck
- [ ] Nach Abschluss (Erfolg oder Fehler) wird die `blog_id` aus dem Set entfernt
- [ ] Verschiedene Blog-IDs koennen parallel generiert werden
- [ ] Set wird korrekt aufgeraeumt (kein Memory Leak)

---

### Schritt 8: Frontend Error Boundary

**Datei:** `project/src/components/ErrorBoundary.tsx` (NEU)
**Was:** Eine React Error Boundary Komponente, die unerwartete Frontend-Fehler auffaengt und eine benutzerfreundliche Fehlermeldung zeigt.

**Erklaerung fuer die Praktikantin:**
Wenn im Frontend ein JavaScript-Fehler auftritt (z.B. ein API-Response hat ein unerwartetes Format), wird die ganze Seite weiss. Das ist eine schlechte Nutzererfahrung. Eine Error Boundary faengt den Fehler ab und zeigt stattdessen: "Etwas ist schiefgelaufen. Bitte lade die Seite neu." — mit einem Button zum Neuladen.

Optional kann die Error Boundary den Fehler auch an Sentry schicken (wenn `@sentry/react` konfiguriert ist). Das ist fuer spaeter — in V1 reicht die einfache Fehlermeldung.

**Implementierung (einfache Version ohne Sentry):**
```typescript
import { Component, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-lg font-semibold">Etwas ist schiefgelaufen</h2>
              <p className="text-sm text-surface-500">
                Ein unerwarteter Fehler ist aufgetreten.
              </p>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" />
                Seite neu laden
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Integration in App (in der Root-Komponente, z.B. `App.tsx`):**
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Um den Router / die gesamte App wrappen:
<ErrorBoundary>
  <RouterProvider router={router} />
</ErrorBoundary>
```

**Done-Kriterien:**
- [ ] Error Boundary faengt Rendering-Fehler im Frontend ab
- [ ] Benutzerfreundliche Fehlermeldung mit "Seite neu laden" Button
- [ ] Folgt dem bestehenden Tailwind/shadcn Design
- [ ] App.tsx/Root-Komponente ist mit ErrorBoundary gewrapped
- [ ] `npx tsc --noEmit` fehlerfrei

---

## Datenbank-Aenderungen

**Keine.**

---

## API-Aenderungen

### Geaenderte Endpoints

| Method | Path | Aenderung |
|--------|------|----------|
| Alle | Alle | Rate Limiting hinzugefuegt (HTTP 429 bei Ueberschreitung) |
| `POST` | `/api/blogs/generate` | HTTP 409 bei doppeltem Aufruf fuer gleiche blog_id |

### Neue Error-Responses

| HTTP Code | Bedeutung | Wann |
|:---------:|-----------|------|
| 429 | Too Many Requests | Rate Limit ueberschritten |
| 409 | Conflict | Blog wird bereits generiert |

---

## Frontend-Aenderungen

### Neue Komponente
- `project/src/components/ErrorBoundary.tsx` — Fehlerbehandlung

### Geaenderte Datei
- Root-Komponente (App.tsx o.ae.) — ErrorBoundary wrappen

---

## Neue ENV-Variablen

```env
# In backend/.env oder root .env hinzufuegen:
SENTRY_DSN=             # Leer lassen fuer lokale Entwicklung
SENTRY_ENVIRONMENT=development
```

**Manueller Schritt fuer die Praktikantin:**
1. Oeffne die `.env`-Datei im Projekt-Root
2. Fuege die zwei Zeilen oben hinzu (mit leerem SENTRY_DSN)
3. Speichern
4. Spaeter, wenn Sentry eingerichtet ist, die DSN eintragen

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Test 1: Rate Limiting**
1. Backend starten: `cd backend && uv run uvicorn app.main:app --reload --port 8123`
2. Im Browser/Postman: Den gleichen API-Call 15 Mal schnell hintereinander ausfuehren
3. **Erwartet:** Ab dem 11. Aufruf kommt HTTP 429 "Rate limit exceeded"

**Test 2: Request Deduplication**
1. Einen Blog erstellen (Titel eingeben, Generieren klicken)
2. SOFORT nochmal auf "Generieren" klicken (schnell!)
3. **Erwartet:** Der zweite Klick gibt eine Fehlermeldung (409) oder wird ignoriert

**Test 3: JWKS TTL**
1. Backend starten, einloggen (Blog erstellen oder so)
2. In den Logs pruefen: `auth.jwks_refreshed` sollte erscheinen
3. 61 Minuten warten (oder TTL zum Testen auf 60 Sekunden setzen)
4. Erneut eine API-Anfrage machen
5. **Erwartet:** In den Logs erscheint erneut `auth.jwks_refreshed`

**Test 4: Error Boundary**
1. Frontend starten
2. In der Browser-Konsole: `window.__TEST_ERROR = true` (oder einen kuenstlichen Fehler einbauen)
3. **Erwartet:** Statt weisser Seite erscheint "Etwas ist schiefgelaufen" mit Neuladen-Button

**Test 5: Sentry (optional, nur wenn DSN konfiguriert)**
1. `SENTRY_DSN` in `.env` setzen
2. Backend starten
3. Einen Fehler provozieren (z.B. ungueltige blog_id an `/generate` senden)
4. **Erwartet:** Fehler erscheint im Sentry Dashboard (https://sentry.io)

### Validierung

```bash
# Backend
cd backend && uv run ruff check . && uv run mypy app/ && uv run pytest -v

# Frontend
cd project && npx tsc --noEmit && npm run build
```

---

## Risiken & Offene Fragen

### Risiken
1. **slowapi In-Memory Storage**: Rate Limiting zaehlt im Server-Speicher. Bei Server-Neustart werden alle Zaehler zurueckgesetzt. Bei mehreren Server-Instanzen (Scaling) hat jede Instanz eigene Zaehler. *Mitigation:* Fuer V1 reicht In-Memory (eine Instanz). Spaeter auf Redis umstellen.
2. **Sentry-Kosten**: Der kostenlose Sentry-Plan hat 5k Fehler/Monat und 10k Performance-Transaktionen. *Mitigation:* `traces_sample_rate=0.1` (nur 10% der Requests tracken), Fehlerrate unter 5k halten.
3. **Rate Limits zu streng/zu locker**: Schwer vorherzusagen, was die richtige Grenze ist. *Mitigation:* Ueber Settings konfigurierbar, Start mit grosszuegigen Limits, bei Bedarf anpassen.

### Offene Fragen
1. Sentry Free Plan oder Paid? (Empfehlung: Free reicht fuer Start)
2. Rate Limits pro Nutzer oder pro Plan? (Empfehlung: V1 gleich fuer alle, spaeter plan-basiert mit Stripe)
3. Soll das Frontend auch Rate-Limit-Fehler anzeigen? (Empfehlung: Ja, als Toast-Notification "Zu viele Anfragen, bitte warte einen Moment")

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Dependencies installieren
     ↓
Schritt 2: Config erweitern
     ↓
Schritt 3: Rate Limiter Setup (rate_limit.py)
     ↓
Schritt 4: Sentry + slowapi in main.py
     ↓
Schritt 5: Rate Limiting auf Endpoints
     ↓
Schritt 6: JWKS Cache TTL (auth.py)
     ↓
Schritt 7: Request Dedup (blogs/routes.py)
     ↓
Schritt 8: Frontend Error Boundary
```

**Reihenfolge fuer Claude Code:** 1 → 2 → 3 → 4 → 5 → 6 → 7 (Backend komplett) → 8 (Frontend)

---

## Naechster Schritt

```bash
# Dieses PRP ausfuehren:
/02-execute docs/PRPs/PRP_06_Stabilitaet_Hardening.md
```
