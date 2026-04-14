# Bolt.new Prompt — Blogreich

> Diesen Prompt direkt in bolt.new einfuegen. Optional vorher "Enhance Prompt" nutzen.

---

Erstelle eine moderne Blog-Plattform Web-App (Frontend) mit dem Namen "Blogreich".

## Tech Stack (VERPFLICHTEND)
- React 18 + TypeScript + Vite
- Tailwind CSS 4 (utility-first, @tailwindcss/vite plugin)
- shadcn/ui Komponenten (Radix UI Primitives)
- Lucide React fuer Icons
- React Router v7 fuer Routing
- React Hook Form + Zod fuer Formulare
- Supabase JS SDK fuer Auth + Datenbank
- Recharts fuer Analytics-Charts

## Farbschema & Design
- Primary: Indigo/Violet (#6366f1)
- Modernes, cleanes SaaS-Design
- Dark Mode + Light Mode (class-based toggle)
- Responsive fuer Desktop + Tablet
- Professionell und production-ready, nicht generisch
- Logo-Text: "Blogreich" in der Sidebar oben

## Supabase Auth
- Supabase als Auth-Provider konfigurieren
- Login / Register Seiten mit Email + Passwort
- AuthContext Provider der den User-State global verwaltet
- Protected Routes die unauthentifizierte User zum Login redirecten
- JWT Token wird in einem API-Client fuer Backend-Calls mitgesendet

## API Client Setup
- Erstelle einen zentralen API-Client (`src/lib/apiClient.ts`)
- Base URL: konfigurierbar ueber Environment Variable `VITE_API_URL` (default: `http://localhost:8123`)
- Automatisch JWT Bearer Token aus Supabase Session anhaengen
- Typisierte Fetch-Wrapper: `apiGet<T>()`, `apiPost<T>()`, `apiPut<T>()`, `apiDelete<T>()`
- Error Handling mit Toast-Notifications (sonner)

## Seiten & Routing

### 1. Dashboard (`/dashboard`)
- Uebersichtskarten (Bento-Grid Layout):
  - Anzahl Blogs (gesamt, Entwurf, Veroeffentlicht)
  - Letzte 5 Blogs als Liste
  - Aktives Unternehmen
- Sidebar-Navigation (shadcn sidebar Komponente) mit:
  - Dashboard, Blog Writer, Meine Blogs, Unternehmen, Keywords, Einstellungen
  - "Blogreich" Logo-Text oben in der Sidebar

### 2. Blog Writer (`/blog/new`) — HAUPTSEITE
- Zwei Modi als Tabs oben: "Blog Writer" (Advanced) und "Easy Blog Writer"

**Blog Writer (Advanced):**
- Schritt 1: Blog-Titel eingeben (grosses Input-Feld)
  - Button darunter: "Themen vorschlagen lassen" (ruft spaeter Backend API auf)
- Schritt 2: Content-Quelle auswaehlen (Select/Dropdown):
  - "KI-generiert" (default)
  - "Mit Realtime-Info"
  - "Von URL" (zeigt zusaetzliches URL-Input-Feld)
- Schritt 3: Einstellungen (aufklappbares Accordion oder Collapsible):
  - Sprache (Select: Deutsch, Englisch)
  - Tonalitaet (Select: Professionell, Locker, Akademisch, Kreativ)
  - Zielgruppe (Input-Feld)
  - Wort-Anzahl (Slider: 1000 - 5000, default 3000)
  - Primary Keyword (Input, optional)
  - Secondary Keywords (Input mit Tags, optional)
  - Unternehmen auswaehlen (Select, laedt aus Supabase)
- Schritt 4: "Blog generieren" Button (prominent, volle Breite)
- Nach dem Klick: Progress-Anzeige mit Schritten:
  - Gliederung wird erstellt...
  - Abschnitte werden geschrieben...
  - Bilder werden generiert...
  - Blog fertig!

**Easy Blog Writer:**
- Nur: Titel + Unternehmen auswaehlen + "Generieren" Button
- Alles andere sind Defaults

### 3. Blog Editor (`/blog/:id/edit`)
- Markdown-Editor (linke Seite) mit Live-Preview (rechte Seite), Split-View
- Toolbar oben: Bold, Italic, H2, H3, Link, Bild einfuegen, Liste
- Rechts: generierte Bilder als Thumbnails zum Einfuegen
- SEO-Score Sidebar (rechts unten): Keyword-Dichte, Wortanzahl, Lesezeit
- Buttons: "Speichern", "Als Entwurf", "Exportieren" (Dropdown: HTML, Markdown)

### 4. Meine Blogs (`/blogs`)
- Tabelle (shadcn table) mit Spalten:
  - Titel, Unternehmen, Status (Badge: Entwurf/In Generierung/Review/Veroeffentlicht), Woerter, Erstellt am
- Filter: Status-Dropdown, Unternehmen-Dropdown, Suchfeld
- Pagination
- Klick auf Zeile -> oeffnet Blog Editor

### 5. Unternehmen (`/companies`)
- Liste aller Unternehmen-Profile als Cards
- "Neues Unternehmen" Button -> Dialog/Sheet:
  - Firmenname (Input)
  - Branche (Input)
  - Firmenbeschreibung (Textarea)
  - Zielgruppe (Input)
  - Hauptangebote (Input)
  - Website-URLs (Multi-Input, mehrere URLs eingeben)
    - Button: "Website analysieren" (ruft spaeter Tavily ueber Backend API auf)
    - Status-Anzeige: "Analyse laeuft..." -> "Style-Profil erstellt"
  - Schreibstil-Preview (readonly Textarea, zeigt analysierten Stil)

### 6. Keywords & Cluster (`/keywords`)
- Tab 1: Keywords — Tabelle mit Keyword, Score, Unternehmen, Status
- Tab 2: Cluster — Cards mit Cluster-Name, Primary Keyword, Keyword-Anzahl, Status
- "Neue Keyword-Recherche starten" Button

### 7. Einstellungen (`/settings`)
- Profil (Name, Email)
- API Keys Anzeige (masked, mit Copy-Button)
- Theme Toggle (Dark/Light)

## Datenbank-Tabellen (Supabase)
Erstelle folgende Supabase-Tabellen mit Row Level Security (RLS):

```sql
-- Unternehmen
create table companies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  industry text,
  description text,
  target_audience text,
  main_offerings text,
  website_urls text[],
  style_profile jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Blogs
create table blogs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  company_id uuid references companies(id),
  title text not null,
  content text,
  status text default 'draft' check (status in ('draft', 'generating', 'review', 'published')),
  language text default 'de',
  tone text default 'professional',
  target_word_count int default 3000,
  actual_word_count int,
  primary_keyword text,
  secondary_keywords text[],
  seo_score int,
  content_source text default 'ai' check (content_source in ('ai', 'realtime', 'url')),
  source_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Blog Bilder
create table blog_images (
  id uuid default gen_random_uuid() primary key,
  blog_id uuid references blogs(id) on delete cascade,
  user_id uuid references auth.users(id) not null,
  image_url text not null,
  prompt text,
  position text default 'header',
  created_at timestamptz default now()
);

-- Keywords
create table keywords (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  company_id uuid references companies(id),
  keyword text not null,
  score int,
  cluster_id uuid,
  status text default 'active',
  created_at timestamptz default now()
);

-- Keyword Cluster
create table keyword_clusters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  company_id uuid references companies(id),
  name text not null,
  primary_keyword text,
  target_word_count int default 3500,
  status text default 'open',
  created_at timestamptz default now()
);
```

Aktiviere RLS auf allen Tabellen mit Policy: `auth.uid() = user_id`

## Wichtige Hinweise
- KEIN Backend-Code erstellen — das Backend (FastAPI) wird separat entwickelt
- Alle API-Calls gehen ueber den `apiClient.ts` und sind zunaechst als Mock/Placeholder implementiert
- Fuer die Blog-Generierung: API-Call simulieren mit setTimeout + Fake-Progress
- Supabase wird NUR fuer Auth und als temporaere Datenspeicherung verwendet
- Spaeter wird die App auf ein separates FastAPI Backend umgestellt
- Verwende stock photos von Unsplash als Platzhalter wo noetig
- Verwende Lucide React Icons, installiere keine anderen Icon-Libraries
