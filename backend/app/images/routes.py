"""Image generation API routes."""

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user_id
from app.core.logging import get_logger
from app.images.schemas import ImageGenerateRequest, ImageGenerateResponse
from app.images.service import generate_images

router = APIRouter()
logger = get_logger(__name__)


@router.post("/generate", response_model=ImageGenerateResponse)
async def start_image_generation(
    request: ImageGenerateRequest,
    user_id: str = Depends(get_current_user_id),
) -> ImageGenerateResponse:
    """Generate blog images via FLUX.2 API.

    Either auto-generates prompts from blog content (Claude)
    or uses explicitly provided prompts. Downloads images from BFL
    and stores them permanently in Supabase Storage.
    """
    logger.info(
        "image.generate_request_received",
        blog_id=request.blog_id,
        user_id=user_id,
        count=request.count,
        auto_generate=request.auto_generate,
    )

    images = await generate_images(
        blog_id=request.blog_id,
        user_id=user_id,
        count=request.count,
        model=request.model,
        explicit_prompts=request.prompts,
        auto_generate=request.auto_generate,
    )

    return ImageGenerateResponse(images=images)
