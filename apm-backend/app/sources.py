from __future__ import annotations

import asyncio
import ipaddress
import logging
import socket
from dataclasses import dataclass
from urllib.parse import urljoin, urlparse
import httpx
from bs4 import BeautifulSoup
from .errors import PipelineError
from .evidence import Page
from .query import ParsedQuery, is_official, registrable_domain

log = logging.getLogger("apm.sources")

TAVILY_URL = "https://api.tavily.com/search"
PAGE_CHARS = 16_000
MAX_BYTES = 1_500_000
MAX_REDIRECTS = 5
USER_AGENT = "Mozilla/5.0 (compatible; APM-Integrations-Bot/1.0)"


@dataclass(frozen=True)
class Hit:
    url: str
    title: str
    snippet: str


def is_safe_url(url: str) -> bool:
    """Basic SSRF guard. Does not defend against DNS rebinding."""
    try:
        parsed = urlparse(url)
        host = parsed.hostname
    except ValueError:
        return False
    if parsed.scheme not in ("http", "https") or not host:
        return False
    host = host.lower()
    if host == "localhost" or host.endswith((".localhost", ".local", ".internal")):
        return False
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return "." in host
    return not (
        ip.is_private or ip.is_loopback or ip.is_link_local
        or ip.is_reserved or ip.is_multicast or ip.is_unspecified
    )

async def is_safe_url_resolved(url: str) -> bool:
    """
    Reject URLs whose host resolves to non-global IP addresses.

    Defense-in-depth SSRF mitigation.
    DNS validation is not connection-time DNS pinning.
    """
    if not is_safe_url(url):
        return False

    try:
        parsed = urlparse(url)

        # Reject URLs containing embedded credentials.
        if parsed.username is not None or parsed.password is not None:
            return False

        port = parsed.port
        if port is not None and port not in (80, 443):
            return False

        host = parsed.hostname
        if not host:
            return False

        # IP-literal URLs do not require DNS resolution.
        try:
            address = ipaddress.ip_address(host)
            return address.is_global
        except ValueError:
            pass

        # Resolve both IPv4 and IPv6 records.
        loop = asyncio.get_running_loop()

        results = await asyncio.wait_for(
            loop.getaddrinfo(
                host,
                port or 443,
                type=socket.SOCK_STREAM,
            ),
            timeout=3.0,
        )

        if not results:
            return False

        addresses = {
            result[4][0]
            for result in results
        }

        # Reject the entire hostname if ANY result is non-global.
        return all(
            ipaddress.ip_address(address).is_global
            for address in addresses
        )

    except (ValueError, OSError, asyncio.TimeoutError):
        return False

def build_queries(parsed: ParsedQuery) -> list[str]:
    n = parsed.name
    return [
        f"{n} OAuth app registration developer portal create app",
        f"{n} OAuth app review approval verification requirements publish distribute",
        f"{n} API OAuth restricted scopes security assessment pricing paid plan",
    ]


async def _tavily(
    client: httpx.AsyncClient, api_key: str, query: str, include_domains: list[str] | None = None
) -> list[Hit]:
    payload: dict = {
        "query": query,
        "search_depth": "basic",
        "max_results": 6,
        "include_answer": False,
    }
    if include_domains:
        payload["include_domains"] = include_domains
    response = await client.post(
        TAVILY_URL,
        json=payload,
        headers={"Authorization": f"Bearer {api_key}"},
        timeout=30.0,
    )
    response.raise_for_status()
    data = response.json()
    hits: list[Hit] = []
    for item in data.get("results", []):
        if isinstance(item, dict) and item.get("url"):
            hits.append(
                Hit(
                    url=str(item["url"]),
                    title=str(item.get("title") or item["url"]),
                    snippet=str(item.get("content") or ""),
                )
            )
    return hits


async def search_all(client: httpx.AsyncClient, parsed: ParsedQuery, api_key: str) -> list[Hit]:
    jobs = [_tavily(client, api_key, q) for q in build_queries(parsed)]
    if parsed.domain:
        jobs.append(
            _tavily(client, api_key, f"{parsed.name} OAuth app setup", [registrable_domain(parsed.domain)])
        )
    results = await asyncio.gather(*jobs, return_exceptions=True)
    hits: list[Hit] = []
    failures = 0
    for result in results:
        if isinstance(result, BaseException):
            failures += 1
            log.warning("search query failed: %s", type(result).__name__)
        else:
            hits.extend(result)
    if failures == len(results):
        raise PipelineError("The search provider failed. Check TAVILY_API_KEY and try again.", 502)
    return hits


def _select(hits: list[Hit], tokens: tuple[str, ...]) -> list[Hit]:
    seen: set[str] = set()
    official: list[Hit] = []
    other: list[Hit] = []
    for hit in hits:
        key = hit.url.split("#")[0].rstrip("/")
        if key in seen or not is_safe_url(hit.url):
            continue
        seen.add(key)
        (official if is_official(hit.url, tokens) else other).append(hit)
    other_cap = 2 if len(official) < 5 else 1
    return official[:5] + other[:other_cap]


def html_to_text(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.get_text(strip=True) if soup.title else ""
    for tag in soup(["script", "style", "noscript", "nav", "footer", "svg", "form"]):
        tag.decompose()
    lines = (line.strip() for line in soup.get_text("\n").splitlines())
    return "\n".join(line for line in lines if line), title


async def _fetch_text(
    client: httpx.AsyncClient,
    url: str,
) -> tuple[str, str, str] | None:
    current_url = url

    try:
        for redirect_count in range(MAX_REDIRECTS + 1):
            if not await is_safe_url_resolved(current_url):
                log.warning("Blocked unsafe URL: %s", current_url)
                return None

            async with client.stream(
                "GET",
                current_url,
                headers={"User-Agent": USER_AGENT},
                follow_redirects=False,
                timeout=15.0,
            ) as response:

                # Handle redirects manually.
                if response.status_code in (301, 302, 303, 307, 308):
                    location = response.headers.get("location")

                    if not location or redirect_count >= MAX_REDIRECTS:
                        return None

                    next_url = urljoin(str(response.url), location)

                    # Validate before making the next HTTP request.
                    if not await is_safe_url_resolved(next_url):
                        log.warning(
                            "Blocked unsafe redirect: %s -> %s",
                            current_url,
                            next_url,
                        )
                        return None

                    current_url = next_url
                    continue

                if response.status_code >= 400:
                    return None

                final_url = str(response.url)

                if not await is_safe_url_resolved(final_url):
                    return None

                content_type = response.headers.get(
                    "content-type", ""
                ).lower()

                if not any(
                    item in content_type
                    for item in ("html", "text/plain", "markdown")
                ):
                    return None

                chunks: list[bytes] = []
                size = 0

                async for chunk in response.aiter_bytes():
                    remaining = MAX_BYTES - size

                    if remaining <= 0:
                        break

                    accepted = chunk[:remaining]
                    chunks.append(accepted)
                    size += len(accepted)

                    if size >= MAX_BYTES:
                        break

                body = b"".join(chunks).decode(
                    response.charset_encoding or "utf-8",
                    errors="replace",
                )

                if "html" in content_type:
                    text, title = html_to_text(body)
                    return text, title, final_url

                return body.strip(), "", final_url

        return None

    except Exception as exc:
        log.debug(
            "Fetch failed for %s: %s",
            url,
            type(exc).__name__,
        )
        return None


async def _load(
    client: httpx.AsyncClient,
    sem: asyncio.Semaphore,
    hit: Hit,
) -> tuple[Hit, str, str, str, str] | None:

    async with sem:
        fetched = await _fetch_text(client, hit.url)

    if fetched and len(fetched[0]) >= 300:
        text, title, final_url = fetched

        return (
            hit,
            text[:PAGE_CHARS],
            (title or hit.title)[:200],
            "fetch",
            final_url,
        )

    if len(hit.snippet) >= 80:
        return (
            hit,
            hit.snippet[:PAGE_CHARS],
            hit.title[:200],
            "search_snippet",
            hit.url,
        )

    return None


async def load_pages(client: httpx.AsyncClient, hits: list[Hit], parsed: ParsedQuery) -> list[Page]:
    selected = _select(hits, parsed.tokens)
    sem = asyncio.Semaphore(4)
    loaded = await asyncio.gather(*[_load(client, sem, h) for h in selected])
    pages: list[Page] = []
    for item in loaded:
        if item is None:
            continue
        hit, text, title, via, source_url = item
        pages.append(
            Page(
                id=f"S{len(pages) + 1}",
                url=source_url,
                title=title,
                official=is_official(hit.url, parsed.tokens),
                via=via,  # type: ignore[arg-type]
                text=text,
            )
        )
    return pages