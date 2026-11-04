import pytest

from app.query import is_official, parse_query


def test_plain_name():
    p = parse_query("GitHub")
    assert p.slug == "github" and p.domain is None and "github" in p.tokens


def test_url_input_derives_name_and_domain():
    p = parse_query("https://developers.hubspot.com/docs/api")
    assert p.name == "hubspot" and p.domain == "developers.hubspot.com"


def test_bare_domain_input():
    assert parse_query("api.slack.com").name == "slack"


def test_alias_tokens_for_x():
    p = parse_query("X (Twitter)")
    assert "x" in p.tokens and "twitter" in p.tokens


def test_garbage_is_rejected():
    for bad in ("", " ", "a", "!!!"):
        with pytest.raises(ValueError):
            parse_query(bad)


def test_official_detection():
    tokens = ("github",)
    assert is_official("https://docs.github.com/en/apps", tokens)
    assert not is_official("https://someone.github.io/post", tokens)
    assert not is_official("https://example.com/github-guide", tokens)
    assert is_official("https://developers.google.com/identity", ("google",))


def test_developers_provider_is_official():
    assert is_official("https://developers.hubspot.com/docs/api", ("hubspot",))
    assert is_official("https://developer.spotify.com/documentation/web-api", ("spotify",))
    assert is_official("https://developers.asana.com/docs", ("asana",))
    assert is_official("https://developers.zoom.us/docs", ("zoom",))
    assert is_official("https://developers.google", ("google",))
    assert is_official("developers.hubspot.com", ("hubspot",))
    assert is_official("https://api.developers.provider.com/v1", ("provider",))
    assert not is_official("https://developers.attacker.com/google", ("google",))
    assert not is_official("https://developers.github.io", ("github",))
    assert not is_official("https://developers.medium.com", ("medium",))
