"""Image generation API routes — section-based with background task."""

import asyncio
from uuid import uuid4

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user_id
from app.core.logging import get_logger
from app.core.supabase_client import db_insert, db_query
from app.images.schemas import (
    ImageGenerateRequest,
    ImageGenerateResponse,
    ImageJobStatusResponse,
    SectionStatus,
)
from app.images.service import generate_images_background, parse_sections_for_count

router = APIRouter()
logger = get_logger(__name__)


@router.post("/generate", response_model=ImageGenerateResponse)
async def start_image_generation(
    request: ImageGenerateRequest,
    user_id: str = Depends(get_current_user_id),
) -> ImageGenerateResponse:
    """Start section-based image generation as a background task.

    Parses blog content into sections, then generates one image per section
    via FLUX.2. Progress is tracked per-section in generation_jobs.
    """
    logger.info(
        "image.generate_request_received",
        blog_id=request.blog_id,
        user_id=user_id,
        model=request.model,
    )

    # Load blog to count sections
    result = await db_query("blogs", {"id": request.blog_id, "user_id": user_id})
    if not result.data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Blog not found")

    content: str = result.data[0].get("content", "")
    total_sections = parse_sections_for_count(content)

    if total_sections == 0:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Blog has no content or sections")

    # Create generation job
    job_id = str(uuid4())
    await db_insert("generation_jobs", {
        "id": job_id,
        "user_id": user_id,
        "blog_id": request.blog_id,
        "status": "running",
        "job_type": "image_generation",
        "total_sections": total_sections,
        "completed_sections": 0,
        "metadata": {"sections": []},
    })

    # Start background task
    asyncio.create_task(generate_images_background(
        blog_id=request.blog_id,
        user_id=user_id,
        model=request.model,
        job_id=job_id,
    ))

    return ImageGenerateResponse(total_sections=total_sections)


@router.get("/{blog_id}/status", response_model=ImageJobStatusResponse)
async def get_image_status(
    blog_id: str,
    user_id: str = Depends(get_current_user_id),
) -> ImageJobStatusResponse:
    """Get real-time status of image generation for a blog.

    Returns per-section progress with status and image URLs.
    """
    result = await db_query(
        "generation_jobs",
        {"blog_id": blog_id, "user_id": user_id},
    )

    # Filter for image generation jobs, get the latest
    image_jobs = [
        j for j in (result.data or [])
        if j.get("job_type") == "image_generation"
    ]

    if not image_jobs:
        return ImageJobStatusResponse(
            status="pending",
            total_sections=0,
            completed_sections=0,
            sections=[],
        )

    # Get latest job (by created_at or just last in list)
    job = image_jobs[-1]
    metadata = job.get("metadata", {}) or {}
    sections_data = metadata.get("sections", [])

    sections = [
        SectionStatus(
            section_index=s.get("section_index", 0),
            section_title=s.get("section_title", ""),
            status=s.get("status", "pending"),
            image_url=s.get("image_url"),
            prompt=s.get("prompt"),
        )
        for s in sections_data
    ]

    return ImageJobStatusResponse(
        status=job.get("status", "pending"),
        total_sections=job.get("total_sections", 0),
        completed_sections=job.get("completed_sections", 0),
        sections=sections,
    )
