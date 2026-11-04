from __future__ import annotations

import asyncio
import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

from .models import Guide


class Store:
    def __init__(self, path: Path) -> None:
        self._path = Path(path)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._init()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._path, timeout=10)
        conn.row_factory = sqlite3.Row
        return conn

    def _init(self) -> None:
        with closing(self._connect()) as conn:
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute(
                "CREATE TABLE IF NOT EXISTS guides ("
                "slug TEXT PRIMARY KEY, body TEXT NOT NULL, updated_at TEXT NOT NULL)"
            )
            conn.commit()

    def _get(self, slug: str) -> dict | None:
        with closing(self._connect()) as conn:
            row = conn.execute("SELECT body FROM guides WHERE slug = ?", (slug,)).fetchone()
        return json.loads(row["body"]) if row else None

    def _put(self, guide: Guide) -> None:
        now = datetime.now(timezone.utc).isoformat(timespec="seconds")
        with closing(self._connect()) as conn:
            conn.execute(
                "INSERT INTO guides (slug, body, updated_at) VALUES (?, ?, ?) "
                "ON CONFLICT(slug) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at",
                (guide.slug, guide.model_dump_json(), now),
            )
            conn.commit()

    def _list(self) -> list[dict]:
        with closing(self._connect()) as conn:
            rows = conn.execute("SELECT body FROM guides ORDER BY updated_at DESC").fetchall()
        summaries = []
        for row in rows:
            g = json.loads(row["body"])
            difficulty = g.get("difficulty") or {}
            summaries.append(
                {
                    "slug": g["slug"],
                    "app_name": g["app_name"],
                    "category": g["category"],
                    "status": g["status"],
                    "difficulty_score": difficulty.get("score"),
                    "difficulty_label": difficulty.get("label"),
                    "lower_bound": difficulty.get("lower_bound"),
                    "approval": g["approval"],
                    "generated_at": g["generated_at"],
                }
            )
        return summaries

    async def get(self, slug: str) -> dict | None:
        return await asyncio.to_thread(self._get, slug)

    async def put(self, guide: Guide) -> None:
        await asyncio.to_thread(self._put, guide)

    async def list(self) -> list[dict]:
        return await asyncio.to_thread(self._list)