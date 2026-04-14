"""Company website analysis service — Tavily map + extract + Claude style analysis."""

import asyncio
import json
import re
from typing import Any

import anthropic
from tavily import TavilyClient

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.supabase_client import db_insert, db_update

logger = get_logger(__name__)

STYLE_ANALYSIS_SYSTEM_PROMPT = """\
Du bist ein Experte fuer Content-Analyse und Schreibstile. \
Analysiere die folgenden Website-Inhalte eines Unternehmens \
und erstelle ein detailliertes Schreibstil-Profil.

Analysiere:
1. **Tonalitaet**: Formell/informell, sachlich/emotional, autoritaer/freundlich
2. **Sprachstil**: Satzlaenge, Fachbegriffe, Anglizismen, Metaphern
3. **Zielgruppen-Ansprache**: Du/Sie, direkt/indirekt, B2B/B2C
4. **Struktur**: Absatzlaenge, Listen-Verwendung, Ueberschriften-Stil
5. **Markenstimme**: Kernwerte, USPs, wiederkehrende Themen
6. **Branchenspezifisches**: Fachvokabular, Compliance-Sprache, technische Tiefe

OUTPUT-FORMAT (strikt JSON):
{
  "summary": "2-3 Saetze Zusammenfassung des Schreibstils",
  "tonality": "...",
  "formality_level": "formal|semi-formal|informal",
  "address_form": "du|Sie|neutral",
  "sentence_style": "...",
  "vocabulary": ["Fachbegriff1", "Fachbegriff2"],
  "brand_values": ["Wert1", "Wert2"],
  "content_themes": ["Thema1", "Thema2"],
  "writing_guidelines": "Konkreter Leitfaden fuer Blog-Autoren, 3-5 Saetze"
}

Antworte NUR mit dem JSON-Objekt."""


async def analyze_company_website(
    company_id: str,
    website_urls: list[str],
    user_id: str,
) -> dict[str, Any]:
    """Analyze company website to extract writing style profile.

    Three phases:
    1. map() — Discover sitemap URLs without downloading content
    2. extract() — Fetch content from the most relevant pages
    3. Claude — Analyze content and create style profile

    Args:
        company_id: Company ID in Supabase.
        website_urls: List of website URLs to analyze.
        user_id: Authenticated user's ID.

    Returns:
        Dict with style_profile, style_data, pages_analyzed, sitemap_urls.
    """
    settings = get_settings()
    tavily = TavilyClient(api_key=settings.tavily_api_key)

    logger.info(
        "company.analysis_started",
        company_id=company_id,
        urls=website_urls,
    )

    # Phase 1: Sitemap Discovery with map()
    discovered_urls: list[str] = []
    for url in website_urls:
        try:
            sitemap = await asyncio.to_thread(
                tavily.map,
                url=url,
                max_depth=1,
                max_breadth=20,
                limit=30,
            )
            discovered_urls.extend(sitemap.get("urls", []))
        except Exception as e:
            logger.warning(
                "company.map_failed",
                url=url,
                error=str(e),
            )

    logger.info(
        "company.map_completed",
        company_id=company_id,
        discovered_count=len(discovered_urls),
    )

    # Phase 2: Extract from relevant pages
    priority_patterns = ["/about", "/ueber", "/leistung", "/service", "/blog", "/team"]
    relevant_urls = [
        u for u in discovered_urls
        if any(p in u.lower() for p in priority_patterns)
    ]
    # Prioritized URLs first, then discovered, always include original URLs
    extract_urls = (relevant_urls[:5] or discovered_urls[:5]) + website_urls
    # Deduplicate while preserving order
    seen: set[str] = set()
    unique_urls: list[str] = []
    for u in extract_urls:
        if u not in seen:
            seen.add(u)
            unique_urls.append(u)
    extract_urls = unique_urls[:10]

    all_content: list[str] = []
    for batch in [extract_urls[i:i + 5] for i in range(0, len(extract_urls), 5)]:
        try:
            result = await asyncio.to_thread(tavily.extract, urls=batch)
            for r in result.get("results", []):
                raw = r.get("raw_content")
                if raw:
                    all_content.append(raw)
        except Exception as e:
            logger.warning(
                "company.extract_failed",
                urls=batch,
                error=str(e),
            )

    if not all_content:
        raise ValueError("Keine Website-Inhalte konnten extrahiert werden")

    logger.info(
        "company.extract_completed",
        company_id=company_id,
        pages_extracted=len(all_content),
    )

    # Phase 3: Claude Style Analysis
    combined_content = "\n\n---\n\n".join(all_content[:5])
    # Truncate to avoid overly long prompts
    if len(combined_content) > 15000:
        combined_content = combined_content[:15000] + "\n\n[... gekuerzt]"

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    def _run_analysis() -> str:
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=1500,
            system=[{
                "type": "text",
                "text": STYLE_ANALYSIS_SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }],
            messages=[{"role": "user", "content": combined_content}],
        )
        return response.content[0].text  # type: ignore[union-attr]

    analysis_text = await asyncio.to_thread(_run_analysis)

    # Parse JSON from response
    try:
        match = re.search(
            r"```(?:json)?\s*(\{.*?\})\s*```", analysis_text, re.DOTALL
        )
        raw_json = match.group(1) if match else analysis_text
        style_data = json.loads(raw_json)
    except json.JSONDecodeError:
        style_data = {"raw_analysis": analysis_text}

    style_text = style_data.get("summary", analysis_text[:500])
    if "writing_guidelines" in style_data:
        style_text += f"\n\nSchreibrichtlinien: {style_data['writing_guidelines']}"

    # Save to Supabase
    await db_update(
        "companies",
        {"style_profile": {"text": style_text, "data": style_data}},
        {"id": company_id, "user_id": user_id},
    )

    # Save crawl results
    await db_insert("crawl_results", {
        "company_id": company_id,
        "user_id": user_id,
        "urls_discovered": discovered_urls[:50],
        "urls_analyzed": extract_urls,
        "pages_count": len(all_content),
    })

    logger.info(
        "company.analysis_completed",
        company_id=company_id,
        pages_analyzed=len(all_content),
    )

    return {
        "style_profile": style_text,
        "style_data": style_data,
        "pages_analyzed": len(all_content),
        "sitemap_urls": discovered_urls[:20],
    }
