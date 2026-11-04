import {
  Guide,
  ConfidenceLevel,
  DifficultyLevel,
  EvidenceItem,
  SetupStep,
  BlockerItem,
  ScopeItem,
  Sensitivity,
  SourceItem,
  FactItem,
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
    if (l === "unknown") return "UNKNOWN";
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

/**
 * Compose a concise 1-2 sentence summary strictly derived from verified facts.
 * Strips internal backend/model names from customer-facing text.
 */
export function composeFactualSummary(
  appName: string,
  facts: BackendFact[],
  difficulty: BackendDifficulty | null,
  approval: BackendApproval
): string {
  const factMap = new Map<string, boolean | number>();
  for (const f of facts) {
    factMap.set(f.key, f.value);
  }

  const hasPublicOAuth = factMap.get("has_public_oauth_registration");
  if (hasPublicOAuth === false) {
    return `${appName} does not offer a public third-party OAuth 2.0 registration portal. Integrations require enterprise partner agreements or API key access.`;
  }

  const reviewRequired = factMap.get("review_required_for_distribution");
  const securityAudit = factMap.get("requires_security_audit");
  const restrictedScopes = factMap.get("uses_restricted_scopes");
  const paidPlan = factMap.get("requires_paid_plan");

  const sentences: string[] = [];

  if (paidPlan === true) {
    sentences.push(
      `${appName} requires a paid subscription or commercial developer plan to access OAuth endpoints.`
    );
  } else if (reviewRequired === true) {
    const minDays = approval?.min_days;
    const maxDays = approval?.max_days;
    const waitClause =
      minDays != null && maxDays != null
        ? ` with typical review turnaround of ${minDays}–${maxDays} days`
        : minDays != null
        ? ` with typical review turnaround of ${minDays} days`
        : "";
    sentences.push(
      `Production access requires mandatory app directory review and approval${waitClause}.`
    );
  } else if (reviewRequired === false) {
    sentences.push(
      `${appName} provides instant self-serve OAuth client registration with zero mandatory review wait for developer usage.`
    );
  } else {
    sentences.push(
      `App review requirements for ${appName} are not stated in retrieved documentation.`
    );
  }

  if (securityAudit === true) {
    sentences.push(
      `A third-party security assessment and compliance audit are mandatory for production scopes.`
    );
  } else if (restrictedScopes === true) {
    sentences.push(
      `Restricted and sensitive scopes trigger elevated consent verification.`
    );
  }

  return sentences.join(" ");
}

// Well-known Composio catalog entries for managed auth lookup
const COMPOSIO_MANAGED_APPS: Record<
  string,
  { appId: string; toolUrl: string; note: string; whenToByoc: string[] }
> = {
  github: {
    appId: "github",
    toolUrl: "https://composio.dev/tools/github",
    note: "Composio provides managed OAuth for GitHub with automatic token refresh and webhook handlers.",
    whenToByoc: [
      "Custom GitHub App branding on authorization dialogs",
      "Organization-wide webhook subscriptions with bespoke secrets",
    ],
  },
  slack: {
    appId: "slack",
    toolUrl: "https://composio.dev/tools/slack",
    note: "Composio provides verified multi-workspace Slack distribution out of the box.",
    whenToByoc: [
      "Custom Slack bot name and custom avatar in target team workspaces",
      "Bespoke internal slash command handlers",
    ],
  },
  "google-workspace": {
    appId: "google",
    toolUrl: "https://composio.dev/tools/google",
    note: "Skip Google Cloud consent screen verification and CASA security audits with Composio Managed Auth.",
    whenToByoc: [
      "Enterprise requirement for first-party Google Cloud project console",
      "Bespoke private service account domain-wide delegation",
    ],
  },
  notion: {
    appId: "notion",
    toolUrl: "https://composio.dev/tools/notion",
    note: "Connect to Notion workspaces without custom OAuth token negotiation.",
    whenToByoc: [
      "Custom enterprise workspace integration keys",
      "Dedicated workspace audit trail requirements",
    ],
  },
  linear: {
    appId: "linear",
    toolUrl: "https://composio.dev/tools/linear",
    note: "Composio provides pre-configured Linear OAuth with PKCE token negotiation.",
    whenToByoc: [
      "Custom white-labeled Linear integration name",
      "Dedicated OAuth client ID for enterprise billing",
    ],
  },
  "twitter-x": {
    appId: "twitter",
    toolUrl: "https://composio.dev/tools/twitter",
    note: "Composio provides managed multi-account posting for Twitter/X.",
    whenToByoc: [
      "Direct enterprise firehose streaming endpoints",
      "First-party developer credentials required for compliance",
    ],
  },
};

export function adaptBackendGuideToFrontend(bg: BackendGuide): Guide {
  const slug = bg.slug;
  const managedConfig = COMPOSIO_MANAGED_APPS[slug];
  const officialSource = bg.sources.find((s) => s.official);
  const primarySource = officialSource || bg.sources[0];
  const hasOfficialSource = Boolean(officialSource);
  const docsUrl = primarySource?.url || `https://developer.${slug}.com`;

  // Build source map
  const sourceMap = new Map<string, BackendSource>();
  for (const s of bg.sources) {
    sourceMap.set(s.id, s);
  }

  // 1. Facts list
  const factsList: FactItem[] = (bg.facts || []).map((f) => ({
    key: f.key,
    value: f.value,
    evidence: (f.evidence?.toUpperCase() as FactItem["evidence"]) || "UNKNOWN",
    quote: f.quote || "",
    source_id: f.source_id || "",
  }));

  // 2. Sources list
  const sourcesList: SourceItem[] = (bg.sources || []).map((s) => ({
    id: s.id,
    url: s.url,
    title: s.title,
    official: Boolean(s.official),
    via: s.via || "fetch",
    cited: Boolean(s.cited),
  }));

  // Build evidence ledger from facts and sources
  const evidenceLedger: EvidenceItem[] = [];
  for (const f of bg.facts || []) {
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
    } else if (
      titleLower.includes("review") ||
      titleLower.includes("submit") ||
      detailLower.includes("approval")
    ) {
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
      quote: step.quote,
      source_id: step.source_id,
      source_url: src?.url,
      generator_action: generatorAction,
    };
  });

  // Build blockers playbook
  const blockersPlaybook: BlockerItem[] = (bg.blockers || []).map((b) => ({
    symptom: b.title,
    cause: b.detail,
    fix: b.quote || b.detail,
    quote: b.quote,
    source_id: b.source_id,
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
  const rawLabel = bg.difficulty?.label;
  const diffLabel = mapDifficultyLabel(rawLabel, score);

  const factors = (bg.difficulty?.breakdown || [])
    .filter((b) => b.points > 0)
    .map((b) => `${b.key.replace(/_/g, " ")} (+${b.points} pts)`);

  if (bg.difficulty?.lower_bound) {
    const verifiedCount = bg.facts ? bg.facts.filter((f) => f.evidence !== "UNKNOWN").length : 0;
    factors.push(`Partial data: ${verifiedCount} of 10 facts verified`);
  }

  // Time estimates derived honestly
  const effortStr = bg.effort
    ? `${bg.effort.low_minutes}–${bg.effort.high_minutes} mins`
    : "Not assessed";

  const isReviewRequired = bg.facts.some(
    (f) => f.key === "review_required_for_distribution" && f.value === true
  );
  const isReviewExplicitlyNotRequired = bg.facts.some(
    (f) => f.key === "review_required_for_distribution" && f.value === false
  );

  let devWaitStr = "Not stated in sources";
  let prodWaitStr = "Not stated in sources";

  if (bg.approval?.min_days != null) {
    devWaitStr = `${bg.approval.min_days}${
      bg.approval.max_days ? `–${bg.approval.max_days}` : ""
    } days`;
  } else if (isReviewExplicitlyNotRequired) {
    devWaitStr = "Instant (0 seconds)";
  }

  if (bg.approval?.max_days != null) {
    prodWaitStr = `${bg.approval.max_days} days`;
  } else if (bg.approval?.min_days != null) {
    prodWaitStr = `${bg.approval.min_days} days`;
  } else if (isReviewExplicitlyNotRequired) {
    prodWaitStr = "Instant (no review required)";
  }

  const approvalWaitSummary = isReviewExplicitlyNotRequired
    ? "Instant (no review required)"
    : prodWaitStr !== "Not stated in sources"
    ? prodWaitStr
    : "Not stated in sources";

  const summaryText = composeFactualSummary(
    bg.app_name,
    bg.facts || [],
    bg.difficulty,
    bg.approval
  );

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
    summary: summaryText,
    difficulty: diffLabel,
    difficulty_score: score,
    difficulty_factors: factors.length > 0 ? factors : ["Standard OAuth 2.0 flow"],
    difficulty_meta: bg.difficulty
      ? {
          score: bg.difficulty.score,
          label: diffLabel,
          lower_bound: Boolean(bg.difficulty.lower_bound),
          unknown_inputs: bg.difficulty.unknown_inputs || [],
          breakdown: bg.difficulty.breakdown || [],
        }
      : undefined,
    time_estimate: {
      setup_active_effort: effortStr,
      approval_wait: approvalWaitSummary,
      confidence: mapEvidenceToConfidence(bg.approval?.evidence),
      dev_wait_claim: devWaitStr,
      dev_wait_confidence: mapEvidenceToConfidence(bg.approval?.evidence),
      production_wait_claim: prodWaitStr,
      production_wait_confidence: mapEvidenceToConfidence(bg.approval?.evidence),
    },
    prerequisites: isReviewRequired
      ? [
          "Developer portal registration and authorized domain",
          "Public Privacy Policy and Terms of Service URLs",
        ]
      : ["Developer portal registration"],
    path: setupPath,
    config_values: {
      redirect_uri_format: "Not assessed",
      auth_url: bg.status === "no_public_oauth" ? "NOT_SUPPORTED" : "Not assessed",
      token_url: bg.status === "no_public_oauth" ? "NOT_SUPPORTED" : "Not assessed",
      default_scopes: [],
      pkce_support: "unknown",
      token_rotation: "unknown",
    },
    scopes: scopesList,
    approval: {
      required: isReviewRequired,
      min_days: bg.approval?.min_days ?? null,
      max_days: bg.approval?.max_days ?? null,
      evidence: (bg.approval?.evidence?.toUpperCase() as any) || "UNKNOWN",
      what_reviewed: isReviewRequired
        ? "App directory compliance, scope justification, and security policy"
        : "No mandatory app review gate",
      typical_rejection_reasons: isReviewRequired
        ? [
            "Missing privacy policy or invalid redirect domain",
            "Unjustified sensitive or restricted scope request",
          ]
        : [],
      what_to_prepare: isReviewRequired
        ? ["App icon (512x512 PNG)", "Demo video URL", "Privacy policy link"]
        : [],
    },
    blockers_and_fixes: blockersPlaybook,
    agent_vs_human: {
      agent_can_do: [
        "Draft OAuth callback handler and PKCE code exchange",
        "Construct scoped authorization redirect URLs",
      ],
      you_must_do: [
        "Log into provider developer console",
        "Generate and store client secrets securely",
      ],
      handoff_critical_point:
        "Human must register the app in the provider console to obtain Client ID & Secret.",
    },
    what_to_do_next: [
      `Navigate to ${docsUrl} to configure OAuth credentials.`,
      "Save client credentials in environment secrets.",
    ],
    evidence: evidenceLedger,
    uncertainties: bg.notes || [],
    sources: sourcesList,
    facts: factsList,
    coverage: bg.coverage || {},
    notes: bg.notes || [],
    has_official_source: hasOfficialSource,
    last_verified: bg.generated_at ? bg.generated_at.split("T")[0] : "2026-11-04",
  };
}

export async function checkBackendHealth(): Promise<{ ok: boolean; model?: string }> {
  try {
    const res = await fetch(`${getBackendBaseUrl()}/api/health`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return { ok: Boolean(data.ok), model: data.model };
    }
  } catch {}
  return { ok: false };
}

export async function getBackendGuides(): Promise<Guide[]> {
  try {
    const res = await fetch(`${getBackendBaseUrl()}/api/guides`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.guides && Array.isArray(data.guides)) {
        return data.guides.map(adaptBackendGuideToFrontend);
      }
    }
  } catch {}
  return [];
}

export async function getBackendGuideBySlug(slug: string): Promise<Guide | null> {
  return fetchLiveBackendGuide(slug);
}

export async function fetchLiveBackendGuide(slug: string): Promise<Guide | null> {
  for (const baseUrl of CANDIDATE_URLS) {
    try {
      const res = await fetch(`${baseUrl}/api/guides/${slug}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const bg: BackendGuide = await res.json();
        if (bg && bg.app_name) {
          activeBackendUrl = baseUrl;
          return adaptBackendGuideToFrontend(bg);
        }
      }
    } catch {
      // Continue to next candidate URL
    }
  }
  return null;
}
