"""Pydantic schemas for blog generation."""

from typing import Literal

from pydantic import BaseModel, Field, model_validator


class BlogGenerateRequest(BaseModel):
    """Request to start blog generation."""

    blog_id: str
    title: str
    company_id: str | None = None
    language: Literal["de", "en"] = "de"
    tone: Literal["professional", "casual", "academic", "creative"] = "professional"
    target_word_count: int = Field(default=3000, ge=1000, le=5000)
    primary_keyword: str | None = None
    secondary_keywords: list[str] = []
    content_source: Literal["ai", "realtime", "url"] = "ai"
    source_url: str | None = None

    @model_validator(mode="after")
    def validate_source_url(self) -> "BlogGenerateRequest":
        """Require source_url when content_source is 'url'."""
        if self.content_source == "url" and not self.source_url:
            msg = "source_url ist erforderlich wenn content_source 'url' ist"
            raise ValueError(msg)
        return self


class BlogGenerateResponse(BaseModel):
    """Response after starting blog generation."""

    status: str = "started"
    message: str = "Blog-Generierung gestartet"


class BlogStatusResponse(BaseModel):
    """Current status of blog generation job."""

    status: Literal["pending", "generating", "completed", "failed"]
    current_step: Literal[
        "outline", "sections", "intro", "conclusion", "images", "done"
    ] | None = None
    progress: float = 0.0
    error: str | None = None
