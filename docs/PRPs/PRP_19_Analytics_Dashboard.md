# PRP #19: Analytics Dashboard — Nutzungsstatistiken, Content-Metriken und Trends

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P3 (Differenzierung — gibt Nutzern Einblick in ihre Content-Performance)
**Geschaetzte Komplexitaet:** Medium
**Betroffene Dateien:** 3 (1 Backend + 2 Frontend)
**Abhaengigkeiten:** PRP #09 (Stripe — usage_tracking Tabelle als Datenbasis)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Das aktuelle Dashboard (Zeile 28-60 in `Dashboard.tsx`) zeigt nur 4 einfache Zahlen: Gesamt-Blogs, Entwuerfe, Veroeffentlicht, Unternehmen. Das ist wie ein Armaturenbrett das nur den Kilometerstand anzeigt — keine Geschwindigkeit, kein Tankstand, keine Temperatur.

Nutzer wollen wissen:
- Wie viele Blogs habe ich diesen Monat erstellt? (Trend ueber Zeit)
- Wie hoch ist mein durchschnittlicher SEO-Score?
- Welches Unternehmen hat die meisten Blogs?
- Wie viele Woerter habe ich insgesamt generiert?
- Wie viel meines Plan-Kontingents habe ich verbraucht?
- Welche Keywords nutze ich am haeufigsten?

### Die Loesung

Wir erweitern das Dashboard um ein **Analytics-Panel** mit visuellen Charts (Recharts) und aussagekraeftigen Metriken:

1. **KPI-Cards:** Blogs diesen Monat, Woerter generiert, Durchschnittlicher SEO-Score, Plan-Auslastung
2. **Blogs pro Monat Chart:** Balkendiagramm der letzten 6 Monate
3. **Top Keywords:** Die 10 am haeufigsten verwendeten Keywords
4. **Top Unternehmen:** Blogs pro Unternehmen (Tortendiagramm)
5. **SEO-Score Verteilung:** Wie viele Blogs haben Score 0-40, 40-70, 70-100

Alle Daten kommen direkt aus Supabase (keine neue Tabelle noetig) — wir aggregieren die bestehenden `blogs` und `usage_tracking` Daten.

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **KPI** | "Key Performance Indicator" — eine wichtige Kennzahl die zeigt, wie gut etwas laeuft. Z.B. "25 Blogs diesen Monat" ist ein KPI fuer die Content-Produktion. |
| **Recharts** | Eine React-Library fuer Diagramme (Charts). Bereits im Projekt installiert (`recharts` in package.json). Ermoeglicht Balken-, Linien-, Torten- und Flaechendiagramme. |
| **Aggregation** | Das Zusammenfassen von vielen Datensaetzen zu einer Kennzahl. Z.B. "Wie viele Blogs wurden im April erstellt?" → Zaehle alle Blogs mit `created_at` im April. |
| **Supabase Aggregation** | Supabase unterstuetzt einfache Aggregationen direkt in Queries: `.select('count')`, `.gte('created_at', '2026-04-01')`. Fuer komplexere Aggregationen nutzen wir eine RPC-Funktion (SQL-Funktion in der Datenbank). |
| **RPC (Remote Procedure Call)** | Eine Funktion die wir in Supabase definieren und vom Backend aus aufrufen. Anstatt viele einzelne Queries zu machen, schreiben wir EINE SQL-Funktion die alle Statistiken auf einmal berechnet. |
| **Time Series / Zeitreihe** | Daten die ueber die Zeit aufgetragen werden. "Blogs pro Monat" ist eine Zeitreihe: Januar 12, Februar 8, Maerz 15, April 22. |
| **Responsive Grid** | Das Layout passt sich der Bildschirmgroesse an. Auf dem Desktop: 4 KPI-Cards nebeneinander. Auf dem Handy: 2x2 oder 1x4 untereinander. |

---

## Ziel

Das bestehende Dashboard um aussagekraeftige Analytics erweitern: KPI-Cards, Zeitreihen-Charts, Keyword-Cloud und Plan-Auslastung. Alle Daten werden aus bestehenden Supabase-Tabellen aggregiert — keine neuen Tabellen noetig.

## User Story

Als Blogreich-Nutzer
moechte ich auf meinem Dashboard sehen, wie viele Blogs ich erstellt habe, wie gut mein SEO ist und wie viel von meinem Plan-Kontingent ich verbraucht habe
damit ich meine Content-Produktion planen und optimieren kann.

## Scope

### In Scope
- **KPI-Cards:** Blogs diesen Monat, Gesamte Woerter, Durchschnitt SEO-Score, Plan-Auslastung (%)
- **Blogs pro Monat:** Balkendiagramm (letzte 6 Monate) mit Recharts
- **Top Keywords:** Top-10 Keywords als Tabelle oder Tag-Cloud
- **Blogs pro Unternehmen:** Tortendiagramm (Recharts PieChart)
- **SEO-Score Verteilung:** Balkendiagramm (schlecht/mittel/gut)
- **Backend: Aggregations-Endpoint** der alle Stats in einem Call liefert
- **Supabase RPC-Funktion** fuer effiziente Datenbank-Aggregation

### Out of Scope
- Echtzeit-Updates (kein WebSocket — Daten werden beim Laden der Seite geholt)
- Export der Analytics als CSV/PDF
- Traffic-Analytics (Google Analytics Integration)
- Content-Performance (welche Blogs werden am meisten gelesen — wir haben kein Tracking)
- Kosten-Analytics (wie viel hat die KI-Generierung gekostet)
- Vergleich mit Vorperiode (z.B. "20% mehr Blogs als letzten Monat")

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `project/src/pages/Dashboard.tsx` | Bestehende Stats erweitern, Charts hinzufuegen | Gesamte Datei (erweitern, nicht ersetzen) |
| `backend/app/blogs/routes.py` | Neuer Endpoint `GET /api/blogs/analytics` | Ende der Datei |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `project/src/components/AnalyticsCharts.tsx` | Recharts-basierte Chart-Komponenten (wiederverwendbar) |

---

## Technischer Plan

### Schritt 1: Supabase — Analytics RPC-Funktion erstellen (MANUELL)

**Wo:** Supabase Dashboard → SQL Editor
**Was:** Eine SQL-Funktion die alle Dashboard-Statistiken in einem einzigen Aufruf berechnet.

**Erklaerung fuer die Praktikantin:**
Statt 5-6 separate Datenbank-Abfragen zu machen (eine fuer "Blogs diesen Monat", eine fuer "Durchschnitt SEO Score", eine fuer "Top Keywords"...), schreiben wir EINE SQL-Funktion die alles auf einmal berechnet. Das ist schneller und belastet die Datenbank weniger.

**SQL:**
```sql
CREATE OR REPLACE FUNCTION get_user_analytics(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        -- KPIs
        'total_blogs', (SELECT COUNT(*) FROM blogs WHERE user_id = target_user_id),
        'blogs_this_month', (SELECT COUNT(*) FROM blogs WHERE user_id = target_user_id
            AND created_at >= date_trunc('month', CURRENT_DATE)),
        'total_words', (SELECT COALESCE(SUM(actual_word_count), 0) FROM blogs
            WHERE user_id = target_user_id AND actual_word_count > 0),
        'avg_seo_score', (SELECT COALESCE(ROUND(AVG(seo_score)), 0) FROM blogs
            WHERE user_id = target_user_id AND seo_score > 0),
        'total_companies', (SELECT COUNT(*) FROM companies WHERE user_id = target_user_id),

        -- Blogs pro Monat (letzte 6 Monate)
        'blogs_per_month', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object('month', to_char(m, 'YYYY-MM'), 'count', COALESCE(c, 0))
                ORDER BY m
            ), '[]'::jsonb)
            FROM generate_series(
                date_trunc('month', CURRENT_DATE) - interval '5 months',
                date_trunc('month', CURRENT_DATE),
                interval '1 month'
            ) AS m
            LEFT JOIN (
                SELECT date_trunc('month', created_at) AS month, COUNT(*) AS c
                FROM blogs WHERE user_id = target_user_id
                GROUP BY date_trunc('month', created_at)
            ) AS bc ON m = bc.month
        ),

        -- Top 10 Keywords
        'top_keywords', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object('keyword', kw, 'count', cnt)
                ORDER BY cnt DESC
            ), '[]'::jsonb)
            FROM (
                SELECT primary_keyword AS kw, COUNT(*) AS cnt
                FROM blogs
                WHERE user_id = target_user_id
                  AND primary_keyword IS NOT NULL
                  AND primary_keyword != ''
                GROUP BY primary_keyword
                ORDER BY cnt DESC
                LIMIT 10
            ) AS top_kw
        ),

        -- Blogs pro Unternehmen
        'blogs_per_company', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object('company', COALESCE(c.name, 'Ohne Unternehmen'), 'count', cnt)
                ORDER BY cnt DESC
            ), '[]'::jsonb)
            FROM (
                SELECT company_id, COUNT(*) AS cnt
                FROM blogs
                WHERE user_id = target_user_id
                GROUP BY company_id
            ) AS bc
            LEFT JOIN companies c ON bc.company_id = c.id
        ),

        -- SEO Score Verteilung
        'seo_distribution', jsonb_build_object(
            'low', (SELECT COUNT(*) FROM blogs WHERE user_id = target_user_id AND seo_score > 0 AND seo_score < 40),
            'medium', (SELECT COUNT(*) FROM blogs WHERE user_id = target_user_id AND seo_score >= 40 AND seo_score < 70),
            'high', (SELECT COUNT(*) FROM blogs WHERE user_id = target_user_id AND seo_score >= 70)
        ),

        -- Status-Verteilung
        'status_counts', jsonb_build_object(
            'draft', (SELECT COUNT(*) FROM blogs WHERE user_id = target_user_id AND status = 'draft'),
            'review', (SELECT COUNT(*) FROM blogs WHERE user_id = target_user_id AND status = 'review'),
            'published', (SELECT COUNT(*) FROM blogs WHERE user_id = target_user_id AND status = 'published')
        )
    ) INTO result;

    RETURN result;
END;
$$;

COMMENT ON FUNCTION get_user_analytics IS 'Aggregated analytics for user dashboard: KPIs, charts, top keywords.';
```

**Schritt-fuer-Schritt fuer die Praktikantin:**
1. Supabase Dashboard → SQL Editor → New Query
2. SQL oben einfuegen → Run
3. **Erwartet:** "Success. No rows returned"
4. Testen: In einem neuen Query ausfuehren:
   ```sql
   SELECT get_user_analytics('DEINE-USER-ID-HIER'::uuid);
   ```
   **Erwartet:** JSON-Objekt mit allen Statistiken

**Done-Kriterien:**
- [ ] RPC-Funktion `get_user_analytics` existiert
- [ ] Gibt JSON mit allen Statistiken zurueck
- [ ] Funktioniert auch fuer Nutzer ohne Blogs (leere Arrays, Nullen)

---

### Schritt 2: Backend — Analytics Endpoint

**Datei:** `backend/app/blogs/routes.py`
**Was:** Neuer Endpoint der die RPC-Funktion aufruft und die Ergebnisse zurueckgibt.

```python
@router.get("/analytics")
async def get_analytics(
    user_id: str = Depends(get_current_user_id),
) -> dict:
    """Get aggregated analytics for the user dashboard.

    Returns KPIs, monthly blog counts, top keywords,
    company distribution, and SEO score distribution.
    """
    from app.core.supabase_client import rpc_call
    results = await rpc_call("get_user_analytics", {"target_user_id": user_id})
    if results and isinstance(results, list):
        return results[0] if results else {}
    return results or {}
```

**Hinweis:** Die `rpc_call` Funktion wurde in PRP #12 (Style RAG) eingefuehrt. Falls sie noch nicht existiert, muss sie in `supabase_client.py` ergaenzt werden.

**Done-Kriterien:**
- [ ] `GET /api/blogs/analytics` gibt aggregierte Statistiken zurueck
- [ ] JWT-geschuetzt
- [ ] Funktioniert auch fuer neue Nutzer (leere Daten)

---

### Schritt 3: Frontend — AnalyticsCharts Komponente

**Datei:** `project/src/components/AnalyticsCharts.tsx` (NEU)
**Was:** Wiederverwendbare Chart-Komponenten basierend auf Recharts (bereits installiert).

**Erklaerung fuer die Praktikantin:**
Recharts ist eine React-Chart-Library die wir bereits im Projekt haben (`recharts` in package.json). Wir erstellen drei Chart-Typen als eigene Komponenten:
1. **MonthlyBlogsChart:** Balkendiagramm der Blogs pro Monat
2. **CompanyPieChart:** Tortendiagramm der Blogs pro Unternehmen
3. **SeoDistributionChart:** Balkendiagramm der SEO-Score-Verteilung

**Implementierung:**
```typescript
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// Farben fuer die Charts (passend zum Blogreich-Theme)
const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

interface MonthlyBlogsChartProps {
  data: Array<{ month: string; count: number }>;
}

export function MonthlyBlogsChart({ data }: MonthlyBlogsChartProps) {
  const formatted = data.map(d => ({
    ...d,
    label: new Date(d.month + '-01').toLocaleDateString('de-DE', { month: 'short' }),
  }));
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={formatted}>
        <XAxis dataKey="label" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
// ... CompanyPieChart und SeoDistributionChart analog
```

**Done-Kriterien:**
- [ ] `MonthlyBlogsChart` rendert Balkendiagramm
- [ ] `CompanyPieChart` rendert Tortendiagramm mit Legende
- [ ] `SeoDistributionChart` rendert 3 Balken (Schlecht/Mittel/Gut)
- [ ] Alle Charts sind responsive (passen sich der Breite an)
- [ ] Dark Mode Support (Texte/Achsen in heller Farbe)
- [ ] `npx tsc --noEmit` fehlerfrei

---

### Schritt 4: Frontend — Dashboard erweitern

**Datei:** `project/src/pages/Dashboard.tsx`
**Was:** Das bestehende Dashboard um die Analytics-Sektion erweitern. Die bestehenden 4 Stat-Cards bleiben, darunter kommen die Charts.

**Erklaerung fuer die Praktikantin:**
Wir aendern das bestehende Dashboard NICHT grundlegend — wir ERWEITERN es. Die oberen 4 Karten (Gesamt-Blogs, Entwuerfe, Veroeffentlicht, Unternehmen) bleiben. Darunter kommt ein neuer Bereich "Analytics" mit den Charts.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard                                                    │
│                                                             │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│ │ 42        │ │ 15        │ │ 12        │ │ 3         │   │
│ │ Gesamt    │ │ Entwuerfe │ │ Published │ │ Firmen    │   │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
│                                                             │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│ │ 8         │ │ 124.500   │ │ 72        │ │ 80%       │   │
│ │ Diesen    │ │ Woerter   │ │ SEO Score │ │ Plan      │   │
│ │ Monat     │ │ gesamt    │ │ Schnitt   │ │ genutzt   │   │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
│                                                             │
│ Blogs pro Monat                  Top Keywords               │
│ ┌─────────────────────────┐  ┌──────────────────────┐      │
│ │ █                       │  │ 1. SEO (12x)         │      │
│ │ █ █                     │  │ 2. Marketing (8x)    │      │
│ │ █ █   █                 │  │ 3. KI Tools (5x)     │      │
│ │ █ █ █ █   █             │  │ 4. Content (4x)      │      │
│ │ █ █ █ █ █ █             │  │ 5. WordPress (3x)    │      │
│ │ N D J F M A             │  │                      │      │
│ └─────────────────────────┘  └──────────────────────┘      │
│                                                             │
│ Blogs pro Unternehmen        SEO-Score Verteilung           │
│ ┌─────────────────────────┐  ┌──────────────────────┐      │
│ │      ██████             │  │ ██                   │      │
│ │    ████████████         │  │ ████████             │      │
│ │  ████████████████       │  │ ██████████████████   │      │
│ │    ████████████         │  │ < 40   40-70   70+   │      │
│ │      ██████             │  │                      │      │
│ └─────────────────────────┘  └──────────────────────┘      │
│                                                             │
│ Letzte Blogs (bestehend)                                    │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

**Neue Daten laden:**
```typescript
const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

useEffect(() => {
    apiGet<AnalyticsData>('/api/blogs/analytics')
        .then(setAnalytics)
        .catch(() => {});  // Stille Fehlerbehandlung — Analytics sind nice-to-have
}, []);
```

**KPI-Cards (neue Reihe):**
| Card | Wert | Icon | Farbe |
|------|------|------|-------|
| Diesen Monat | `analytics.blogs_this_month` | Calendar | Blau |
| Woerter gesamt | `analytics.total_words` (formatiert: "124.5K") | Type | Lila |
| SEO Score | `analytics.avg_seo_score` + "/100" | TrendingUp | Gruen |
| Plan genutzt | Aus `usage_tracking` (wenn PRP #09 implementiert) | Gauge | Orange |

**Done-Kriterien:**
- [ ] Analytics werden beim Laden des Dashboards abgerufen
- [ ] 4 neue KPI-Cards unter den bestehenden 4
- [ ] MonthlyBlogsChart zeigt Balkendiagramm der letzten 6 Monate
- [ ] Top-Keywords Tabelle zeigt Top-10
- [ ] CompanyPieChart zeigt Blogs pro Unternehmen
- [ ] SeoDistributionChart zeigt Score-Verteilung
- [ ] Wenn Analytics leer (neuer Nutzer): Placeholder "Noch keine Daten"
- [ ] Responsive: Auf Mobile 1 Spalte, auf Desktop 2 Spalten fuer Charts
- [ ] `npx tsc --noEmit` und `npm run build` fehlerfrei

---

## Datenbank-Aenderungen

### Neue RPC-Funktion (manuell in Supabase)

Siehe **Schritt 1** fuer SQL.

**Keine neue Tabelle noetig** — alle Daten kommen aus bestehenden Tabellen (`blogs`, `companies`, `usage_tracking`).

---

## API-Aenderungen

### Neuer Endpoint

| Method | Path | Auth | Beschreibung |
|--------|------|:---:|-------------|
| `GET` | `/api/blogs/analytics` | JWT | Aggregierte Dashboard-Statistiken |

### Response-Format

```json
{
  "total_blogs": 42,
  "blogs_this_month": 8,
  "total_words": 124500,
  "avg_seo_score": 72,
  "total_companies": 3,
  "blogs_per_month": [
    {"month": "2025-11", "count": 5},
    {"month": "2025-12", "count": 12},
    {"month": "2026-01", "count": 8},
    {"month": "2026-02", "count": 15},
    {"month": "2026-03", "count": 10},
    {"month": "2026-04", "count": 8}
  ],
  "top_keywords": [
    {"keyword": "SEO", "count": 12},
    {"keyword": "Marketing", "count": 8}
  ],
  "blogs_per_company": [
    {"company": "Wahlreich e.K.", "count": 20},
    {"company": "Test GmbH", "count": 12},
    {"company": "Ohne Unternehmen", "count": 10}
  ],
  "seo_distribution": {"low": 3, "medium": 12, "high": 27},
  "status_counts": {"draft": 15, "review": 12, "published": 15}
}
```

---

## Frontend-Aenderungen

### Neue Komponente
- `project/src/components/AnalyticsCharts.tsx`

### Geaenderte Datei
- `project/src/pages/Dashboard.tsx` — Analytics-Sektion hinzufuegen

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Test 1: Dashboard mit Daten**
1. Sicherstellen dass mindestens 5-10 Blogs existieren
2. Dashboard oeffnen
3. **Erwartet:** KPI-Cards zeigen korrekte Zahlen
4. **Erwartet:** Balkendiagramm zeigt Blogs pro Monat
5. **Erwartet:** Top-Keywords Liste ist sichtbar
6. **Erwartet:** Tortendiagramm zeigt Unternehmen

**Test 2: Dashboard ohne Daten (neuer Nutzer)**
1. Neuen Account erstellen
2. Dashboard oeffnen
3. **Erwartet:** Alle Werte sind 0, Charts zeigen "Noch keine Daten" Placeholder

**Test 3: Dark Mode**
1. Dark Mode aktivieren
2. Dashboard pruefen
3. **Erwartet:** Charts sind im Dark Mode lesbar (helle Texte, dunkler Hintergrund)

**Test 4: Mobile**
1. Browser DevTools → Mobile View
2. **Erwartet:** Charts sind untereinander (1 Spalte), nicht abgeschnitten

### Validierung

```bash
cd backend && uv run ruff check . && uv run mypy app/ && uv run pytest -v
cd project && npx tsc --noEmit && npm run build
```

---

## Risiken & Offene Fragen

### Risiken
1. **RPC-Performance:** Bei Nutzern mit 1000+ Blogs koennte die Aggregation langsam werden. *Mitigation:* Die SQL-Queries nutzen Indices (user_id Index existiert); bei Bedarf materialized views.
2. **Recharts Bundle-Groesse:** Recharts ist bereits installiert, aber die Imports koennen die Bundle-Groesse erhoehen. *Mitigation:* Nur die benoetigten Komponenten importieren (Tree-Shaking).
3. **Inkonsistente Daten:** Wenn `usage_tracking` (PRP #09) noch nicht implementiert ist, fehlt die Plan-Auslastung. *Mitigation:* Plan-KPI nur anzeigen wenn `usage_tracking` Daten vorhanden.

### Offene Fragen
1. Soll es einen "Analytics" Nav-Eintrag geben oder bleibt alles auf dem Dashboard? (Empfehlung: Auf dem Dashboard — kein separater Nav-Eintrag)
2. Zeitraum-Filter (letzte 30 Tage / 90 Tage / 1 Jahr)? (Empfehlung: Spaeter — V1 zeigt immer "alle Zeit" + "letzter Monat")
3. CSV-Export der Analytics? (Empfehlung: Spaeter)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: Supabase RPC-Funktion (Manuell)
     ↓
Schritt 2: Backend — Analytics Endpoint
     ↓
Schritt 3: Frontend — AnalyticsCharts Komponente
     ↓
Schritt 4: Frontend — Dashboard erweitern
```

**Reihenfolge fuer Claude Code:** 2 (Backend) → 1 (Manuell) → 3 → 4 (Frontend)

---

## Naechster Schritt

```bash
/02-execute docs/PRPs/PRP_19_Analytics_Dashboard.md
```
