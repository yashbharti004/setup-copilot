What the assignment is really about

The pain: To let an AI agent act on a user’s Gmail, Notion, HubSpot and so on, a developer usually has to register their own OAuth app with that provider. That means creating a client ID and secret, setting redirect URIs, picking scopes, and sometimes passing a review before real users can connect. Each provider does this differently. Some take 10 minutes (GitHub). Some take weeks (Google’s sensitive or restricted scopes need verification, and possibly a security assessment; Slack’s public distribution needs review; some providers require a business account or partnership). Developers currently don’t know which case they’re in until they’ve burned days.

What Composio wants: a tool that tells a developer, for any app:

How hard it is (easy, medium, hard)
How long it will take, including approval waits
Exact steps, requirements and gotchas
What an agent can do for them and where they must take over
What to do when blocked (rejections, missing scopes, a business-verification wall)

It should have a pre-built library (you only need a few samples) and a live generation flow: type an unfamiliar app, and an agent researches it and produces a shareable guide.

What they’re evaluating (they say this explicitly): problem understanding, usefulness, judgment about evidence, and thoughtful use of agents. The last two matter most. A pretty UI that confidently states hallucinated approval times will lose to a plainer one that says “verified from the official docs on this date, unverified: review timeline.”

Core product insight

Don’t build “a docs summarizer.” Build an evidence-graded setup-path planner.

Every claim in a guide carries a confidence label: Verified (I tested it), Sourced (official docs, linked), Community-reported (forums, issues), Unknown (flagged honestly).
The guide is organized around decisions and blockers, not around the docs’ table of contents.
The agent’s work is visible (what it searched, fetched, and what it couldn’t find).

This is the product decision you’ll defend in the README.

Scope decision

In scope

A guide schema, one guide page template, 4 hand-verified sample guides, a live-generation agent, and a verification log.
Shareable URL per guide.

Out of scope (say so in the README)

All 100 apps, real provider approvals, auth/accounts, a database beyond simple storage, an automated browser doing actual signups.

Pick 4 sample apps with different difficulty profiles:

App	Why it’s a good sample
GitHub	Easy: self-serve, instant, no review. Your baseline.
Slack	Medium: instant for dev workspaces, review for the public directory.
Google (Gmail or Drive)	Hard: consent screen, sensitive/restricted scopes, verification, possibly a security assessment. Most valuable demo.
Notion or HubSpot or Linear	Medium/odd: public vs internal integrations, a marketplace listing.

Optionally add one “gated” app (e.g., X/Twitter or LinkedIn, where access tiers and approval are the blocker) to show the “agent hands off to human” story.

Architecture (simple, fast to ship)

Stack: Next.js (or Vite and a small Node server) on Vercel; the Anthropic API for the agent; web search and fetch tools for research; static JSON for the library.

User input (name or URL)
   → Resolve app (name, domain, dev-docs URL)
   → Research agent (search + fetch loop, bounded steps)
   → Structured extraction (JSON matching the schema, each field with sources)
   → Verifier pass (checks claims against the fetched text, downgrades unsupported ones)
   → Render guide page + shareable link (/guide/[slug])

Agent design (the “thoughtful use of agents” part):
Use 2-3 narrow roles rather than one giant prompt:

Researcher: searches for the provider’s OAuth/app-registration docs, review/verification policy, and rate or approval signals. Fetches the pages and records the URLs.
Writer: fills the schema only from the fetched evidence. Unknown stays “Unknown.”
Verifier/critic: for every claim, checks that the cited source text supports it. Flags anything unsupported, and flags stale or contradictory sources.

Stream progress to the UI (“Found developer docs… checking review requirements… no official timeline found”). That makes the agent’s investigation visible and makes live demos far more impressive.

The guide schema (this is your most important artifact)
app: name, slug, logo, docs_url
summary: one-line verdict
difficulty: Easy | Moderate | Hard | Gated
time_estimate:
  setup_active_effort: e.g. "15–30 min"
  approval_wait: e.g. "None" | "1–5 business days (community-reported)" | "Unknown"
  confidence: verified | sourced | community | unknown
prerequisites: [account type, business verification, paid plan, domain, privacy policy URL...]
path: [ordered steps; each has: action, detail, who (agent | you), source, confidence]
config_values: redirect URI format, auth/token URLs, default scopes, PKCE support
scopes: [scope, what it unlocks, sensitivity (basic / sensitive / restricted)]
approval: required? what's reviewed? typical rejection reasons, what to prepare
blockers_and_fixes: [symptom → cause → fix]
agent_vs_human: what the agent can do (draft privacy policy, prepare scope justifications, generate redirect URIs, write the review request) vs what only you can do (create the account, submit identity docs)
what_to_do_next: concrete next 3 actions
evidence: [{claim, source_url, retrieved_at, status}]
uncertainties: explicit list
last_verified: date

Two design points: a difficulty rubric that is transparent (e.g., points for review required, business verification, paid plan, restricted scopes, manual approval), so the rating is explainable and consistent across apps rather than vibes.

Time plan (about 7 hours)
Block	Time	Output
1. Understand the problem	45 min	Read the Composio managed-auth directory and docs; manually do the GitHub OAuth app setup (see below); write 5 bullets on what a developer actually struggles with
2. Schema and rubric	45 min	Final JSON schema, difficulty rubric, confidence labels
3. Manual research of 4 samples	90 min	Source-backed drafts; this becomes your ground truth for judging the agent
4. Build the agent pipeline	90 min	Researcher, writer and verifier; structured JSON output; step streaming
5. UI	60 min	Search box, library grid, guide page, evidence panel, share link, “agent vs you” section
6. Verification and corrections	45 min	Compare agent output vs ground truth; log the diffs (see below)
7. README, deploy, test live on unfamiliar apps	45 min	Deployed link, repo, README

Order matters: do block 3 before the agent, so you know what “good” looks like and can measure the agent against it.

The “show us what you tested” piece

Without paid accounts you can still do real verification:

Actually attempt setup where it’s free: GitHub OAuth App, a Slack app on a free workspace, a Google Cloud project’s OAuth consent screen (stops at the point where verification is needed; screenshot the warning about the unverified-app limits and the sensitive-scope prompt). Record what’s really required versus what the docs imply.
Build a verification log (a table in the README or a page in the app): claim, how checked, result (confirmed, corrected, couldn’t verify). Include at least a few corrections, e.g. “agent said X scope is sensitive; docs show it’s restricted,” or “agent’s approval estimate came from a forum post, downgraded to community-reported.”
Run the agent on 3 apps outside your library and report where it failed. Honest failure notes score well.
Key decisions to write in your README
Why evidence grading over polished prose (trust is the product).
Why a narrow, 4-app library plus live generation, instead of 100 shallow guides.
Why a multi-step agent with a verifier rather than a single prompt (hallucination control).
Why agent/human handoff is explicit (the brief asks for it).
What the agent can’t do: it can’t sign up for accounts, pass CAPTCHAs, or submit verification, so the guide marks those as “you.”
How this could connect to Composio: e.g., for apps in their managed-auth directory, the guide’s first recommendation could be “you may not need your own OAuth app, use Composio’s managed auth to start, and bring your own when you need custom branding or scopes.” This shows product thinking, since the managed directory is the starting point they gave you. Check the directory to see which of your sample apps are managed and use that to shape the “do you even need to do this?” step. (I haven’t looked at the current directory contents, so verify what it says.)
Limitations to state plainly

Approval times are mostly not published; guides use community reports with low confidence. Providers change their processes, so each guide carries a last_verified date. The live agent may miss pages behind JS or logins. No real approvals were attempted.

Practical tips
Cap the agent: a maximum number of search and fetch steps (say 8-12) and a timeout so live demos don’t hang. Cache results per app.
Pre-run a few “unfamiliar” apps (e.g., Zoom, Asana, Dropbox, Atlassian) so you know the pipeline holds before they pick one.
Never let the writer invent: instruct it that any field without a source must be “Unknown.”
Keep secrets out: env vars only, .env.example in the repo.
Prioritize the demo path: type app, see the live steps, see a clear verdict at the top (difficulty, time, blockers), scroll to the steps, copy the share link.


The “startup-grade, zero-cost” version

The goal is a product that feels like a real Composio feature (think “Composio Setup Copilot”), not a hackathon demo. Here is the opinionated stack and what separates it from an average submission.

Free stack (best in class)
Layer	Pick	Why
Framework	Next.js (App Router) + TypeScript	Standard startup stack; API routes and UI in one repo
UI	Tailwind + shadcn/ui + Framer Motion	Looks like a funded product out of the box
Hosting	Vercel Hobby	Free, instant public link, preview deploys
LLM	Gemini (latest Flash/Pro tier) via Google AI Studio free tier, with Groq (Llama/Qwen-class models) as fallback	Generous free limits, long context for reading docs, native structured JSON output. Fallback makes live demos resilient to rate limits
Search	Tavily free tier (primary) + Brave/Serper free credits (backup)	Built for agents, returns clean content
Page fetch	Jina Reader (r.jina.ai/<url>) + Firecrawl free tier for JS-heavy pages	Turns docs pages into clean markdown for free
Storage / cache	Upstash Redis or Supabase free tier	Cache generated guides, power share links
Agent orchestration	Vercel AI SDK (streaming, tool calls, structured output)	Live step-by-step progress with little code
Validation	Zod schemas	Enforces the guide schema, so output is never malformed
Browser automation (optional)	Playwright locally for screenshots of real setup screens	Supports “what I tested” with real evidence

Free-tier limits change often, so check each provider’s current limits before you depend on them. Build the LLM and search calls behind a small interface so you can swap providers in minutes if one throttles you during the demo.

What makes it feel like a real product
Verdict-first guide page. At the top: difficulty badge, effort estimate, approval wait, confidence meter, and a “blockers” count. A developer gets the answer in 5 seconds, then scrolls for detail.
Evidence drawer. Every claim has a small source chip (Verified, Official docs, Community, Unknown). Clicking it shows the exact source snippet and retrieval date. This is your strongest differentiator on “judgment about evidence.”
Live agent timeline. A streaming panel shows “Searching developer docs… Reading app review policy… Checking scope sensitivity… Verifying 14 claims… 2 downgraded.” It’s both a great demo and honest about the process.
“Agent does / You do” split. Two columns per step. Agent-doable items have a Generate button: draft a privacy policy stub, scope justification text, redirect URI list, or the review-request email. This is the “make progress on it” part of the brief, and few candidates will build it.
“What to do if blocked” playbook. Symptom, cause, fix, plus a drafted escalation message to the provider.
Shareable, clean URLs (/guide/google-drive) with an Open Graph preview image so links look good in Slack.
Library page with filters (difficulty, approval required, time) and 4 hand-verified guides with a “Verified by test” badge.
Composio-aware angle: a “Do you even need your own OAuth app?” banner. If the app is in Composio’s managed-auth directory, say that managed auth can get you started immediately and own credentials matter later (custom branding, scopes, quotas). Check the live directory to confirm which apps qualify rather than assuming.
Freshness: a last_verified date and a “Report an issue / re-run research” button.
Eval page (/evals): a table of your verification log, showing agent claims vs ground truth, accuracy per field. Very few candidates will show their own failures openly, and it signals engineering maturity.
Agent pipeline (production-style)
resolve_app  → name/URL → canonical app + dev-docs domain
research     → Tavily search (targeted queries) → fetch top sources via Jina/Firecrawl
extract      → Gemini structured output (Zod schema), every field cites source IDs
verify       → second pass: each claim vs cited text → supported / weak / unsupported
score        → deterministic difficulty rubric computed in code (not by the LLM)
render       → stream partial results to UI, cache final guide

Two important choices:

Difficulty is computed by code from extracted facts (review required, business verification, restricted scopes, paid plan, manual approval, known rejection patterns), so ratings are consistent and explainable.
Fixed query templates per app (“{app} OAuth app registration”, “{app} app review verification requirements”, “{app} OAuth scopes”, “{app} API approval time”) plus a few agent-chosen follow-ups. Bounded steps keep live runs under about 60 seconds and cheap.
Repo structure
/app            (pages: /, /guide/[slug], /library, /evals)
/lib/agent      (resolve, research, extract, verify, score)
/lib/schema     (zod guide schema, rubric)
/data/guides    (4 verified JSON guides)
/data/evals     (verification log)
README.md       (setup, decisions, limitations)
.env.example
Revised time plan (about 8 hours, tight)
Block	Time
Read Composio docs, manually do GitHub OAuth app setup, take notes	0:45
Schema, rubric, evidence labels	0:45
Manual research on 4 apps (your ground truth)	1:30
Agent pipeline with streaming	1:45
UI (verdict, evidence drawer, timeline, library)	1:30
“Generate” helpers and blocker playbook	0:30
Evals, corrections, README, deploy, test on 3 unfamiliar apps	1:15

If you’re short on time, cut in this order: OG images, filters, Playwright screenshots, fallback LLM. Never cut the evidence drawer, the verdict-first layout, or the verification log. Those carry the grade.

Demo script (assume they’ll test you live)
Open library, show the Google guide (hard) versus GitHub (easy) to prove the difficulty spread.
Type an unfamiliar app, watch the timeline stream, land on a verdict.
Open the evidence drawer, show one Unknown and explain why you left it honest.
Click a Generate button (scope justification), then copy the share link.
Show /evals with one thing the agent got wrong and what you changed.