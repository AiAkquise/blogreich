"""Blog generation service — Claude API pipeline with Supabase status updates."""

import asyncio
import json
import re
from typing import Any

import anthropic
from tavily import TavilyClient

from app.blogs.prompts import (
    CONCLUSION_SYSTEM_PROMPT,
    INTRO_SYSTEM_PROMPT,
    OUTLINE_SYSTEM_PROMPT,
    SECTION_SYSTEM_PROMPT,
    build_conclusion_prompt,
    build_intro_prompt,
    build_outline_prompt,
    build_section_prompt,
    build_style_system_prompt,
)
from app.blogs.schemas import BlogGenerateRequest
from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.supabase_client import db_query, db_update

logger = get_logger(__name__)


async def update_blog_status(
    blog_id: str,
    user_id: str,
    status: str,
    current_step: str | None,
    progress: float,
    error: str | None = None,
) -> None:
    """Update generation job status in Supabase."""
    data: dict[str, Any] = {
        "status": status,
        "current_step": current_step,
        "progress": progress,
    }
    if error:
        data["error"] = error
    await db_update("generation_jobs", data, {"blog_id": blog_id, "user_id": user_id})


def _call_claude(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 2000,
) -> str:
    """Synchronous Claude API call (to be wrapped in asyncio.to_thread)."""
    settings = get_settings()
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=max_tokens,
        system=[{
            "type": "text",
            "text": system_prompt,
            "cache_control": {"type": "ephemeral"},
        }],
        messages=[{"role": "user", "content": user_prompt}],
    )
    return response.content[0].text  # type: ignore[union-attr]


def _extract_json(text: str) -> dict[str, Any]:
    """Extract JSON object from Claude response, handling markdown code blocks."""
    # Try to find JSON in code blocks first
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        return json.loads(match.group(1))  # type: ignore[no-any-return]
    # Try raw JSON
    return json.loads(text)  # type: ignore[no-any-return]


def _build_style_context(style_profile: dict[str, Any]) -> str:
    """Build a rich style context string from structured style profile data.

    Extracts and formats tonality, formality, address form, vocabulary,
    brand values, and writing guidelines into a cohesive instruction
    for the LLM. Falls back to text summary if structured data is missing.

    Args:
        style_profile: Dict with "text" (str) and optional "data" (dict) keys.

    Returns:
        Formatted style context string, or empty string if no data available.
    """
    data: dict[str, Any] = style_profile.get("data", {})
    text: str = style_profile.get("text", "")

    if not data:
        return text

    parts: list[str] = []

    if summary := data.get("summary"):
        parts.append(f"Zusammenfassung: {summary}")
    if tonality := data.get("tonality"):
        parts.append(f"Tonalitaet: {tonality}")
    if formality := data.get("formality_level"):
        parts.append(f"Formalitaetsgrad: {formality}")
    if address := data.get("address_form"):
        label = {"du": "Du-Ansprache", "Sie": "Sie-Ansprache", "neutral": "Neutrale Ansprache"}
        parts.append(f"Ansprache: {label.get(address, address)}")
    if sentence_style := data.get("sentence_style"):
        parts.append(f"Satzstil: {sentence_style}")
    if (vocab := data.get("vocabulary")) and isinstance(vocab, list) and vocab:
        parts.append(f"Fachvokabular (unbedingt verwenden): {', '.join(vocab)}")
    if (values := data.get("brand_values")) and isinstance(values, list) and values:
        parts.append(f"Markenwerte: {', '.join(values)}")
    if (themes := data.get("content_themes")) and isinstance(themes, list) and themes:
        parts.append(f"Kernthemen: {', '.join(themes)}")
    if guidelines := data.get("writing_guidelines"):
        parts.append(f"Schreibrichtlinien: {guidelines}")

    return "\n".join(parts) if parts else text


async def _get_context_material(
    content_source: str,
    title: str,
    source_url: str | None,
) -> str | None:
    """Fetch additional context material based on content source."""
    settings = get_settings()

    if content_source == "realtime":
        tavily = TavilyClient(api_key=settings.tavily_api_key)
        search_results = await asyncio.to_thread(
            tavily.search, query=title, max_results=5
        )
        results = search_results.get("results", [])
        formatted = []
        for r in results:
            formatted.append(f"**{r.get('title', '')}**\n{r.get('content', '')}")
        return "\n\n---\n\n".join(formatted) if formatted else None

    if content_source == "url" and source_url:
        tavily = TavilyClient(api_key=settings.tavily_api_key)
        extracted = await asyncio.to_thread(tavily.extract, urls=[source_url])
        results = extracted.get("results", [])
        if results and results[0].get("raw_content"):
            return results[0]["raw_content"][:5000]  # type: ignore[no-any-return]

    return None


def _calculate_seo_score(
    content: str,
    primary_keyword: str | None,
    secondary_keywords: list[str],
) -> int:
    """Calculate a basic SEO score (0-100) based on keyword presence and structure."""
    score = 50  # Base score

    content_lower = content.lower()

    # H2 headings present
    h2_count = content.count("## ")
    if h2_count >= 3:
        score += 10
    elif h2_count >= 1:
        score += 5

    # Word count bonus
    word_count = len(content.split())
    if word_count >= 1500:
        score += 10
    elif word_count >= 800:
        score += 5

    # Primary keyword check
    if primary_keyword:
        kw_lower = primary_keyword.lower()
        kw_count = content_lower.count(kw_lower)
        if kw_count >= 5:
            score += 15
        elif kw_count >= 2:
            score += 10
        elif kw_count >= 1:
            score += 5

    # Secondary keywords
    if secondary_keywords:
        found = sum(1 for kw in secondary_keywords if kw.lower() in content_lower)
        ratio = found / len(secondary_keywords)
        score += int(ratio * 15)

    return min(score, 100)


def _assemble_markdown(
    title: str,
    intro: str,
    sections: list[str],
    conclusion: str,
) -> str:
    """Assemble the final markdown blog content."""
    parts = [f"# {title}", "", intro, ""]
    for section in sections:
        parts.append(section)
        parts.append("")
    parts.append(conclusion)
    return "\n".join(parts)


async def generate_blog(request: BlogGenerateRequest, user_id: str) -> None:
    """Run blog generation pipeline as a background task.

    Updates Supabase status at each step. Individual sections may fail
    without aborting the entire pipeline.

    Args:
        request: Blog generation parameters.
        user_id: Authenticated user's ID.
    """
    blog_id = request.blog_id

    logger.info(
        "blog.generation_started",
        blog_id=blog_id,
        user_id=user_id,
        title=request.title,
    )

    try:
        # 1. Create generation job
        from app.core.supabase_client import db_insert
        await db_insert("generation_jobs", {
            "user_id": user_id,
            "blog_id": blog_id,
            "status": "running",
            "current_step": "outline",
            "progress": 0.1,
        })

        # 2. Load company style profile if provided
        style_context: str | None = None
        if request.company_id:
            result = await db_query(
                "companies",
                {"id": request.company_id, "user_id": user_id},
            )
            if result.data:
                company_data = result.data[0]
                sp = company_data.get("style_profile")
                if sp and isinstance(sp, dict):
                    style_context = _build_style_context(sp)
                    logger.info(
                        "blog.style_profile_loaded",
                        blog_id=blog_id,
                        company_id=request.company_id,
                        has_structured_data=bool(sp.get("data")),
                    )
                else:
                    logger.info(
                        "blog.style_profile_missing",
                        blog_id=blog_id,
                        company_id=request.company_id,
                    )
        else:
            logger.info(
                "blog.style_profile_skipped",
                blog_id=blog_id,
            )

        # 3. Build style-enriched system prompts (cached across pipeline steps)
        styled_outline_prompt = build_style_system_prompt(OUTLINE_SYSTEM_PROMPT, style_context)
        styled_section_prompt = build_style_system_prompt(SECTION_SYSTEM_PROMPT, style_context)
        styled_intro_prompt = build_style_system_prompt(INTRO_SYSTEM_PROMPT, style_context)
        styled_conclusion_prompt = build_style_system_prompt(
            CONCLUSION_SYSTEM_PROMPT, style_context
        )

        # 4. Fetch context material
        context_material = await _get_context_material(
            request.content_source, request.title, request.source_url
        )

        # 5. Generate outline
        await update_blog_status(blog_id, user_id, "running", "outline", 0.1)

        outline_prompt = build_outline_prompt(
            title=request.title,
            primary_keyword=request.primary_keyword,
            secondary_keywords=request.secondary_keywords,
            context_material=context_material,
            target_word_count=request.target_word_count,
            language=request.language,
            tone=request.tone,
        )

        outline_text = await asyncio.to_thread(
            _call_claude, styled_outline_prompt, outline_prompt, 2000
        )
        parsed_outline = _extract_json(outline_text)
        sections_spec = parsed_outline.get("sections", [])

        if not sections_spec:
            raise ValueError("Outline generation returned no sections")

        logger.info("blog.outline_completed", blog_id=blog_id, sections=len(sections_spec))

        # 5. Generate sections
        await update_blog_status(blog_id, user_id, "running", "sections", 0.2)

        sections_content: list[str] = []
        failed_sections: list[int] = []

        for i, section in enumerate(sections_spec):
            try:
                section_prompt = build_section_prompt(
                    section=section,
                    primary_keyword=request.primary_keyword,
                    secondary_keywords=request.secondary_keywords,
                    language=request.language,
                    tone=request.tone,
                )
                section_text = await asyncio.to_thread(
                    _call_claude, styled_section_prompt, section_prompt, 1500
                )
                sections_content.append(section_text)
            except Exception as e:
                logger.warning(
                    "blog.section_generation_failed",
                    blog_id=blog_id,
                    section_index=i,
                    error=str(e),
                )
                failed_sections.append(i)
                h2 = section.get("h2", f"Abschnitt {i + 1}")
                sections_content.append(
                    f"## {h2}\n\n*Dieser Abschnitt wird nachgereicht.*"
                )

            progress = 0.2 + (0.5 * (i + 1) / len(sections_spec))
            await update_blog_status(blog_id, user_id, "running", "sections", progress)

        # 6. Generate introduction
        await update_blog_status(blog_id, user_id, "running", "intro", 0.75)

        outline_summary = "\n".join(
            f"- {s.get('h2', '')}" for s in sections_spec
        )
        intro_prompt = build_intro_prompt(
            title=request.title,
            outline_summary=outline_summary,
            primary_keyword=request.primary_keyword,
            language=request.language,
            tone=request.tone,
        )
        intro_text = await asyncio.to_thread(
            _call_claude, styled_intro_prompt, intro_prompt, 800
        )

        # 7. Generate conclusion
        await update_blog_status(blog_id, user_id, "running", "conclusion", 0.85)

        sections_summary = "\n".join(
            s[:200] + "..." if len(s) > 200 else s for s in sections_content
        )
        conclusion_prompt = build_conclusion_prompt(
            title=request.title,
            sections_summary=sections_summary,
            primary_keyword=request.primary_keyword,
            language=request.language,
            tone=request.tone,
        )
        conclusion_text = await asyncio.to_thread(
            _call_claude, styled_conclusion_prompt, conclusion_prompt, 800
        )

        # 8. Assemble final content
        full_content = _assemble_markdown(
            title=request.title,
            intro=intro_text,
            sections=sections_content,
            conclusion=conclusion_text,
        )
        word_count = len(full_content.split())
        seo_score = _calculate_seo_score(
            full_content, request.primary_keyword, request.secondary_keywords
        )

        # 9. Save to Supabase
        blog_update_data: dict[str, Any] = {
            "content": full_content,
            "actual_word_count": word_count,
            "seo_score": seo_score,
            "status": "review",
        }
        if failed_sections:
            blog_update_data["failed_sections"] = failed_sections

        await db_update("blogs", blog_update_data, {"id": blog_id, "user_id": user_id})

        await update_blog_status(blog_id, user_id, "completed", "done", 1.0)

        logger.info(
            "blog.generation_completed",
            blog_id=blog_id,
            word_count=word_count,
            seo_score=seo_score,
            failed_sections=failed_sections,
        )

    except Exception as e:
        logger.error(
            "blog.generation_failed",
            blog_id=blog_id,
            error=str(e),
            error_type=type(e).__name__,
            exc_info=True,
        )
        try:
            await update_blog_status(
                blog_id, user_id, "failed", None, 0.0, error=str(e)
            )
            await db_update(
                "blogs",
                {"status": "draft"},
                {"id": blog_id, "user_id": user_id},
            )
        except Exception:
            logger.error("blog.status_update_after_failure_failed", exc_info=True)
