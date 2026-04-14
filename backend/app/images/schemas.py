"""Pydantic schemas for image generation."""

from typing import Literal

from pydantic import BaseModel, Field, model_validator


class ImageGenerateRequest(BaseModel):
    """Request to generate blog images via FLUX.2."""

    blog_id: str
    prompts: list[str] | None = None
    auto_generate: bool = True
    count: int = Field(default=3, ge=1, le=5)
    model: Literal["flux-2-pro-preview", "flux-2-klein-4b"] = "flux-2-pro-preview"

    @model_validator(mode="after")
    def validate_prompts(self) -> "ImageGenerateRequest":
        """Require prompts when auto_generate is False."""
        if not self.auto_generate and not self.prompts:
            msg = "prompts erforderlich wenn auto_generate=False"
            raise ValueError(msg)
        return self


class ImageResult(BaseModel):
    """Single generated image result."""

    id: str
    image_url: str
    original_bfl_url: str
    prompt: str
    position: str


class ImageGenerateResponse(BaseModel):
    """Response with all generated images."""

    images: list[ImageResult]
