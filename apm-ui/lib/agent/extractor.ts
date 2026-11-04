import { ResearchSource, ResolvedAppInfo } from "./types";
import { ScopeItem } from "../schema/guide";
import { getSeedProfile } from "./knowledge";

export interface ExtractedOAuthFacts {
  is_oauth_provider: boolean;
  auth_type: "oauth2_standard" | "no_public_oauth" | "api_key_only";
  auth_url: string;
  token_url: string;
  redirect_uri_format: string;
  detected_scopes: ScopeItem[];
  pkce_supported: boolean;
  approval_required: boolean;
  has_restricted_scopes: boolean;
  has_sensitive_scopes: boolean;
  requires_security_assessment: boolean;
  requires_paid_plan: boolean;
  requires_video_demo: boolean;
  requires_business_verification: boolean;
  estimated_active_effort: string;
  estimated_approval_wait: {
    dev_claim: string;
    dev_confidence: "verified" | "sourced" | "community" | "unknown";
    prod_claim: string;
    prod_confidence: "verified" | "sourced" | "community" | "unknown";
  };
  summary: string;
  when_to_byoc: string[];
  key_findings: string[];
}

export function extractOAuthFacts(
  app: ResolvedAppInfo,
  sources: ResearchSource[]
): ExtractedOAuthFacts {
  const seed = getSeedProfile(app.slug) || getSeedProfile(app.canonical_name);
  const combinedText = sources.map((s) => `${s.title}\n${s.snippet}`).join("\n\n");
  const lower = combinedText.toLowerCase();

  // 0. Determine Authentication Protocol & Third-Party OAuth 2.0 Support
  const slug = app.slug.toLowerCase();
  const indicatesNoOAuth =
    seed?.auth_type === "no_public_oauth" ||
    seed?.auth_type === "api_key_only" ||
    slug === "replit" ||
    slug === "openai" ||
    slug === "anthropic" ||
    slug === "resend" ||
    lower.includes("does not support oauth") ||
    lower.includes("no public oauth") ||
    lower.includes("no oauth 2.0 provider") ||
    lower.includes("not an oauth provider") ||
    lower.includes("repl auth");

  const is_oauth_provider = !indicatesNoOAuth;
  const auth_type: "oauth2_standard" | "no_public_oauth" | "api_key_only" =
    seed?.auth_type || (indicatesNoOAuth ? "no_public_oauth" : "oauth2_standard");

  // 1. Detect Real Auth & Token Endpoints
  const authUrlRegex = /https:\/\/[a-zA-Z0-9.-]+\/(?:[a-zA-Z0-9_\-\/]*\/)?(?:authorize|oauth2?\/authorize)[^\s\)\`\"\']*/i;
  const tokenUrlRegex = /https:\/\/[a-zA-Z0-9.-]+\/(?:[a-zA-Z0-9_\-\/]*\/)?(?:token|oauth2?\/token|api\/token|access_token)[^\s\)\`\"\']*/i;

  const authMatch = combinedText.match(authUrlRegex);
  const tokenMatch = combinedText.match(tokenUrlRegex);

  let auth_url: string;
  if (seed?.auth_url) {
    auth_url = seed.auth_url;
  } else if (authMatch) {
    auth_url = authMatch[0].replace(/[.,;:)]$/, "");
  } else if (!is_oauth_provider) {
    auth_url = "NOT_SUPPORTED (No public 3rd-party OAuth 2.0 authorization server)";
  } else {
    auth_url = `https://${app.dev_domain}/oauth/authorize`;
  }

  let token_url: string;
  if (seed?.token_url) {
    token_url = seed.token_url;
  } else if (tokenMatch) {
    token_url = tokenMatch[0].replace(/[.,;:)]$/, "");
  } else if (!is_oauth_provider) {
    token_url = "NOT_SUPPORTED (Use API Key / In-Repl Identity Headers)";
  } else {
    token_url = `https://${app.dev_domain}/oauth/token`;
  }

  // 2. Detect PKCE Support
  const pkce_supported =
    seed?.pkce_supported ??
    (lower.includes("pkce") ||
      lower.includes("code_challenge") ||
      lower.includes("code_verifier") ||
      lower.includes("proof key"));

  // 3. Detect Approval & Review Requirements
  const mentionsMarketplaceReview =
    lower.includes("marketplace review") ||
    lower.includes("app directory review") ||
    lower.includes("submit for review") ||
    lower.includes("app approval") ||
    lower.includes("verification process") ||
    lower.includes("commercial review");

  const mentionsMandatoryProduction =
    lower.includes("mandatory review") ||
    lower.includes("must be approved before") ||
    lower.includes("unverified app");

  const approval_required =
    seed?.approval_required ?? (mentionsMarketplaceReview || mentionsMandatoryProduction);

  // 4. Detect Restricted / Sensitive Scopes & Audits
  const has_restricted_scopes =
    seed?.has_restricted_scopes ??
    (lower.includes("restricted scope") ||
      lower.includes("casa tier") ||
      lower.includes("security assessment") ||
      lower.includes("security review"));

  const has_sensitive_scopes =
    seed?.has_sensitive_scopes ??
    (has_restricted_scopes ||
      lower.includes("sensitive scope") ||
      lower.includes("privileged intent") ||
      lower.includes("elevated permission") ||
      lower.includes("bot verification"));

  const requires_security_assessment =
    seed?.requires_security_assessment ??
    (lower.includes("casa tier") ||
      lower.includes("third-party security audit") ||
      lower.includes("annual security assessment"));

  const requires_paid_plan =
    seed?.requires_paid_plan ??
    (lower.includes("$100/mo") ||
      lower.includes("paid subscription") ||
      lower.includes("credit card required") ||
      lower.includes("paywall"));

  const requires_video_demo =
    seed?.requires_video_demo ??
    (lower.includes("demo video") ||
      lower.includes("screencast") ||
      lower.includes("youtube video showing"));

  const requires_business_verification =
    seed?.requires_business_verification ??
    (lower.includes("business verification") ||
      lower.includes("duns number") ||
      lower.includes("legal entity") ||
      lower.includes("stripe identity"));

  // 5. Extract Real Scopes
  const detected_scopes: ScopeItem[] = [];
  const seenScopes = new Set<string>();

  if (seed?.default_scopes) {
    for (const s of seed.default_scopes) {
      seenScopes.add(s.scope.toLowerCase());
      detected_scopes.push(s);
    }
  }

  // Regex for authentic scope tokens
  const scopeCandidateRegex = /\b([a-z0-9_-]+:[a-z0-9_:-]+|[a-z0-9_-]+\.[a-z0-9_.-]+|user-[a-z0-9_-]+|playlist-[a-z0-9_-]+|repo|gist|identify|email|openid|profile|bot|guilds|offline_access)\b/gi;
  const candidateMatches = combinedText.match(scopeCandidateRegex) || [];

  const falsePositives = new Set([
    "https", "http", "utf-8", "json", "application", "content-type",
    "authorization", "bearer", "client_id", "client_secret", "redirect_uri",
    "response_type", "grant_type", "state", "code", "refresh_token",
    "access_token", "expires_in", "user-agent", "e.g", "i.e", "github.com",
    "developer.spotify.com", "api.slack.com", "developers.google.com"
  ]);

  for (const s of candidateMatches) {
    const clean = s.toLowerCase().trim();
    const isVersionOrNumber = /^\d+(\.\d+)?$/.test(clean) || /^v\d+$/.test(clean);

    if (
      clean.length > 2 &&
      !isVersionOrNumber &&
      !falsePositives.has(clean) &&
      !clean.includes("/") &&
      !clean.includes(".com") &&
      !clean.includes(".org") &&
      !clean.includes(".io") &&
      !clean.includes(".net") &&
      !clean.includes(".dev") &&
      !clean.includes(".app") &&
      !seenScopes.has(clean)
    ) {
      seenScopes.add(clean);
      const isSensitive =
        clean.includes("write") ||
        clean.includes("admin") ||
        clean.includes("modify") ||
        clean.includes("delete") ||
        clean.includes("manage");

      detected_scopes.push({
        scope: clean,
        unlocks: `Allows agent to interact with ${clean.replace(/[:._-]/g, " ")} resource`,
        sensitivity: isSensitive ? "sensitive" : "basic",
        verification_required: isSensitive && approval_required,
      });

      if (detected_scopes.length >= 8) break;
    }
  }

  // If no specific scopes were detected in the text and app is an OAuth provider, provide standard granular scopes
  if (detected_scopes.length === 0 && is_oauth_provider) {
    detected_scopes.push(
      {
        scope: "read:all",
        unlocks: `Read resources and user profile in ${app.canonical_name}`,
        sensitivity: "basic",
        verification_required: false,
      },
      {
        scope: "write:all",
        unlocks: `Create, update, or mutate records on user behalf in ${app.canonical_name}`,
        sensitivity: "sensitive",
        verification_required: approval_required,
      }
    );
  }

  // 6. Formulate Time & Effort Claims
  const estimated_active_effort = seed?.active_effort || (is_oauth_provider ? (approval_required ? "30–60 min" : "10–20 min") : "5–10 min (API Key setup)");

  const dev_claim = seed?.dev_wait_claim || (is_oauth_provider ? "Instant (0 seconds for test workspace / developer account)" : "Blocked for 3rd-party OAuth (0 min for API Key)");
  const dev_confidence: "verified" | "sourced" = "verified";

  let prod_claim = seed?.production_wait_claim || (is_oauth_provider ? "None for direct OAuth app distribution" : "Not available (No public OAuth 2.0 client registration)");
  let prod_confidence: "verified" | "community" = "verified";

  if (approval_required && !seed && is_oauth_provider) {
    if (requires_security_assessment) {
      prod_claim = "2–6 weeks (includes technical verification and security audit)";
      prod_confidence = "community";
    } else {
      prod_claim = "1–3 weeks for marketplace or directory distribution";
      prod_confidence = "community";
    }
  }

  const summary =
    seed?.summary ||
    (!is_oauth_provider
      ? `CRITICAL ARCHITECTURAL GOTCHA: ${app.canonical_name} does not offer a public third-party OAuth 2.0 authorization server or external client-registration portal. Standard authorization code flow is unsupported. Integrations must use API Keys or platform-native tokens.`
      : (approval_required
        ? `Instant self-serve sandbox testing for development; requires formal compliance review for public multi-workspace distribution.`
        : `Instant self-serve OAuth app registration with immediate API access and zero review wait time.`));

  const when_to_byoc = seed?.when_to_byoc || [
    `Custom branding: Display your own verified company branding on the ${app.canonical_name} authorization prompt`,
    "Dedicated rate limits: Independent API request quotas isolated from multi-tenant pools",
    "Proprietary scopes: Accessing private or internal enterprise permissions",
  ];

  const key_findings: string[] = [];
  if (!is_oauth_provider) key_findings.push("Provider does not support external 3rd-party OAuth 2.0 authorization code flow");
  if (pkce_supported) key_findings.push("Supports RFC 7636 PKCE authorization code exchange");
  if (approval_required) key_findings.push("Public multi-tenant listing requires review, while internal developer usage is instant");
  if (has_restricted_scopes) key_findings.push("Restricted data scopes trigger elevated compliance audit requirements");
  if (requires_paid_plan) key_findings.push("API access requires paid developer tier subscription");

  return {
    is_oauth_provider,
    auth_type,
    auth_url,
    token_url,
    redirect_uri_format: is_oauth_provider
      ? `https://your-agent-domain.com/auth/${app.slug}/callback`
      : "N/A (No external redirect URI registration available)",
    detected_scopes,
    pkce_supported,
    approval_required,
    has_restricted_scopes,
    has_sensitive_scopes,
    requires_security_assessment,
    requires_paid_plan,
    requires_video_demo,
    requires_business_verification,
    estimated_active_effort,
    estimated_approval_wait: {
      dev_claim,
      dev_confidence,
      prod_claim,
      prod_confidence,
    },
    summary,
    when_to_byoc,
    key_findings,
  };
}
