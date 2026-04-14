"""Blogreich API — FastAPI entry point."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.blogs.routes import router as blogs_router
from app.companies.routes import router as companies_router
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.images.routes import router as images_router
from app.keywords.routes import router as keywords_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application startup and shutdown."""
    settings = get_settings()
    setup_logging(settings.log_level)
    yield


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(blogs_router, prefix="/api/blogs", tags=["blogs"])
app.include_router(companies_router, prefix="/api/companies", tags=["companies"])
app.include_router(images_router, prefix="/api/images", tags=["images"])
app.include_router(keywords_router, prefix="/api/keywords", tags=["keywords"])


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "Blogreich API"}


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.version}
