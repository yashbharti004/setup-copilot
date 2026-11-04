"""Turns raw model output into a Guide. Every claim is re-checked by code here."""
from __future__ import annotations

import math
from datetime import datetime, timezone

from .evidence import Page, classify
from .models import (
    Approval, Blocker, Evidence, Fact, Guide, Source, Step,
)
from .query import ParsedQuery
from .rubric import FACT_SPECS, compute_difficulty, estimate_effort

_RANK = {Evidence.VERIFIED: 3, Evidence.DOCS: 2, Evidence.COMMUNITY: 1}
MAX_STEPS = 10
MAX_BLOCKERS = 8
MAX_WAIT_DAYS = 3650


def _s(item: dict, key: str) -> str:
    return str(item.get(key) or "").strip()


def parse_value(key: str, raw: object) -> bool | float | None:
    spec = FACT_SPECS[key]
    text = str(raw).strip().lower()
    if spec.kind == "bool":
        if text in ("true", "yes"):
            return True
        if text in ("false", "no"):
            return False
        return None
    try:
        number = float(text)
    except ValueError:
        return None
    if not math.isfinite(number) or number < 0 or number > MAX_WAIT_DAYS:
        return None
    return number


def _evidence(item: dict, pages: dict[str, Page]) -> Evidence:
    return classify(_s(item, "quote"), _s(item, "source_id"), _s(item, "directness"), pages)


def _build_facts(items: object, pages: dict[str, Page], notes: list[str]) -> tuple[dict[str, Fact], int]:
    candidates: dict[str, list[Fact]] = {}
    dropped = 0
    for item in items if isinstance(items, list) else []:
        if not isinstance(item, dict):
            continue
        key = _s(item, "key")
        if key not in FACT_SPECS:
            continue
        value = parse_value(key, item.get("value"))
        if value is None:
            dropped += 1
            continue
        evidence = _evidence(item, pages)
        if evidence is Evidence.UNKNOWN:
            dropped += 1
            continue
        candidates.setdefault(key, []).append(
            Fact(key=key, value=value, evidence=evidence, quote=_s(item, "quote"), source_id=_s(item, "source_id"))
        )

    chosen: dict[str, Fact] = {}
    for key in FACT_SPECS:  # keeps rubric order
        options = candidates.get(key)
        if not options:
            continue
        best = max(_RANK[f.evidence] for f in options)
        top = [f for f in options if _RANK[f.evidence] == best]
        if len({f.value for f in top}) > 1:
            notes.append(f"Sources disagree on '{key}', so it is treated as unknown.")
            continue
        chosen[key] = top[0]

    low, high = chosen.get("review_wait_days_min"), chosen.get("review_wait_days_max")
    if low and high and float(low.value) > float(high.value):
        del chosen["review_wait_days_min"]
        notes.append("Dropped an inconsistent minimum review wait (it exceeded the maximum).")
    return chosen, dropped


def _build_steps(items: object, pages: dict[str, Page]) -> tuple[list[Step], int]:
    steps: list[Step] = []
    dropped = 0
    for item in items if isinstance(items, list) else []:
        if not isinstance(item, dict):
            continue
        title = _s(item, "title")
        evidence = _evidence(item, pages)
        if not title or evidence is Evidence.UNKNOWN:
            dropped += 1
            continue
        if len(steps) >= MAX_STEPS:
            continue
        actor = _s(item, "actor")
        steps.append(
            Step(
                order=len(steps) + 1,
                title=title[:140],
                detail=_s(item, "detail")[:600],
                actor="agent" if actor == "agent" else "human",  # unsure means a human takes over
                evidence=evidence,
                quote=_s(item, "quote"),
                source_id=_s(item, "source_id"),
            )
        )
    return steps, dropped


def _build_blockers(items: object, pages: dict[str, Page]) -> tuple[list[Blocker], int]:
    blockers: list[Blocker] = []
    dropped = 0
    for item in items if isinstance(items, list) else []:
        if not isinstance(item, dict):
            continue
        title = _s(item, "title")
        evidence = _evidence(item, pages)
        if not title or evidence is Evidence.UNKNOWN:
            dropped += 1
            continue
        if len(blockers) >= MAX_BLOCKERS:
            continue
        blockers.append(
            Blocker(
                title=title[:140],
                detail=_s(item, "detail")[:600],
                evidence=evidence,
                quote=_s(item, "quote"),
                source_id=_s(item, "source_id"),
            )
        )
    return blockers, dropped


def _approval(facts: dict[str, Fact]) -> Approval:
    required = facts.get("review_required_for_distribution")
    low, high = facts.get("review_wait_days_min"), facts.get("review_wait_days_max")
    if required is not None and required.value is False:
        return Approval(min_days=0.0, max_days=0.0, evidence=required.evidence)
    used = [f for f in (low, high) if f is not None]
    if used:
        weakest = min(used, key=lambda f: _RANK[f.evidence]).evidence
        hi = float((high or low).value)  # type: ignore[union-attr]
        lo = float((low or high).value)  # type: ignore[union-attr]
        if lo > hi:
            lo, hi = hi, lo
        return Approval(min_days=lo, max_days=hi, evidence=weakest)
    return Approval(min_days=None, max_days=None, evidence=Evidence.UNKNOWN)


def build(parsed: ParsedQuery, pages: list[Page], raw: dict, model: str) -> Guide:
    page_map = {p.id: p for p in pages}
    notes: list[str] = []

    facts, dropped_facts = _build_facts(raw.get("facts"), page_map, notes)
    steps, dropped_steps = _build_steps(raw.get("steps"), page_map)
    blockers, dropped_blockers = _build_blockers(raw.get("blockers"), page_map)

    registration = facts.get("has_public_oauth_registration")
    inputs = {key: fact.value for key, fact in facts.items()}

    difficulty = None
    effort = None
    if registration is not None and registration.value is False:
        status = "no_public_oauth"
        notes.append("Sources indicate there is no public OAuth app registration for third-party developers.")
    elif registration is None and not steps:
        status = "insufficient_evidence"
        notes.append("Sources did not show a public OAuth registration path. Nothing was guessed.")
    else:
        difficulty = compute_difficulty(inputs)
        effort = estimate_effort(inputs)
        status = "complete" if (registration is not None and registration.value is True and len(steps) >= 3) else "partial"
        if difficulty.lower_bound:
            notes.append(
                "Difficulty is a lower bound; these inputs were not found: "
                + ", ".join(difficulty.unknown_inputs) + "."
            )
        notes.append("Effort is a rubric estimate, not a measurement.")

    if not any(p.official for p in pages):
        notes.append("No official source was found; everything here rests on non-official pages.")
    snippet_pages = sum(1 for p in pages if p.via == "search_snippet")
    if snippet_pages:
        notes.append(f"{snippet_pages} page(s) could only be read as search snippets, so coverage may be thin.")
    dropped_total = dropped_facts + dropped_steps + dropped_blockers
    if dropped_total:
        notes.append(f"{dropped_total} claim(s) were dropped because their quote was not found in the source text.")
    notes.append("Nothing here was executed against the provider. Labels reflect source text only.")

    cited = {f.source_id for f in facts.values()} | {s.source_id for s in steps} | {b.source_id for b in blockers}
    sources = [
        Source(id=p.id, url=p.url, title=p.title, official=p.official, via=p.via, cited=p.id in cited)
        for p in pages
    ]

    return Guide(
        slug=parsed.slug,
        query=parsed.raw,
        app_name=_s(raw, "app_name")[:80] or parsed.name.title(),
        category=_s(raw, "category")[:60] or "Uncategorized",
        status=status,  # type: ignore[arg-type]
        generated_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        model=model,
        difficulty=difficulty,
        effort=effort,
        approval=_approval(facts),
        facts=list(facts.values()),
        steps=steps,
        blockers=blockers,
        sources=sources,
        coverage={
            "facts_found": len(facts),
            "facts_possible": len(FACT_SPECS),
            "steps_kept": len(steps),
            "steps_dropped": dropped_steps,
            "blockers_kept": len(blockers),
            "blockers_dropped": dropped_blockers,
            "facts_dropped": dropped_facts,
        },
        notes=notes,
    )