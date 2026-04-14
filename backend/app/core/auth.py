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


def _extract_signing_key(jwks: dict[str, Any], kid: str | None) -> dict[str, str]:
    """Extract the signing key from JWKS, supporting both RSA and EC key types.

    Args:
        jwks: JWKS response from Supabase.
        kid: Key ID from the JWT header.

    Returns:
        Key dict suitable for jose.jwt.decode().
    """
    for key in jwks.get("keys", []):
        if kid and key.get("kid") != kid:
            continue

        kty = key.get("kty", "")

        if kty == "RSA":
            return {
                "kty": kty,
                "kid": key.get("kid", ""),
                "use": key.get("use", "sig"),
                "n": key["n"],
                "e": key["e"],
            }

        if kty == "EC":
            return {
                "kty": kty,
                "kid": key.get("kid", ""),
                "use": key.get("use", "sig"),
                "crv": key.get("crv", "P-256"),
                "x": key["x"],
                "y": key["y"],
            }

    return {}


def _detect_algorithm(key: dict[str, str]) -> str:
    """Detect the JWT algorithm based on key type.

    Args:
        key: Extracted JWKS key.

    Returns:
        Algorithm string for jose.jwt.decode().
    """
    kty = key.get("kty", "")
    if kty == "EC":
        crv = key.get("crv", "P-256")
        crv_to_alg: dict[str, str] = {"P-256": "ES256", "P-384": "ES384", "P-521": "ES512"}
        return crv_to_alg.get(crv, "ES256")
    return "RS256"


async def get_current_user_id(
    authorization: str = Header(..., description="Bearer <supabase-jwt>"),
) -> str:
    """Extract and verify user_id from Supabase JWT.

    Supports both RSA (RS256) and EC (ES256) key types.
    Supabase may use either depending on project configuration.

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
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        signing_key = _extract_signing_key(jwks, kid)

        if not signing_key:
            raise HTTPException(status_code=401, detail="Unable to find matching signing key")

        algorithm = _detect_algorithm(signing_key)
        settings = get_settings()

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=[algorithm],
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
