"""Pydantic schemas for keyword research."""

from pydantic import BaseModel


class KeywordResearchRequest(BaseModel):
    """Request to research keywords for a company."""

    company_id: str
    topic: str | None = None


class KeywordResult(BaseModel):
    """Single keyword with relevance score."""

    keyword: str
    score: int


class KeywordResearchResponse(BaseModel):
    """Response with keyword cluster and scored keywords."""

    cluster_id: str
    cluster_name: str
    primary_keyword: str
    keywords: list[KeywordResult]
