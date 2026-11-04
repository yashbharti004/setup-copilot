from __future__ import annotations

from typing import Awaitable, Callable

import httpx

from .builder import build
from .config import Settings
from .errors import PipelineError
from .extractor import extract
from .models import Guide
from .query import ParsedQuery
from .sources import load_pages, search_all

Emit = Callable[[str, str], Awaitable[None]]


async def run_pipeline(parsed: ParsedQuery, settings: Settings, emit: Emit) -> Guide:
    settings.require_keys()

    async with httpx.AsyncClient(timeout=httpx.Timeout(15.0),trust_env=False,) as client:
        await emit("search", f"Searching for {parsed.name} OAuth documentation")
        hits = await search_all(client, parsed, settings.tavily_api_key)
        if not hits:
            raise PipelineError(f"No search results found for '{parsed.name}'.", 404)

        await emit("fetch", "Reading the most relevant pages")
        pages = await load_pages(client, hits, parsed)
        if not pages:
            raise PipelineError("Found results but could not read any of the pages.", 502)

    official = sum(1 for p in pages if p.official)
    await emit("extract", f"Extracting quote-backed claims from {len(pages)} pages ({official} official)")
    raw = await extract(parsed.name, pages, settings)

    await emit("verify", "Checking every quote against the page text and computing the score")
    return build(parsed, pages, raw, settings.model)