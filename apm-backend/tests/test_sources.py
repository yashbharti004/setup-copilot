
import httpx
import pytest

from app.sources import MAX_BYTES, MAX_REDIRECTS, _fetch_text


@pytest.mark.asyncio
async def test_blocks_redirect_to_localhost():
    requests = []

    def handler(request):
        requests.append(str(request.url))
        return httpx.Response(
            302,
            headers={"Location": "http://localhost/admin"},
        )

    async with httpx.AsyncClient(
        transport=httpx.MockTransport(handler)
    ) as client:
        result = await _fetch_text(
            client, "https://example.com/start"
        )

    assert result is None
    assert len(requests) == 1


@pytest.mark.asyncio
async def test_follows_safe_relative_redirect():
    def handler(request):
        if request.url.path == "/start":
            return httpx.Response(
                302,
                headers={"Location": "/docs"},
            )

        return httpx.Response(
            200,
            headers={"Content-Type": "text/plain"},
            text="A" * 400,
        )

    async with httpx.AsyncClient(
        transport=httpx.MockTransport(handler)
    ) as client:
        result = await _fetch_text(
            client, "https://example.com/start"
        )

    assert result is not None
    assert result[2] == "https://example.com/docs"
    assert len(result[0]) == 400


@pytest.mark.asyncio
async def test_rejects_too_many_redirects():
    requests = []

    def handler(request):
        requests.append(str(request.url))
        return httpx.Response(
            302,
            headers={"Location": f"/redirect-{len(requests)}"},
        )

    async with httpx.AsyncClient(
        transport=httpx.MockTransport(handler)
    ) as client:
        result = await _fetch_text(
            client, "https://example.com/start"
        )

    assert result is None
    assert len(requests) == MAX_REDIRECTS + 1


@pytest.mark.asyncio
async def test_response_body_is_limited(monkeypatch):
    monkeypatch.setattr("app.sources.MAX_BYTES", 10)

    def handler(request):
        return httpx.Response(
            200,
            headers={"Content-Type": "text/plain"},
            content=b"A" * 100,
        )

    async with httpx.AsyncClient(
        transport=httpx.MockTransport(handler)
    ) as client:
        result = await _fetch_text(
            client, "https://example.com/docs"
        )

    assert result is not None
    assert len(result[0].encode("utf-8")) == 10


@pytest.mark.asyncio
async def test_returns_final_url_after_redirect():
    def handler(request):
        if request.url.path == "/old":
            return httpx.Response(
                301,
                headers={"Location": "https://docs.github.com/new"},
            )

        return httpx.Response(
            200,
            headers={"Content-Type": "text/plain"},
            text="Documentation content. " * 20,
        )

    async with httpx.AsyncClient(
        transport=httpx.MockTransport(handler)
    ) as client:
        result = await _fetch_text(
            client, "https://github.com/old"
        )

    assert result is not None
    assert result[2] == "https://docs.github.com/new"
