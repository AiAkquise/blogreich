# PRP #04: Blog Export — Markdown, HTML und WordPress-kompatibel

## Status: DRAFT
**Erstellt:** 2026-04-29
**Prioritaet:** P1 (Launch-Voraussetzung — Nutzer muessen Blogs ausserhalb der Plattform verwenden koennen)
**Geschaetzte Komplexitaet:** Low
**Betroffene Dateien:** 3 (nur Frontend)

---

## Einfache Erklaerung: Was machen wir und warum?

### Das Problem

Blogreich generiert Blog-Artikel — aber aktuell kann der Nutzer den fertigen Blog nur innerhalb der Plattform lesen. Wenn er ihn auf seiner eigenen Website veroeffentlichen will (z.B. WordPress, Webflow, Squarespace), muss er den Text manuell kopieren und einfuegen. Dabei gehen oft Formatierungen verloren: Ueberschriften, Listen, Fettdruck — alles weg.

Es gibt zwar schon einen "Export"-Button im Blog-Editor, aber:
- Der **HTML-Export** nutzt primitive Regex-Ersetzungen (einfache Textmuster-Suche), die bei komplexerem Markdown fehlschlagen — z.B. verschachtelte Listen, Links in Ueberschriften, Codeblocks
- Es gibt keinen **WordPress-kompatiblen** Export (WordPress nutzt spezielle HTML-Kommentare als Block-Markierungen)
- Der Export hat kein Styling — das exportierte HTML sieht ohne CSS unformatiert aus

### Die Loesung

Wir verbessern den Blog-Export auf drei Wegen:
1. **Markdown-Export** (bereits funktional, bleibt wie bisher)
2. **HTML-Export** mit einer echten Markdown-Parsing-Library (`marked`) statt Regex — korrekte Umwandlung aller Markdown-Elemente
3. **WordPress-Export** — HTML, das direkt in den WordPress Classic Editor eingefuegt werden kann, mit optionalem Inline-Styling

Alle drei Exporte bleiben **rein im Frontend** — kein Backend-Aufruf noetig, weil der Blog-Content bereits als Markdown im Browser vorliegt.

### Technische Begriffe einfach erklaert

| Begriff | Erklaerung |
|---------|-----------|
| **Markdown** | Eine einfache Textformatierung: `# Titel`, `**fett**`, `- Liste`. Unser Blog-Content wird als Markdown gespeichert. Es ist leicht lesbar und kann in HTML umgewandelt werden. |
| **HTML** | Die "Sprache des Webs" — jede Website besteht aus HTML. `<h1>Titel</h1>`, `<strong>fett</strong>`, `<ul><li>Liste</li></ul>`. Browser verstehen HTML und zeigen es formatiert an. |
| **Markdown-to-HTML Parsing** | Die Umwandlung von Markdown in HTML. Z.B. wird `## Ueberschrift` zu `<h2>Ueberschrift</h2>`. Aktuell machen wir das mit Regex (fehleranfaellig), neu mit einer spezialisierten Library (`marked`). |
| **Regex** | "Regular Expressions" — Textmuster zum Suchen und Ersetzen. Z.B. "Finde alles das mit ## anfaengt und ersetze es durch h2-Tags". Problem: Regex versteht die BEDEUTUNG des Textes nicht, nur das Muster. Deshalb scheitert es bei komplexen Faellen. |
| **`marked`** | Eine beliebte JavaScript-Library, die Markdown korrekt in HTML umwandelt. Sie versteht die Markdown-Spezifikation vollstaendig und behandelt auch Spezialfaelle (verschachtelte Listen, Links in Ueberschriften, Codeblocks). |
| **WordPress Classic Editor** | Der aeltere, einfachere Editor in WordPress. Man fuegt HTML direkt ein. Im Gegensatz zum neueren "Gutenberg"-Editor braucht er kein spezielles Format. |
| **Blob** | Ein JavaScript-Objekt, das Rohdaten enthaelt (z.B. eine Datei im Speicher). Wir erstellen einen Blob aus dem exportierten Text und loesen einen "Download" aus — der Browser fragt den Nutzer, wo er die Datei speichern will. |
| **Inline-Styling** | CSS-Stile direkt im HTML-Element: `<h2 style="font-size: 1.5em; font-weight: bold;">`. Normalerweise nutzt man separate CSS-Dateien, aber beim Einfuegen in WordPress/E-Mail-Editoren braucht man Inline-Styles, weil externe CSS-Dateien nicht geladen werden. |

---

## Ziel

Den bestehenden Blog-Export im BlogEditor verbessern: Die primitive Regex-basierte HTML-Konvertierung durch eine echte Markdown-Parsing-Library (`marked`) ersetzen und einen WordPress-kompatiblen Export hinzufuegen.

## User Story

Als Blogreich-Nutzer
moechte ich meinen generierten Blog als sauberes HTML oder WordPress-kompatibles HTML exportieren koennen
damit ich ihn direkt in mein CMS (WordPress, Webflow, etc.) einfuegen kann ohne Formatierungen manuell nachzuarbeiten.

## Scope

### In Scope
- `marked` Library installieren und konfigurieren
- HTML-Export mit korrekter Markdown-Umwandlung (statt Regex)
- WordPress-kompatiblen HTML-Export (mit optionalem Inline-Styling)
- Export-Dropdown im BlogEditor verbessern (3 Optionen statt 2)
- Bestehende `markdownToHtml()` Regex-Funktion durch `marked` ersetzen (auch fuer Preview)

### Out of Scope
- Backend-Endpoint fuer Export (Frontend-only reicht fuer V1)
- WordPress REST API Publishing (kommt in PRP #07)
- PDF-Export
- Gutenberg-Block-Format (zu komplex, Classic Editor reicht)
- Bilder im Export einbetten (Bilder bleiben als URLs, die auf Supabase Storage zeigen)

## Betroffene Dateien

### Bestehende Dateien (aendern)

| Datei | Aenderung | Relevante Zeilen |
|-------|----------|-----------------|
| `project/src/pages/BlogEditor.tsx` | `markdownToHtml()` durch `marked` ersetzen; Export-Dropdown um "WordPress" erweitern; `handleExport()` um WP-Format erweitern | L31-58 (`markdownToHtml`), L178-189 (`handleExport`), L371-385 (Export-Dropdown) |
| `project/package.json` | `marked` Dependency hinzufuegen | Dependencies-Section |

### Neue Dateien (erstellen)

| Datei | Zweck |
|-------|-------|
| `project/src/lib/markdown.ts` | Zentrale Markdown-Utilities: `markdownToHtml()`, `markdownToWordPressHtml()`, `marked`-Konfiguration |

---

## Technischer Plan

### Schritt 1: `marked` Library installieren

**Was:** Die `marked` npm-Library installieren. Sie ist die populaerste Markdown-to-HTML Library fuer JavaScript (30M+ Downloads/Woche, 33k GitHub Stars).

**Erklaerung fuer die Praktikantin:**
Wir installieren ein "Paket" (Library) das Markdown in HTML umwandeln kann. Stell dir vor, du kaufst ein professionelles Uebersetzungsbuch statt selbst mit einem Woerterbuch Wort fuer Wort zu uebersetzen. Das Ergebnis ist besser und zuverlaessiger.

**Manueller Schritt (falls die Praktikantin es ausfuehrt):**
1. Oeffne ein Terminal
2. Navigiere zum Frontend-Ordner: `cd project`
3. Fuehre aus: `npm install marked`
4. Fuehre aus: `npm install -D @types/marked` (TypeScript-Typen)
5. **Pruefe:** `package.json` sollte jetzt `"marked"` in den Dependencies haben

**Fuer Claude Code:**
```bash
cd project && npm install marked @types/marked
```

**Done-Kriterien:**
- [ ] `marked` ist in `project/package.json` unter `dependencies`
- [ ] `@types/marked` ist unter `devDependencies`
- [ ] `npm run build` laeuft ohne Fehler

---

### Schritt 2: Zentrale Markdown-Utilities erstellen

**Datei:** `project/src/lib/markdown.ts` (NEU)
**Was:** Eine zentrale Datei fuer alle Markdown-Umwandlungen. Statt die Logik direkt im BlogEditor zu haben, lagern wir sie aus — so kann sie auch in anderen Teilen der App wiederverwendet werden.

**Erklaerung fuer die Praktikantin:**
Aktuell steht die Markdown-Umwandlung direkt im BlogEditor (Zeile 31-58). Das ist wie ein Rezept, das in einem Kochbuch auf der Seite fuer "Lasagne" steht, obwohl man es auch fuer andere Gerichte braucht. Wir verschieben es in eine eigene Datei (`markdown.ts`), damit es ueberall genutzt werden kann.

**Inhalt:**
```typescript
import { marked } from 'marked';

// Konfiguration: sicher, mit CSS-Klassen fuer Tailwind-Kompatibilitaet
marked.setOptions({
  breaks: true,          // Zeilenumbrueche werden zu <br>
  gfm: true,             // GitHub Flavored Markdown (Tabellen, Strikethrough)
});

/**
 * Wandelt Markdown in sauberes HTML um.
 * Nutzt die `marked` Library fuer korrekte Umwandlung.
 */
export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown) as string;
}

/**
 * Wandelt Markdown in WordPress-kompatibles HTML um.
 * Fuegt optionales Inline-Styling hinzu, damit der Blog
 * beim Einfuegen in den WordPress Classic Editor gut aussieht.
 */
export function markdownToWordPressHtml(markdown: string): string {
  let html = marked.parse(markdown) as string;
  // Inline-Styles fuer WordPress Classic Editor
  html = html
    .replace(/<h1>/g, '<h1 style="font-size: 2em; font-weight: bold; margin: 1em 0 0.5em;">')
    .replace(/<h2>/g, '<h2 style="font-size: 1.5em; font-weight: bold; margin: 1em 0 0.5em;">')
    .replace(/<h3>/g, '<h3 style="font-size: 1.25em; font-weight: bold; margin: 0.8em 0 0.4em;">')
    .replace(/<p>/g, '<p style="margin-bottom: 1em; line-height: 1.7;">')
    .replace(/<ul>/g, '<ul style="margin: 1em 0; padding-left: 2em;">')
    .replace(/<ol>/g, '<ol style="margin: 1em 0; padding-left: 2em;">')
    .replace(/<li>/g, '<li style="margin-bottom: 0.3em;">')
    .replace(/<img /g, '<img style="max-width: 100%; height: auto; margin: 1em 0;" ')
    .replace(/<blockquote>/g, '<blockquote style="border-left: 4px solid #ccc; padding: 0.5em 1em; margin: 1em 0; color: #555;">');
  return html;
}

/**
 * Wandelt Markdown in HTML mit Tailwind-CSS-Klassen um.
 * Fuer die Blog-Preview im Editor.
 */
export function markdownToPreviewHtml(markdown: string): string {
  let html = marked.parse(markdown) as string;
  // Tailwind-Klassen fuer die Preview (wie im aktuellen markdownToHtml)
  html = html
    .replace(/<h1>/g, '<h1 class="text-2xl font-bold mt-8 mb-4 text-surface-900 dark:text-surface-100">')
    .replace(/<h2>/g, '<h2 class="text-xl font-bold mt-8 mb-3 text-surface-900 dark:text-surface-100">')
    .replace(/<h3>/g, '<h3 class="text-lg font-semibold mt-6 mb-2 text-surface-900 dark:text-surface-100">')
    .replace(/<p>/g, '<p class="mb-4 leading-relaxed text-surface-700 dark:text-surface-300">')
    .replace(/<img /g, '<img class="w-full rounded-lg my-4 shadow-sm" loading="lazy" ')
    .replace(/<li>/g, '<li class="ml-4">');
  return html;
}
```

**Done-Kriterien:**
- [ ] `markdownToHtml()` gibt sauberes HTML zurueck (ohne CSS-Klassen)
- [ ] `markdownToWordPressHtml()` gibt HTML mit Inline-Styles zurueck
- [ ] `markdownToPreviewHtml()` gibt HTML mit Tailwind-Klassen zurueck (wie bisher im Editor)
- [ ] Alle Funktionen behandeln: Ueberschriften, Listen, Fett/Kursiv, Links, Bilder, Code-Blocks, Tabellen
- [ ] `npx tsc --noEmit` fehlerfrei

---

### Schritt 3: BlogEditor Export verbessern

**Datei:** `project/src/pages/BlogEditor.tsx`
**Was:**
1. Die alte `markdownToHtml()` Funktion (Zeile 31-58) entfernen
2. Stattdessen `markdownToPreviewHtml` aus `@/lib/markdown` importieren (fuer die Preview)
3. `handleExport()` um WordPress-Format erweitern
4. Export-Dropdown um dritte Option erweitern

**Erklaerung fuer die Praktikantin:**
Wir ersetzen die selbstgebaute, fehleranfaellige Markdown-Umwandlung durch die professionelle `marked`-Library. Und wir fuegen einen dritten Export-Button hinzu: "Als WordPress HTML exportieren".

**Aenderung an `handleExport()` (aktuell Zeile 178-189):**
```typescript
import { markdownToHtml, markdownToWordPressHtml } from '@/lib/markdown';

const handleExport = (format: 'markdown' | 'html' | 'wordpress') => {
  let blob: Blob;
  let filename: string;
  const title = blog?.title || 'blog';

  switch (format) {
    case 'markdown':
      blob = new Blob([content], { type: 'text/markdown' });
      filename = `${title}.md`;
      break;
    case 'html':
      blob = new Blob([markdownToHtml(content)], { type: 'text/html' });
      filename = `${title}.html`;
      break;
    case 'wordpress':
      blob = new Blob([markdownToWordPressHtml(content)], { type: 'text/html' });
      filename = `${title}_wordpress.html`;
      break;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  setShowExport(false);
};
```

**Aenderung am Export-Dropdown (aktuell Zeile 371-385):**
Dritte Option hinzufuegen:
```tsx
<button onClick={() => handleExport('wordpress')} className="...">
  Als WordPress HTML exportieren
</button>
```

**Aenderung an der Preview (aktuell nutzt `markdownToHtml()`):**
Die Preview-Funktion im Editor nutzt `markdownToHtml()` zum Rendern der Vorschau. Diese muss auf `markdownToPreviewHtml()` umgestellt werden:
```typescript
import { markdownToPreviewHtml } from '@/lib/markdown';
// In der Preview-Sektion:
dangerouslySetInnerHTML={{ __html: markdownToPreviewHtml(content) }}
```

**Done-Kriterien:**
- [ ] Alte `markdownToHtml()` Funktion in BlogEditor.tsx entfernt (Zeile 31-58)
- [ ] Preview nutzt `markdownToPreviewHtml()` aus `@/lib/markdown`
- [ ] Export-Dropdown hat 3 Optionen: HTML, Markdown, WordPress
- [ ] HTML-Export liefert sauberes, korrektes HTML (auch bei verschachtelten Listen, Code-Blocks)
- [ ] WordPress-Export liefert HTML mit Inline-Styling
- [ ] Markdown-Export funktioniert wie bisher
- [ ] `npx tsc --noEmit` und `npm run build` fehlerfrei

---

## Datenbank-Aenderungen

**Keine.**

---

## API-Aenderungen

**Keine.** Alle Exporte sind rein Frontend-seitig (Blob-Download).

---

## Frontend-Aenderungen

### Neue Datei
- `project/src/lib/markdown.ts` — Zentrale Markdown-Utilities

### Geaenderte Datei
- `project/src/pages/BlogEditor.tsx` — Export + Preview

### Neue Dependency
- `marked` + `@types/marked`

---

## Testing-Strategie

### Manueller Test (fuer die Praktikantin)

**Voraussetzung:** Frontend laeuft lokal (`cd project && npm run dev`), ein Blog wurde bereits generiert.

**Test 1: Markdown-Export**
1. Blog im Editor oeffnen
2. Export-Button klicken → "Als Markdown exportieren"
3. Datei oeffnen
4. **Erwartet:** Gleicher Text wie im Editor, mit `##`, `**fett**` etc.

**Test 2: HTML-Export**
1. Export-Button → "Als HTML exportieren"
2. Datei im Browser oeffnen (Doppelklick)
3. **Erwartet:** Ueberschriften sind gross und fett, Listen haben Aufzaehlungszeichen, Bilder werden angezeigt, Links sind klickbar

**Test 3: WordPress-Export**
1. Export-Button → "Als WordPress HTML exportieren"
2. Datei im Texteditor oeffnen (z.B. VS Code)
3. **Erwartet:** HTML mit `style="..."` Attributen an jedem Element
4. Optional: In WordPress einfuegen (Classic Editor → "Text"-Tab → HTML einfuegen → "Visuell"-Tab)
5. **Erwartet:** Formatierung sieht sauber aus

**Test 4: Preview im Editor**
1. Blog im Editor oeffnen (Split-View)
2. **Erwartet:** Preview sieht gleich oder besser aus als vorher (Tailwind-Klassen)
3. Teste: Verschachtelte Listen, Fett in Ueberschriften, Code-Blocks, Bilder

**Test 5: Spezialfaelle**
1. Blog mit Tabelle (falls vorhanden) exportieren
2. Blog mit Code-Block exportieren
3. **Erwartet:** Tabellen und Code-Blocks werden korrekt als HTML gerendert (vorher fehlte das!)

### Validierung

```bash
# Frontend
cd project && npx tsc --noEmit && npm run build
```

---

## Risiken & Offene Fragen

### Risiken
1. **`marked` Bundle-Groesse**: `marked` ist ~40KB (minified). Fuer eine SPA ist das akzeptabel. *Mitigation:* Koennte bei Bedarf lazy-loaded werden.
2. **Preview-Regression**: Die neue Preview koennte leicht anders aussehen als die alte (weil `marked` den Markdown anders interpretiert als die Regex-Funktion). *Mitigation:* Visuellen Vergleich machen, Tailwind-Klassen anpassen wenn noetig.
3. **XSS-Sicherheit**: `marked` escaped standardmaessig HTML in Markdown. Wenn ein Nutzer `<script>alert('hack')</script>` in den Content schreibt, wird es escaped. *Mitigation:* Default-Verhalten von `marked` beibehalten (sanitize).

### Offene Fragen
1. Soll der HTML-Export ein vollstaendiges HTML-Dokument sein (mit `<html>`, `<head>`, `<body>`) oder nur den Content-Body? (Empfehlung: Nur Body — der Nutzer fuegt es in sein CMS ein)
2. Sollen die Blog-Bilder als vollstaendige URLs (`https://xyz.supabase.co/...`) oder als relative Pfade exportiert werden? (Empfehlung: Vollstaendige URLs — funktioniert ueberall)

---

## Abhaengigkeits-Diagramm

```
Schritt 1: marked installieren
     ↓
Schritt 2: markdown.ts Utilities erstellen
     ↓
Schritt 3: BlogEditor Export + Preview umstellen
```

**Reihenfolge fuer Claude Code:** 1 → 2 → 3

---

## Naechster Schritt

```bash
# Dieses PRP ausfuehren:
/02-execute docs/PRPs/PRP_04_Blog_Export.md
```
