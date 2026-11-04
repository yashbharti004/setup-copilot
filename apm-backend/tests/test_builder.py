from app.builder import build
from app.evidence import Page
from app.query import parse_query

QUOTE = "Apps that use restricted scopes must complete a security assessment"


def _page() -> Page:
    text = QUOTE + " by an approved assessor. Verification can take several weeks."
    return Page(id="S1", url="https://developers.google.com/x", title="t", official=True, via="fetch", text=text)


def _fact(key: str, value: str, quote: str = QUOTE) -> dict:
    return {"key": key, "value": value, "source_id": "S1", "quote": quote, "directness": "explicit"}


def test_fabricated_claims_are_dropped_and_score_is_computed_by_code():
    raw = {
        "app_name": "Google Workspace",
        "category": "Productivity",
        "facts": [
            _fact("has_public_oauth_registration", "true"),
            _fact("requires_security_audit", "true"),
            _fact("uses_restricted_scopes", "true"),
            _fact("requires_video_demo", "true", quote="This sentence was invented by the model entirely"),
        ],
        "steps": [{
            "title": "Create project", "detail": "x", "actor": "human", "source_id": "S1",
            "quote": "a made up quote that does not exist anywhere in the page", "directness": "explicit",
        }],
        "blockers": [],
    }
    guide = build(parse_query("Google Workspace"), [_page()], raw, "test-model")

    keys = {f.key for f in guide.facts}
    assert "requires_video_demo" not in keys
    assert guide.difficulty is not None
    assert guide.difficulty.score == 35 and guide.difficulty.label == "MODERATE"
    assert guide.difficulty.lower_bound is True
    assert guide.steps == [] and guide.coverage["steps_dropped"] == 1
    assert guide.status == "partial"
    assert guide.sources[0].cited is True


def test_no_registration_and_no_steps_is_insufficient_evidence():
    raw = {"app_name": "Replit", "category": "Dev", "facts": [], "steps": [], "blockers": []}
    guide = build(parse_query("Replit"), [_page()], raw, "test-model")
    assert guide.status == "insufficient_evidence"
    assert guide.difficulty is None and guide.steps == []


def test_explicit_no_registration_is_reported_not_invented():
    raw = {
        "app_name": "Foo", "category": "Dev", "steps": [], "blockers": [],
        "facts": [_fact("has_public_oauth_registration", "false")],
    }
    guide = build(parse_query("Foo"), [_page()], raw, "test-model")
    assert guide.status == "no_public_oauth" and guide.difficulty is None