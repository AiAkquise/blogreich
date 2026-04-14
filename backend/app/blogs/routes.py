"""Blog generation API routes."""

import asyncio

from fastapi import APIRouter, Depends

from app.blogs.schemas import BlogGenerateRequest, BlogGenerateResponse, BlogStatusResponse
from app.blogs.service import generate_blog
from app.core.auth import get_current_user_id
from app.core.logging import get_logger
from app.core.supabase_client import db_query

router = APIRouter()
logger = get_logger(__name__)


@router.post("/generate", response_model=BlogGenerateResponse)
async def start_blog_generation(
    request: BlogGenerateRequest,
    user_id: str = Depends(get_current_user_id),
) -> BlogGenerateResponse:
    """Start blog generation as a background task.

    Creates an async task that generates the blog content via Claude API
    and updates the status in Supabase. Returns immediately.
    """
    logger.info(
        "blog.generate_request_received",
        blog_id=request.blog_id,
        user_id=user_id,
        title=request.title,
    )

    asyncio.create_task(generate_blog(request, user_id))

    return BlogGenerateResponse()


@router.get("/{blog_id}/status", response_model=BlogStatusResponse)
async def get_blog_status(
    blog_id: str,
    user_id: str = Depends(get_current_user_id),
) -> BlogStatusResponse:
    """Get the current generation status for a blog.

    Reads from the generation_jobs table in Supabase.
    """
    result = await db_query(
        "generation_jobs",
        {"blog_id": blog_id, "user_id": user_id},
    )

    if not result.data:
        return BlogStatusResponse(status="pending")

    job = result.data[0]
    return BlogStatusResponse(
        status=job.get("status", "pending"),
        current_step=job.get("current_step"),
        progress=job.get("progress", 0.0),
        error=job.get("error"),
    )
