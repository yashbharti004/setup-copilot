"""Pre-generate the library:  python -m scripts.generate_seed"""
from __future__ import annotations

import asyncio
import json
from pathlib import Path

from app.config import get_settings
from app.errors import PipelineError
from app.service import build_service


async def main() -> None:
    apps = json.loads(Path("seed/apps.json").read_text(encoding="utf-8"))
    service = build_service(get_settings())
    for name in apps:
        try:
            guide = await service.get_or_generate(name)
            difficulty = guide.get("difficulty") or {}
            print(f"{name:<24} {guide['status']:<22} {difficulty.get('label')} {difficulty.get('score')}")
        except PipelineError as exc:
            print(f"{name:<24} FAILED: {exc.message}")


if __name__ == "__main__":
    asyncio.run(main())