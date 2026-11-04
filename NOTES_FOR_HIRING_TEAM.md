# Notes for the Hiring Team

> **Project:** Setup-Copilot — Evidence-Based OAuth Difficulty & Blueprint Engine for AI Agents  
> **Repository:** [https://github.com/yashbharti004/setup-copilot](https://github.com/yashbharti004/setup-copilot)  
> **Specification:** Composio Founding Full-Stack Engineer / AI Engineer Take-Home Assignment  

---

## Executive Summary

When AI agents need to integrate with external SaaS tools, the hardest part is almost never writing the OAuth code — it is navigating the **bureaucratic, opaque, and highly restrictive developer portal ecosystem**. Developers routinely encounter surprise $100/month API paywalls, unexpected 4-week CASA security audits ($5,000+), unstated review turnaround queues, and confusing scope permission models.

**Setup-Copilot** solves this by:
1. Auditing developer portals and extracting **10 canonical OAuth facts** backed by cited source quotes.
2. Calculating a **deterministic difficulty rubric (0–100)** strictly in code — no LLM-hallucinated scores.
3. Generating an **Agent Prep Kit** for the human-only steps (drafting least-privilege scope justifications, data governance disclosures, privacy clauses, and reviewer cover letters).
4. Visualizing an **Execution Timeline** differentiating instant actions from uncommitted vendor wait gates.
5. Providing an **Architectural Advisory** explaining when developers can bypass the entire setup using Composio's pre-configured managed OAuth directory vs. when custom BYOC (Bring Your Own Credentials) is required.

---

## 1. Demonstrate the Experience on Real Apps

We modeled real providers spanning all 4 distinct difficulty tiers, each exhibiting unique architectural blockers:

| Provider | Difficulty Score | Tier | Active Effort | Approval Wait | Key Challenge / Blockers Handled |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **GitHub** | **0 / 100** | **Easy** | 5–10 min | Instant (0 days) | **Self-Serve Baseline**: Zero review needed for multi-user OAuth apps; only Marketplace listings require review. Instant client secret generation. |
| **Slack** | **45 / 100** | **Moderate** | 15–30 min | 2–3 weeks (Dir) / Instant (Dev) | **Scope Granularity**: Bot tokens (`chat:write`) vs User tokens (`chat:write.customize`); local workspace installs are instant, but public distribution requires Directory review. |
| **Google Workspace** | **80 / 100** | **Hard** | 1–2 hours | 4–6 weeks | **The Restricted Scope Trap**: Gmail and Drive scopes require Google Search Console domain verification, an unlisted YouTube screencast demo, and third-party CASA Tier 2 assessment ($5,000+). |
| **X (Twitter)** | **85 / 100** | **Gated** | 10–15 min | Immediate Paywall | **API Paywall Barrier**: Free tier is severely throttled (1,500 posts/month total per app) with 0 read endpoints. Multi-user agents are hard-blocked without a $100/mo Basic subscription. |
| **Linear** | **15 / 100** | **Easy** | 5–10 min | Instant (0 days) | **RFC 7636 PKCE Enforcement**: Mandatory `code_challenge` and `code_verifier`; agent alerts developer to avoid standard secret-only exchange. |
| **Notion** | **25 / 100** | **Moderate** | 10–15 min | Instant (0 days) | **Page-Level Isolation**: Access token does not grant root workspace access; users must explicitly share pages, preventing `object_not_found` runtime errors. |

### Live Execution on Unfamiliar Apps
If the hiring team enters an unfamiliar provider (e.g., `HubSpot`, `Spotify`, `Zoom`, `Asana`, `Dropbox`, or any arbitrary developer portal URL), Setup-Copilot executes a live streaming pipeline:
1. **Query & Domain Resolution**: Recognizes both plain text names and official portals (including `developers.<provider>.*`, `developer.<provider>.*`, and `docs.<provider>.*`).
2. **Official Source Extraction**: Deep-fetches official vendor documentation via Tavily search and targeted HTTP scraping, strictly filtering out user-generated content platforms (`github.io`, `medium.com`, `reddit.com`).
3. **Canonical Fact Extraction**: Extracts 10 boolean/numeric facts with source citations and direct quotes.
4. **Verifier Critic Pass**: Cross-examines extracted claims against strict domain invariants (e.g. flagging contradictions like mandatory review claiming 0 days turnaround).
5. **Deterministic Rubric Scoring**: Scores the provider using deterministic code weights and assigns the appropriate badge (`Easy`, `Moderate`, `Hard`, `Gated`, or `UNKNOWN`).
6. **Dynamic Asset Generation**: Generates the **Start Here** interactive checklist, **Timeline View**, and **Agent Prep Kit**.

---

## 2. Evidence Verification & Ground-Truth Audit

We audited **24 claims across 9 provider developer portals** (6 pre-verified ground-truth apps + 3 live unfamiliar portals: Zoom, Asana, Dropbox).

- **First-Pass Raw Accuracy:** **70.8%** (17 of 24 claims confirmed by initial extraction).
- **Verifier Safe Pass Rate:** **83.3%** (20 of 24 claims safely verified or appropriately downgraded).
- **Interactive Ledger:** Viewable in-app at [`/evals`](http://localhost:3000/evals) and in the **Verification Log** tab on every guide.

### What We Learned & Corrected (Verifier Critic in Action)
1. **The Gmail CASA Assessment Trap (`Google Workspace`)**:
   - *Initial Agent Claim*: `gmail.modify` was classified as a standard "Sensitive Scope" requiring a 3-day Google review.
   - *Ground Truth*: Under Google's API Services User Data Policy, `mail.google.com` and `gmail.*` scopes are strictly classified as **Restricted Scopes**, requiring a third-party CASA (Cloud App Security Assessment) Tier 2 audit costing upwards of $5,000 and 4–6 weeks turnaround.
   - *Systematic Fix*: The verifier critic catches scope strings matching restricted namespaces and enforces the CASA requirement flag, raising the difficulty score from 50 to 80 (`Hard`).
2. **The Twitter/X Free Tier Mirage (`Twitter / X`)**:
   - *Initial Agent Claim*: Developers can build automated agent bots on the Free tier.
   - *Ground Truth*: The modern v2 Free tier has a global cap of 1,500 posts/month total across all app users and provides **zero read or search endpoints**. Autonomous agents cannot read mentions or replies without the $100/mo Basic tier.
   - *Systematic Fix*: The deterministic rubric assigns an automatic floor of **85 (`Gated`)** whenever a provider requires a paid subscription to perform basic API workflows.
3. **Outdated Forum Quota Hallucination (`Dropbox` - Unfamiliar Test App)**:
   - *Initial Agent Claim*: Development apps can connect up to 50 users before requiring production review.
   - *Ground Truth*: The 50-user limit was from an old Dropbox API v1 forum post from 2017. Modern Dropbox API v2 documentation allows up to 500 connected users.
   - *Systematic Fix*: The verifier critic penalizes community forum citations and prioritized modern official documentation at `developers.dropbox.com`.
4. **Mandatory PKCE Handshake (`Linear`)**:
   - *Initial Agent Claim*: PKCE is optional for web apps.
   - *Ground Truth*: Linear enforces RFC 7636 PKCE for all authorization code flows.
   - *Systematic Fix*: Updated authentication generator to include `code_challenge_method=S256` in default boilerplate.

### What We Could Not Verify (Honest Unknowns)
- **Unstated Review Turnaround SLAs**: Developer portals for Slack, Dropbox, and Zoom do **not** publish binding SLAs for app review queues in their public documentation.
- **Handling Unknowns Honestly**: Rather than guessing a plausible-sounding turnaround (e.g. "3–5 days"), Setup-Copilot:
  - Renders the wait turnaround as `"Unknown wait: Not stated in official vendor docs"`.
  - Flags the score as a **strict lower bound** (e.g., `≥35`) with an explicit count of verified facts (`Partial data: 4 of 10 facts verified`).
  - Sets the difficulty tier to neutral gray `UNKNOWN` if gating inputs cannot be confirmed, preventing developers from walking into unforeseen project delays.

---

## 3. Key Decisions & Thoughtful Use of Agents

### A. Deterministic Code Rubric over LLM Scoring
Many AI agent implementations prompt an LLM: *"Rate the difficulty from 1 to 10 on how hard this OAuth setup is."* This produces volatile, non-reproducible scores.  
In Setup-Copilot:
- The LLM's only job is to extract verified facts and cite exact source quotes.
- The **difficulty score (0–100) is computed strictly in code** (`apm-backend/app/rubric.py` and `apm-ui/lib/schema/rubric.ts`) from 10 verified boolean and numeric flags.
- Tiers are mathematically deterministic: Easy (0–24), Moderate (25–59), Hard (60–84), Gated (85+).

### B. Thoughtful Division of Labor: Agent vs. Human
In OAuth provider onboarding, an AI agent **cannot** solve a reCAPTCHA, complete enterprise D-U-N-S verification, or record a video screencast of a user interface. Attempting to automate these steps leads to brittle failures.  
Instead, the agent adds maximum leverage by preparing everything the human needs:
- **Scope Justification Statement**: Articulates least-privilege access for review teams.
- **Data Governance & Token Security Statement**: AES-256 at rest, TLS 1.3 in transit, and token revocation disclosures.
- **Privacy Policy Clauses**: Ready-to-paste legal outlines satisfying developer portal review checkers.
- **Reviewer Submission Cover Letter**: Staging test credentials, test walkthroughs, and reviewer guidance.

### C. Composio Managed OAuth Architectural Advisory
For every provider, Setup-Copilot checks whether Composio provides a pre-configured managed app:
- **Managed Alternative Available**: Explains how developers can bypass developer portal bureaucracy, screencasts, and review queues entirely using Composio's managed credentials, while honestly documenting the edge cases where a custom BYOC setup is still required (e.g. custom white-label branding, on-premises GitHub Enterprise Server).
- **Not in Managed Directory**: Clearly indicates that custom BYOC setup is mandatory and guides the developer through the portal checklist.

---

## 4. Repository & Setup Instructions

- **Source Repository:** [https://github.com/yashbharti004/setup-copilot](https://github.com/yashbharti004/setup-copilot)
- **Deployment Configuration:** Pre-configured with `render.yaml`, `Dockerfile`, and `railway.json`.

### Local Setup (Run in 2 Minutes)

#### 1. Backend (FastAPI on Port 8001)
```bash
cd apm-backend
python -m venv .venv

# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --port 8001
```

#### 2. Frontend (Next.js on Port 3000)
```bash
cd apm-ui
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Running Test Suites
```bash
# Backend unit tests (28 passed)
cd apm-backend
python -m pytest -v

# Frontend unit & integrity tests (7 passed)
cd apm-ui
npm test
```

---

## 5. Known Limitations & Edge Cases

1. **Portals Behind Authenticated Paywalls / Logins**:
   - Providers requiring paid developer memberships before viewing portal consoles (e.g. Apple Developer Program requiring $99/year login) cannot be deep-crawled by public web fetchers. In these cases, Setup-Copilot extracts public policy documentation and conservatively bounds the score.
2. **Dynamic Client-Side Single Page Apps**:
   - Certain provider settings pages render strictly via client-side JavaScript behind user authentication cookies. For unfamiliar apps, Setup-Copilot relies on official documentation portals (`developers.<provider>.*`) rather than attempting authenticated headless browser sessions.
3. **Search Engine Rate Limits**:
   - When evaluating completely unfamiliar apps without a pre-indexed dossier, the system requires active API keys (`GROQ_API_KEY`, and optionally `TAVILY_API_KEY`). If search rate limits are reached, the system falls back gracefully to its verified local knowledge base.
