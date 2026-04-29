# PRP #09: Stripe Payments — Subscriptions, Checkout und Usage-Tracking

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P1 (Revenue — ohne Zahlungen kein Geschaeftsmodell)
**Geschaetzte Komplexitaet:** High
**Betroffene Dateien:** 10+ (5 Backend + 3 Frontend + 2 Supabase)
**Abhaengigkeiten:** PRP #08 (Landing Page — Pricing-Tabelle verlinkt auf Checkout)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Blogreich ist kostenlos — jeder kann sich anmelden und unbegrenzt Blogs generieren. Das ist fuer die Entwicklung ok, aber fuer ein echtes Geschaeft brauchen wir ein Bezahlsystem. Jeder generierte Blog kostet uns Geld (Claude API, FLUX.2 Bilder, Tavily Suche), und ohne Einnahmen koennen wir die Plattform nicht betreiben.

### Die Loesung

Wir integrieren **Stripe** — den weltweit fuehrenden Zahlungsanbieter fuer SaaS-Plattformen. Der Nutzer waehlt einen Plan (Starter/Professional/Agency), wird zu einer Stripe-Checkout-Seite weitergeleitet, bezahlt dort, und wird zurueck zu Blogreich geleitet. Ab dann hat er sein monatliches Kontingent (z.B. 30 Blogs/Monat beim Professional-Plan).

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **Stripe** | Ein Zahlungsanbieter wie PayPal, aber speziell fuer Software-Unternehmen. Stripe uebernimmt die gesamte Zahlungsabwicklung: Kreditkarten, SEPA, Rechnungen. Wir muessen keine Kreditkartennummern speichern oder PCI-Compliance Vorschriften erfuellen — Stripe macht das alles. |
| **Subscription / Abo** | Ein wiederkehrendes Zahlungsmodell: Der Nutzer zahlt jeden Monat automatisch. Solange er zahlt, hat er Zugang zum Produkt. |
| **Checkout Session** | Eine temporaere Bezahl-Seite, die Stripe fuer uns generiert. Der Nutzer gibt dort seine Zahlungsdaten ein. Wir leiten ihn dorthin weiter und Stripe leitet ihn nach der Zahlung zurueck zu uns. Wir sehen nie die Kreditkartennummer — nur Stripe. |
| **Customer Portal** | Eine von Stripe bereitgestellte Seite, auf der Nutzer ihr Abo selbst verwalten koennen: Plan aendern, Zahlungsmethode aktualisieren, kuendigen. Wir muessen das nicht selbst bauen! |
| **Webhook** | Eine Benachrichtigung, die Stripe an unseren Server schickt, wenn etwas passiert. Z.B. "Nutzer X hat bezahlt", "Abo Y wurde gekuendigt", "Zahlung Z ist fehlgeschlagen". Stell dir vor, Stripe ruft uns an und sagt: "Hey, hier ist was passiert." Unser Server nimmt den Anruf entgegen und aktualisiert die Datenbank. |
| **Webhook Secret** | Ein geheimes Passwort, das Stripe und wir teilen. Damit pruefen wir, ob ein Webhook wirklich von Stripe kommt — und nicht von einem Angreifer, der sich als Stripe ausgibt. |
| **Product / Price** | In Stripe erstellt man zuerst ein "Product" (z.B. "Blogreich Professional") und dann einen "Price" (z.B. "49 EUR/Monat"). Ein Product kann mehrere Prices haben (monatlich, jaehrlich). |
| **stripe_customer_id** | Jeder zahlende Nutzer bekommt eine ID bei Stripe (z.B. `cus_abc123`). Wir speichern diese ID in unserer Datenbank, damit wir den Nutzer bei Stripe wiederfinden koennen. |
| **Usage Tracking** | Zaehlung, wie viele Blogs/Bilder ein Nutzer in seinem aktuellen Abrechnungszeitraum generiert hat. Wenn er sein Limit erreicht, wird die Generierung blockiert. |
| **Idempotency / Idempotenz** | Sicherstellen, dass eine Aktion nur EINMAL ausgefuehrt wird, auch wenn die Benachrichtigung mehrfach kommt. Webhooks koennen doppelt zugestellt werden — wir muessen damit umgehen koennen. |
| **Test Mode / Live Mode** | Stripe hat zwei Modi: Im Test-Modus kann man mit Fake-Kreditkarten testen (z.B. `4242 4242 4242 4242`). Erst im Live-Modus werden echte Zahlungen verarbeitet. Beide Modi haben separate API-Keys. |

---

## Ziel

Ein Stripe-basiertes Subscription-System implementieren mit drei Plaenen (Starter, Professional, Agency). Nutzer koennen ueber Stripe Checkout bezahlen, ihr Abo im Customer Portal verwalten, und ihre Nutzung wird gegen das Plan-Limit geprueft.

## User Story

Als Blogreich-Nutzer
moechte ich einen passenden Plan waehlen und sicher bezahlen koennen
damit ich ein definiertes monatliches Kontingent an Blogs und Bildern generieren kann.

Als Blogreich-Betreiber
moechte ich automatisch Einnahmen erhalten und die Nutzung pro Plan begrenzen
damit die Plattform sich selbst traegt und nicht missbraucht wird.

## Scope

### In Scope
- **3 Plaene:** Starter (19 EUR), Professional (49 EUR), Agency (149 EUR)
- **Stripe Checkout** fuer Zahlungsabwicklung (Hosted Checkout Page)
- **Stripe Customer Portal** fuer Abo-Verwaltung (Plan aendern, kuendigen)
- **Webhooks** fuer Subscription-Events (created, updated, deleted, payment_failed)
- **Supabase-Tabellen:** `subscriptions` und `usage_tracking`
- **Plan-Limits durchsetzen:** Blog-Generierung blockieren wenn Limit erreicht
- **Settings-Seite:** Aktueller Plan, Nutzung, Abo verwalten

### Out of Scope
- Jaehliche Abrechnung (V1 nur monatlich — jaehrlich spaeter)
- Kostenloser Free-Tier (V1 ohne Free Plan — Trial per Einladung)
- Stripe Connect (Marketplace/Payouts an andere)
- Automatische Rechnungserstellung (Stripe macht das automatisch)
- Usage-basierte Abrechnung (Overage Charges) — bei Limit wird einfach blockiert
- EU-Mehrwertsteuer / Reverse Charge (Stripe Tax spaeter)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/main.py` | Stripe-Router registrieren, Webhook-Route (ohne Auth!) | L41-44 |
| `backend/app/core/config.py` | Neue Settings: stripe_secret_key, stripe_webhook_secret, stripe_publishable_key | Ende |
| `backend/app/blogs/routes.py` | Usage-Check vor Blog-Generierung (Limit erreicht?) | L17-36 |
| `backend/pyproject.toml` | `stripe` Dependency hinzufuegen | L6-16 |
| `project/src/pages/Settings.tsx` | Neuer Abschnitt: Plan-Anzeige, Nutzung, "Plan aendern" Button | Gesamte Datei |
| `project/src/pages/Landing.tsx` | Pricing-Buttons verlinken auf Checkout (statt /register) | Pricing-Sektion |
| `project/src/types/index.ts` | Neue Types: Subscription, UsageInfo | Ende |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `backend/app/stripe_billing/` | Neuer Feature-Slice (Ordner) |
| `backend/app/stripe_billing/__init__.py` | Package-Init |
| `backend/app/stripe_billing/schemas.py` | Pydantic-Schemas |
| `backend/app/stripe_billing/service.py` | Stripe API Client (Checkout, Portal, Webhook-Handling) |
| `backend/app/stripe_billing/routes.py` | API-Endpoints |
| `backend/app/stripe_billing/usage.py` | Usage-Tracking und Limit-Pruefung |

---

## Technischer Plan

### Schritt 1: Stripe Account und Products einrichten (MANUELL)

**Wo:** Stripe Dashboard (stripe.com)
**Was:** Stripe-Account erstellen, Products und Prices anlegen.

**Schritt-fuer-Schritt Anleitung fuer die Praktikantin:**

**A. Stripe Account erstellen:**
1. Gehe zu https://dashboard.stripe.com/register
2. Erstelle einen Account (E-Mail, Passwort)
3. Du landest automatisch im **Test-Modus** (erkennbar am orangenen Banner "Test mode")
4. BLEIB im Test-Modus! Echte Zahlungen kommen erst spaeter.

**B. API-Keys kopieren:**
1. Gehe zu https://dashboard.stripe.com/test/apikeys
2. Kopiere den "Secret key" (beginnt mit `sk_test_...`)
3. Kopiere den "Publishable key" (beginnt mit `pk_test_...`)
4. Fuege beide in die `.env`-Datei ein:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

**C. Products und Prices erstellen:**
1. Gehe zu https://dashboard.stripe.com/test/products
2. Klicke "Add product"
3. Erstelle 3 Products:

| Product-Name | Preis | Intervall | Beschreibung |
|:---:|:---:|:---:|---|
| **Blogreich Starter** | 19,00 EUR | Monatlich | 10 Blogs/Monat, 1 Unternehmen, 30 Bilder |
| **Blogreich Professional** | 49,00 EUR | Monatlich | 30 Blogs/Monat, 3 Unternehmen, 100 Bilder |
| **Blogreich Agency** | 149,00 EUR | Monatlich | 100 Blogs/Monat, 15 Unternehmen, 300 Bilder |

4. Nach dem Erstellen: Klicke auf jedes Product → kopiere die **Price ID** (beginnt mit `price_...`)
5. Notiere die Price IDs — wir brauchen sie in der Konfiguration.

**D. Customer Portal aktivieren:**
1. Gehe zu https://dashboard.stripe.com/test/settings/billing/portal
2. Aktiviere das Customer Portal
3. Erlaube: "Cancel subscription", "Switch plan"
4. Speichern

**E. Webhook einrichten:**
1. Gehe zu https://dashboard.stripe.com/test/webhooks
2. Klicke "Add endpoint"
3. URL: `https://deine-domain.de/api/stripe/webhook` (fuer lokale Entwicklung nutzen wir Stripe CLI, siehe unten)
4. Events auswaehlen:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Kopiere den "Signing secret" (beginnt mit `whsec_...`)
6. Fuege in `.env` ein: `STRIPE_WEBHOOK_SECRET=whsec_...`

**F. Lokales Testing mit Stripe CLI (fuer Webhooks):**
1. Installiere Stripe CLI: https://docs.stripe.com/stripe-cli
2. Login: `stripe login`
3. Webhooks weiterleiten: `stripe listen --forward-to localhost:8123/api/stripe/webhook`
4. Die CLI gibt einen temporaeren Webhook Secret aus — nutze DIESEN in `.env` fuer lokales Testing

**Done-Kriterien:**
- [ ] Stripe Account existiert (Test-Modus)
- [ ] 3 Products mit monatlichen Prices erstellt
- [ ] API-Keys und Webhook-Secret in `.env`
- [ ] Customer Portal aktiviert

---

### Schritt 2: Supabase-Tabellen erstellen (MANUELL)

**Wo:** Supabase Dashboard
**Was:** Zwei neue Tabellen: `subscriptions` und `usage_tracking`.

**SQL fuer die Praktikantin:**

```sql
-- Subscription-Daten (wird von Stripe Webhooks befuellt)
CREATE TABLE IF NOT EXISTS subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id text NOT NULL,
    stripe_subscription_id text UNIQUE,
    plan text NOT NULL DEFAULT 'free',  -- 'starter', 'professional', 'agency'
    status text NOT NULL DEFAULT 'inactive',  -- 'active', 'canceled', 'past_due', 'inactive'
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id
ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
ON subscriptions(stripe_customer_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Usage-Tracking (wird vom Backend bei jeder Generierung aktualisiert)
CREATE TABLE IF NOT EXISTS usage_tracking (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_start date NOT NULL,  -- Erster Tag des Abrechnungszeitraums
    blogs_generated int DEFAULT 0,
    images_generated int DEFAULT 0,
    companies_analyzed int DEFAULT 0,
    keywords_researched int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_tracking_user_period
ON usage_tracking(user_id, period_start);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
ON usage_tracking FOR SELECT
USING (auth.uid() = user_id);

COMMENT ON TABLE subscriptions IS 'Stripe subscription data, updated via webhooks.';
COMMENT ON TABLE usage_tracking IS 'Monthly usage counters per user, updated by backend on each generation.';
```

**Done-Kriterien:**
- [ ] Beide Tabellen existieren in Supabase
- [ ] RLS ist aktiviert mit korrekten Policies
- [ ] Indices existieren

---

### Schritt 3: Backend — Dependencies und Config

**Dateien:** `backend/pyproject.toml`, `backend/app/core/config.py`
**Was:** `stripe` Library installieren und Konfiguration erweitern.

**Neue Dependency:**
```toml
"stripe>=11.0",
```

**Neue Settings:**
```python
# Stripe
stripe_secret_key: str = ""
stripe_publishable_key: str = ""
stripe_webhook_secret: str = ""
stripe_starter_price_id: str = ""
stripe_professional_price_id: str = ""
stripe_agency_price_id: str = ""
```

**Plan-Limits (als Code-Konstante, nicht Config):**
```python
PLAN_LIMITS = {
    "free": {"blogs": 3, "images": 10, "companies": 1},
    "starter": {"blogs": 10, "images": 30, "companies": 1},
    "professional": {"blogs": 30, "images": 100, "companies": 3},
    "agency": {"blogs": 100, "images": 300, "companies": 15},
}
```

**Done-Kriterien:**
- [ ] `stripe` in Dependencies
- [ ] Alle Stripe-Settings konfiguriert
- [ ] Plan-Limits definiert

---

### Schritt 4: Backend — Stripe Service

**Datei:** `backend/app/stripe_billing/service.py` (NEU)
**Was:** Stripe API Interaktionen: Checkout Session erstellen, Customer Portal URL holen, Webhook Events verarbeiten.

**Erklaerung fuer die Praktikantin:**
Dieser Service ist die Bruecke zwischen unserem Backend und Stripe. Er hat drei Hauptfunktionen:

1. **Checkout starten:** Erstellt eine temporaere Bezahl-Seite bei Stripe und gibt uns die URL. Der Nutzer wird dorthin weitergeleitet.
2. **Portal URL holen:** Holt die URL fuer das Stripe Customer Portal, wo der Nutzer sein Abo verwalten kann.
3. **Webhook verarbeiten:** Wenn Stripe uns benachrichtigt (z.B. "Zahlung erfolgreich"), aktualisieren wir die Datenbank.

**Kernfunktionen:**
```python
async def create_checkout_session(user_id: str, price_id: str, email: str) -> str:
    """Create a Stripe Checkout Session and return the URL."""

async def create_portal_session(user_id: str) -> str:
    """Create a Stripe Customer Portal session URL."""

async def handle_webhook_event(payload: bytes, sig_header: str) -> None:
    """Process a Stripe webhook event and update database."""
```

**Webhook Events die wir verarbeiten:**

| Event | Aktion |
|-------|--------|
| `checkout.session.completed` | Subscription in DB erstellen, Plan setzen |
| `customer.subscription.updated` | Plan/Status in DB aktualisieren |
| `customer.subscription.deleted` | Status auf "canceled" setzen |
| `invoice.payment_failed` | Status auf "past_due" setzen, Nutzer benachrichtigen (spaeter) |

**Done-Kriterien:**
- [ ] Checkout Session erstellt korrekte Stripe URL
- [ ] Portal Session URL funktioniert
- [ ] Webhook verarbeitet alle 4 Events korrekt
- [ ] Webhook verifiziert die Signatur (Sicherheit!)
- [ ] Idempotenz: Doppelte Webhook-Events fuehren nicht zu doppelten DB-Eintraegen

---

### Schritt 5: Backend — Usage Tracking

**Datei:** `backend/app/stripe_billing/usage.py` (NEU)
**Was:** Funktionen zum Zaehlen und Pruefen der Nutzung.

**Erklaerung fuer die Praktikantin:**
Jeder Plan hat Limits (z.B. Professional = 30 Blogs/Monat). Wenn ein Nutzer einen Blog generiert, muessen wir:
1. Pruefen ob er noch Kontingent hat
2. Wenn ja: Zaehler erhoehen
3. Wenn nein: Generierung blockieren mit einer freundlichen Meldung

**Kernfunktionen:**
```python
async def check_usage_limit(user_id: str, resource: str) -> bool:
    """Check if user is within their plan limits.

    Args:
        resource: 'blogs', 'images', 'companies', 'keywords'

    Returns True if user can proceed, False if limit reached.
    """

async def increment_usage(user_id: str, resource: str, count: int = 1) -> None:
    """Increment usage counter for a resource."""

async def get_usage_info(user_id: str) -> dict:
    """Get current usage and limits for a user."""
```

**Integration in Blog-Generierung (blogs/routes.py):**
```python
from app.stripe_billing.usage import check_usage_limit, increment_usage

@router.post("/generate")
async def start_blog_generation(...):
    if not await check_usage_limit(user_id, "blogs"):
        raise HTTPException(
            status_code=403,
            detail="Blog-Limit erreicht. Bitte upgrade deinen Plan."
        )
    # ... Generierung starten ...
    await increment_usage(user_id, "blogs")
```

**Done-Kriterien:**
- [ ] `check_usage_limit()` liest Plan und aktuelle Nutzung aus DB
- [ ] `increment_usage()` erhoet den Zaehler atomar
- [ ] Nutzer ohne Subscription werden als "free" Plan behandelt
- [ ] Usage-Zaehler wird pro Monat zurueckgesetzt (basierend auf `period_start`)

---

### Schritt 6: Backend — Stripe Routes

**Datei:** `backend/app/stripe_billing/routes.py` (NEU)
**Was:** API-Endpoints fuer Checkout, Portal und Webhooks.

**WICHTIG:** Der Webhook-Endpoint darf KEINE JWT-Authentifizierung haben! Stripe sendet die Requests, nicht ein eingeloggter Nutzer. Die Authentizitaet wird ueber die Webhook-Signatur geprueft.

**Endpoints:**
```python
router = APIRouter()

@router.post("/checkout")
async def create_checkout(body: CheckoutRequest, user_id = Depends(get_current_user_id)):
    """Create Stripe Checkout Session. Returns URL to redirect to."""

@router.post("/portal")
async def create_portal(user_id = Depends(get_current_user_id)):
    """Create Stripe Customer Portal URL for self-service management."""

@router.get("/subscription")
async def get_subscription(user_id = Depends(get_current_user_id)):
    """Get current subscription and usage info."""

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events. NO AUTH — verified via signature."""
```

**Registrierung in main.py:**
```python
from app.stripe_billing.routes import router as stripe_router
app.include_router(stripe_router, prefix="/api/stripe", tags=["stripe"])
```

**Done-Kriterien:**
- [ ] `/api/stripe/checkout` erstellt Checkout Session und gibt URL zurueck
- [ ] `/api/stripe/portal` gibt Customer Portal URL zurueck
- [ ] `/api/stripe/subscription` gibt aktuellen Plan und Nutzung zurueck
- [ ] `/api/stripe/webhook` ist OHNE JWT-Auth erreichbar
- [ ] Webhook verifiziert Stripe-Signatur

---

### Schritt 7: Frontend — Settings-Seite erweitern

**Datei:** `project/src/pages/Settings.tsx`
**Was:** Neuer Abschnitt "Dein Plan" mit aktuellem Plan, Nutzungsanzeige und Abo-Verwaltung.

**Visuelles Design:**
```
┌──────────────────────────────────────────────────┐
│ 💳 Dein Plan                                     │
│                                                  │
│ Aktueller Plan: Professional (49 EUR/mo)         │
│ Naechste Abrechnung: 29. Mai 2026                │
│                                                  │
│ Nutzung diesen Monat:                            │
│ Blogs:        ████████░░  24/30                  │
│ Bilder:       ██████░░░░  62/100                 │
│ Unternehmen:  ██░░░░░░░░  2/3                    │
│                                                  │
│ [Plan aendern]  [Abo kuendigen]                  │
└──────────────────────────────────────────────────┘
```

- Nutzungsbalken mit shadcn/ui oder einfache CSS-Bars
- "Plan aendern" → oeffnet Stripe Customer Portal (neues Tab)
- "Abo kuendigen" → auch Customer Portal
- Wenn kein Plan: "Kein aktives Abo. [Plan waehlen]" → Landing Page Pricing

**Done-Kriterien:**
- [ ] Aktueller Plan wird angezeigt
- [ ] Nutzungsbalken zeigen aktuelle/maximale Werte
- [ ] "Plan aendern" oeffnet Stripe Customer Portal
- [ ] Ohne Plan: Hinweis + Link zur Pricing-Seite

---

### Schritt 8: Frontend — Pricing-Buttons auf Checkout verlinken

**Datei:** `project/src/pages/Landing.tsx`
**Was:** Die Pricing-Buttons in der Landing Page sollen eine Stripe Checkout Session starten statt nur auf `/register` zu verlinken.

**Erklaerung fuer die Praktikantin:**
Aktuell verlinken die "Starten"-Buttons unter jedem Plan auf `/register`. Nach der Aenderung passiert folgendes:
1. Nicht eingeloggt → Button verlinkt auf `/register?plan=professional`
2. Eingeloggt → Button ruft `/api/stripe/checkout` auf und leitet zu Stripe weiter
3. Nach Zahlung → Stripe leitet zurueck zu `/dashboard?checkout=success`

**Done-Kriterien:**
- [ ] Pricing-Buttons funktionieren fuer eingeloggte UND nicht-eingeloggte User
- [ ] Checkout Session wird korrekt erstellt
- [ ] Nach Zahlung: Redirect zu Dashboard mit Erfolgsmeldung

---

## Datenbank-Aenderungen

### Neue Tabellen (manuell in Supabase)

Siehe **Schritt 2** fuer die komplette SQL-Anleitung.

---

## API-Aenderungen

### Neue Endpoints

| Method | Path | Auth | Beschreibung |
|--------|------|:---:|-------------|
| `POST` | `/api/stripe/checkout` | JWT | Checkout Session erstellen |
| `POST` | `/api/stripe/portal` | JWT | Customer Portal URL |
| `GET` | `/api/stripe/subscription` | JWT | Aktueller Plan + Nutzung |
| `POST` | `/api/stripe/webhook` | **NEIN** | Stripe Webhook Handler |

### Geaenderte Endpoints

| Method | Path | Aenderung |
|--------|------|----------|
| `POST` | `/api/blogs/generate` | Usage-Check vor Generierung (HTTP 403 bei Limit) |
| `POST` | `/api/images/generate` | Usage-Check |
| `POST` | `/api/companies/analyze` | Usage-Check |

---

## Neue ENV-Variablen

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_AGENCY_PRICE_ID=price_...
```

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Voraussetzung:** Stripe im Test-Modus, Backend + Frontend laufen, Stripe CLI fuer lokale Webhooks.

**Test 1: Checkout Flow**
1. Landing Page oeffnen
2. Registrieren (falls nicht eingeloggt)
3. Klick auf "Professional" Plan → "Starten"
4. **Erwartet:** Weiterleitung zu Stripe Checkout
5. Test-Kreditkarte eingeben: `4242 4242 4242 4242`, Ablauf: beliebig in der Zukunft, CVC: beliebig
6. "Bezahlen" klicken
7. **Erwartet:** Weiterleitung zurueck zu Blogreich Dashboard mit Erfolgsmeldung
8. Settings oeffnen → Plan sollte "Professional" zeigen

**Test 2: Usage Tracking**
1. 2-3 Blogs generieren
2. Settings oeffnen
3. **Erwartet:** Nutzungsbalken zeigt "2/30 Blogs" oder "3/30 Blogs"

**Test 3: Limit erreicht**
1. (Fuer schnellen Test: Limits temporaer auf 1 Blog setzen)
2. Einen Blog generieren (sollte funktionieren)
3. Zweiten Blog generieren
4. **Erwartet:** Fehlermeldung "Blog-Limit erreicht. Bitte upgrade deinen Plan."

**Test 4: Customer Portal**
1. Settings → "Plan aendern"
2. **Erwartet:** Stripe Customer Portal oeffnet sich
3. "Subscription kuendigen" klicken
4. Zurueck zu Blogreich → Settings
5. **Erwartet:** Plan zeigt "Cancelled" oder "Endet am ..."

**Test 5: Fehlgeschlagene Zahlung**
1. Stripe Dashboard → Test-Modus
2. Test-Kreditkarte fuer fehlgeschlagene Zahlung: `4000 0000 0000 0341`
3. Checkout durchfuehren
4. **Erwartet:** Stripe zeigt Fehlermeldung

### Stripe Test-Kreditkarten (Referenz)

| Karte | Ergebnis |
|-------|----------|
| `4242 4242 4242 4242` | Zahlung erfolgreich |
| `4000 0000 0000 0002` | Karte abgelehnt |
| `4000 0000 0000 0341` | Zahlung fehlgeschlagen |
| `4000 0025 0000 3155` | 3D Secure erforderlich |

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
1. **Webhook Delivery Failure**: Wenn unser Server nicht erreichbar ist, queued Stripe die Webhooks (bis zu 3 Tage). *Mitigation:* Webhook-Processing idempotent machen.
2. **Race Condition bei Usage**: Wenn zwei Blog-Generierungen gleichzeitig starten, koennten beide den Zaehler lesen bevor einer ihn erhoet. *Mitigation:* Atomare DB-Updates (`UPDATE ... SET blogs_generated = blogs_generated + 1`).
3. **EU-Rechtliches**: MwSt-Handling, Widerrufsrecht, AGB. *Mitigation:* Rechtsberatung einholen. Stripe Tax spaeter aktivieren.
4. **Lokales Webhook-Testing**: Webhooks brauchen eine oeffentliche URL. *Mitigation:* Stripe CLI Forward (`stripe listen --forward-to localhost:8123/api/stripe/webhook`).

### Offene Fragen
1. Free Tier anbieten? (Empfehlung: V1 ohne Free — 14-Tage Trial stattdessen)
2. Jaehrliche Abrechnung? (Empfehlung: Spaeter — V1 nur monatlich)
3. Upselling-Logik? (Z.B. "Du hast 28/30 Blogs verbraucht — upgrade auf Agency?" — spaeter)
4. Was passiert bei Kuendigung mit bestehenden Blogs? (Empfehlung: Bleiben erhalten, nur Generierung wird blockiert)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Stripe Account + Products (Manuell)
     ↓
Schritt 2: Supabase Tabellen (Manuell)
     ↓
Schritt 3: Dependencies + Config (Backend)
     ↓
Schritt 4: Stripe Service (Backend)
     ↓
Schritt 5: Usage Tracking (Backend)
     ↓
Schritt 6: Stripe Routes (Backend)
     ↓
Schritt 7: Settings-Seite (Frontend)
     ↓
Schritt 8: Pricing-Buttons (Frontend)
```

**Reihenfolge fuer Claude Code:** 3 → 4 → 5 → 6 (Backend) → 7 → 8 (Frontend)
**Manuell vor Code:** 1 (Stripe) → 2 (Supabase)

---

## Naechster Schritt

```bash
# Dieses PRP ausfuehren:
/02-execute docs/PRPs/PRP_09_Stripe_Payments.md
```
