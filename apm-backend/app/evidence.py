"""Quote verification. This is what makes a VERIFIED badge mean something."""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from typing import Literal

from .models import Evidence

MIN_QUOTE_WORDS = 4
MAX_QUOTE_CHARS = 600

_NON_WORD = re.compile(r"[\W_]+", re.UNICODE)


def normalize(text: str) -> str:
    """Case/punctuation/whitespace-insensitive form used for quote matching."""
    return _NON_WORD.sub(" ", unicodedata.normalize("NFKC", text).casefold()).strip()


@dataclass
class Page:
    id: str
    url: str
    title: str
    official: bool
    via: Literal["fetch", "search_snippet"]
    text: str
    norm: str = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self.norm = f" {normalize(self.text)} "


def classify(
    quote: str | None,
    source_id: str | None,
    directness: str | None,
    pages: dict[str, Page],
) -> Evidence:
    if not quote or not source_id or len(quote) > MAX_QUOTE_CHARS:
        return Evidence.UNKNOWN

    page = pages.get(source_id)
    if page is None:
        return Evidence.UNKNOWN

    nq = normalize(quote)

    if len(nq.split()) < MIN_QUOTE_WORDS:
        return Evidence.UNKNOWN

    if f" {nq} " not in page.norm:
        return Evidence.UNKNOWN

    # Search snippets are not sufficient for VERIFIED evidence.
    if page.via != "fetch":
        return Evidence.COMMUNITY if not page.official else Evidence.DOCS

    if not page.official:
        return Evidence.COMMUNITY

    if directness == "explicit":
        return Evidence.VERIFIED

    if directness == "implied":
        return Evidence.DOCS

    return Evidence.UNKNOWN