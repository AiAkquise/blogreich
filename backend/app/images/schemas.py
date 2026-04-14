"""Pydantic schemas for section-based image generation."""

from typing import Literal

from pydantic import BaseModel


class ImageGenerateRequest(BaseModel):
    """Request to generate blog images via FLUX.2 (one per section)."""

    blog_id: str
    model: Literal["flux-2-pro-preview", "flux-2-klein-4b"] = "flux-2-pro-preview"


class ImageGenerateResponse(BaseModel):
    """Response after starting image generation background task."""

    status: str = "started"
    message: str = "Bildgenerierung gestartet"
    total_sections: int


class ImageResult(BaseModel):
    """Single generated image result."""

    id: str
    image_url: str
    original_bfl_url: str
    prompt: str
    position: str
    section_index: int
    section_title: str


class SectionStatus(BaseModel):
    """Status of image generation for a single section."""

    section_index: int
    section_title: str
    status: Literal["pending", "generating", "completed", "failed"]
    image_url: str | None = None
    prompt: str | None = None


class ImageJobStatusResponse(BaseModel):
    """Full status of image generation job with per-section progress."""

    status: Literal["pending", "running", "completed", "failed"]
    total_sections: int
    completed_sections: int
    sections: list[SectionStatus]
