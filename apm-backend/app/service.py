"""Caching, de-duplication of in-flight generations, and concurrency limits."""
from __future__ import annotations

import asyncio
import logging
from typing import AsyncIterator

from .config import Settings
from .errors import PipelineError
from .pipeline import run_pipeline
from .query import ParsedQuery, parse_query
from .store import Store

log = logging.getLogger("apm.service")


class Job:
    """A running generation that many clients can follow."""

    def __init__(self) -> None:
        self.events: list[dict] = []
        self.done = False
        self._cond = asyncio.Condition()

    async def push(self, event: dict) -> None:
        async with self._cond:
            self.events.append(event)
            self._cond.notify_all()

    async def finish(self) -> None:
        async with self._cond:
            self.done = True
            self._cond.notify_all()

    async def follow(self) -> AsyncIterator[dict]:
        index = 0
        while True:
            async with self._cond:
                await self._cond.wait_for(lambda: index < len(self.events) or self.done)
                batch = self.events[index:]
                index = len(self.events)
                finished = self.done
            for event in batch:
                yield event
            if finished:
                return


class GuideService:
    def __init__(self, store: Store, settings: Settings) -> None:
        self._store = store
        self._settings = settings
        self._jobs: dict[str, Job] = {}
        self._tasks: set[asyncio.Task] = set()
        self._sem = asyncio.Semaphore(settings.max_concurrent_generations)

    @property
    def store(self) -> Store:
        return self._store

    async def stream(self, query: str, force: bool = False) -> AsyncIterator[dict]:
        parsed = parse_query(query)  # raises ValueError on bad input
        job = self._jobs.get(parsed.slug)
        if job is None and not force:
            cached = await self._store.get(parsed.slug)
            if cached is not None:
                yield {"type": "done", "guide": cached, "cached": True}
                return
            job = self._jobs.get(parsed.slug)  # another request may have started meanwhile
        if job is None:
            job = Job()
            self._jobs[parsed.slug] = job
            task = asyncio.create_task(self._run(job, parsed))
            self._tasks.add(task)
            task.add_done_callback(self._tasks.discard)
        async for event in job.follow():
            yield event

    async def get_or_generate(self, query: str, force: bool = False) -> dict:
        async for event in self.stream(query, force):
            if event["type"] == "done":
                return event["guide"]
            if event["type"] == "error":
                raise PipelineError(event["message"], event.get("status", 502))
        raise PipelineError("Generation ended unexpectedly.", 500)

    async def _run(self, job: Job, parsed: ParsedQuery) -> None:
        async def emit(stage: str, message: str) -> None:
            await job.push({"type": "progress", "stage": stage, "message": message})

        try:
            async with self._sem:
                guide = await run_pipeline(parsed, self._settings, emit)
            await self._store.put(guide)
            await job.push({"type": "done", "guide": guide.model_dump(mode="json"), "cached": False})
        except PipelineError as exc:
            await job.push({"type": "error", "message": exc.message, "status": exc.status})
        except Exception:
            log.exception("generation failed for %s", parsed.slug)
            await job.push(
                {"type": "error", "message": "Unexpected server error while generating the guide.", "status": 500}
            )
        finally:
            self._jobs.pop(parsed.slug, None)
            await job.finish()


def build_service(settings: Settings) -> GuideService:
    return GuideService(Store(settings.db_path), settings)