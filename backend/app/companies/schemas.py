"""Pydantic schemas for company website analysis."""

from pydantic import BaseModel, Field


class CompanyAnalyzeRequest(BaseModel):
    """Request to analyze company website(s)."""

    company_id: str
    website_urls: list[str] = Field(..., min_length=1, max_length=5)


class CompanyAnalyzeResponse(BaseModel):
    """Response after website analysis."""

    style_profile: str
    style_data: dict[str, object]
    pages_analyzed: int
    sitemap_urls: list[str]
