"""Supabase JWT verification via JWKS endpoint."""

from typing import Any

import httpx
from fastapi import Header, HTTPException
from jose import JWTError, jwt

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_jwks_cache: dict[str, Any] | None = None


async def _get_jwks() -> dict[str, Any]:
    """Fetch and cache JWKS from Supabase."""
    global _jwks_cache  # noqa: PLW0603
    if _jwks_cache is not None:
        return _jwks_cache

    settings = get_settings()
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        logger.info("auth.jwks_fetched", url=jwks_url)
        return _jwks_cache


async def get_current_user_id(
    authorization: str = Header(..., description="Bearer <supabase-jwt>"),
) -> str:
    """Extract and verify user_id from Supabase JWT.

    Args:
        authorization: Authorization header with Bearer token.

    Returns:
        The authenticated user's ID (UUID string).

    Raises:
        HTTPException: If token is missing, invalid, or expired.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.removeprefix("Bearer ")

    try:
        jwks = await _get_jwks()
        # Get the signing key from JWKS
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        rsa_key: dict[str, str] = {}
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"],
                }
                break

        if not rsa_key:
            raise HTTPException(status_code=401, detail="Unable to find matching signing key")

        settings = get_settings()
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience="authenticated",
            issuer=f"{settings.supabase_url}/auth/v1",
        )

        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing sub claim")

        return user_id

    except JWTError as e:
        logger.warning("auth.jwt_verification_failed", error=str(e))
        raise HTTPException(status_code=401, detail="Invalid or expired token") from e
