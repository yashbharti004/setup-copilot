# Setup-Copilot

### Evidence-Based OAuth Difficulty & Blueprint Engine for AI Agents

> **"Know how hard an OAuth integration will be to configure, how long human approval takes, and automate the setup before you write agent code."**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Zod Enforced](https://img.shields.io/badge/Schema-Zod%20Enforced-306998?style=flat-square)](https://zod.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-35%20Passing-10b981?style=flat-square)](/tests)

> 📋 **Notes to the Hiring Team**: Please see [**`NOTES_FOR_HIRING_TEAM.md`**](./NOTES_FOR_HIRING_TEAM.md) for our detailed submission walkthrough, including real provider benchmarks, unfamiliar app handling, ground-truth audit ledger, and key architectural decisions.

---

## 1. Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18+ or v20+ LTS
- **Python**: 3.10+ (tested on Python 3.11)

### Option A: Run Everything Locally

#### 1. Backend (FastAPI on Port 8001)
```bash
cd apm-backend
python -m venv .venv

# Windows:
.\.venv\Scripts\activate
# macOS / Linux:
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

---

## 2. Running Test Suites

Both the backend and frontend have comprehensive test suites verifying rubric calculations, boundary conditions, schema constraints, official domain detection, and contradiction checks:

### Run Backend Unit Tests (28 Pytest tests)
```bash
cd apm-backend
python -m pytest -v
```
Verifies query parsing, `developers.<provider>.*` recognition, evidence extraction, official domain resolution, deterministic scoring weights, and edge cases.

### Run Frontend Integrity & Mapper Tests (7 test suites)
```bash
cd apm-ui
npm test
```
Verifies:
- Mathematical reconciliation of the evals ledger (24 claims across 9 providers).
- Zod schema contradiction refinements (rejecting impossible combinations like mandatory human review with 0 days turnaround).
- Adapter mappings for null approval turnaround and honest `UNKNOWN` / lower-bound badges.

---

## 3. Notes to the Hiring Team: Show Us That It Works

### A. Experience on Real Apps (Full Spectrum of Challenges)
We modeled real providers spanning all 4 difficulty tiers:
- **GitHub (`Easy`, Score: 0/100, 5–10 min)**: Zero review needed for multi-user OAuth apps; only Marketplace listings require review. Instant client secret generation.
- **Slack (`Moderate`, Score: 45/100, 15–30 min)**: Granular bot vs user scope models; instant for development workspaces, but 2–3 weeks if distributing to the App Directory.
- **Google Workspace (`Hard`, Score: 80/100, 4–6 weeks)**: Gmail/Drive restricted scopes require domain verification (Search Console), an unlisted YouTube screencast, and a third-party CASA Tier 2 security audit ($5,000+).
- **X / Twitter (`Gated`, Score: 85/100, Paywall)**: Free tier has a crippling 1,500 post/mo cap and 0 read endpoints. Multi-user agents are blocked without the $100/mo Basic tier.
- **Linear (`Easy`, Score: 15/100)**: Enforces RFC 7636 PKCE for authorization code exchange.
- **Notion (`Moderate`, Score: 25/100)**: Enforces page-level isolation rather than workspace-wide access.

### B. Unfamiliar App Live Demonstration
Submit any unfamiliar app (e.g. `HubSpot`, `Spotify`, `Zoom`, `Asana`, `Dropbox`, or any `developers.<provider>.*` portal):
1. The backend automatically resolves the official developer portal and filters out user-generated content platforms.
2. It fetches documentation, extracts 10 canonical facts with cited quotes, runs the verifier critic pass, and deterministically computes the rubric score.
3. The UI renders the **Start Here** interactive checklist, the **Agent Prep Kit** for human-only steps, and the **Execution Timeline**.

### C. Ground-Truth Verification & Audit (`/evals`)
We audited **24 claims across 9 provider developer portals** (6 pre-verified + 3 unfamiliar):
- **Raw First-Pass Accuracy:** **70.8%**
- **Verifier Safe Pass Rate:** **83.3%**
- **What was corrected**:
  - *Gmail Scopes*: Caught agent classifying `gmail.modify` as standard sensitive; corrected to strictly restricted requiring CASA Tier 2 audit.
  - *Twitter Paywall*: Caught agent claiming Free Tier works for posting bots; corrected to require $100/mo Basic tier, activating Gated floor (85).
  - *Linear PKCE*: Caught agent claiming PKCE is optional; corrected to mandatory RFC 7636.
  - *Dropbox Limit*: Caught agent citing legacy 50-user limit from 2017 blog; corrected to official 500-user limit from modern API v2 docs.
- **What could not be verified (Honest Unknowns)**:
  - Most vendors do not state review turnaround SLAs in docs. Setup-Copilot marks them as `"Unknown wait: Not stated in official vendor docs"` and computes difficulty as a mathematical lower bound (`≥35`) rather than hallucinating false SLAs.

### D. Thoughtful Use of Agents
- **Agents cannot solve CAPTCHAs, verify phone numbers, or record UI screencasts.**
- **Where agents deliver massive value**: Drafting the **Agent Prep Kit** — application purpose, least-privilege scope justifications, data governance statements (AES-256 at rest, TLS 1.3 in transit), privacy policy clauses, and reviewer cover letters with staging instructions.

---

## 4. Key Architecture & Design Decisions

### A. Absolute Source of Truth: The Dossier JSON
Every single metric, status label, and difficulty score derives strictly from verified data in the dossier JSON.
- **Zero hardcoded assumptions:** Guessed approval turnarounds and internal strings are never hardcoded. If data was not found, it is explicitly rendered as `"Not assessed"` or `"Not stated in sources"`.
- **Official Source Gate:** A `VERIFIED` badge appears **only** when evidence is verified AND from an official developer portal (`developers.<provider>.*`).

### B. Contradiction Invariants & Refinement Rules
Zod schemas (`apm-ui/lib/schema/guide.ts`) enforce `superRefine` invariants:
1. Mandatory review cannot claim 0 days approval wait without explicit explanation.
2. Self-serve instant approval cannot specify positive review turnaround days.
3. Easy difficulty tier (<25 points) is rejected if gating facts are unknown.

### C. Single Source of Truth Deterministic Rubric
Scores are calculated purely in code (0–100):
- `+25 pts`: `review_required_for_distribution`
- `+10 pts`: `uses_restricted_scopes`
- `+25 pts`: `requires_security_audit`
- `+15 pts`: `requires_business_verification`
- `+10 pts`: `requires_video_demo`
- `+5 pts`: `requires_domain_verification`
- `+10 pts`: `review_wait_days_max >= 7`
- `+10 pts`: `review_wait_days_max >= 28`
- `Floor 85`: `requires_paid_plan` (e.g. X API $100/mo paywall)
- Tiers: `Easy` (0–24), `Moderate` (25–59), `Hard` (60–84), `Gated` (85+), `UNKNOWN`.

---

## 5. Deployment Options

### Render (1-Click Free Hosting)
1. Push code to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), select **New +** $\to$ **Blueprint**.
3. Select your repository. Render automatically reads `render.yaml` and launches the unified container for free.
4. Set `GROQ_API_KEY` (and optionally `GEMINI_API_KEY`, `TAVILY_API_KEY`) under Environment Variables.

### Railway (Container / Multi-Service)
The repository includes root `railway.json` and `Dockerfile` ready for 1-click deployment on Railway. See `DEPLOY_RAILWAY.md` for details.
