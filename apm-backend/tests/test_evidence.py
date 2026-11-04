from app.evidence import Page, classify
from app.models import Evidence


def _pages(official: bool = True) -> dict[str, Page]:
    text = "Apps that use restricted scopes must complete a security assessment. Reviews can take several weeks."
    return {"S1": Page(id="S1", url="https://x.example", title="t", official=official, via="fetch", text=text)}


def test_exact_quote_on_official_page_is_verified():
    q = "Apps that use restricted scopes must complete a security assessment"
    assert classify(q, "S1", "explicit", _pages()) is Evidence.VERIFIED


def test_quote_matching_ignores_case_and_punctuation():
    q = "apps that use RESTRICTED scopes, must complete a security assessment!"
    assert classify(q, "S1", "explicit", _pages()) is Evidence.VERIFIED


def test_implied_on_official_page_is_docs():
    q = "Reviews can take several weeks"
    assert classify(q, "S1", "implied", _pages()) is Evidence.DOCS


def test_non_official_page_is_community():
    q = "Reviews can take several weeks"
    assert classify(q, "S1", "explicit", _pages(official=False)) is Evidence.COMMUNITY


def test_invented_quote_is_unknown():
    assert classify("This sentence does not exist anywhere", "S1", "explicit", _pages()) is Evidence.UNKNOWN


def test_missing_source_or_too_short_quote_is_unknown():
    assert classify("Reviews can take several weeks", "S9", "explicit", _pages()) is Evidence.UNKNOWN
    assert classify("several weeks", "S1", "explicit", _pages()) is Evidence.UNKNOWN
    assert classify(None, "S1", "explicit", _pages()) is Evidence.UNKNOWN