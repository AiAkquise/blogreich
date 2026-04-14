"""Application configuration via Pydantic Settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Blogreich API configuration loaded from environment variables."""

    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

    # App
    app_name: str = "Blogreich API"
    version: str = "0.1.0"
    environment: str = "development"
    log_level: str = "INFO"
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Supabase
    supabase_url: str
    supabase_service_role_key: str

    # Anthropic
    anthropic_api_key: str
    anthropic_model: str = "claude-sonnet-4-20250514"

    # BFL (FLUX.2)
    bfl_api_key: str
    bfl_model: str = "flux-2-pro-preview"
    bfl_base_url: str = "https://api.bfl.ai/v1"

    # Supabase Storage
    supabase_storage_bucket: str = "blog-images"

    # Tavily
    tavily_api_key: str


@lru_cache
def get_settings() -> Settings:
    """Return cached Settings instance."""
    return Settings()  # type: ignore[call-arg]
