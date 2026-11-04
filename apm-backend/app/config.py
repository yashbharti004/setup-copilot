from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

from .errors import PipelineError

load_dotenv()


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str
    tavily_api_key: str
    model: str
    groq_api_key: str
    groq_model: str
    db_path: Path
    cors_origins: tuple[str, ...]
    admin_token: str
    max_concurrent_generations: int
    rate_limit_per_hour: int

    def require_keys(self) -> None:
        missing = [
            name
            for name, value in (
                ("GEMINI_API_KEY", self.gemini_api_key),
                ("TAVILY_API_KEY", self.tavily_api_key),
            )
            if not value
        ]
        if missing:
            raise PipelineError(
                f"Server is missing: {', '.join(missing)}", 503
            )


@lru_cache
def get_settings() -> Settings:
    origins = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5173",
    )

    return Settings(
        gemini_api_key=os.environ.get("GEMINI_API_KEY", ""),
        tavily_api_key=os.environ.get("TAVILY_API_KEY", ""),
        model=os.environ.get("GEMINI_MODEL", "gemini-3.8-flash"),
        groq_api_key=os.environ.get("GROQ_API_KEY", ""),
        groq_model=os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b"),
        db_path=Path(os.environ.get("DB_PATH", "data/guides.db")),
        cors_origins=tuple(
            origin.strip() for origin in origins.split(",") if origin.strip()
        ),
        admin_token=os.environ.get("ADMIN_TOKEN", ""),
        max_concurrent_generations=max(
            1, _int("MAX_CONCURRENT_GENERATIONS", 3)
        ),
        rate_limit_per_hour=max(1, _int("RATE_LIMIT_PER_HOUR", 30)),
    )