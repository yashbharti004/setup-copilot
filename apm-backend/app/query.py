from __future__ import annotations
from publicsuffix2 import get_sld   
import re
from dataclasses import dataclass
from urllib.parse import urlparse

_SECOND_LEVEL = {"co", "com", "org", "net", "gov", "ac", "edu"}
_STOPWORDS = {"the", "and", "for", "app", "api", "inc", "formerly"}
_DOMAIN_RE = re.compile(r"^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(/\S*)?$")

OFFICIAL_DOMAINS: dict[str, tuple[str, ...]] = {
    "github": ("github.com",),
    "google": ("google.com",),
    "youtube": ("youtube.com", "google.com"),
    "slack": ("slack.com",),
    "notion": ("notion.so", "notion.com"),
    "replit": ("replit.com",),
    "twitter": ("twitter.com",),
    "x": ("x.com",),
}

# Names whose official domains do not contain the app name.
ALIASES: dict[str, tuple[str, ...]] = {
    "x": ("x", "twitter"),
    "twitter": ("x", "twitter"),
    "x-twitter": ("x", "twitter"),
    "x-formerly-twitter": ("x", "twitter"),
    "google-workspace": ("google",),
    "google-workspace-gmail-drive": ("google",),
    "gmail": ("google",),
    "google-drive": ("google",),
    "google-calendar": ("google",),
    "youtube": ("youtube", "google"),
}

# Hosts where anyone can publish; never treated as official even if a name matches.
UGC_SUFFIXES = (
    "github.io", "medium.com", "substack.com", "blogspot.com", "wordpress.com",
    "notion.site", "readthedocs.io", "gitbook.io", "netlify.app", "vercel.app",
    "pages.dev", "herokuapp.com", "stackoverflow.com", "reddit.com",
)


@dataclass(frozen=True)
class ParsedQuery:
    raw: str
    name: str
    slug: str
    domain: str | None
    tokens: tuple[str, ...]


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:80]


def registrable_domain(host: str) -> str:
    host = host.lower().strip(".")
    try:
        result = get_sld(host)
        return result.lower() if result else host
    except Exception:
        return host


def registrable_label(host: str) -> str:
    return registrable_domain(host).split(".")[0]


def host_of(url: str) -> str:
    try:
        host = urlparse(url).hostname
    except ValueError:
        host = None
    return (host or "").lower().removeprefix("www.")


def is_official(url: str, tokens: tuple[str, ...]) -> bool:
    host = host_of(url).rstrip(".")

    if not host or not tokens:
        return False

    # Exclude known user-generated-content platforms.
    for suffix in UGC_SUFFIXES:
        if host == suffix or host.endswith("." + suffix):
            return False

    # Trust only explicitly registered provider domains.
    for token in tokens:
        for official_domain in OFFICIAL_DOMAINS.get(token, ()):
            if (
                host == official_domain
                or host.endswith("." + official_domain)
            ):
                return True

    return False


def _tokens(name: str, slug: str, domain: str | None) -> tuple[str, ...]:
    found = {t for t in re.findall(r"[a-z0-9]+", name.lower()) if len(t) > 1 and t not in _STOPWORDS}
    found.update(ALIASES.get(slug, ()))
    if domain:
        found.add(registrable_label(domain))
    if not found:
        found.add(slug.replace("-", ""))
    return tuple(sorted(found))


def parse_query(raw: str) -> ParsedQuery:
    q = (raw or "").strip()
    if len(q) < 2:
        raise ValueError("Enter an app name or a developer-portal URL.")
    if len(q) > 200:
        raise ValueError("Query is too long.")

    lowered = q.lower()
    candidate: str | None = None
    if "://" in lowered:
        candidate = lowered
    elif _DOMAIN_RE.match(lowered):
        candidate = "https://" + lowered

    domain: str | None = None
    name = q
    if candidate:
        try:
            host = urlparse(candidate).hostname
        except ValueError:
            host = None
        if not host or "." not in host:
            raise ValueError("That URL does not look valid.")
        domain = host.removeprefix("www.")
        name = registrable_label(domain)

    slug = slugify(name)
    if not slug:
        raise ValueError("Could not read an app name from that input.")
    return ParsedQuery(raw=q, name=name, slug=slug, domain=domain, tokens=_tokens(name, slug, domain))