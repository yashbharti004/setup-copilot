import { Guide } from "../schema/guide";

export type HelperAction =
  | "draft_privacy_policy"
  | "scope_justification"
  | "redirect_uri"
  | "review_email";

export interface HelperResult {
  title: string;
  action: HelperAction;
  filename: string;
  content: string;
  notes: string;
}

export function generateHelperContent(guide: Guide, action: HelperAction): HelperResult {
  const appName = guide.app.name;
  const scopesList = guide.scopes.map((s) => `- \`${s.scope}\`: ${s.unlocks}`).join("\n");

  switch (action) {
    case "draft_privacy_policy":
      return {
        title: `Privacy Policy Disclosure Stub for ${appName}`,
        action: "draft_privacy_policy",
        filename: "PRIVACY_POLICY_STUB.md",
        notes: `This stub complies with ${appName}'s developer data guidelines, including data minimization and explicit user data deletion rights.`,
        content: `# User Data & API Privacy Disclosure: ${appName} Integration

**Effective Date:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

### 1. Data Collected Through ${appName} API
Our AI Agent requests authorization to access your ${appName} account to perform automated workflow actions on your behalf.
The specific scopes requested include:
${scopesList}

### 2. Purpose of Use
Data accessed via ${appName} APIs is used solely to execute user-directed commands within the agent environment. We do NOT:
- Sell or monetize user account data to third parties.
- Use data retrieved from ${appName} to train generalized foundation AI models without explicit opt-in consent.
- Retain personal communication contents beyond the immediate execution lifecycle of the user task.

### 3. Limited Use Compliance (Where Applicable)
Our use and transfer to any other app of information received from ${appName} APIs adheres to the provider's Developer Policies, including strict Limited Use requirements.

### 4. Storage & Revocation
- Authentication tokens (access and refresh tokens) are encrypted at rest using AES-256 and stored in an isolated cryptographic vault.
- Users can revoke access at any time through their ${appName} account security settings or by deleting the connection in our agent dashboard. Upon revocation, all cached credentials and session tokens are purged immediately.

For privacy inquiries, contact: **privacy@yourdomain.com**
`,
      };

    case "scope_justification":
      return {
        title: `OAuth Scope Justification Statement for ${appName}`,
        action: "scope_justification",
        filename: "SCOPE_JUSTIFICATION.md",
        notes: `Submit this text in the ${appName} Developer Console or app review portal to justify permission necessity to trust & safety evaluators.`,
        content: `# OAuth Scope Justification for ${appName} App Review

### Application Overview
**Application Name:** [Your AI Agent Name]  
**Target Provider:** ${appName}  
**Primary Function:** Autonomous assistant that executes developer and productivity workflows under explicit user direction.

---

### Detailed Scope Breakdown & Justifications

${guide.scopes
  .map(
    (s, idx) => `#### ${idx + 1}. Scope: \`${s.scope}\` (${s.sensitivity.toUpperCase()})
- **What it unlocks:** ${s.unlocks}
- **Why this scope is essential:** The AI agent cannot execute user-initiated commands without this specific grant. For example, when a user asks the agent to inspect or update items, this API permission provides the minimal required read/write boundary.
- **Why a narrower scope cannot be used:** Alternative basic scopes do not support the operational APIs required for continuous agent task completion.
- **Data protection safeguard:** Data is processed ephemerally in-memory and credentials are stored with AES-256 vault encryption.
`
  )
  .join("\n")}

### Data Minimization Statement
We enforce strict principle-of-least-privilege. No administrative scopes or unneeded tenant-level rights are requested.
`,
      };

    case "redirect_uri":
      return {
        title: `Redirect Callback URI Configuration for ${appName}`,
        action: "redirect_uri",
        filename: "REDIRECT_URIS.env",
        notes: `Copy and paste these exact URI strings into your ${appName} Developer Portal settings.`,
        content: `# Configured Callback URIs for ${appName} OAuth 2.0

# 1. Localhost Development (Standard Dev Server)
http://localhost:3000/api/auth/callback/${guide.app.slug}

# 2. Localhost Alternate Port (e.g. Next.js fallback)
http://localhost:3001/api/auth/callback/${guide.app.slug}

# 3. Production HTTPS Callback (Replace with your registered domain)
https://agent.yourdomain.com/api/auth/callback/${guide.app.slug}

# 4. Staging / Preview Environment (Optional)
https://staging.yourdomain.com/api/auth/callback/${guide.app.slug}

---
# Provider Specific Rules:
# Format: ${guide.config_values.redirect_uri_format}
# PKCE Required: ${guide.config_values.pkce_support ? "YES" : "NO / OPTIONAL"}
# Exact Match Enforced: ${appName === "Google Workspace (Gmail & Drive)" ? "YES (Subdomains must be pre-verified in Search Console)" : "YES (Exact scheme, host, port, path)"}
`,
      };

    case "review_email":
      return {
        title: `App Review Submission & Escalation Email for ${appName}`,
        action: "review_email",
        filename: "APP_REVIEW_LETTER.txt",
        notes: `Use this email template when submitting your app for review or responding to provider inquiry tickets.`,
        content: `Subject: App Verification Request: [Application Name] (Client ID: [YOUR_CLIENT_ID])

Dear ${appName} Developer Review Team,

We are submitting our application, [Application Name], for OAuth verification and public distribution.

1. Application Summary:
[Application Name] is an intelligent workflow assistant designed to help developers and teams manage tasks, notifications, and integrations securely.

2. Requested Permissions:
We have configured minimal granular scopes to power our core features:
${guide.scopes.map((s) => `  - ${s.scope}: ${s.unlocks}`).join("\n")}

3. Review Materials Prepared:
  - Demonstration Video (Unlisted YouTube/Loom): [LINK_TO_VIDEO]
    * The browser address bar clearly shows our registered Client ID: [YOUR_CLIENT_ID]
    * The screencast demonstrates the OAuth consent screen and shows how granted data is displayed and used in the UI.
  - Public Privacy Policy URL: https://yourdomain.com/privacy
  - Terms of Service URL: https://yourdomain.com/terms
  - Verified Domain: yourdomain.com (Verified via Google Search Console / DNS TXT)

4. Security & Data Protection:
All customer tokens are encrypted at rest using AES-256 with key rotation. We do not sell user data or train third-party models on user content.

Please let us know if additional test credentials, sandbox accounts, or architectural explanations are needed to facilitate your review.

Sincerely,
[Your Name / Team Lead]
[Your Company / Organization]
[Contact Email & Phone]
`,
      };
  }
}

