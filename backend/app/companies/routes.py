"""Company website analysis API routes."""

from fastapi import APIRouter, Depends, HTTPException

from app.companies.schemas import CompanyAnalyzeRequest, CompanyAnalyzeResponse
from app.companies.service import analyze_company_website
from app.core.auth import get_current_user_id
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post("/analyze", response_model=CompanyAnalyzeResponse)
async def analyze_company(
    request: CompanyAnalyzeRequest,
    user_id: str = Depends(get_current_user_id),
) -> CompanyAnalyzeResponse:
    """Analyze company website(s) and create a writing style profile.

    Uses Tavily to crawl the website and Claude to analyze the content.
    Results are saved to the company's style_profile in Supabase.
    """
    logger.info(
        "company.analyze_request_received",
        company_id=request.company_id,
        user_id=user_id,
        urls=request.website_urls,
    )

    try:
        result = await analyze_company_website(
            company_id=request.company_id,
            website_urls=request.website_urls,
            user_id=user_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        logger.error(
            "company.analyze_failed",
            company_id=request.company_id,
            error=str(e),
            error_type=type(e).__name__,
            exc_info=True,
        )
        raise HTTPException(
            status_code=500, detail="Website-Analyse fehlgeschlagen"
        ) from e

    return CompanyAnalyzeResponse(
        style_profile=result["style_profile"],
        style_data=result["style_data"],
        pages_analyzed=result["pages_analyzed"],
        sitemap_urls=result["sitemap_urls"],
    )
