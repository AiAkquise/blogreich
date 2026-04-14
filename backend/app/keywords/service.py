"""Keyword research service — Claude API for topic discovery and keyword scoring."""

import asyncio
import json
import re
from typing import Any
from uuid import uuid4

import anthropic

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.supabase_client import db_insert, db_query
from app.keywords.schemas import KeywordResearchResponse, KeywordResult

logger = get_logger(__name__)

TOPIC_SYSTEM_PROMPT = """Du bist ein SEO-Experte. Basierend auf den Unternehmensdaten,
schlage EIN relevantes Blog-Thema vor (3-5 Woerter).

Antworte NUR mit JSON:
{"topic": "..."}"""

KEYWORD_SYSTEM_PROMPT = """Du bist ein SEO-Keyword-Researcher. Erstelle 20-30 Long-Tail Keywords
fuer das gegebene Thema und Unternehmen. Bewerte jedes Keyword mit einem Score von 1-10:

Scoring-Kriterien:
- 9-10: Perfekter Business-Fit + hohes Suchvolumen + geringe Konkurrenz
- 7-8: Guter Business-Fit + moderates Suchvolumen
- 5-6: Relevantes Thema, aber generisch oder hohe Konkurrenz
- 1-4: Schwacher Bezug zum Unternehmen

Antworte NUR mit JSON:
{
  "cluster_name": "Themenbereich (2-4 Woerter)",
  "primary_keyword": "Wichtigstes Keyword",
  "keywords": [
    {"keyword": "long tail keyword beispiel", "score": 8},
    {"keyword": "weiteres keyword", "score": 7}
  ]
}"""


def _call_claude_json(system_prompt: str, user_prompt: str) -> dict[str, Any]:
    """Call Claude and parse JSON response (sync, wrap in to_thread)."""
    settings = get_settings()
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    response = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=2000,
        system=[{
            "type": "text",
            "text": system_prompt,
            "cache_control": {"type": "ephemeral"},
        }],
        messages=[{"role": "user", "content": user_prompt}],
    )

    text = response.content[0].text  # type: ignore[union-attr]

    # Extract JSON from possible markdown code blocks
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    raw = match.group(1) if match else text
    return json.loads(raw)  # type: ignore[no-any-return]


async def research_keywords(
    company_id: str,
    user_id: str,
    topic: str | None = None,
) -> KeywordResearchResponse:
    """Research keywords for a company and topic.

    Pipeline:
    1. Load company data from Supabase
    2. If no topic given, generate one via Claude
    3. Generate 20-30 keywords with scores in one Claude call
    4. Filter keywords with score >= 7
    5. Save cluster and keywords to Supabase

    Args:
        company_id: Company to research keywords for.
        user_id: Authenticated user's ID.
        topic: Optional topic (auto-generated if not provided).

    Returns:
        KeywordResearchResponse with cluster and scored keywords.
    """
    logger.info(
        "keyword.research_started",
        company_id=company_id,
        user_id=user_id,
        topic=topic,
    )

    # 1. Load company data
    result = await db_query(
        "companies",
        {"id": company_id, "user_id": user_id},
    )
    if not result.data:
        raise ValueError(f"Company {company_id} not found")

    company = result.data[0]
    company_context = (
        f"Unternehmen: {company.get('name', '')}\n"
        f"Branche: {company.get('industry', '')}\n"
        f"Zielgruppe: {company.get('target_audience', '')}\n"
        f"Beschreibung: {company.get('description', '')}"
    )

    # 2. Generate topic if not provided
    if not topic:
        topic_result = await asyncio.to_thread(
            _call_claude_json,
            TOPIC_SYSTEM_PROMPT,
            f"Unternehmensdaten:\n{company_context}\n\nSchlage ein Blog-Thema vor.",
        )
        topic = topic_result.get("topic", "Allgemeines Thema")
        logger.info("keyword.topic_generated", topic=topic)

    # 3. Generate keywords + scoring in one call
    keyword_result = await asyncio.to_thread(
        _call_claude_json,
        KEYWORD_SYSTEM_PROMPT,
        (
            f"Unternehmensdaten:\n{company_context}\n\n"
            f"Thema: {topic}\n\n"
            f"Erstelle 20-30 Long-Tail Keywords mit Scores."
        ),
    )

    cluster_name: str = keyword_result.get("cluster_name", topic)
    primary_keyword: str = keyword_result.get("primary_keyword", topic)
    raw_keywords: list[dict[str, Any]] = keyword_result.get("keywords", [])

    # 4. Filter score >= 7
    filtered = [
        KeywordResult(keyword=kw["keyword"], score=kw["score"])
        for kw in raw_keywords
        if kw.get("score", 0) >= 7
    ]

    logger.info(
        "keyword.scoring_completed",
        total=len(raw_keywords),
        filtered=len(filtered),
    )

    # 5. Save cluster to Supabase
    cluster_id = str(uuid4())
    await db_insert("keyword_clusters", {
        "id": cluster_id,
        "user_id": user_id,
        "company_id": company_id,
        "name": cluster_name,
        "primary_keyword": primary_keyword,
        "topic": topic,
    })

    # Save individual keywords
    for kw in filtered:
        await db_insert("keywords", {
            "id": str(uuid4()),
            "user_id": user_id,
            "cluster_id": cluster_id,
            "keyword": kw.keyword,
            "score": kw.score,
        })

    logger.info(
        "keyword.research_completed",
        company_id=company_id,
        cluster_id=cluster_id,
        keywords_saved=len(filtered),
    )

    return KeywordResearchResponse(
        cluster_id=cluster_id,
        cluster_name=cluster_name,
        primary_keyword=primary_keyword,
        keywords=filtered,
    )
