import { Guide, SetupStep } from "../schema/guide";
import { calculateDifficulty } from "../schema/rubric";
import { ResearchSource, ResolvedAppInfo } from "./types";
import { extractOAuthFacts } from "./extractor";

/**
 * Writer Agent Role
 * Synthesizes structured JSON conforming to GuideSchema using fetched real-world evidence.
 * Integrates deterministic difficulty calculation from rubric.
 */
export async function runWriter(
  app: ResolvedAppInfo,
  sources: ResearchSource[],
  onProgress?: (msg: string) => void
): Promise<Guide> {
  onProgress?.(`Extracting OAuth specifications & scopes from evidence for ${app.canonical_name}...`);

  // Extract genuine OAuth endpoints, scopes, and approval gates from live documentation
  const extracted = extractOAuthFacts(app, sources);

  const rubric = calculateDifficulty({
    approval_required: extracted.approval_required,
    has_restricted_scopes: extracted.has_restricted_scopes,
    has_sensitive_scopes: extracted.has_sensitive_scopes,
    requires_business_verification: extracted.requires_business_verification,
    requires_paid_plan: extracted.requires_paid_plan,
    requires_security_assessment: extracted.requires_security_assessment,
    requires_video_demo: extracted.requires_video_demo,
    has_manual_partner_vetting: false,
    instant_self_serve_available: !extracted.approval_required && extracted.is_oauth_provider,
    has_no_public_oauth: !extracted.is_oauth_provider,
  });

  // Build evidence list from real research sources
  const evidenceList = sources.slice(0, 6).map((s, idx) => ({
    id: `${app.slug}-ev-${idx + 1}`,
    claim: s.title,
    source_url: s.url,
    retrieved_at: s.retrieved_at,
    status: (idx === 0 ? "verified" : "sourced") as "verified" | "sourced",
    snippet: s.snippet,
  }));

  // Build steps tailored to auth architecture
  let path: SetupStep[];

  if (!extracted.is_oauth_provider) {
    path = [
      {
        step_number: 1,
        action: `Verify Authentication Architecture (${app.canonical_name})`,
        detail: `Note that ${app.canonical_name} does NOT offer a public third-party OAuth 2.0 authorization server or external client-registration portal. Standard authorization code grant is unsupported.`,
        who: "you",
        source: sources[0]?.url || app.docs_url,
        confidence: "verified",
        evidence_id: `${app.slug}-ev-1`,
      },
      {
        step_number: 2,
        action: `Obtain Integration Credentials / API Tokens`,
        detail: app.slug === "replit"
          ? `Sign in to Replit, open Account Settings, and generate a Personal API Token for programmatic GraphQL API access.`
          : `Sign in to https://${app.dev_domain}, navigate to API Keys or Developer Settings, and generate a secret API Key.`,
        who: "you",
        source: sources[0]?.url || app.docs_url,
        confidence: "verified",
        evidence_id: `${app.slug}-ev-1`,
      },
      {
        step_number: 3,
        action: `Provision Token in Secure Environment`,
        detail: `Store your secret token in your local environment file (e.g. ${app.slug.toUpperCase()}_API_KEY). Never commit credentials to version control.`,
        who: "you",
        source: sources[0]?.url || app.docs_url,
        confidence: "verified",
        evidence_id: `${app.slug}-ev-1`,
      },
      {
        step_number: 4,
        action: `Configure Agent API Client`,
        detail: app.slug === "replit"
          ? `Implement direct GraphQL requests against Replit's API, or if deploying inside a Repl, parse native 'X-Replit-User-*' headers from incoming HTTP requests.`
          : `Implement HTTP client passing 'Authorization: Bearer <API_KEY>' in request headers for agent operations.`,
        who: "agent",
        source: sources[0]?.url || app.docs_url,
        confidence: "verified",
        evidence_id: `${app.slug}-ev-1`,
      },
    ];
  } else {
    path = [
      {
        step_number: 1,
        action: `Open ${app.canonical_name} Developer Portal`,
        detail: `Navigate to https://${app.dev_domain} and register or sign in with your developer account credentials.`,
        who: "you",
        source: sources[0]?.url || app.docs_url,
        confidence: "verified",
        evidence_id: `${app.slug}-ev-1`,
      },
      {
        step_number: 2,
        action: "Register OAuth Application & Configure Redirect URIs",
        detail: `Create a new OAuth application. Register your redirect URI: '${extracted.redirect_uri_format}'. Localhost URLs are permitted for development.`,
        who: "agent_assisted",
        source: sources[0]?.url || app.docs_url,
        confidence: "verified",
        evidence_id: `${app.slug}-ev-1`,
        generator_action: "redirect_uri",
      },
      {
        step_number: 3,
        action: "Configure Requested Scopes",
        detail: `Select minimal required permissions: ${extracted.detected_scopes.slice(0, 3).map((s) => s.scope).join(", ")}. Document business justification for sensitive permissions.`,
        who: "agent_assisted",
        source: sources[1]?.url || sources[0]?.url || app.docs_url,
        confidence: "sourced",
        evidence_id: `${app.slug}-ev-2`,
        generator_action: "scope_justification",
      },
      {
        step_number: 4,
        action: "Store Client ID & Secret in Secure Vault",
        detail: `Copy the generated Client ID and Client Secret into your agent environment variables. Never commit secrets to source control.`,
        who: "you",
        source: sources[0]?.url || app.docs_url,
        confidence: "verified",
        evidence_id: `${app.slug}-ev-1`,
      },
      {
        step_number: 5,
        action: `Implement OAuth 2.0 Authorization Code Flow${extracted.pkce_supported ? " with PKCE" : ""}`,
        detail: `Initiate authorization request to '${extracted.auth_url}' and exchange callback code at '${extracted.token_url}'${extracted.pkce_supported ? " using RFC 7636 PKCE code_challenge / code_verifier" : ""}.`,
        who: "agent",
        source: sources[0]?.url || app.docs_url,
        confidence: "verified",
        evidence_id: `${app.slug}-ev-1`,
      },
    ];

    if (extracted.approval_required) {
      path.push({
        step_number: 6,
        action: "Submit for Public Directory / Marketplace Approval",
        detail: `Complete technical review checklist, provide public Privacy Policy & Support URLs, and submit app for directory verification.`,
        who: "agent_assisted",
        source: sources[1]?.url || sources[0]?.url || app.docs_url,
        confidence: "sourced",
        evidence_id: `${app.slug}-ev-2`,
        generator_action: "review_email",
      });
    }
  }

  const guide: Guide = {
    app: {
      name: app.canonical_name,
      slug: app.slug,
      logo: app.logo_url,
      docs_url: sources[0]?.url || app.docs_url,
      category: app.category,
      in_composio_managed: app.in_composio,
      composio_app_id: app.slug,
      composio_tool_url: app.in_composio ? `https://composio.dev/tools/${app.slug}` : undefined,
      managed_alternative_note: app.in_composio
        ? `Composio provides managed connectors for ${app.canonical_name}. You can connect agent actions immediately without managing personal credentials.`
        : undefined,
      when_to_byoc: [
        `Custom branding: Display your own verified company branding on the ${app.canonical_name} authorization prompt`,
        "Dedicated rate limits: Independent API request quotas isolated from multi-tenant pools",
        "Proprietary scopes: Accessing private or internal enterprise permissions",
      ],
    },
    summary: extracted.summary,
    difficulty: rubric.level,
    difficulty_score: rubric.score,
    difficulty_factors: rubric.breakdown_strings,
    time_estimate: {
      setup_active_effort: extracted.estimated_active_effort,
      dev_wait_claim: extracted.estimated_approval_wait.dev_claim,
      dev_wait_confidence: extracted.estimated_approval_wait.dev_confidence,
      production_wait_claim: extracted.estimated_approval_wait.prod_claim,
      production_wait_confidence: extracted.estimated_approval_wait.prod_confidence,
      approval_wait: extracted.approval_required ? "1–3 weeks" : "Instant",
      confidence: extracted.approval_required ? "community" : "verified",
    },
    prerequisites: !extracted.is_oauth_provider
      ? [
          `A registered account on ${app.canonical_name}`,
          "Personal API Key / Access Token generated from account settings",
          ...(app.slug === "replit" ? ["Hosted Repl container environment (if utilizing Repl Auth headers)"] : []),
        ]
      : [
          `A registered account on ${app.canonical_name}`,
          "A public HTTPS callback URL (localhost supported for local development)",
          ...(extracted.approval_required ? ["Public Privacy Policy and Support Contact URL"] : []),
        ],
    path,
    config_values: {
      redirect_uri_format: extracted.redirect_uri_format,
      auth_url: extracted.auth_url,
      token_url: extracted.token_url,
      default_scopes: extracted.detected_scopes.map((s) => s.scope),
      pkce_support: extracted.pkce_supported,
      token_rotation: "optional",
    },
    scopes: extracted.detected_scopes,
    approval: {
      required: extracted.approval_required,
      min_days: extracted.approval_required ? 7 : null,
      max_days: extracted.approval_required ? 21 : null,
      evidence: extracted.approval_required ? "COMMUNITY" : "VERIFIED",
      what_reviewed: !extracted.is_oauth_provider
        ? `${app.canonical_name} does not operate a public OAuth app directory review because external third-party OAuth 2.0 client registration is not supported.`
        : (extracted.approval_required
          ? `Provider evaluates scope justification, privacy policy clarity, token storage security, and data minimization.`
          : `No formal approval review required for private internal integrations.`),
      typical_rejection_reasons: !extracted.is_oauth_provider
        ? [
            `Attempting to register a third-party OAuth 2.0 client application (no developer portal exists for this)`,
            `Expecting universal OAuth redirect URLs (app must use API keys or workspace-native auth)`,
            app.slug === "replit"
              ? `Misinterpreting internal 'Repl Auth' (which only functions inside Repl-hosted environments) as a universal OAuth provider`
              : `Missing valid API authentication header in HTTP requests`,
          ]
        : [
            "Over-requesting broad read/write scopes without demonstrable user-facing functionality",
            "Missing or inaccessible Privacy Policy URL",
            "Broken redirect URI endpoints or missing TLS/HTTPS encryption on callback URLs",
          ],
      what_to_prepare: !extracted.is_oauth_provider
        ? [
            "User account with appropriate administrator permissions",
            "Secure environment variable vault for API Key storage",
            ...(app.slug === "replit" ? ["Hosted Repl container environment (if utilizing Repl Auth headers)"] : []),
          ]
        : [
            "Public Privacy Policy URL",
            "High-resolution application icon (512x512 PNG)",
            ...(extracted.requires_video_demo ? ["Video screencast demonstration of OAuth grant screen"] : []),
          ],
    },
    blockers_and_fixes: !extracted.is_oauth_provider
      ? [
          {
            symptom: `Cannot find OAuth 2.0 Client ID & Secret registration portal on ${app.canonical_name}`,
            cause: `${app.canonical_name} does not provide a public third-party OAuth 2.0 Authorization Server.`,
            fix: `Switch authentication architecture to Personal Access Tokens / API Keys, or consult provider documentation for workspace-native auth.`,
          },
          ...(app.slug === "replit"
            ? [
                {
                  symptom: "X-Replit-User-* identity headers are empty or missing in requests",
                  cause: "Repl Auth headers are only injected for web apps hosted directly on Replit's container infrastructure.",
                  fix: "Deploy the service inside a Repl container or use Personal API Tokens for external agent access.",
                },
              ]
            : []),
        ]
      : [
          {
            symptom: "redirect_uri_mismatch during authorization redirect",
            cause: "The callback URL supplied in the authorize request does not exactly match the whitelist registered in the developer portal.",
            fix: "Check trailing slashes, http vs https protocols, and port numbers in developer dashboard.",
            escalation_template: `Hello ${app.canonical_name} Support, our OAuth application [CLIENT_ID] is encountering redirect verification errors during callback handshake.`,
          },
          {
            symptom: "invalid_client or unauthenticated error during code exchange",
            cause: "Client Secret is missing, mistyped, or authorization header was not formatted according to HTTP Basic Auth specs.",
            fix: "Re-generate Client Secret and ensure Authorization header is formatted as 'Basic base64(client_id:client_secret)' or passed in POST body.",
          },
        ],
    agent_vs_human: {
      agent_can_do: !extracted.is_oauth_provider
        ? [
            `Format API requests and authentication headers for ${app.canonical_name}`,
            "Generate environment variable configuration templates",
            "Structure data payloads and handle HTTP rate-limit responses",
          ]
        : [
            `Draft OAuth route handlers and PKCE code challenges for ${app.canonical_name}`,
            "Generate privacy policy terms and scope justifications",
            "Format API payloads and error handling strategies",
          ],
      you_must_do: !extracted.is_oauth_provider
        ? [
            `Log into https://${app.dev_domain} and generate an API Key or Personal Token`,
            "Paste secret token into your secure .env vault",
            ...(app.slug === "replit" ? ["Deploy inside a Repl container if utilizing native Repl Auth headers"] : []),
          ]
        : [
            `Log into https://${app.dev_domain} with your personal or company account`,
            "Register the OAuth application and copy Client ID and Secret to .env",
            "Submit review forms if publishing to the public directory",
          ],
      handoff_critical_point: !extracted.is_oauth_provider
        ? `Human must generate an API Key or Personal Access Token in ${app.canonical_name} account settings and provide it to the agent environment.`
        : `Human must create the app in https://${app.dev_domain} and provide the Client ID & Secret to the agent environment.`,
    },
    what_to_do_next: !extracted.is_oauth_provider
      ? [
          `Review ${app.canonical_name} documentation on official API authentication methods.`,
          "Generate an API Key or Personal Access Token in user account settings.",
          "Add the API token to your agent environment variables and test API connectivity.",
        ]
      : [
          `Visit https://${app.dev_domain} and create an OAuth 2.0 application.`,
          "Add the callback redirect URI to your app settings.",
          "Store Client ID and Client Secret in your local environment file.",
        ],
    evidence: evidenceList,
    sources: sources.map((s, idx) => ({
      id: `src-${idx + 1}`,
      url: s.url,
      title: s.title,
      official: s.url.includes("docs") || s.url.includes("developer") || s.url.includes(app.slug),
      via: "fetch" as const,
      cited: true,
    })),
    facts: [
      {
        key: "has_public_oauth_registration",
        value: extracted.is_oauth_provider,
        evidence: "VERIFIED" as const,
        quote: extracted.summary,
        source_id: "src-1",
      },
      {
        key: "review_required_for_distribution",
        value: extracted.approval_required,
        evidence: "VERIFIED" as const,
        quote: extracted.summary,
        source_id: "src-1",
      },
    ],
    coverage: { verified_facts: 2, total_facts: 10 },
    notes: ["Generated by agent pipeline"],
    has_official_source: sources.some(
      (s) => s.url.includes("docs") || s.url.includes("developer") || s.url.includes(app.slug)
    ),
    uncertainties: [
      extracted.approval_required
        ? `Official SLA for marketplace review is not formally guaranteed; community feedback estimates 1–3 weeks turnaround.`
        : !extracted.is_oauth_provider
        ? `${app.canonical_name} does not offer public third-party OAuth 2.0. Integrations must rely on Personal API Keys or workspace-hosted features.`
        : `Provider documentation does not publish fixed API rate limits for free tiers.`,
    ],
    last_verified: new Date().toISOString().split("T")[0],
  };

  return guide;
}
