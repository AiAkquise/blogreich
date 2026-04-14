"""Image generation service — FLUX.2 API + Supabase Storage."""

import asyncio
import json
import re
from typing import Any
from uuid import uuid4

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.supabase_client import db_insert, db_query, get_supabase
from app.images.schemas import ImageResult

logger = get_logger(__name__)

IMAGE_PROMPT_SYSTEM = """Du bist ein Experte fuer Bild-Prompts fuer KI-Bildgeneratoren.
Erstelle hochwertige, detaillierte Bild-Prompts fuer Blog-Artikel-Bilder.

Regeln:
- Jeder Prompt beschreibt ein professionelles, fotorealistisches Bild
- Nutze beschreibende Adjektive fuer Atmosphaere und Stil
- Vermeide Text im Bild, Wasserzeichen, UI-Elemente
- Jeder Prompt ist einzigartig und passt zu einer anderen Stelle im Blog
- Sprache: Englisch (Bildgeneratoren verstehen Englisch am besten)

Antworte NUR mit JSON:
{
  "prompts": [
    {"prompt": "...", "position": "header"},
    {"prompt": "...", "position": "section_1"},
    {"prompt": "...", "position": "section_2"}
  ]
}"""


def _generate_image_prompts(blog_content: str, count: int) -> list[dict[str, str]]:
    """Generate image prompts from blog content via Claude (sync, wrap in to_thread)."""
    import anthropic

    settings = get_settings()
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    response = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=1000,
        system=[{
            "type": "text",
            "text": IMAGE_PROMPT_SYSTEM,
            "cache_control": {"type": "ephemeral"},
        }],
        messages=[{
            "role": "user",
            "content": (
                f"Erstelle {count} Bild-Prompts fuer folgenden Blog-Artikel:\n\n"
                f"{blog_content[:3000]}"
            ),
        }],
    )

    text = response.content[0].text  # type: ignore[union-attr]

    # Extract JSON from possible markdown code blocks
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    raw = match.group(1) if match else text
    parsed: dict[str, Any] = json.loads(raw)
    return parsed.get("prompts", [])  # type: ignore[no-any-return]


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
    max_wait: int = 60,
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

    raise TimeoutError("FLUX.2 image generation timed out after 60s")


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

    # Download from BFL (signed URL expires in ~10 min)
    img_response = await http.get(bfl_url)
    img_response.raise_for_status()
    img_bytes = img_response.content

    # Upload to Supabase Storage
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


async def generate_single_image(
    prompt: str,
    blog_id: str,
    position: str,
    model: str,
    user_id: str,
) -> ImageResult:
    """Generate one image: submit to FLUX.2, poll, download, upload to Storage.

    Args:
        prompt: Text prompt for image generation.
        blog_id: Blog this image belongs to.
        position: Image position (header, section_1, etc.).
        model: FLUX.2 model to use.
        user_id: Authenticated user's ID.

    Returns:
        ImageResult with permanent Supabase URL.
    """
    logger.info(
        "image.generation_started",
        blog_id=blog_id,
        position=position,
        model=model,
    )

    async with httpx.AsyncClient(timeout=90.0) as http:
        # 1. Submit task
        polling_url = await _submit_flux_task(http, prompt, model)

        # 2. Poll until ready
        bfl_image_url = await _poll_flux_result(http, polling_url)

        # 3. Download from BFL + upload to Supabase Storage
        permanent_url = await _download_and_upload(
            http, bfl_image_url, blog_id, position
        )

    # 4. Save reference in blog_images table
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
        "image.generation_completed",
        blog_id=blog_id,
        position=position,
        image_id=image_id,
    )

    return ImageResult(
        id=image_id,
        image_url=permanent_url,
        original_bfl_url=bfl_image_url,
        prompt=prompt,
        position=position,
    )


async def generate_images(
    blog_id: str,
    user_id: str,
    count: int = 3,
    model: str = "flux-2-pro-preview",
    explicit_prompts: list[str] | None = None,
    auto_generate: bool = True,
) -> list[ImageResult]:
    """Generate multiple blog images.

    Either auto-generates prompts from blog content via Claude,
    or uses explicitly provided prompts.

    Args:
        blog_id: Blog to generate images for.
        user_id: Authenticated user's ID.
        count: Number of images to generate.
        model: FLUX.2 model to use.
        explicit_prompts: Pre-defined prompts (skips Claude prompt generation).
        auto_generate: If True, generate prompts from blog content via Claude.

    Returns:
        List of ImageResult with permanent URLs.
    """
    logger.info(
        "image.batch_generation_started",
        blog_id=blog_id,
        count=count,
        auto_generate=auto_generate,
    )

    # Determine prompts
    if explicit_prompts:
        positions = [f"section_{i}" if i > 0 else "header" for i in range(len(explicit_prompts))]
        prompts_with_positions = list(zip(explicit_prompts, positions, strict=True))
    elif auto_generate:
        # Load blog content from Supabase
        result = await db_query("blogs", {"id": blog_id, "user_id": user_id})
        if not result.data:
            raise ValueError(f"Blog {blog_id} not found")
        blog_content: str = result.data[0].get("content", "")
        if not blog_content:
            raise ValueError(f"Blog {blog_id} has no content yet")

        # Generate prompts via Claude
        prompt_data = await asyncio.to_thread(
            _generate_image_prompts, blog_content, count
        )
        prompts_with_positions = [
            (p["prompt"], p.get("position", f"section_{i}"))
            for i, p in enumerate(prompt_data[:count])
        ]
    else:
        raise ValueError("Either explicit_prompts or auto_generate must be provided")

    # Generate images concurrently
    tasks = [
        generate_single_image(prompt, blog_id, position, model, user_id)
        for prompt, position in prompts_with_positions
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Collect successes, log failures
    images: list[ImageResult] = []
    for i, r in enumerate(results):
        if isinstance(r, BaseException):
            logger.error(
                "image.single_generation_failed",
                blog_id=blog_id,
                index=i,
                error=str(r),
                error_type=type(r).__name__,
            )
        else:
            images.append(r)

    logger.info(
        "image.batch_generation_completed",
        blog_id=blog_id,
        total=len(prompts_with_positions),
        succeeded=len(images),
    )

    return images
