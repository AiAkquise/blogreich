# PRP #05: AWS Hosting — ECS Express Mode (Backend) + Amplify (Frontend) + CI/CD

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P1 (Launch-Voraussetzung — ohne Hosting kein oeffentlicher Zugang)
**Geschaetzte Komplexitaet:** High
**Betroffene Dateien:** 5 neue Dateien (Infra-Konfiguration)
**Ausfuehrungsreihenfolge:** LETZTE PRP vor Go-Live (nach allen Feature-PRPs)
**Typ:** Ueberwiegend manuell (AWS Console, CLI) + wenige Code-Dateien

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Blogreich laeuft aktuell nur auf deinem eigenen Computer ("lokal"). Wenn du den Laptop zumachst, ist Blogreich weg. Kein anderer Mensch auf der Welt kann Blogreich nutzen. Fuer eine echte Plattform brauchen wir einen Server, der 24/7 laeuft, von ueberall erreichbar ist und eine richtige Domain hat (z.B. `blogreich.de`).

### Die Loesung

Wir hosten Blogreich auf **Amazon Web Services (AWS)** — dem groessten Cloud-Anbieter der Welt. Konkret nutzen wir:

1. **AWS Amplify** fuer das Frontend (React SPA) — wie ein "Dropbox fuer Websites": Du pushst Code zu GitHub, Amplify baut die Website automatisch und stellt sie ins Internet.

2. **AWS ECS Express Mode** fuer das Backend (FastAPI) — wie ein "intelligenter Server": Du gibst ihm ein Docker-Image (eine verpackte Version deiner App), und ECS startet es, ueberwacht es, und skaliert es automatisch wenn mehr Nutzer kommen.

3. **GitHub Actions** fuer CI/CD — wie ein "automatischer Assistent": Jedes Mal wenn du Code pushst, prueft GitHub automatisch ob alles funktioniert (Tests, Linting) und deployt es dann auf AWS.

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **Hosting** | Einen Server mieten, auf dem deine Software laeuft und von ueberall im Internet erreichbar ist. Wie eine Wohnung mieten — die "Wohnung" ist ein Computer in einem Rechenzentrum. |
| **AWS (Amazon Web Services)** | Amazons Cloud-Plattform. Statt eigene Server zu kaufen, mietest du Rechenleistung bei Amazon — minutengenau abgerechnet. AWS hat Rechenzentren weltweit. |
| **Docker / Container** | Eine Technologie, die deine App in ein "Paket" verpackt — mit allem was sie braucht (Python, Libraries, Code). Dieses Paket laeuft ueberall gleich, egal ob auf deinem Laptop oder auf AWS. Wie ein Umzugskarton: alles drin, einfach aufstellen. |
| **Docker Image** | Das "Rezept" fuer einen Container. Es beschreibt, welche Software installiert werden soll und wie die App gestartet wird. Wird einmal gebaut und kann beliebig oft gestartet werden. |
| **Dockerfile** | Die Textdatei, die beschreibt, wie das Docker Image gebaut wird. Wie ein Kochrezept: "Nimm Python 3.12, installiere diese Pakete, kopiere den Code, starte den Server." |
| **ECR (Elastic Container Registry)** | Amazons "Speicher fuer Docker Images". Wir bauen das Image auf GitHub und laden es in ECR hoch. Von dort laedt ECS es herunter und startet es. |
| **ECS (Elastic Container Service)** | Amazons Dienst zum Betreiben von Docker-Containern. "Elastic" bedeutet: Er kann automatisch mehr Container starten wenn viele Nutzer kommen, und wieder herunterfahren wenn es ruhig ist. |
| **ECS Express Mode** | Die vereinfachte Version von ECS. Statt viel Konfiguration braucht man nur einen Befehl. Es ist der offizielle Nachfolger von AWS App Runner (der eingestellt wird). |
| **Fargate** | Der "Motor" hinter ECS. Fargate betreibt Container OHNE dass du eigene Server verwalten musst. Du sagst nur "Ich brauche 0.25 CPU und 0.5 GB RAM" und Fargate kummert sich um den Rest. |
| **ALB (Application Load Balancer)** | Ein "Verkehrspolizist" der eingehende Anfragen auf verschiedene Container verteilt. Wenn du 3 Container hast, leitet der ALB jede Anfrage an den Container, der gerade am wenigsten beschaeftigt ist. |
| **Amplify** | Amazons Hosting-Dienst fuer Websites. Besonders gut fuer React/Vue/Angular SPAs. Du verbindest es mit GitHub, und bei jedem Push baut Amplify die Website automatisch neu. |
| **SPA (Single Page Application)** | Eine Website, die aus einer einzigen HTML-Datei besteht. Der Browser laedt einmal die Seite, danach aendert sich nur der Inhalt (ohne die Seite neu zu laden). React-Apps sind typische SPAs. |
| **CI/CD** | "Continuous Integration / Continuous Deployment": Automatisches Testen und Deployen bei jedem Code-Push. Statt manuell zu testen und hochzuladen, macht das ein automatischer Prozess. |
| **GitHub Actions** | GitHubs eingebauter CI/CD-Dienst. Du schreibst eine YAML-Datei die beschreibt, was bei jedem Push passieren soll (z.B. Tests laufen lassen, Docker Image bauen, auf AWS deployen). |
| **Route 53** | Amazons DNS-Dienst. DNS ist das "Telefonbuch des Internets" — es uebersetzt `blogreich.de` in eine IP-Adresse (z.B. `54.93.78.12`). |
| **SSL/HTTPS** | Verschluesselung der Verbindung zwischen Browser und Server. Das gruene Schloss in der Adressleiste. Ohne HTTPS warnen Browser die Nutzer. Amplify und ECS Express Mode stellen automatisch SSL-Zertifikate bereit. |
| **ENV-Variablen** | Konfigurationswerte die NICHT im Code stehen, sondern auf dem Server gesetzt werden. Z.B. API-Keys, Datenbankpasswoerter. So koennen verschiedene Umgebungen (Entwicklung, Produktion) verschiedene Werte haben. |

---

## Ziel

Die gesamte Blogreich-Plattform auf AWS deployen: Frontend auf Amplify mit automatischem Build bei Git-Push, Backend auf ECS Express Mode als Docker-Container, und GitHub Actions als CI/CD Pipeline fuer automatisches Testing und Deployment.

## User Story

Als Blogreich-Betreiber
moechte ich die Plattform auf AWS hosten mit automatischem Deployment
damit Nutzer sie von ueberall erreichen koennen und ich nicht manuell deployen muss.

Als Blogreich-Nutzer
moechte ich Blogreich ueber eine echte Domain (blogreich.de) mit HTTPS nutzen
damit ich der Plattform vertrauen und sie ueberall nutzen kann.

## Scope

### In Scope
- **Dockerfile** fuer das Backend (FastAPI + uvicorn)
- **AWS Amplify** Setup fuer das Frontend (React SPA)
- **AWS ECS Express Mode** Setup fuer das Backend
- **ECR Repository** fuer Docker Images
- **GitHub Actions** CI/CD Pipeline (Test → Build → Deploy)
- **Route 53** Domain-Konfiguration (wenn Domain vorhanden)
- **ENV-Variablen** auf AWS konfigurieren (API-Keys, Secrets)

### Out of Scope
- Custom Domain kaufen (Adrian muss Domain separat registrieren)
- AWS WAF (Web Application Firewall) — spaeter
- Multi-Region Deployment — V1 nur eu-central-1 (Frankfurt)
- Datenbank auf AWS (Supabase bleibt extern)
- CDN fuer Blog-Bilder (Supabase Storage bleibt)
- Monitoring-Dashboard (CloudWatch reicht fuer V1)
- Terraform/CDK Infrastructure-as-Code (manuelles Setup fuer V1, IaC spaeter)

## Betroffene Dateien

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `backend/Dockerfile` | Docker Image fuer das FastAPI Backend |
| `backend/.dockerignore` | Dateien die nicht ins Docker Image sollen |
| `project/amplify.yml` | Amplify Build-Konfiguration (oder ueber Amplify Console) |
| `.github/workflows/deploy-backend.yml` | GitHub Actions: Backend testen, bauen, deployen |
| `.github/workflows/deploy-frontend.yml` | GitHub Actions: Frontend testen (Amplify deployed automatisch) |

### Bestehende Dateien (aendern)

| Datei | Aenderung |
|-------|----------|
| `backend/app/core/config.py` | `allowed_origins` um Production-Domain erweitern |

---

## Technischer Plan

### Schritt 1: Dockerfile fuer das Backend erstellen (Claude Code)

**Datei:** `backend/Dockerfile` (NEU)
**Was:** Ein Multi-Stage Dockerfile, das ein schlankes Docker Image fuer das FastAPI Backend baut.

**Erklaerung fuer die Praktikantin:**
Ein Dockerfile ist wie ein Kochrezept fuer einen Container:
1. "Nimm Python 3.12 als Basis"
2. "Installiere die Abhaengigkeiten"
3. "Kopiere den Code"
4. "Starte den Server"

Multi-Stage bedeutet: Wir nutzen zwei "Koeche". Der erste installiert alles (auch Build-Tools). Der zweite kopiert nur das Ergebnis — dadurch ist das finale Image kleiner und sicherer.

**Dockerfile:**
```dockerfile
# === Stage 1: Build ===
FROM python:3.12-slim AS builder

WORKDIR /app

# uv fuer schnellere Paketinstallation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Dependencies installieren (gecacht wenn sich pyproject.toml nicht aendert)
COPY pyproject.toml uv.lock* ./
RUN uv sync --no-dev --frozen

# === Stage 2: Runtime ===
FROM python:3.12-slim

WORKDIR /app

# Nur die installierten Pakete vom Builder kopieren
COPY --from=builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# App-Code kopieren
COPY app/ ./app/

# Port und Healthcheck
EXPOSE 8123
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8123/health').raise_for_status()"

# Server starten
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8123"]
```

**Datei:** `backend/.dockerignore` (NEU)
```
__pycache__/
*.pyc
.env
.venv/
.git/
.pytest_cache/
.mypy_cache/
.ruff_cache/
tests/
```

**Done-Kriterien:**
- [ ] `docker build -t blogreich-api backend/` laeuft erfolgreich
- [ ] `docker run -p 8123:8123 --env-file .env blogreich-api` startet den Server
- [ ] `curl http://localhost:8123/health` gibt `{"status": "healthy"}` zurueck
- [ ] Image-Groesse unter 200MB

---

### Schritt 2: AWS Account und ECR einrichten (MANUELL)

**Wo:** AWS Console (console.aws.amazon.com)
**Was:** AWS Account vorbereiten, ECR Repository anlegen, IAM User fuer CI/CD erstellen.

**Schritt-fuer-Schritt fuer die Praktikantin:**

**A. AWS Account (falls nicht vorhanden):**
1. Gehe zu https://aws.amazon.com und erstelle einen Account
2. Kreditkarte hinterlegen (wird erst belastet wenn Free Tier ueberschritten)
3. Region waehlen: `eu-central-1` (Frankfurt) — oben rechts im AWS Dashboard

**B. ECR Repository erstellen:**
1. AWS Console → Suche "ECR" → "Amazon Elastic Container Registry"
2. Klicke "Create repository"
3. Repository name: `blogreich-api`
4. Visibility: Private
5. Klicke "Create"
6. Notiere die **Repository URI** (sieht aus wie: `123456789.dkr.ecr.eu-central-1.amazonaws.com/blogreich-api`)

**C. IAM User fuer GitHub Actions erstellen:**
1. AWS Console → IAM → Users → "Create user"
2. Username: `github-actions-deployer`
3. Permissions: "Attach policies directly" → folgende Policies anhaengen:
   - `AmazonECS_FullAccess`
   - `AmazonEC2ContainerRegistryFullAccess`
   - `AmazonEC2ContainerRegistryPowerUser`
4. "Create user" → Security credentials → "Create access key"
5. Use case: "Application running outside AWS"
6. Kopiere **Access Key ID** und **Secret Access Key** (werden nur einmal angezeigt!)

**D. GitHub Secrets konfigurieren:**
1. Gehe zu GitHub → dein Repository → Settings → Secrets and variables → Actions
2. Fuege folgende Secrets hinzu:
   - `AWS_ACCESS_KEY_ID` → der Access Key von oben
   - `AWS_SECRET_ACCESS_KEY` → der Secret Key von oben
   - `AWS_REGION` → `eu-central-1`
   - `ECR_REPOSITORY` → `blogreich-api`
   - `AWS_ACCOUNT_ID` → deine 12-stellige AWS Account ID

**Done-Kriterien:**
- [ ] ECR Repository `blogreich-api` existiert
- [ ] IAM User `github-actions-deployer` mit korrekten Rechten
- [ ] GitHub Secrets konfiguriert

---

### Schritt 3: ECS Express Mode Service erstellen (MANUELL)

**Wo:** AWS Console oder AWS CLI
**Was:** ECS Express Mode Service konfigurieren, der das Docker Image aus ECR laeuft.

**Erklaerung fuer die Praktikantin:**
ECS Express Mode ist wie "App Runner 2.0" — du gibst ihm ein Docker Image und er kuemmert sich um alles: Server, Netzwerk, Load Balancer, SSL, Auto-Scaling. Ein Befehl und der Service laeuft.

**Per AWS CLI (empfohlen):**
```bash
# 1. ECS Cluster erstellen (falls nicht vorhanden)
aws ecs create-cluster --cluster-name blogreich --region eu-central-1

# 2. ECS Express Service erstellen
# (Die exakte CLI-Syntax haengt von der AWS CLI Version ab —
# alternativ ueber die AWS Console: ECS → Create Service → Express Mode)
```

**Per AWS Console (einfacher fuer Anfaenger):**
1. AWS Console → ECS → "Create cluster"
2. Cluster name: `blogreich`
3. Infrastructure: AWS Fargate
4. "Create"
5. Im Cluster → "Create service"
6. Launch type: Fargate
7. Service name: `blogreich-api`
8. Task definition: (wird im naechsten Schritt erstellt — oder Express Mode erstellt sie automatisch)
9. Container image: Die ECR URI von oben + `:latest`
10. Port: 8123
11. Environment variables: Alle ENV-Vars aus `.env` eingeben (SUPABASE_URL, ANTHROPIC_API_KEY etc.)
12. Health check path: `/health`
13. Auto-scaling: Min 1, Max 3 tasks
14. "Create service"

**ENV-Variablen auf ECS konfigurieren:**
Folgende Werte muessen als ECS Environment Variables gesetzt werden:

| Variable | Wert |
|----------|------|
| `SUPABASE_URL` | `https://dcskfgpohcdaxrhiswnb.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | (aus .env kopieren) |
| `ANTHROPIC_API_KEY` | (aus .env) |
| `BFL_API_KEY` | (aus .env) |
| `TAVILY_API_KEY` | (aus .env) |
| `STRIPE_SECRET_KEY` | (aus .env) |
| `STRIPE_WEBHOOK_SECRET` | (aus .env) |
| `WORDPRESS_ENCRYPTION_KEY` | (aus .env) |
| `SENTRY_DSN` | (aus .env) |
| `SENTRY_ENVIRONMENT` | `production` |
| `ENVIRONMENT` | `production` |
| `ALLOWED_ORIGINS` | `https://blogreich.de,https://www.blogreich.de` |

**WICHTIG:** Sensible Werte (API-Keys) sollten als **AWS Secrets Manager** Secrets gespeichert werden, nicht als Klartext-Umgebungsvariablen. Fuer V1 reichen Klartext-ENV-Vars, aber fuer Production spaeter auf Secrets Manager umstellen.

**Done-Kriterien:**
- [ ] ECS Cluster `blogreich` existiert
- [ ] Service `blogreich-api` laeuft mit dem Docker Image
- [ ] Health Check unter `https://<alb-url>/health` gibt `{"status": "healthy"}` zurueck
- [ ] Alle ENV-Variablen sind konfiguriert

---

### Schritt 4: AWS Amplify fuer Frontend einrichten (MANUELL)

**Wo:** AWS Console → Amplify
**Was:** Amplify mit dem GitHub Repository verbinden, sodass jeder Push auf `main` automatisch das Frontend baut und deployed.

**Schritt-fuer-Schritt fuer die Praktikantin:**

1. AWS Console → Suche "Amplify" → "AWS Amplify"
2. Klicke "Create new app"
3. Source: "GitHub" → Autorisiere AWS Zugriff auf dein GitHub Repo
4. Waehle das `Blogplattform` Repository
5. Branch: `main`
6. **Build settings** — Amplify erkennt normalerweise Vite automatisch. Falls nicht:

**amplify.yml** (manuell eingeben oder als Datei im Repo):
```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - cd project
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: project/dist
        files:
          - '**/*'
      cache:
        paths:
          - project/node_modules/**/*
    appRoot: .
```

7. **Environment variables** in Amplify konfigurieren:
   - `VITE_SUPABASE_URL` → `https://dcskfgpohcdaxrhiswnb.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` → (Anon Key aus Supabase)
   - `VITE_API_URL` → Die URL des ECS Backend (z.B. `https://api.blogreich.de`)

8. Klicke "Save and deploy"
9. Warte bis der Build fertig ist (ca. 2-5 Minuten)
10. **Erwartet:** Amplify gibt dir eine URL (z.B. `https://main.d1abc123.amplifyapp.com`)

**Custom Domain (optional, wenn Domain vorhanden):**
1. In Amplify → Domain management → "Add domain"
2. Domain eingeben: `blogreich.de`
3. Amplify erstellt automatisch SSL-Zertifikate
4. DNS-Records in Route 53 (oder deinem Domain-Registrar) setzen wie angezeigt

**Done-Kriterien:**
- [ ] Amplify App ist verbunden mit GitHub `main` Branch
- [ ] Automatischer Build bei Git Push
- [ ] Frontend ist erreichbar unter Amplify-URL
- [ ] Umgebungsvariablen (VITE_*) sind konfiguriert
- [ ] SPA-Routing funktioniert (Seiten-Reload auf `/dashboard` gibt keine 404)

**SPA Redirect-Regel (WICHTIG):**
Amplify muss wissen, dass alle Routes zur `index.html` fuehren (SPA-Routing). In Amplify Console:
1. App → Rewrites and redirects
2. Regel hinzufuegen:
   - Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - Target: `/index.html`
   - Type: `200 (Rewrite)`

---

### Schritt 5: GitHub Actions CI/CD Pipeline erstellen (Claude Code)

**Datei:** `.github/workflows/deploy-backend.yml` (NEU)
**Was:** Automatische Pipeline die bei jedem Push auf `main`:
1. Backend-Tests laufen laesst (Ruff, MyPy, Pytest)
2. Docker Image baut
3. Image in ECR pusht
4. ECS Service aktualisiert (neues Image deployen)

**Erklaerung fuer die Praktikantin:**
GitHub Actions ist wie ein Roboter, der bei jedem Code-Push automatisch arbeitet. Er liest die `.yml`-Datei und fuehrt die Befehle aus — auf einem GitHub-Server, nicht auf deinem Computer. Wenn etwas fehlschlaegt (z.B. ein Test), wird das Deployment gestoppt und du bekommst eine Benachrichtigung.

**Pipeline:**
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'       # Nur bei Backend-Aenderungen
      - '.github/workflows/deploy-backend.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
      - run: cd backend && uv sync
      - run: cd backend && uv run ruff check .
      - run: cd backend && uv run mypy app/
      - run: cd backend && uv run pytest -v

  deploy:
    needs: test    # Nur deployen wenn Tests bestanden
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        run: |
          docker build -t ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com/${{ secrets.ECR_REPOSITORY }}:latest backend/
          docker push ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ secrets.AWS_REGION }}.amazonaws.com/${{ secrets.ECR_REPOSITORY }}:latest

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster blogreich \
            --service blogreich-api \
            --force-new-deployment \
            --region ${{ secrets.AWS_REGION }}
```

**Datei:** `.github/workflows/deploy-frontend.yml` (NEU)
**Was:** Frontend-Tests bei jedem Push (Amplify deployed automatisch — wir brauchen nur Tests).

```yaml
name: Test Frontend

on:
  push:
    branches: [main]
    paths:
      - 'project/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd project && npm ci
      - run: cd project && npx tsc --noEmit
      - run: cd project && npm run build
```

**Done-Kriterien:**
- [ ] Backend-Pipeline laeuft bei Push auf `main` (nur bei Backend-Aenderungen)
- [ ] Tests muessen bestehen vor Deployment
- [ ] Docker Image wird gebaut und in ECR gepusht
- [ ] ECS Service wird aktualisiert
- [ ] Frontend-Pipeline prueft TypeScript und Build

---

### Schritt 6: CORS und Production-Config anpassen (Claude Code)

**Datei:** `backend/app/core/config.py`
**Was:** `allowed_origins` um die Production-Domain erweitern.

**Aenderung:**
```python
allowed_origins: list[str] = [
    "http://localhost:5173",
    "http://localhost:3000",
    # Production — wird ueber ENV-Variable ALLOWED_ORIGINS ueberschrieben
]
```

Auf AWS wird `ALLOWED_ORIGINS` als ENV-Variable gesetzt: `https://blogreich.de,https://www.blogreich.de`

**Done-Kriterien:**
- [ ] CORS erlaubt die Production-Domain
- [ ] Lokale Entwicklung funktioniert weiterhin (localhost)

---

## Datenbank-Aenderungen

**Keine.** Supabase bleibt extern und unveraendert.

---

## API-Aenderungen

**Keine.** Alle bestehenden Endpoints bleiben gleich. Nur die URL aendert sich von `http://localhost:8123` zu `https://api.blogreich.de`.

---

## Frontend-Aenderungen

**Minimal.** Nur die `VITE_API_URL` ENV-Variable zeigt auf die Production-URL statt localhost. Das ist bereits ueber ENV-Variablen konfigurierbar.

---

## Geschaetzte AWS-Kosten (monatlich)

| Service | Kosten |
|---------|--------|
| ECS Fargate (0.25 vCPU, 0.5GB RAM, 24/7) | ~15-25 EUR |
| ALB (shared, bis 25 Services) | ~5-10 EUR |
| Amplify Hosting (Build + Hosting) | ~1-5 EUR |
| ECR (Docker Image Storage) | ~1 EUR |
| Route 53 (DNS) | ~0.50 EUR |
| **Gesamt** | **~22-42 EUR/Monat** |

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Test 1: Backend auf AWS**
1. ECS Service ist gestartet
2. Oeffne `https://<alb-url>/health` im Browser
3. **Erwartet:** `{"status": "healthy", "version": "0.1.0"}`

**Test 2: Frontend auf Amplify**
1. Oeffne die Amplify-URL im Browser
2. **Erwartet:** Blogreich Landing Page wird angezeigt
3. Registriere dich / logge dich ein
4. **Erwartet:** Dashboard funktioniert, Blogs koennen erstellt werden

**Test 3: CI/CD Pipeline**
1. Mache eine kleine Aenderung im Code (z.B. Version in `config.py` von "0.1.0" auf "0.1.1")
2. Pushe zu GitHub: `git add . && git commit -m "test: version bump" && git push`
3. Gehe zu GitHub → Actions Tab
4. **Erwartet:** Pipeline laeuft (Tests → Build → Deploy)
5. Nach ~5 Minuten: Backend hat neue Version (`/health` zeigt "0.1.1")

**Test 4: Auto-Scaling (optional)**
1. Sende viele parallele Anfragen an das Backend (z.B. mit `hey` oder `wrk` Tool)
2. Beobachte in der ECS Console: Werden neue Tasks gestartet?

### Validierung

```bash
# Lokal testen ob Docker Image funktioniert:
cd backend && docker build -t blogreich-api . && docker run -p 8123:8123 --env-file ../.env blogreich-api

# Health Check:
curl http://localhost:8123/health
```

---

## Risiken & Offene Fragen

### Risiken
1. **ECS Express Mode ist relativ neu**: Community-Erfahrung begrenzt. *Mitigation:* Falls Probleme, auf klassisches ECS Fargate wechseln (gleiche Infrastruktur).
2. **ENV-Variablen als Klartext**: Sensible API-Keys sollten in AWS Secrets Manager gespeichert werden. *Mitigation:* V1 mit Klartext-ENV, spaeter auf Secrets Manager umstellen.
3. **Docker Build Cache auf GitHub Actions**: Erste Builds dauern lang (~5 Min). *Mitigation:* Docker Layer Caching in GitHub Actions aktivieren.
4. **CORS-Probleme**: Frontend und Backend laufen auf verschiedenen Domains. *Mitigation:* `allowed_origins` korrekt konfigurieren, beim Testing pruefen.

### Offene Fragen
1. **Domain:** `blogreich.de`, `blogreich.io`, oder `blogreich.app`? (Adrian muss entscheiden und registrieren)
2. **Subdomain-Struktur:** `api.blogreich.de` fuer Backend, `blogreich.de` fuer Frontend? (Empfehlung: Ja)
3. **Staging-Umgebung:** Soll es neben Production eine Staging-Umgebung geben? (Empfehlung: Spaeter — V1 nur Production)
4. **AWS Region:** `eu-central-1` (Frankfurt) fuer DACH-Naehe? (Empfehlung: Ja)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Dockerfile erstellen (Claude Code)
     ↓
Schritt 2: AWS Account + ECR + IAM (Manuell)
     ↓
Schritt 3: ECS Express Mode Service (Manuell)
     ↓
Schritt 4: Amplify Frontend (Manuell)
     ↓
Schritt 5: GitHub Actions CI/CD (Claude Code)
     ↓
Schritt 6: CORS + Production Config (Claude Code)
```

**Reihenfolge:** 1 (Claude Code) → 2 (Manuell) → 5 (Claude Code) → 3 (Manuell) → 4 (Manuell) → 6 (Claude Code)

**Hinweis:** Diese PRP hat VIELE manuelle Schritte (AWS Console). Claude Code erstellt nur die Konfigurationsdateien (Dockerfile, GitHub Actions, amplify.yml). Die AWS-Einrichtung muss Adrian oder die Praktikantin manuell durchfuehren.

---

## Naechster Schritt

```bash
# Dieses PRP ausfuehren (nur die Code-Dateien):
/02-execute docs/PRPs/PRP_05_AWS_Hosting.md
```
