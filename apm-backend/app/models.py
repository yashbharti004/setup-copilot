from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel


class Evidence(str, Enum):
    VERIFIED = "VERIFIED"    # official page, explicit statement, quote found in fetched text
    DOCS = "DOCS"            # official page, implied by the text, quote found in fetched text
    COMMUNITY = "COMMUNITY"  # non-official page, quote found in fetched text
    UNKNOWN = "UNKNOWN"      # nothing checkable found


class Source(BaseModel):
    id: str
    url: str
    title: str
    official: bool
    via: Literal["fetch", "search_snippet"]
    cited: bool = False


class Fact(BaseModel):
    key: str
    value: bool | float
    evidence: Evidence
    quote: str
    source_id: str


class Step(BaseModel):
    order: int
    title: str
    detail: str
    actor: Literal["human", "agent"]
    evidence: Evidence
    quote: str
    source_id: str


class Blocker(BaseModel):
    title: str
    detail: str
    evidence: Evidence
    quote: str
    source_id: str


class Contribution(BaseModel):
    key: str
    points: int


class Difficulty(BaseModel):
    score: int
    label: str
    lower_bound: bool            # True when some scoring inputs were unknown
    unknown_inputs: list[str]
    breakdown: list[Contribution]


class Effort(BaseModel):
    low_minutes: int
    high_minutes: int
    basis: Literal["rubric_estimate"] = "rubric_estimate"


class Approval(BaseModel):
    min_days: float | None
    max_days: float | None
    evidence: Evidence


class Guide(BaseModel):
    slug: str
    query: str
    app_name: str
    category: str
    status: Literal["complete", "partial", "no_public_oauth", "insufficient_evidence"]
    generated_at: str
    model: str
    difficulty: Difficulty | None
    effort: Effort | None
    approval: Approval
    facts: list[Fact]
    steps: list[Step]
    blockers: list[Blocker]
    sources: list[Source]
    coverage: dict[str, int]
    notes: list[str]