# Setup-Copilot

### Evidence-Based OAuth Difficulty & Blueprint Engine for AI Agents

> **"Know how hard an OAuth integration will be to configure, how long human approval takes, and automate the setup before you write agent code."**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Zod Enforced](https://img.shields.io/badge/Schema-Zod%20Enforced-306998?style=flat-square)](https://zod.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-34%20Passing-10b981?style=flat-square)](/tests)

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

Both the backend and frontend have comprehensive test suites verifying rubric calculations, boundary conditions, schema constraints, and contradiction checks:

### Run Backend Unit Tests (27 Pytest tests)
```bash
cd apm-backend
python -m pytest -v
```
Verifies query parsing, evidence extraction, official domain resolution, deterministic scoring weights, and edge cases.

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

## 3. Key Architecture & Design Decisions

### A. Absolute Source of Truth: The Dossier JSON
Every single metric, status label, and difficulty score derives strictly from verified data in the dossier JSON.
- **Zero hardcoded assumptions:** Internal strings, assumed protocols ("RFC 6749"), and guessed approval turnarounds are never hardcoded. If data was not found, it is explicitly rendered as `"Not assessed"` or `"Not stated in sources"`.
- **Honest Unknowns:** When approval wait or gating facts are unverified:
  - Approval displays as `"Not stated in sources"`, never guessed as "Instant".
  - Incomplete data renders as a lower bound (e.g. `"≥35"`) with an explicit fact count (*"Partial data: 4 of 10 facts verified"*).
  - Tiers with unknown gates render as neutral gray `UNKNOWN` with explanatory notes.
- **Official Source Gate:** A `VERIFIED` badge appears **only** when evidence is verified AND from an official developer portal. If only third-party posts were read, the UI displays a warning banner and suppresses `VERIFIED_BLUEPRINT`.

### B. Contradiction Invariants & Refinement Rules
Zod schemas (`apm-ui/lib/schema/guide.ts`) enforce `superRefine` invariants:
1. Mandatory review cannot claim 0 days approval wait without explicit explanation.
2. Self-serve instant approval cannot specify positive review turnaround days.
3. Easy difficulty tier (<25 points) is rejected if gating facts (review process, CASA audit, paid plan, business verification) are unknown.

### C. 10 Canonical OAuth Fact Verification Engine
Every dossier audits against 10 canonical facts:
1. `has_public_oauth_registration` (Public 3rd-party registration portal)
2. `review_required_for_distribution` (Mandatory app directory / external review)
3. `review_wait_days_min` (Minimum stated wait in days)
4. `review_wait_days_max` (Maximum stated wait in days)
5. `requires_paid_plan` (Paid subscription / API paywall)
6. `requires_security_audit` (Third-party assessment, e.g. CASA Tier 2/3)
7. `requires_video_demo` (Unlisted YouTube screencast)
8. `requires_domain_verification` (DNS TXT / Search Console verification)
9. `requires_business_verification` (Legal entity / D-U-N-S verification)
10. `uses_restricted_scopes` (Restricted or sensitive scope classification)

### D. Single Source of Truth Deterministic Rubric
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

## 4. Ground Truth Verification & Evals Methodology (`/evals`)

We conducted an audit of 24 claims across 9 provider developer portals (6 pre-verified ground truth + 3 live unfamiliar portals).
- **First-Pass Raw Accuracy:** **70.8%** (17 of 24 claims confirmed by initial extraction).
- **Verifier Safe Pass Rate:** **83.3%** (20 of 24 claims where the verifier critic downgraded or flagged suspicious claims to prevent engineer traps).
- **Corrected / Flagged Hallucinations:** 4 claims (e.g., catching Gmail scopes being classified as merely 'sensitive' rather than 'restricted' requiring CASA Tier 2 audits).

---

## 5. Deployment Options

### Render (1-Click Free Hosting)
1. Push code to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), select **New +** $\to$ **Blueprint**.
3. Select your repository. Render automatically reads `render.yaml` and launches the unified container for free.
4. Set `GROQ_API_KEY` (and optionally `GEMINI_API_KEY`, `TAVILY_API_KEY`) under Environment Variables.

### Railway (Container / Multi-Service)
The repository includes root `railway.json` and `Dockerfile` ready for 1-click deployment on Railway. See `DEPLOY_RAILWAY.md` for details.
