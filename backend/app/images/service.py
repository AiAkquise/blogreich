"""Image generation service — section-based FLUX.2 + Supabase Storage."""

import asyncio
import json
import re
from dataclasses import dataclass
from typing import Any
from uuid import uuid4

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.supabase_client import db_insert, db_query, db_update, get_supabase
from app.images.schemas import ImageResult

logger = get_logger(__name__)

SECTION_IMAGE_PROMPT_SYSTEM = """Du bist ein Experte fuer Bild-Prompts fuer KI-Bildgeneratoren.
Erstelle EINEN detaillierten Bild-Prompt fuer den folgenden Blog-Abschnitt.

Regeln:
- Fotorealistisch, professionell, hochwertig
- Passend zum Inhalt des Abschnitts
- Kein Text im Bild, keine Wasserzeichen, keine UI-Elemente
- Sprache: Englisch (Bildgeneratoren verstehen Englisch am besten)
- Breitformat (16:9 Querformat)
- Beschreibende Adjektive fuer Atmosphaere und Stil

Antworte NUR mit JSON: {"prompt": "..."}"""

FAZIT_KEYWORDS = {"fazit", "zusammenfassung", "schluss", "conclusion", "resümee", "abschluss"}


@dataclass
class SectionInfo:
    """Parsed markdown section."""

    index: int
    title: str
    content: str


def _parse_sections(markdown: str) -> list[SectionInfo]:
    """Parse markdown content into sections based on ## headings.

    Args:
        markdown: Full blog markdown content.

    Returns:
        List of SectionInfo with index, title, and truncated content.
    """
    lines = markdown.split("\n")
    sections: list[SectionInfo] = []
    current_title = "Einleitung"
    current_lines: list[str] = []
    section_index = 0

    for line in lines:
        if line.startswith("## "):
            # Save previous section
            content = "\n".join(current_lines).strip()
            if content:
                sections.append(SectionInfo(
                    index=section_index,
                    title=current_title,
                    content=content[:500],
                ))
                section_index += 1

            current_title = line.removeprefix("## ").strip()
            current_lines = []
        elif line.startswith("# ") and section_index == 0:
            # Skip H1 title, don't add to intro content
            continue
        else:
            current_lines.append(line)

    # Last section
    content = "\n".join(current_lines).strip()
    if content:
        # Check if it's a conclusion
        title_lower = current_title.lower()
        if any(kw in title_lower for kw in FAZIT_KEYWORDS):
            current_title = current_title  # Keep original title
        sections.append(SectionInfo(
            index=section_index,
            title=current_title,
            content=content[:500],
        ))

    return sections


def _generate_section_prompt(section: SectionInfo) -> str:
    """Generate a FLUX.2 image prompt for one section via Claude.

    Sync function — wrap in asyncio.to_thread().

    Args:
        section: Parsed section with title and content excerpt.

    Returns:
        English image prompt string.
    """
    import anthropic

    settings = get_settings()
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    response = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=300,
        system=[{
            "type": "text",
            "text": SECTION_IMAGE_PROMPT_SYSTEM,
            "cache_control": {"type": "ephemeral"},
        }],
        messages=[{
            "role": "user",
            "content": (
                f"Abschnitt: {section.title}\n\n"
                f"Inhalt:\n{section.content}"
            ),
        }],
    )

    text = response.content[0].text  # type: ignore[union-attr]

    # Extract JSON
    match = re.search(r"\{.*?\}", text, re.DOTALL)
    if match:
        parsed: dict[str, str] = json.loads(match.group(0))
        return parsed.get("prompt", text)
    return text


async def _submit_flux_task(
    http: httpx.AsyncClient,
    prompt: str,
    model: str,
) -> str:
    """Submit image generation task to FLUX.2 API. Returns polling URL."""
    settings = get_settings()
    response = await http.post(
        f"{settings.bfl_base_url}/{model}",
        headers={
            "x-key": settings.bfl_api_key,
            "Content-Type": "application/json",
        },
        json={"prompt": prompt, "width": 1440, "height": 810},
    )
    response.raise_for_status()
    task_data = response.json()
    polling_url: str = task_data["polling_url"]
    return polling_url


async def _poll_flux_result(
    http: httpx.AsyncClient,
    polling_url: str,
    max_wait: int = 90,
) -> str:
    """Poll FLUX.2 API until image is ready. Returns BFL image URL."""
    settings = get_settings()
    for _ in range(max_wait):
        await asyncio.sleep(1)
        result = await http.get(
            polling_url,
            headers={"x-key": settings.bfl_api_key, "accept": "application/json"},
        )
        data = result.json()
        status = data.get("status", "")

        if status == "Ready":
            sample: str = data["result"]["sample"]
            return sample
        if status in ("Error", "Failed"):
            raise RuntimeError(f"FLUX.2 generation failed: {data}")

    raise TimeoutError("FLUX.2 image generation timed out")


async def _download_and_upload(
    http: httpx.AsyncClient,
    bfl_url: str,
    blog_id: str,
    position: str,
) -> str:
    """Download image from BFL and upload to Supabase Storage.

    Returns:
        Permanent public URL from Supabase Storage.
    """
    settings = get_settings()

    img_response = await http.get(bfl_url)
    img_response.raise_for_status()
    img_bytes = img_response.content

    file_name = f"{blog_id}/{position}_{uuid4().hex[:8]}.jpg"
    supabase = get_supabase()

    await asyncio.to_thread(
        supabase.storage.from_(settings.supabase_storage_bucket).upload,
        file_name,
        img_bytes,
        {"content-type": "image/jpeg"},
    )

    permanent_url = (
        f"{settings.supabase_url}/storage/v1/object/public"
        f"/{settings.supabase_storage_bucket}/{file_name}"
    )
    return permanent_url


async def _update_job_status(
    job_id: str,
    user_id: str,
    status: str,
    completed: int,
    sections_data: list[dict[str, Any]],
) -> None:
    """Update image generation job status in Supabase."""
    await db_update("generation_jobs", {
        "status": status,
        "completed_sections": completed,
        "metadata": {"sections": sections_data},
    }, {"id": job_id, "user_id": user_id})


async def generate_single_image(
    http: httpx.AsyncClient,
    prompt: str,
    blog_id: str,
    section: SectionInfo,
    model: str,
    user_id: str,
) -> ImageResult:
    """Generate one image for a section: FLUX.2 submit → poll → download → upload.

    Args:
        http: Shared httpx client.
        prompt: English image prompt.
        blog_id: Blog this image belongs to.
        section: Section info with index and title.
        model: FLUX.2 model to use.
        user_id: Authenticated user's ID.

    Returns:
        ImageResult with permanent Supabase URL.
    """
    position = f"section_{section.index}"

    logger.info(
        "image.section_generation_started",
        blog_id=blog_id,
        section_index=section.index,
        section_title=section.title,
    )

    polling_url = await _submit_flux_task(http, prompt, model)
    bfl_image_url = await _poll_flux_result(http, polling_url)
    permanent_url = await _download_and_upload(http, bfl_image_url, blog_id, position)

    image_id = str(uuid4())
    await db_insert("blog_images", {
        "id": image_id,
        "blog_id": blog_id,
        "user_id": user_id,
        "image_url": permanent_url,
        "original_bfl_url": bfl_image_url,
        "prompt": prompt,
        "position": position,
    })

    logger.info(
        "image.section_generation_completed",
        blog_id=blog_id,
        section_index=section.index,
        image_id=image_id,
    )

    return ImageResult(
        id=image_id,
        image_url=permanent_url,
        original_bfl_url=bfl_image_url,
        prompt=prompt,
        position=position,
        section_index=section.index,
        section_title=section.title,
    )


async def generate_images_background(
    blog_id: str,
    user_id: str,
    model: str,
    job_id: str,
) -> None:
    """Background task: generate images for all blog sections.

    Parses blog into sections, generates prompts via Claude,
    then generates FLUX.2 images in batches of 3.
    Updates job status after each completed image.

    Args:
        blog_id: Blog to generate images for.
        user_id: Authenticated user's ID.
        model: FLUX.2 model to use.
        job_id: Generation job ID for status tracking.
    """
    logger.info("image.batch_generation_started", blog_id=blog_id, job_id=job_id)

    try:
        # 1. Load blog content
        result = await db_query("blogs", {"id": blog_id, "user_id": user_id})
        if not result.data:
            raise ValueError(f"Blog {blog_id} not found")
        blog_content: str = result.data[0].get("content", "")
        if not blog_content:
            raise ValueError(f"Blog {blog_id} has no content")

        # 2. Parse sections
        sections = _parse_sections(blog_content)
        if not sections:
            raise ValueError("No sections found in blog content")

        # 3. Initialize section statuses
        section_statuses: list[dict[str, Any]] = [
            {
                "section_index": s.index,
                "section_title": s.title,
                "status": "pending",
                "image_url": None,
                "prompt": None,
            }
            for s in sections
        ]

        await _update_job_status(
            job_id, user_id, "running", 0, section_statuses
        )

        # 4. Generate prompts for all sections via Claude
        logger.info("image.prompt_generation_started", blog_id=blog_id, sections=len(sections))
        prompts: list[str] = []
        for section in sections:
            prompt = await asyncio.to_thread(_generate_section_prompt, section)
            prompts.append(prompt)
            section_statuses[section.index]["prompt"] = prompt

        logger.info("image.prompt_generation_completed", blog_id=blog_id, prompts=len(prompts))

        # 5. Generate images in batches of 3
        batch_size = 3
        completed = 0

        async with httpx.AsyncClient(timeout=120.0) as http:
            for batch_start in range(0, len(sections), batch_size):
                batch_end = min(batch_start + batch_size, len(sections))
                batch_sections = sections[batch_start:batch_end]
                batch_prompts = prompts[batch_start:batch_end]

                # Mark batch as generating
                for s in batch_sections:
                    section_statuses[s.index]["status"] = "generating"
                await _update_job_status(
                    job_id, user_id, "running", completed, section_statuses
                )

                # Generate batch concurrently
                tasks = [
                    generate_single_image(http, prompt, blog_id, section, model, user_id)
                    for section, prompt in zip(batch_sections, batch_prompts, strict=True)
                ]
                results = await asyncio.gather(*tasks, return_exceptions=True)

                # Update statuses
                for section, r in zip(batch_sections, results, strict=True):
                    if isinstance(r, BaseException):
                        logger.error(
                            "image.section_generation_failed",
                            blog_id=blog_id,
                            section_index=section.index,
                            error=str(r),
                            error_type=type(r).__name__,
                        )
                        section_statuses[section.index]["status"] = "failed"
                    else:
                        section_statuses[section.index]["status"] = "completed"
                        section_statuses[section.index]["image_url"] = r.image_url
                        completed += 1

                await _update_job_status(
                    job_id, user_id, "running", completed, section_statuses
                )

        # 6. Final status
        all_failed = all(s["status"] == "failed" for s in section_statuses)
        final_status = "failed" if all_failed else "completed"

        await _update_job_status(
            job_id, user_id, final_status, completed, section_statuses
        )

        logger.info(
            "image.batch_generation_completed",
            blog_id=blog_id,
            total=len(sections),
            succeeded=completed,
        )

    except Exception as e:
        logger.error(
            "image.batch_generation_failed",
            blog_id=blog_id,
            error=str(e),
            error_type=type(e).__name__,
            exc_info=True,
        )
        try:
            await _update_job_status(job_id, user_id, "failed", 0, [])
        except Exception:
            logger.error("image.status_update_after_failure_failed", exc_info=True)


def parse_sections_for_count(content: str) -> int:
    """Parse sections and return count (used by route before starting task).

    Args:
        content: Blog markdown content.

    Returns:
        Number of sections found.
    """
    return len(_parse_sections(content))
