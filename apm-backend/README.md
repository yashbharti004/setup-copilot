# APM Integrations backend

Evidence-graded OAuth setup guides. The LLM extracts quote-backed claims. Code verifies the quotes, assigns labels and computes the score.

## Setup (Python 3.11+)
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env        # add ANTHROPIC_API_KEY and TAVILY_API_KEY
pytest                      # offline tests, no keys needed
uvicorn app.main:app --reload --port 8000
python -m scripts.generate_seed   # optional: pre-generate the library
python -m scripts.run_eval        # optional: writes eval/results.json
```

## API
- `GET  /api/health`
- `GET  /api/rubric`: tiers, weights and label definitions (drive your UI legend from this)
- `GET  /api/eval`: latest eval results (drive the header "accuracy" from this)
- `GET  /api/guides`, `GET /api/guides/{slug}`
- `POST /api/generate` with `{"query": "HubSpot"}` returns the guide JSON
- `GET  /api/generate/stream?q=HubSpot` is Server-Sent Events. Events: `progress` (`stage`, `message`), `done` (`guide`, `cached`), `error` (`message`, `status`)

## Key decisions
- The score and tier come from `app/rubric.py` only, and the label is derived from the score.
- A claim is kept only if its quote is found in the fetched page text. Otherwise it is dropped.
- An unknown scoring input makes the difficulty a lower bound instead of counting as zero.
- If no OAuth path is found, the status is `insufficient_evidence` or `no_public_oauth`.
- Effort is a rubric estimate, labelled as such.

## Limitations
- The quote check proves a page says something. It does not prove the model read it correctly (value, actor and effort are judgments).
- Nothing is executed against provider portals, so there is no TESTED label yet.
- JS-rendered docs may come back empty and fall back to search snippets.
- "Official" is a domain-name heuristic (see `app/query.py`).
- Rate limiting and caching are in-process. Use Redis if you run several workers.
- `eval/golden.json` was written from memory and needs checking against live docs.