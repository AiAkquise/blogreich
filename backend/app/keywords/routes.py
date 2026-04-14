"""Keyword research API routes."""

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user_id
from app.core.logging import get_logger
from app.keywords.schemas import KeywordResearchRequest, KeywordResearchResponse
from app.keywords.service import research_keywords

router = APIRouter()
logger = get_logger(__name__)


@router.post("/research", response_model=KeywordResearchResponse)
async def start_keyword_research(
    request: KeywordResearchRequest,
    user_id: str = Depends(get_current_user_id),
) -> KeywordResearchResponse:
    """Research keywords for a company topic.

    Generates 20-30 long-tail keywords with relevance scores via Claude.
    Filters keywords with score >= 7 and saves them as a cluster in Supabase.
    """
    logger.info(
        "keyword.research_request_received",
        company_id=request.company_id,
        user_id=user_id,
        topic=request.topic,
    )

    return await research_keywords(
        company_id=request.company_id,
        user_id=user_id,
        topic=request.topic,
    )
