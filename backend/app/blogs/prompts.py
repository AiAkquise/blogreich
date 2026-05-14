"""System prompts for blog generation pipeline.

Based on the n8n automation prompts, optimized for Claude API.
"""

OUTLINE_SYSTEM_PROMPT = """\
Du bist ein erfahrener SEO-Blog-Stratege. \
Erstelle eine detaillierte Gliederung fuer einen Blog-Artikel.

REGELN:
- Erstelle 5-7 H2-Abschnitte
- Jeder H2-Abschnitt hat 2-4 H3-Unterabschnitte
- Die Gliederung muss SEO-optimiert sein
- Beruecksichtige das Haupt-Keyword und die Neben-Keywords
- Schreibe in der angegebenen Sprache und Tonalitaet

OUTPUT-FORMAT (strikt JSON):
{
  "h1": "Blog-Titel (optimiert fuer SEO)",
  "sections": [
    {
      "h2": "Abschnitts-Ueberschrift",
      "h3": ["Unter-Ueberschrift 1", "Unter-Ueberschrift 2"],
      "key_points": ["Kernaussage 1", "Kernaussage 2"]
    }
  ]
}

Antworte NUR mit dem JSON-Objekt, kein anderer Text."""

SECTION_SYSTEM_PROMPT = """\
Du bist ein professioneller Blog-Autor. \
Schreibe einen einzelnen Blog-Abschnitt.

REGELN:
- Schreibe 450-600 Woerter pro Abschnitt
- Verwende Storytelling und konkrete Beispiele
- Direkte Leser-Ansprache (Du/Sie je nach Tonalitaet)
- Natuerliche Integration der Keywords (kein Keyword-Stuffing)
- Verwende Uebergangsphrasen zwischen Absaetzen
- Markdown-Formatierung: H2 und H3 verwenden
- Fuege wo sinnvoll Aufzaehlungen oder nummerierte Listen ein

OUTPUT: Nur den Markdown-Text des Abschnitts, keine Meta-Kommentare."""

INTRO_SYSTEM_PROMPT = """\
Du bist ein professioneller Blog-Autor. \
Schreibe eine packende Einleitung fuer einen Blog-Artikel.

REGELN:
- 200-280 Woerter
- Starte mit einem Hook (Frage, Statistik, provokante These oder Anekdote)
- Beschreibe das Problem oder die Herausforderung des Lesers
- Preview: Was wird der Leser in diesem Artikel lernen?
- Natuerliche Keyword-Integration
- Direkte Leser-Ansprache

OUTPUT: Nur den Markdown-Text der Einleitung, keine Meta-Kommentare."""

CONCLUSION_SYSTEM_PROMPT = """\
Du bist ein professioneller Blog-Autor. \
Schreibe ein ueberzeugendes Fazit fuer einen Blog-Artikel.

REGELN:
- 200-280 Woerter
- Fasse die wichtigsten Erkenntnisse zusammen (3-5 Bullet Points)
- Call-to-Action: Was soll der Leser als naechstes tun?
- Vermeide woertliche Wiederholungen aus dem Hauptteil
- Enden mit einem inspirierenden oder motivierenden Schlusssatz

OUTPUT: Nur den Markdown-Text des Fazits, keine Meta-Kommentare."""


def build_style_system_prompt(base_prompt: str, style_context: str | None) -> str:
    """Enrich a base system prompt with company style context.

    If style_context is provided, it is appended to the base prompt
    with clear instructions for the LLM to follow the company's
    writing style consistently.

    Args:
        base_prompt: The base system prompt for the pipeline step.
        style_context: Formatted style context string, or None.

    Returns:
        The enriched system prompt, or the base prompt unchanged if no style.
    """
    if not style_context:
        return base_prompt

    return f"""{base_prompt}

UNTERNEHMENS-SCHREIBSTIL (WICHTIG — befolge diese Vorgaben):
{style_context}

Wende diesen Schreibstil konsequent an: Tonalitaet, Ansprache-Form, \
Fachvokabular und Markenstimme muessen sich im gesamten Text widerspiegeln."""


def build_outline_prompt(
    title: str,
    primary_keyword: str | None,
    secondary_keywords: list[str],
    context_material: str | None,
    target_word_count: int,
    language: str,
    tone: str,
) -> str:
    """Build the user prompt for outline generation."""
    parts = [f"Erstelle eine Gliederung fuer folgenden Blog-Artikel:\n\nTitel: {title}"]

    parts.append(f"Sprache: {language}")
    parts.append(f"Tonalitaet: {tone}")
    parts.append(f"Ziel-Wortanzahl: {target_word_count}")

    if primary_keyword:
        parts.append(f"Haupt-Keyword: {primary_keyword}")
    if secondary_keywords:
        parts.append(f"Neben-Keywords: {', '.join(secondary_keywords)}")
    if context_material:
        parts.append(f"\nZusaetzliches Quellmaterial:\n{context_material[:3000]}")

    return "\n".join(parts)


def build_section_prompt(
    section: dict[str, object],
    primary_keyword: str | None,
    secondary_keywords: list[str],
    language: str,
    tone: str,
) -> str:
    """Build the user prompt for a single section."""
    h2 = section.get("h2", "")
    h3_list = section.get("h3", [])
    key_points = section.get("key_points", [])

    parts = [
        f"Schreibe den folgenden Blog-Abschnitt:\n\nH2: {h2}",
        f"Sprache: {language}",
        f"Tonalitaet: {tone}",
    ]

    if h3_list and isinstance(h3_list, list):
        parts.append(f"H3-Unterabschnitte: {', '.join(str(h) for h in h3_list)}")
    if key_points and isinstance(key_points, list):
        parts.append(f"Kernaussagen: {', '.join(str(k) for k in key_points)}")
    if primary_keyword:
        parts.append(f"Haupt-Keyword: {primary_keyword}")
    if secondary_keywords:
        parts.append(f"Neben-Keywords: {', '.join(secondary_keywords)}")

    return "\n".join(parts)


def build_intro_prompt(
    title: str,
    outline_summary: str,
    primary_keyword: str | None,
    language: str,
    tone: str,
) -> str:
    """Build the user prompt for introduction."""
    parts = [
        f"Schreibe die Einleitung fuer folgenden Blog-Artikel:\n\nTitel: {title}",
        f"Sprache: {language}",
        f"Tonalitaet: {tone}",
        f"\nGliederungs-Ueberblick:\n{outline_summary}",
    ]
    if primary_keyword:
        parts.append(f"Haupt-Keyword: {primary_keyword}")
    return "\n".join(parts)


def build_conclusion_prompt(
    title: str,
    sections_summary: str,
    primary_keyword: str | None,
    language: str,
    tone: str,
) -> str:
    """Build the user prompt for conclusion."""
    parts = [
        f"Schreibe das Fazit fuer folgenden Blog-Artikel:\n\nTitel: {title}",
        f"Sprache: {language}",
        f"Tonalitaet: {tone}",
        f"\nZusammenfassung der Abschnitte:\n{sections_summary}",
    ]
    if primary_keyword:
        parts.append(f"Haupt-Keyword: {primary_keyword}")
    return "\n".join(parts)
