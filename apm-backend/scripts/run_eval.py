"""Score the pipeline against hand-checked facts:  python -m scripts.run_eval"""
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from app.config import get_settings
from app.errors import PipelineError
from app.service import build_service


async def main() -> None:
    golden = json.loads(Path("eval/golden.json").read_text(encoding="utf-8"))
    service = build_service(get_settings())
    results = []
    counts = {"pass": 0, "fail": 0, "unknown": 0}

    for entry in golden["apps"]:
        checks = []
        try:
            guide = await service.get_or_generate(entry["query"], force=True)
            found = {f["key"]: f["value"] for f in guide["facts"]}
            for key, expected in entry["expect"].items():
                if key not in found:
                    outcome, actual = "unknown", None
                else:
                    actual = found[key]
                    outcome = "pass" if actual == expected else "fail"
                counts[outcome] += 1
                checks.append({"key": key, "expected": expected, "actual": actual, "result": outcome})
        except PipelineError as exc:
            for key, expected in entry["expect"].items():
                counts["unknown"] += 1
                checks.append({"key": key, "expected": expected, "actual": None, "result": f"error: {exc.message}"})
        results.append({"query": entry["query"], "checks": checks})
        print(entry["query"], [(c["key"], c["result"]) for c in checks])

    answered = counts["pass"] + counts["fail"]
    summary = {
        **counts,
        "pass_rate_of_answered": round(counts["pass"] / answered, 3) if answered else None,
    }
    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "golden_note": golden.get("note", ""),
        "summary": summary,
        "apps": results,
    }
    Path("eval").mkdir(exist_ok=True)
    Path("eval/results.json").write_text(json.dumps(output, indent=2), encoding="utf-8")
    print("SUMMARY", summary)


if __name__ == "__main__":
    asyncio.run(main())