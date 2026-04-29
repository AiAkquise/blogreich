# PRP #07: WordPress Publishing — 1-Click Veroeffentlichung zu WordPress

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P1 (Markteintritt — Standard-Feature bei Koala, SEOwriting)
**Geschaetzte Komplexitaet:** Medium
**Betroffene Dateien:** 8 (4 Backend + 3 Frontend + 1 Supabase)
**Abhaengigkeiten:** PRP #04 (Blog Export — nutzt `markdownToHtml()` fuer die HTML-Konvertierung)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Die meisten Blogreich-Nutzer betreiben eine WordPress-Website. Aktuell ist der Workflow:
1. Blog in Blogreich generieren
2. HTML exportieren (PRP #04)
3. In WordPress einloggen
4. Neuen Beitrag erstellen
5. HTML einfuegen
6. Bilder manuell hochladen
7. Kategorien/Tags setzen
8. Veroeffentlichen

Das sind **8 manuelle Schritte** — jedes Mal. Bei Koala oder SEOwriting ist es **1 Klick**: "Publish to WordPress" und fertig. Das ist ein massiver Wettbewerbsnachteil fuer Blogreich.

### Die Loesung

Wir bauen eine **WordPress-Integration** mit zwei Teilen:

1. **Einrichtung (einmalig):** In den Blogreich-Einstellungen gibt der Nutzer seine WordPress-URL und ein "Application Password" ein. Blogreich testet die Verbindung und speichert die Zugangsdaten.

2. **Veroeffentlichung (pro Blog):** Im Blog-Editor gibt es einen neuen "Zu WordPress veroeffentlichen" Button. Ein Klick und der Blog wird als Entwurf in WordPress erstellt — mit Titel, formatiertem HTML-Content und allen Bildern.

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **WordPress REST API** | Eine Schnittstelle, ueber die man WordPress-Beitraege erstellen, bearbeiten und loeschen kann — ohne das WordPress-Dashboard zu oeffnen. Man schickt einfach HTTP-Requests an URLs wie `https://meineseite.de/wp-json/wp/v2/posts`. |
| **Application Password** | Ein spezielles Passwort, das WordPress seit Version 5.6 anbietet. Es ist NICHT das Login-Passwort des Nutzers, sondern ein separates Passwort, das nur fuer API-Zugriffe gilt. Man kann es jederzeit widerrufen, ohne das Login-Passwort zu aendern. Sicherer als das normale Passwort. |
| **Basic Authentication** | Ein einfaches Authentifizierungsverfahren: Username und Passwort werden zusammen als `username:passwort` codiert (Base64) und im HTTP-Header mitgeschickt. Unsicher ohne HTTPS, aber mit HTTPS voellig ok. |
| **Base64** | Eine Methode, um beliebige Daten in Buchstaben und Zahlen umzuwandeln. `admin:abcd 1234 efgh 5678` wird zu `YWRtaW46YWJjZCAxMjM0IGVmZ2ggNTY3OA==`. Nicht verschluesselt, nur codiert — aber das ist ok, weil HTTPS die eigentliche Verschluesselung uebernimmt. |
| **Draft / Entwurf** | In WordPress gibt es verschiedene Post-Status: `draft` (Entwurf — nur fuer den Autor sichtbar), `publish` (veroeffentlicht — fuer alle sichtbar), `pending` (zur Pruefung). Wir erstellen Blogs als `draft`, damit der Nutzer sie vor der Veroeffentlichung nochmal pruefen kann. |
| **wp/v2/posts** | Der WordPress REST API Endpoint zum Erstellen und Verwalten von Blog-Beitraegen. `v2` bedeutet Version 2 der API. |
| **wp/v2/media** | Der WordPress REST API Endpoint zum Hochladen von Bildern und anderen Dateien. |
| **Featured Image / Beitragsbild** | Das Hauptbild eines WordPress-Beitrags. Wird z.B. in der Blog-Uebersicht und in Social-Media-Shares angezeigt. |
| **Verschluesselung / Encryption** | Die Zugangsdaten des Nutzers (Username + App Password) muessen sicher gespeichert werden. Wir verschluesseln sie in der Datenbank, damit selbst bei einem Datenleck niemand die WordPress-Zugangsdaten lesen kann. |
| **Fernet Encryption** | Ein Verschluesselungsverfahren aus der Python `cryptography` Library. Es nutzt AES-128 (einen starken Algorithmus) und stellt sicher, dass verschluesselte Daten nicht manipuliert werden koennen. |

---

## Ziel

Eine WordPress-Integration bauen, die es Nutzern ermoeglicht, ihre WordPress-Website in den Einstellungen zu verbinden und dann generierte Blogs mit einem Klick als Entwurf in WordPress zu veroeffentlichen — inklusive formatiertem HTML und Bildern.

## User Story

Als Blogreich-Nutzer
moechte ich meinen generierten Blog direkt aus Blogreich heraus in meinem WordPress als Entwurf erstellen koennen
damit ich nicht manuell kopieren, einfuegen und formatieren muss.

## Scope

### In Scope
- WordPress-Verbindung einrichten (Settings-Seite: URL + Username + App Password)
- Verbindung testen (Backend prueft ob Zugangsdaten korrekt sind)
- Blog als Draft zu WordPress publizieren (Titel + HTML Content)
- Blog-Bilder zu WordPress Media Library hochladen
- Erstes Bild als Featured Image setzen
- Neue Supabase-Tabelle `wordpress_connections`
- Neuer Backend-Feature-Slice `wordpress/`
- "Zu WordPress veroeffentlichen" Button im BlogEditor

### Out of Scope
- WordPress-Kategorien und Tags (V1 nutzt "Uncategorized")
- Gutenberg Block Format (Classic Editor HTML reicht)
- Automatisches Publishing (immer als Draft — Nutzer prueft in WP)
- Bidirektionale Sync (Aenderungen in WP zurueck zu Blogreich)
- Mehrere WordPress-Sites pro Nutzer (V1: eine Site pro Nutzer)
- WordPress.com (nur self-hosted WordPress mit REST API)
- Yoast SEO / RankMath Felder befuellen

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `backend/app/main.py` | WordPress-Router registrieren | L41-44 (Router-Registrierung) |
| `project/src/pages/Settings.tsx` | Neue Card "WordPress-Verbindung" mit Formular | Gesamte Datei (130 Zeilen) |
| `project/src/pages/BlogEditor.tsx` | "Zu WordPress veroeffentlichen" Button + Dialog | Export-Bereich (L363-385) |
| `project/src/types/index.ts` | Neue Types: `WordPressConnection` | Ende der Datei |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `backend/app/wordpress/` | Neuer Feature-Slice (Ordner) |
| `backend/app/wordpress/__init__.py` | Package-Init |
| `backend/app/wordpress/schemas.py` | Pydantic-Schemas fuer WP-Verbindung und Publishing |
| `backend/app/wordpress/service.py` | WordPress REST API Client (publish, upload media, test connection) |
| `backend/app/wordpress/routes.py` | API-Endpoints (connect, test, publish) |

---

## Technischer Plan

### Schritt 1: Supabase — wordpress_connections Tabelle erstellen

**Wo:** Supabase Dashboard (manueller Schritt)
**Was:** Neue Tabelle fuer WordPress-Verbindungen.

**Schritt-fuer-Schritt Anleitung fuer die Praktikantin:**

1. Oeffne das Supabase Dashboard: https://supabase.com/dashboard
2. Waehle das Blogreich-Projekt
3. Klicke links auf "SQL Editor"
4. Klicke auf "New Query"
5. Kopiere folgenden SQL-Code:

```sql
-- WordPress-Verbindungen pro Nutzer
CREATE TABLE IF NOT EXISTS wordpress_connections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    site_url text NOT NULL,
    username text NOT NULL,
    app_password_encrypted text NOT NULL,
    site_name text DEFAULT '',
    is_active boolean DEFAULT true,
    last_tested_at timestamptz DEFAULT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index fuer schnelle Abfragen pro User
CREATE INDEX IF NOT EXISTS idx_wordpress_connections_user_id
ON wordpress_connections(user_id);

-- Row Level Security aktivieren
ALTER TABLE wordpress_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Nutzer sehen nur ihre eigenen Verbindungen
CREATE POLICY "Users can manage own wordpress connections"
ON wordpress_connections FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Kommentar zur Dokumentation
COMMENT ON TABLE wordpress_connections IS 'WordPress site connections for 1-click publishing. Credentials are encrypted.';
```

6. Klicke auf "Run"
7. **Erwartet:** "Success. No rows returned"
8. Pruefe: "Table Editor" → `wordpress_connections` sollte sichtbar sein

**Done-Kriterien:**
- [ ] Tabelle `wordpress_connections` existiert
- [ ] RLS ist aktiviert mit korrekter Policy
- [ ] Index auf `user_id` existiert

---

### Schritt 2: Backend — WordPress Schemas

**Datei:** `backend/app/wordpress/schemas.py` (NEU)
**Was:** Pydantic-Schemas fuer die WordPress-Integration.

**Schemas:**
```python
class WordPressConnectRequest(BaseModel):
    """Request to save/update a WordPress connection."""
    site_url: str           # z.B. "https://meinblog.de"
    username: str           # WordPress-Username
    app_password: str       # Application Password (Klartext vom Frontend)

class WordPressConnectResponse(BaseModel):
    """Response after saving connection."""
    id: str
    site_url: str
    site_name: str
    is_active: bool

class WordPressTestResponse(BaseModel):
    """Response from connection test."""
    success: bool
    site_name: str | None = None
    error: str | None = None

class WordPressPublishRequest(BaseModel):
    """Request to publish a blog to WordPress."""
    blog_id: str
    status: Literal["draft", "publish"] = "draft"

class WordPressPublishResponse(BaseModel):
    """Response after publishing."""
    success: bool
    wordpress_post_id: int | None = None
    wordpress_url: str | None = None
    error: str | None = None
```

**Done-Kriterien:**
- [ ] Alle Schemas definiert
- [ ] `uv run mypy app/` fehlerfrei

---

### Schritt 3: Backend — WordPress Service

**Datei:** `backend/app/wordpress/service.py` (NEU)
**Was:** Der WordPress REST API Client mit drei Funktionen: Verbindung testen, Blog publizieren, Bilder hochladen.

**Erklaerung fuer die Praktikantin:**
Dieser Service ist der "Bote" zwischen Blogreich und WordPress. Er spricht die WordPress REST API und macht drei Dinge:
1. **Test:** Prueft ob die URL und Zugangsdaten korrekt sind (ruft `GET /wp-json/wp/v2/users/me` auf)
2. **Publish:** Erstellt einen neuen Beitrag in WordPress (ruft `POST /wp-json/wp/v2/posts` auf)
3. **Upload Media:** Laedt Bilder in die WordPress Media Library hoch (ruft `POST /wp-json/wp/v2/media` auf)

**Verschluesselung der Zugangsdaten:**
```python
from cryptography.fernet import Fernet

# Schluessel wird aus WORDPRESS_ENCRYPTION_KEY ENV-Variable geladen
# (oder automatisch generiert und in .env gespeichert)

def encrypt_password(password: str, key: str) -> str:
    """Encrypt the application password for storage."""
    f = Fernet(key.encode())
    return f.encrypt(password.encode()).decode()

def decrypt_password(encrypted: str, key: str) -> str:
    """Decrypt the stored application password."""
    f = Fernet(key.encode())
    return f.decrypt(encrypted.encode()).decode()
```

**WordPress API Aufrufe (mit httpx):**
```python
async def test_wordpress_connection(site_url: str, username: str, app_password: str) -> dict:
    """Test if WordPress credentials are valid."""
    auth_header = _build_basic_auth(username, app_password)
    async with httpx.AsyncClient(timeout=15.0, verify=True) as client:
        response = await client.get(
            f"{site_url}/wp-json/wp/v2/users/me",
            headers={"Authorization": auth_header},
        )
        if response.status_code == 200:
            data = response.json()
            return {"success": True, "site_name": data.get("name", "")}
        return {"success": False, "error": f"HTTP {response.status_code}"}

async def publish_to_wordpress(
    site_url: str, username: str, app_password: str,
    title: str, html_content: str, status: str = "draft",
    featured_image_url: str | None = None,
) -> dict:
    """Create a new post in WordPress."""
    auth_header = _build_basic_auth(username, app_password)
    post_data = {
        "title": title,
        "content": html_content,
        "status": status,
    }

    # Optional: Featured Image hochladen
    if featured_image_url:
        media_id = await _upload_media_from_url(
            site_url, auth_header, featured_image_url, title
        )
        if media_id:
            post_data["featured_media"] = media_id

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{site_url}/wp-json/wp/v2/posts",
            headers={"Authorization": auth_header, "Content-Type": "application/json"},
            json=post_data,
        )
        if response.status_code == 201:
            data = response.json()
            return {
                "success": True,
                "wordpress_post_id": data["id"],
                "wordpress_url": data.get("link", ""),
            }
        return {"success": False, "error": response.text[:500]}

def _build_basic_auth(username: str, password: str) -> str:
    """Build Basic Auth header value."""
    import base64
    credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
    return f"Basic {credentials}"
```

**Done-Kriterien:**
- [ ] `test_wordpress_connection()` gibt `{"success": true/false}` zurueck
- [ ] `publish_to_wordpress()` erstellt einen Post in WordPress und gibt die Post-URL zurueck
- [ ] `_upload_media_from_url()` laedt ein Bild von einer URL herunter und in WP hoch
- [ ] Passwort-Verschluesselung mit Fernet funktioniert (encrypt → decrypt = original)
- [ ] Alle Fehler werden sauber behandelt (kein Crash bei unreachbarer WP-Instanz)
- [ ] Logging: `wordpress.connection_tested`, `wordpress.publish_completed`, `wordpress.publish_failed`

---

### Schritt 4: Backend — WordPress Routes

**Datei:** `backend/app/wordpress/routes.py` (NEU)
**Was:** API-Endpoints fuer WordPress-Verbindung und Publishing.

**Endpoints:**
```python
router = APIRouter()

@router.post("/connect")        # Verbindung speichern/aktualisieren
@router.get("/connection")      # Aktuelle Verbindung abrufen
@router.delete("/connection")   # Verbindung loeschen
@router.post("/test")           # Verbindung testen
@router.post("/publish")        # Blog zu WordPress publizieren
```

**Registrierung in main.py:**
```python
from app.wordpress.routes import router as wordpress_router
app.include_router(wordpress_router, prefix="/api/wordpress", tags=["wordpress"])
```

**Done-Kriterien:**
- [ ] Alle 5 Endpoints existieren und sind JWT-geschuetzt
- [ ] `/connect` speichert verschluesselte Credentials in Supabase
- [ ] `/connection` gibt Verbindung zurueck (OHNE Passwort!)
- [ ] `/test` ruft WordPress API auf und gibt Erfolg/Fehler zurueck
- [ ] `/publish` erstellt Blog als Draft in WordPress
- [ ] Rate Limiting: `/publish` und `/test` je 10/hour

---

### Schritt 5: Backend — Dependency hinzufuegen

**Datei:** `backend/pyproject.toml`
**Was:** `cryptography` Library (fuer Fernet Encryption) hinzufuegen.

**Erklaerung fuer die Praktikantin:**
`cryptography` ist bereits als Abhaengigkeit von `python-jose[cryptography]` installiert. Wir muessen es daher NICHT separat hinzufuegen — es ist schon da. Wir koennen direkt `from cryptography.fernet import Fernet` importieren.

**Neuer Config-Wert (config.py):**
```python
# WordPress
wordpress_encryption_key: str = ""  # Fernet-Key, wird beim ersten Start generiert
```

**Neuer ENV-Wert (.env):**
```env
WORDPRESS_ENCRYPTION_KEY=
```

**Manueller Schritt — Fernet Key generieren:**
1. Im Terminal: `cd backend && uv run python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
2. Den ausgegebenen Key kopieren (sieht aus wie: `dGhpcyBpcyBhIHRlc3Qga2V5...`)
3. In `.env` einfuegen: `WORDPRESS_ENCRYPTION_KEY=dGhpcyBpcyBhIHRlc3Qga2V5...`

**Done-Kriterien:**
- [ ] `WORDPRESS_ENCRYPTION_KEY` in Settings definiert
- [ ] Fernet Key in `.env` generiert und eingetragen
- [ ] `from cryptography.fernet import Fernet` funktioniert ohne neuen Install

---

### Schritt 6: Frontend — Settings-Seite erweitern

**Datei:** `project/src/pages/Settings.tsx`
**Was:** Neue Card "WordPress-Verbindung" mit Formular (URL, Username, App Password) und Test-Button.

**Erklaerung fuer die Praktikantin:**
Die Settings-Seite bekommt eine neue Karte, in der der Nutzer seine WordPress-Website verbinden kann. Der Flow:
1. Nutzer gibt WordPress-URL, Username und Application Password ein
2. Klickt "Verbindung testen"
3. Backend prueft die Zugangsdaten
4. Bei Erfolg: gruener Haken, "Verbunden mit [Site Name]"
5. Klickt "Speichern"
6. Beim naechsten Mal zeigt die Karte: "Verbunden mit meinblog.de" + "Trennen"-Button

**Visuelles Design:**
```
┌──────────────────────────────────────────────────┐
│ 🔗 WordPress-Verbindung                         │
│                                                  │
│ Status: ✅ Verbunden mit "Mein Blog"             │
│                                                  │
│ WordPress-URL: https://meinblog.de               │
│ Benutzername:  admin                             │
│ App Password:  ••••••••••••••••                  │
│                                                  │
│ [Verbindung testen]  [Speichern]  [Trennen]      │
│                                                  │
│ 💡 So erstellst du ein Application Password:     │
│ WordPress → Benutzer → Profil → Application      │
│ Passwords → "Blogreich" eingeben → Hinzufuegen   │
└──────────────────────────────────────────────────┘
```

**Hilfetext fuer den Nutzer (wird unter dem Formular angezeigt):**
> **So erstellst du ein Application Password in WordPress:**
> 1. Logge dich in dein WordPress-Dashboard ein
> 2. Gehe zu "Benutzer" → "Profil"
> 3. Scrolle runter zu "Application Passwords"
> 4. Gib einen Namen ein (z.B. "Blogreich")
> 5. Klicke "Neues Application Password hinzufuegen"
> 6. Kopiere das generierte Passwort (es wird nur einmal angezeigt!)
> 7. Fuege es hier in Blogreich ein

**Done-Kriterien:**
- [ ] WordPress-Card in Settings sichtbar
- [ ] Formular mit URL, Username, App Password
- [ ] "Verbindung testen" Button ruft Backend auf und zeigt Ergebnis
- [ ] "Speichern" speichert die Verbindung
- [ ] "Trennen" loescht die Verbindung
- [ ] Hilfetext erklaert wie man ein App Password erstellt
- [ ] Gespeicherte Verbindung wird beim Laden der Seite angezeigt (ohne Passwort)
- [ ] `npx tsc --noEmit` fehlerfrei

---

### Schritt 7: Frontend — "Zu WordPress veroeffentlichen" Button im BlogEditor

**Datei:** `project/src/pages/BlogEditor.tsx`
**Was:** Neuer Button im Export-Bereich des Editors. Beim Klick wird geprueft ob eine WordPress-Verbindung besteht, dann wird der Blog als Draft publiziert.

**Erklaerung fuer die Praktikantin:**
Im Blog-Editor gibt es bereits Export-Buttons (HTML, Markdown, WordPress HTML). Wir fuegen einen neuen Button hinzu: "Zu WordPress veroeffentlichen". Dieser Button:
1. Prueft, ob der Nutzer eine WordPress-Verbindung eingerichtet hat
2. Wenn nein: zeigt einen Hinweis "Bitte verbinde zuerst deine WordPress-Website in den Einstellungen"
3. Wenn ja: ruft den Backend-Endpoint `/api/wordpress/publish` auf
4. Zeigt Erfolg: "Blog als Entwurf in WordPress erstellt! [Link zum Beitrag]"

**Implementierung:**
- Neuer State: `wpPublishing: boolean`, `wpResult: {success, url} | null`
- Button in der Toolbar neben den Export-Buttons
- Success-Toast mit Link zum WordPress-Beitrag

**Done-Kriterien:**
- [ ] "Zu WordPress veroeffentlichen" Button sichtbar
- [ ] Button ist deaktiviert wenn keine WP-Verbindung besteht (mit Tooltip/Hinweis)
- [ ] Loading-State waehrend Publishing
- [ ] Erfolgs-Anzeige mit Link zum WP-Beitrag
- [ ] Fehler-Anzeige wenn Publishing fehlschlaegt
- [ ] `npx tsc --noEmit` und `npm run build` fehlerfrei

---

## Datenbank-Aenderungen

### Neue Tabelle (manuell in Supabase)

Siehe **Schritt 1** fuer die komplette SQL-Anleitung.

---

## API-Aenderungen

### Neue Endpoints

| Method | Path | Request | Response | Beschreibung |
|--------|------|---------|----------|-------------|
| `POST` | `/api/wordpress/connect` | `{site_url, username, app_password}` | `{id, site_url, site_name}` | Verbindung speichern |
| `GET` | `/api/wordpress/connection` | — | `{id, site_url, site_name, is_active}` oder `null` | Aktuelle Verbindung |
| `DELETE` | `/api/wordpress/connection` | — | `{success: true}` | Verbindung loeschen |
| `POST` | `/api/wordpress/test` | `{site_url, username, app_password}` | `{success, site_name, error}` | Verbindung testen |
| `POST` | `/api/wordpress/publish` | `{blog_id, status: "draft"}` | `{success, wordpress_post_id, wordpress_url}` | Blog publizieren |

---

## Frontend-Aenderungen

### Geaenderte Dateien
- `project/src/pages/Settings.tsx` — WordPress-Verbindungs-Card
- `project/src/pages/BlogEditor.tsx` — "Zu WordPress" Button
- `project/src/types/index.ts` — `WordPressConnection` Type

---

## Neue ENV-Variablen

```env
WORDPRESS_ENCRYPTION_KEY=   # Fernet Key fuer Passwort-Verschluesselung
```

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Voraussetzung:** Eine WordPress-Website mit REST API und Application Passwords aktiviert. Alternativ: Eine lokale WordPress-Installation (z.B. mit LocalWP oder Docker).

**Test 1: Verbindung einrichten**
1. WordPress: Application Password erstellen (Profil → Application Passwords → "Blogreich")
2. Blogreich: Einstellungen → WordPress-Verbindung → URL, Username, App Password eingeben
3. "Verbindung testen" klicken
4. **Erwartet:** Gruener Haken, "Verbunden mit [Site Name]"
5. "Speichern" klicken
6. Seite neu laden
7. **Erwartet:** Verbindung wird angezeigt (ohne Passwort)

**Test 2: Blog veroeffentlichen**
1. Einen Blog generieren (oder bestehenden oeffnen)
2. Im Blog-Editor: "Zu WordPress veroeffentlichen" klicken
3. **Erwartet:** Erfolgsmeldung mit Link zum WordPress-Beitrag
4. Link anklicken
5. **Erwartet:** Im WordPress-Dashboard ist ein neuer Entwurf mit dem Blog-Titel und formatiertem Content

**Test 3: Ohne Verbindung**
1. WordPress-Verbindung trennen (Einstellungen → "Trennen")
2. Im Blog-Editor: "Zu WordPress veroeffentlichen" klicken
3. **Erwartet:** Hinweis "Bitte verbinde zuerst deine WordPress-Website in den Einstellungen"

**Test 4: Falsche Zugangsdaten**
1. Einstellungen → WordPress → Falsches Passwort eingeben
2. "Verbindung testen" klicken
3. **Erwartet:** Fehlermeldung "Authentifizierung fehlgeschlagen"

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
1. **WordPress REST API deaktiviert**: Manche Sicherheits-Plugins deaktivieren die REST API. *Mitigation:* Klare Fehlermeldung "WordPress REST API ist nicht erreichbar. Bitte pruefe deine Sicherheits-Plugins."
2. **Application Passwords nicht verfuegbar**: Nur ab WordPress 5.6 und nicht bei allen Hostinganbietern. *Mitigation:* Hilfetext erklaert die Voraussetzungen.
3. **CORS-Probleme**: Unsere API ruft WordPress auf — das sollte kein CORS-Problem sein (Server-to-Server). Nur wenn das Frontend direkt WordPress aufruft, gaebe es CORS. *Mitigation:* Alle WP-Calls gehen ueber unser Backend.
4. **Bilder zu gross**: Blog-Bilder aus FLUX.2 koennen 1-5 MB gross sein. WordPress hat Upload-Limits. *Mitigation:* Bilder werden einzeln hochgeladen, Fehler werden geloggt aber der Post wird trotzdem erstellt.
5. **Verschluesselungs-Key verloren**: Wenn der `WORDPRESS_ENCRYPTION_KEY` geaendert wird, koennen bestehende Passwoerter nicht mehr entschluesselt werden. *Mitigation:* Key in `.env` speichern und nie aendern. Dokumentation.

### Offene Fragen
1. Soll der Blog als "draft" oder "publish" erstellt werden? (Empfehlung: Default "draft", mit Option "publish" fuer erfahrene Nutzer)
2. Sollen WordPress-Kategorien und Tags aus Blogreich uebernommen werden? (Empfehlung: Spaeter — V1 nutzt "Uncategorized")
3. Sollen auch aeltere Blogs (ohne Bilder) publishbar sein? (Empfehlung: Ja, einfach ohne Featured Image)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Supabase Tabelle (Manuell)
     ↓
Schritt 2: WordPress Schemas (Backend)
     ↓
Schritt 3: WordPress Service (Backend)
     ↓
Schritt 4: WordPress Routes (Backend)
     ↓
Schritt 5: Config + Encryption Key (Backend)
     ↓
Schritt 6: Settings-Seite (Frontend)
     ↓
Schritt 7: BlogEditor Button (Frontend)
```

**Reihenfolge fuer Claude Code:** 5 → 2 → 3 → 4 (Backend) → 1 (Manuell/Supabase) → 6 → 7 (Frontend)

**Hinweis:** Schritt 1 (Supabase SQL) muss von der Praktikantin manuell ausgefuehrt werden, bevor das Frontend die Verbindung speichern kann. Der Fernet Key (Schritt 5) muss ebenfalls manuell generiert und in `.env` eingetragen werden.

---

## Naechster Schritt

```bash
# Dieses PRP ausfuehren:
/02-execute docs/PRPs/PRP_07_WordPress_Publishing.md
```
