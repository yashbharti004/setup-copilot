import {
  Guide,
  ConfidenceLevel,
  DifficultyLevel,
  EvidenceItem,
  SetupStep,
  BlockerItem,
  ScopeItem,
  Sensitivity,
} from "./schema/guide";

export interface BackendFact {
  key: string;
  value: boolean | number;
  evidence: "VERIFIED" | "DOCS" | "COMMUNITY" | "UNKNOWN" | string;
  quote: string;
  source_id: string;
}

export interface BackendStep {
  order: number;
  title: string;
  detail: string;
  actor: "human" | "agent";
  evidence: "VERIFIED" | "DOCS" | "COMMUNITY" | "UNKNOWN" | string;
  quote: string;
  source_id: string;
}

export interface BackendBlocker {
  title: string;
  detail: string;
  evidence: "VERIFIED" | "DOCS" | "COMMUNITY" | "UNKNOWN" | string;
  quote: string;
  source_id: string;
}

export interface BackendSource {
  id: string;
  url: string;
  title: string;
  official: boolean;
  via: "fetch" | "search_snippet";
  cited: boolean;
}

export interface BackendDifficulty {
  score: number;
  label: string;
  lower_bound: boolean;
  unknown_inputs: string[];
  breakdown: Array<{ key: string; points: number }>;
}

export interface BackendEffort {
  low_minutes: number;
  high_minutes: number;
  basis: string;
}

export interface BackendApproval {
  min_days: number | null;
  max_days: number | null;
  evidence: "VERIFIED" | "DOCS" | "COMMUNITY" | "UNKNOWN" | string;
}

export interface BackendGuide {
  slug: string;
  query: string;
  app_name: string;
  category: string;
  status: "complete" | "partial" | "no_public_oauth" | "insufficient_evidence";
  generated_at: string;
  model: string;
  difficulty: BackendDifficulty | null;
  effort: BackendEffort | null;
  approval: BackendApproval;
  facts: BackendFact[];
  steps: BackendStep[];
  blockers: BackendBlocker[];
  sources: BackendSource[];
  coverage: Record<string, number>;
  notes: string[];
}

const CANDIDATE_URLS = [
  process.env.BACKEND_URL,
  process.env.NEXT_PUBLIC_BACKEND_URL,
  "http://127.0.0.1:8001",
  "http://127.0.0.1:8000",
  "http://localhost:8001",
  "http://localhost:8000",
].filter(Boolean) as string[];

let activeBackendUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8001";

export function getBackendBaseUrl(): string {
  return activeBackendUrl;
}

export const BACKEND_BASE_URL = activeBackendUrl;

export function mapEvidenceToConfidence(raw?: string): ConfidenceLevel {
  if (!raw) return "unknown";
  const upper = raw.toUpperCase();
  if (upper === "VERIFIED") return "verified";
  if (upper === "DOCS" || upper === "SOURCED") return "sourced";
  if (upper === "COMMUNITY") return "community";
  return "unknown";
}

export function mapDifficultyLabel(label?: string, score?: number): DifficultyLevel {
  if (label) {
    const l = label.toLowerCase();
    if (l === "easy") return "Easy";
    if (l === "moderate") return "Moderate";
    if (l === "hard") return "Hard";
    if (l === "gated") return "Gated";
  }
  const s = score ?? 0;
  if (s >= 85) return "Gated";
  if (s >= 60) return "Hard";
  if (s >= 25) return "Moderate";
  return "Easy";
}

// Well-known Composio catalog entries for managed auth lookup
const COMPOSIO_MANAGED_APPS: Record<
  string,
  { appId: string; toolUrl: string; note: string; whenToByoc: string[] }
> = {
  github: {
    appId: "github",
    toolUrl: "https://composio.dev/tools/github",
    note: "Composio provides managed OAuth for GitHub with automatic token refresh, webhook handlers, and fine-grained repository permissions.",
    whenToByoc: [
      "Custom GitHub App branding on authorization dialogs",
      "Organization-wide webhook subscriptions with bespoke secrets",
    ],
  },
  slack: {
    appId: "slack",
    toolUrl: "https://composio.dev/tools/slack",
    note: "Composio provides verified multi-workspace Slack distribution out of the box without requiring manual App Directory submission.",
    whenToByoc: [
      "Custom Slack bot name and custom avatar in target team workspaces",
      "Bespoke internal slash command handlers",
    ],
  },
  "google-workspace": {
    appId: "google",
    toolUrl: "https://composio.dev/tools/google",
    note: "Skip Google Cloud consent screen verification, domain ownership checks, and $15,000 CASA security audits with Composio Managed Auth.",
    whenToByoc: [
      "Enterprise requirement for first-party Google Cloud project console",
      "Bespoke private service account domain-wide delegation",
    ],
  },
  notion: {
    appId: "notion",
    toolUrl: "https://composio.dev/tools/notion",
    note: "Connect to Notion workspaces instantly without building custom OAuth exchange flows or handling integration secret lifecycles.",
    whenToByoc: [
      "Custom enterprise workspace integration keys",
      "Dedicated workspace audit trail requirements",
    ],
  },
  linear: {
    appId: "linear",
    toolUrl: "https://composio.dev/tools/linear",
    note: "Composio provides pre-configured Linear OAuth with PKCE RFC 7636 token negotiation.",
    whenToByoc: [
      "Custom white-labeled Linear integration name",
      "Dedicated OAuth client ID for enterprise billing",
    ],
  },
  "twitter-x": {
    appId: "twitter",
    toolUrl: "https://composio.dev/tools/twitter",
    note: "Composio provides managed multi-account posting without individual developers paying the $100/mo X API Basic paywall.",
    whenToByoc: [
      "Direct enterprise firehose streaming endpoints",
      "First-party developer credentials required for compliance",
    ],
  },
};

export function adaptBackendGuideToFrontend(bg: BackendGuide): Guide {
  const slug = bg.slug;
  const managedConfig = COMPOSIO_MANAGED_APPS[slug];
  const primarySource = bg.sources.find((s) => s.official) || bg.sources[0];
  const docsUrl = primarySource?.url || `https://developer.${slug}.com`;

  // Build evidence ledger from sources and facts/steps/blockers
  const sourceMap = new Map<string, BackendSource>();
  for (const s of bg.sources) {
    sourceMap.set(s.id, s);
  }

  const evidenceLedger: EvidenceItem[] = [];

  // 1. Add facts to evidence ledger
  for (const f of bg.facts) {
    const s = sourceMap.get(f.source_id);
    evidenceLedger.push({
      id: `${f.source_id}-fact-${f.key}`,
      claim: `Fact: ${f.key.replace(/_/g, " ")} = ${String(f.value)}`,
      source_url: s?.url || docsUrl,
      retrieved_at: bg.generated_at,
      status: mapEvidenceToConfidence(f.evidence),
      snippet: f.quote || `Verified ${f.key}: ${f.value}`,
    });
  }

  // 2. Add sources themselves to evidence ledger
  for (const s of bg.sources) {
    if (!evidenceLedger.some((e) => e.source_url === s.url)) {
      evidenceLedger.push({
        id: s.id,
        claim: `Source: ${s.title}`,
        source_url: s.url,
        retrieved_at: bg.generated_at,
        status: s.official ? "sourced" : "community",
        snippet: `Fetched via ${s.via} (${s.official ? "official" : "third-party"})`,
      });
    }
  }

  // Build setup path
  const agentSteps: string[] = [];
  const humanSteps: string[] = [];

  const setupPath: SetupStep[] = (bg.steps || []).map((step) => {
    const src = sourceMap.get(step.source_id);
    const confidence = mapEvidenceToConfidence(step.evidence);

    let generatorAction: SetupStep["generator_action"] = undefined;
    const titleLower = step.title.toLowerCase();
    const detailLower = step.detail.toLowerCase();

    if (titleLower.includes("privacy") || detailLower.includes("privacy")) {
      generatorAction = "draft_privacy_policy";
    } else if (titleLower.includes("scope") || detailLower.includes("scope")) {
      generatorAction = "scope_justification";
    } else if (titleLower.includes("redirect") || detailLower.includes("callback")) {
      generatorAction = "redirect_uri";
    } else if (titleLower.includes("review") || titleLower.includes("submit") || detailLower.includes("approval")) {
      generatorAction = "review_email";
    }

    if (step.actor === "agent") {
      agentSteps.push(`${step.title}: ${step.detail}`);
    } else {
      humanSteps.push(`${step.title}: ${step.detail}`);
    }

    return {
      step_number: step.order,
      action: step.title,
      detail: step.detail,
      who: step.actor === "agent" ? "agent" : "you",
      source: src?.title || src?.url || step.source_id,
      confidence,
      evidence_id: step.source_id,
      generator_action: generatorAction,
    };
  });

  // Build blockers playbook
  const blockersPlaybook: BlockerItem[] = (bg.blockers || []).map((b) => ({
    symptom: b.title,
    cause: b.detail,
    fix: b.quote || b.detail,
    escalation_template: `To: ${bg.app_name} Developer Support\nSubject: Assistance with OAuth configuration for ${bg.app_name}\n\nIssue: ${b.title}\nDetail: ${b.detail}\n\nPlease advise on resolution steps.`,
  }));

  // Build scopes analysis
  const hasRestricted = bg.facts.some(
    (f) => f.key === "uses_restricted_scopes" && f.value === true
  );
  const highestSeverity: Sensitivity = hasRestricted ? "restricted" : "basic";

  const scopesList: ScopeItem[] = [
    {
      scope: "read_profile",
      unlocks: "Access user profile and account identifiers",
      sensitivity: "basic",
      verification_required: false,
    },
    {
      scope: "agent_actions",
      unlocks: "Perform standard agent actions on behalf of the user",
      sensitivity: highestSeverity,
      verification_required: hasRestricted,
    },
  ];

  // Difficulty calculation
  const score = bg.difficulty?.score ?? 0;
  const diffLabel = mapDifficultyLabel(bg.difficulty?.label, score);
  const factors = (bg.difficulty?.breakdown || [])
    .filter((b) => b.points > 0)
    .map((b) => `${b.key.replace(/_/g, " ")} (+${b.points} pts)`);

  if (bg.difficulty?.lower_bound) {
    factors.push("Lower bound score (some scoring inputs unknown)");
  }

  // Time estimates
  const effortStr = bg.effort
    ? `${bg.effort.low_minutes}-${bg.effort.high_minutes} mins`
    : "15-30 mins";

  const devWaitStr =
    bg.approval?.min_days != null
      ? `${bg.approval.min_days}${bg.approval.max_days ? `-${bg.approval.max_days}` : ""} days`
      : "Instant (0s)";

  const prodWaitStr =
    bg.approval?.max_days != null
      ? `${bg.approval.max_days} days`
      : bg.approval?.min_days != null
      ? `${bg.approval.min_days} days`
      : "Instant (no review required)";

  const isApprovalReq =
    bg.approval?.min_days != null ||
    bg.approval?.max_days != null ||
    score >= 25;

  return {
    app: {
      name: bg.app_name,
      slug: bg.slug,
      logo: `/logos/${bg.slug}.svg`,
      docs_url: docsUrl,
      category: bg.category || "Productivity",
      in_composio_managed: Boolean(managedConfig),
      composio_app_id: managedConfig?.appId,
      composio_tool_url: managedConfig?.toolUrl,
      managed_alternative_note: managedConfig?.note,
      when_to_byoc: managedConfig?.whenToByoc,
    },
    summary:
      bg.status === "no_public_oauth"
        ? `No public self-serve OAuth registration found for ${bg.app_name}. Manual enterprise request required.`
        : `${bg.app_name} OAuth integration guide generated by APM Backend (${bg.model || "Gemini"}). Deterministic rubric score: ${score}/100 [${diffLabel.toUpperCase()}].`,
    difficulty: diffLabel,
    difficulty_score: score,
    difficulty_factors: factors.length > 0 ? factors : ["Standard OAuth 2.0 flow"],
    time_estimate: {
      setup_active_effort: effortStr,
      approval_wait: prodWaitStr,
      confidence: mapEvidenceToConfidence(bg.approval?.evidence),
      dev_wait_claim: devWaitStr,
      dev_wait_confidence: mapEvidenceToConfidence(bg.approval?.evidence),
      production_wait_claim: prodWaitStr,
      production_wait_confidence: mapEvidenceToConfidence(bg.approval?.evidence),
    },
    prerequisites: [
      `A valid ${bg.app_name} account with developer privileges`,
      `A designated OAuth callback / redirect URL (e.g. http://localhost:3000/callback)`,
      `A secure environment to store the generated Client ID and Client Secret (.env)`,
    ],
    path: setupPath,
    config_values: {
      redirect_uri_format: `https://your-domain.com/api/auth/callback/${bg.slug} or http://localhost:3000/callback`,
      auth_url: `https://${bg.slug}.com/oauth/authorize`,
      token_url: `https://${bg.slug}.com/oauth/token`,
      default_scopes: ["read", "write"],
      pkce_support: "optional",
      token_rotation: "optional",
    },
    scopes: scopesList,
    approval: {
      required: isApprovalReq,
      what_reviewed: isApprovalReq
        ? "Scopes, privacy policy, and integration business justification reviewed by provider trust & safety team."
        : "No mandatory approval review required for direct developer OAuth authorization.",
      typical_rejection_reasons: [
        "Vague or overly broad scope requests without clear justification",
        "Missing public Privacy Policy or Terms of Service links",
        "Invalid or insecure OAuth redirect URIs",
      ],
      what_to_prepare: [
        "Accurate scope justification statement",
        "Published HTTPS privacy policy URL",
        "Production and local redirect URIs",
      ],
    },
    blockers_and_fixes: blockersPlaybook,
    agent_vs_human: {
      agent_can_do:
        agentSteps.length > 0
          ? agentSteps
          : [
              "Draft OAuth redirect URI handlers and callback listeners",
              "Construct token exchange POST payload",
              "Generate Scope Justification business case",
            ],
      you_must_do:
        humanSteps.length > 0
          ? humanSteps
          : [
              `Log into ${bg.app_name} Developer Console`,
              "Create new OAuth application credentials",
              "Save Client ID and Secret to secure .env",
            ],
      handoff_critical_point: `Developer must create the credentials in ${bg.app_name} developer portal and save them to .env before the agent can exchange tokens.`,
    },
    what_to_do_next: [
      `Open ${bg.app_name} Developer Portal to register credentials`,
      "Copy Client ID and Secret into your environment variables",
      "Execute token authorization and verify callback handling",
    ],
    evidence: evidenceLedger,
    uncertainties: bg.notes || [],
    last_verified: bg.generated_at
      ? bg.generated_at.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  };
}

export async function checkBackendHealth(): Promise<{
  ok: boolean;
  model?: string;
  keys_configured?: boolean;
}> {
  for (const url of CANDIDATE_URLS) {
    try {
      const res = await fetch(`${url}/api/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        activeBackendUrl = url;
        return await res.json();
      }
    } catch {
      // try next candidate URL
    }
  }
  return { ok: false };
}

export async function getBackendGuides(): Promise<Guide[]> {
  const urls = Array.from(new Set([activeBackendUrl, ...CANDIDATE_URLS]));
  for (const url of urls) {
    try {
      const res = await fetch(`${url}/api/guides`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        activeBackendUrl = url;
        const list: BackendGuide[] = await res.json();
        return list.map(adaptBackendGuideToFrontend);
      }
    } catch {
      // try next
    }
  }
  return [];
}

export async function getBackendGuideBySlug(slug: string): Promise<Guide | null> {
  const urls = Array.from(new Set([activeBackendUrl, ...CANDIDATE_URLS]));
  for (const url of urls) {
    try {
      const res = await fetch(`${url}/api/guides/${slug}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        activeBackendUrl = url;
        const bg: BackendGuide = await res.json();
        return adaptBackendGuideToFrontend(bg);
      }
    } catch {
      // try next
    }
  }
  return null;
}
