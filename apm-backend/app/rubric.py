"""Single source of truth for facts, weights, tiers and scoring.

The LLM never produces a score. Code computes it from verified facts, and the
label is derived from the score, so the two can never disagree.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from .models import Contribution, Difficulty, Effort


@dataclass(frozen=True)
class FactSpec:
    kind: Literal["bool", "number"]
    description: str


FACT_SPECS: dict[str, FactSpec] = {
    "has_public_oauth_registration": FactSpec(
        "bool",
        "Third-party developers can register their own OAuth app/client with this provider "
        "through a public portal, console or API.",
    ),
    "review_required_for_distribution": FactSpec(
        "bool",
        "The provider must review or approve the app before users outside the developer's own "
        "account/workspace/org can use it, or before it can be listed in the provider's directory.",
    ),
    "review_wait_days_min": FactSpec(
        "number", "Lowest stated or typical review wait, in calendar days."
    ),
    "review_wait_days_max": FactSpec(
        "number", "Highest stated or typical review wait, in calendar days."
    ),
    "requires_paid_plan": FactSpec(
        "bool", "A paid plan, subscription or paid developer tier is required to use the OAuth API."
    ),
    "requires_security_audit": FactSpec(
        "bool", "A third-party security assessment/audit (e.g. CASA) is required."
    ),
    "requires_video_demo": FactSpec(
        "bool", "A video/screencast demonstration of the integration is required for review."
    ),
    "requires_domain_verification": FactSpec(
        "bool", "Ownership of a domain/website (and often a privacy policy) must be verified."
    ),
    "requires_business_verification": FactSpec(
        "bool", "The developer or company must pass business/identity verification."
    ),
    "uses_restricted_scopes": FactSpec(
        "bool",
        "The integration needs scopes the provider calls restricted/sensitive that trigger extra review.",
    ),
}

# (inclusive lower bound, inclusive upper bound) per tier. Must be contiguous 0..100.
TIERS: tuple[tuple[str, int, int], ...] = (
    ("EASY", 0, 24),
    ("MODERATE", 25, 59),
    ("HARD", 60, 84),
    ("GATED", 85, 100),
)

# Shown instead of a tier when the score cannot be trusted (see compute_difficulty).
UNKNOWN_LABEL = "UNKNOWN"

WEIGHTS: dict[str, int] = {
    "review_required_for_distribution": 25,
    "uses_restricted_scopes": 10,
    "requires_domain_verification": 5,
    "requires_video_demo": 10,
    "requires_security_audit": 25,
    "requires_business_verification": 15,
}

# (min days of max-wait, extra points); both apply cumulatively.
WAIT_STEPS: tuple[tuple[int, int], ...] = ((7, 10), (28, 10))

# A paywall alone puts the app in GATED.
PAID_FLOOR = 85

# Rough active-effort model (minutes). It is an estimate, not a measurement.
EFFORT_BASE = (10, 20)
EFFORT_ADDONS: dict[str, tuple[int, int]] = {
    "review_required_for_distribution": (15, 45),
    "requires_video_demo": (30, 60),
    "requires_security_audit": (120, 480),
    "requires_domain_verification": (10, 30),
    "requires_business_verification": (30, 120),
    "uses_restricted_scopes": (30, 90),
    "requires_paid_plan": (10, 20),
}

SCORING_KEYS: tuple[str, ...] = (
    *WEIGHTS.keys(),
    "review_wait_days_max",
    "requires_paid_plan",
)

# If any of these is unknown, a low score can't be trusted as "easy":
# each one can on its own push the app to HARD or GATED.
GATE_KEYS: tuple[str, ...] = (
    "review_required_for_distribution",
    "requires_paid_plan",
)


def label_for(score: int) -> str:
    for name, low, high in TIERS:
        if low <= score <= high:
            return name
    raise ValueError(f"score out of range: {score}")


def compute_difficulty(
    inputs: dict[str, bool | float],
    has_official_source: bool = True,
) -> Difficulty:
    breakdown: list[Contribution] = []
    total = 0

    for key, points in WEIGHTS.items():
        if inputs.get(key) is True:
            breakdown.append(Contribution(key=key, points=points))
            total += points

    wait = inputs.get("review_wait_days_max")
    if isinstance(wait, (int, float)) and not isinstance(wait, bool):
        for threshold, points in WAIT_STEPS:
            if wait >= threshold:
                breakdown.append(
                    Contribution(
                        key=f"review_wait_days_max>={threshold}",
                        points=points,
                    )
                )
                total += points

    if inputs.get("requires_paid_plan") is True and total < PAID_FLOOR:
        breakdown.append(
            Contribution(
                key=f"requires_paid_plan (floor {PAID_FLOOR})",
                points=PAID_FLOOR - total,
            )
        )
        total = PAID_FLOOR

    score = max(0, min(total, 100))

    unknown = [
        key for key in SCORING_KEYS
        if key not in inputs
    ]

    if (
        inputs.get("review_required_for_distribution") is False
        and "review_wait_days_max" in unknown
    ):
        unknown.remove("review_wait_days_max")

    label = label_for(score)

    # A score is a lower bound when inputs are missing. "At least MODERATE"
    # is still informative, but "EASY" is not: an unknown gate could flip it.
    easy_but_unverified = (
        label == "EASY" and any(k in unknown for k in GATE_KEYS)
    )

    # Evidence from unofficial pages alone should never produce a verdict.
    if easy_but_unverified or not has_official_source:
        label = UNKNOWN_LABEL

    return Difficulty(
        score=score,
        label=label,
        lower_bound=bool(unknown),
        unknown_inputs=unknown,
        breakdown=breakdown,
    )


def estimate_effort(inputs: dict[str, bool | float]) -> Effort:
    low, high = EFFORT_BASE
    for key, (add_low, add_high) in EFFORT_ADDONS.items():
        if inputs.get(key) is True:
            low += add_low
            high += add_high
    return Effort(low_minutes=low, high_minutes=high)


def describe() -> dict:
    """Machine-readable rubric so the UI legend can never drift from the scorer."""
    return {
        "tiers": [{"label": n, "min": lo, "max": hi} for n, lo, hi in TIERS],
        "unknown_label": (
            f"{UNKNOWN_LABEL} is shown when the score is only a lower bound and a "
            "gating input (review, paid plan, audit, business verification) "
            "was not found, or when no official source was read."
        ),
        "weights": WEIGHTS,
        "wait_steps": [{"days_at_least": d, "points": p} for d, p in WAIT_STEPS],
        "paid_floor": PAID_FLOOR,
        "facts": {k: {"kind": v.kind, "description": v.description} for k, v in FACT_SPECS.items()},
        "evidence_labels": {
            "VERIFIED": "Official page states it explicitly; the quote was found in the fetched page text.",
            "DOCS": "Official page implies it; the quote was found in the fetched page text.",
            "COMMUNITY": "Only a non-official page says it; the quote was found in the fetched page text.",
            "UNKNOWN": "No checkable source. Such claims are dropped from the guide.",
        },
        "note": "Labels describe source text only. Nothing is executed against provider portals.",
    }