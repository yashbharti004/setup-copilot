from __future__ import annotations

import hmac
import json
import logging
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI, Header, HTTPException, Query, Request
from fastapi import Path as PathParam
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from .config import get_settings
from .errors import PipelineError
from .query import parse_query
from .rubric import describe
from .service import build_service

logging.basicConfig(level=logging.INFO)
settings = get_settings()
EVAL_PATH = Path("eval/results.json")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.service = build_service(settings)
    yield


app = FastAPI(title="APM Integrations API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class RateLimiter:
    def __init__(self, limit: int, window_seconds: int = 3600) -> None:
        self._limit = limit
        self._window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > self._window:
            hits.popleft()
        if len(hits) >= self._limit:
            return False
        hits.append(now)
        return True


limiter = RateLimiter(settings.rate_limit_per_hour)


class GenerateRequest(BaseModel):
    query: str = Field(min_length=2, max_length=200)
    force: bool = False


def _check(query: str, request: Request) -> None:
    try:
        parse_query(query)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    client = request.client.host if request.client else "unknown"
    if not limiter.allow(client):
        raise HTTPException(status_code=429, detail="Too many generation requests. Try again later.")


def _force_allowed(requested: bool, token: str | None) -> bool:
    expected = settings.admin_token
    if not (requested and expected and token):
        return False
    return hmac.compare_digest(token.encode(), expected.encode())


async def _sse(events: AsyncIterator[dict]) -> AsyncIterator[str]:
    async for event in events:
        yield f"event: {event['type']}\ndata: {json.dumps(event, ensure_ascii=False)}\n\n"


@app.get("/api/health")
async def health() -> dict:
    return {
        "ok": True,
        "model": settings.model,
        "keys_configured": bool(settings.gemini_api_key and settings.tavily_api_key),
    }


@app.get("/api/rubric")
async def rubric() -> dict:
    return describe()


@app.get("/api/eval")
async def eval_results() -> JSONResponse:
    if not EVAL_PATH.exists():
        raise HTTPException(status_code=404, detail="No evaluation has been run yet.")
    return JSONResponse(json.loads(EVAL_PATH.read_text(encoding="utf-8")))


@app.get("/api/guides")
async def list_guides(request: Request) -> list[dict]:
    return await request.app.state.service.store.list()


@app.get("/api/guides/{slug}")
async def get_guide(request: Request, slug: str = PathParam(pattern=r"^[a-z0-9-]{1,80}$")) -> JSONResponse:
    guide = await request.app.state.service.store.get(slug)
    if guide is None:
        raise HTTPException(status_code=404, detail="Guide not found.")
    return JSONResponse(guide)


@app.post("/api/generate")
async def generate(
    body: GenerateRequest,
    request: Request,
    x_admin_token: str | None = Header(default=None),
) -> JSONResponse:
    _check(body.query, request)
    try:
        guide = await request.app.state.service.get_or_generate(
            body.query, force=_force_allowed(body.force, x_admin_token)
        )
    except PipelineError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.message) from exc
    return JSONResponse(guide)


@app.get("/api/generate/stream")
async def generate_stream(
    request: Request,
    q: str = Query(min_length=2, max_length=200),
    force: bool = False,
    x_admin_token: str | None = Header(default=None),
) -> StreamingResponse:
    _check(q, request)
    events = request.app.state.service.stream(q, force=_force_allowed(force, x_admin_token))
    return StreamingResponse(
        _sse(events),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )