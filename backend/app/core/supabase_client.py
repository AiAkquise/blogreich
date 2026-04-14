"""Supabase client with Service Role Key (bypasses RLS).

All supabase-py calls are synchronous. In async contexts, wrap with
asyncio.to_thread() to avoid blocking the event loop.
"""

import asyncio
from functools import lru_cache
from typing import Any

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def get_supabase() -> Client:
    """Return cached Supabase client with Service Role Key."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


async def db_query(
    table: str,
    filters: dict[str, Any],
    select: str = "*",
) -> Any:
    """Read rows from a Supabase table with filters.

    Args:
        table: Table name.
        filters: Column-value pairs for .eq() filtering.
        select: Columns to select.

    Returns:
        Supabase query response data.
    """
    def _run() -> Any:
        q = get_supabase().table(table).select(select)
        for col, val in filters.items():
            q = q.eq(col, val)
        return q.execute()
    return await asyncio.to_thread(_run)


async def db_insert(table: str, data: dict[str, Any]) -> Any:
    """Insert a row into a Supabase table.

    Args:
        table: Table name.
        data: Row data to insert.

    Returns:
        Supabase insert response data.
    """
    def _run() -> Any:
        return get_supabase().table(table).insert(data).execute()
    return await asyncio.to_thread(_run)


async def db_update(
    table: str,
    data: dict[str, Any],
    filters: dict[str, Any],
) -> Any:
    """Update rows in a Supabase table matching filters.

    Args:
        table: Table name.
        data: Fields to update.
        filters: Column-value pairs for .eq() filtering.

    Returns:
        Supabase update response data.
    """
    def _run() -> Any:
        q = get_supabase().table(table).update(data)
        for col, val in filters.items():
            q = q.eq(col, val)
        return q.execute()
    return await asyncio.to_thread(_run)
