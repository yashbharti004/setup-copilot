"use client";

import React, { useState } from "react";
import { Guide } from "@/lib/schema/guide";
import { Copy, Check, Bot, FileText, Shield, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

interface AgentPrepKitProps {
  guide: Guide;
}

export function AgentPrepKit({ guide }: AgentPrepKitProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const appName = guide.app.name;
  const scopesList =
    guide.scopes.length > 0
      ? guide.scopes.map((s) => `- \`${s.scope}\`: ${s.unlocks} (Access: ${s.sensitivity})`).join("\n")
      : "- Standard read/write access requested for authorized user workflows.";

  const requiresVideo = guide.facts?.some((f) => f.key === "requires_video_demo" && f.value === true);
  const requiresAudit = guide.facts?.some((f) => f.key === "requires_security_audit" && f.value === true);
  const requiresDomain = guide.facts?.some((f) => f.key === "requires_domain_verification" && f.value === true);

  // Asset 1: App Purpose & Scope Justification
  const purposeText = `## Application Purpose & Scope Justification for ${appName} Review Team

**Application Name:** ${appName} Copilot & Integration Agent
**Primary Purpose:** Autonomous developer workflow automation and bi-directional data synchronization on behalf of the authorized user.

### Scope Justification:
The integration requests the minimum necessary scopes to execute user-instructed tasks:
${scopesList}

### Principle of Least Privilege:
1. The agent requests read and write permissions solely for objects explicitly referenced in user prompts.
2. No administrative or tenant-wide scopes are requested beyond user-delegated authorization.
3. Access tokens are used strictly in real-time response to authenticated user instructions.`;

  // Asset 2: Data Governance & Token Security Disclosure
  const governanceText = `## Data Governance & Token Security Statement

**Provider:** ${appName} OAuth 2.0 Integration
**Data Classification:** User-Delegated OAuth Tokens & Ephemeral API Payloads

### Security Controls:
1. **Token Encryption:** All OAuth access and refresh tokens are encrypted at rest using envelope encryption with AES-256-GCM. Decryption keys are managed via isolated KMS hardware modules.
2. **Transit Security:** All traffic to ${appName} endpoints is strictly enforced over TLS 1.3 with modern cipher suites.
3. **Data Retention & Storage:** No raw end-user credentials, passwords, or persistent customer PII are retained. Only scoped OAuth tokens and synchronization state IDs are stored.
4. **Revocation & Deletion:** Users may revoke the OAuth connection at any time directly through ${appName}'s account security settings or our workspace settings. Token revocation initiates immediate purge of associated authentication credentials within 60 seconds.
5. **Third-Party Sharing:** Zero user data or tokens are shared with, sold to, or processed by external advertisers or data brokers.`;

  // Asset 3: Privacy Policy Outline & Mandatory Clauses
  const privacyText = `## Privacy Policy - OAuth Integration Addendum for ${appName}

### 1. Information Collected Via ${appName} API
When you authenticate your ${appName} account, our application receives an OAuth 2.0 access token and limited account profile information (user identifier, organization ID) strictly to verify your authorization.

### 2. How We Use ${appName} Data
Data retrieved through the ${appName} API is processed strictly to execute tasks instructed by you. We do not use ${appName} customer data to train generalized machine learning models without express opt-in consent.

### 3. Data Protection & Security Standards
${requiresAudit ? "This application undergoes third-party CASA / SOC 2 security compliance assessments annually." : "We enforce strict technical access controls and cryptographic safeguards compliant with industry security benchmarks."}

### 4. User Rights & Data Deletion Requests
You have the right to request full deletion of all tokens and synchronization metadata associated with your ${appName} account by contacting our security compliance office at security@yourdomain.com.`;

  // Asset 4: Review Submission Message / Cover Letter
  const submissionCoverLetter = `Dear ${appName} App Review Team,

We are submitting our application for production OAuth review.

**Application:** ${appName} Agent Integration
**Integration Category:** ${guide.app.category}
**OAuth Redirect URI:** ${guide.config_values?.redirect_uri_format || "https://yourdomain.com/api/auth/callback"}
${requiresDomain ? `**Domain Verification:** Verified via DNS TXT records / Google Search Console.` : ""}
${requiresVideo ? `**Video Screencast Demo:** https://youtu.be/UNLISTED_DEMO_URL (Demonstrates OAuth consent dialog, user granting requested scopes, and agent performing user-instructed actions).` : ""}
${requiresAudit ? `**Third-Party Security Assessment:** Prepared for CASA Tier 2 / Cloud Assessment validation.` : ""}

**Reviewer Verification Instructions:**
1. Navigate to our staging test environment at https://staging.yourdomain.com/login.
2. Sign in with test account: \`reviewer@yourdomain.com\` / \`Password123!\`.
3. Click "Connect ${appName}" to trigger the OAuth 2.0 authorization code flow.
4. Notice the clear disclosure of requested scopes and transparent consent screen.

Thank you for your review. Please let us know if you require any additional technical details or test credentials.

Sincerely,
Engineering Team`;

  const fullKitMarkdown = `${purposeText}\n\n---\n\n${governanceText}\n\n---\n\n${privacyText}\n\n---\n\n${submissionCoverLetter}`;

  const assets = [
    {
      key: "purpose",
      title: "1. Scope Justification Statement",
      badge: "Mandatory for Review",
      description: "Why your application needs each requested scope — ready to paste into developer portal review questionnaires.",
      content: purposeText,
    },
    {
      key: "governance",
      title: "2. Data Governance & Security Disclosure",
      badge: "Security Review",
      description: "Cryptographic storage, AES-256 encryption, and token purge SLA assurances expected by enterprise vendor teams.",
      content: governanceText,
    },
    {
      key: "privacy",
      title: "3. Privacy Policy Mandatory Clauses",
      badge: "Policy Compliance",
      description: "Specific legal clauses covering API token handling, no-training clauses, and user deletion endpoints.",
      content: privacyText,
    },
    {
      key: "cover",
      title: "4. Review Submission Cover Letter",
      badge: "Portal Submission",
      description: "Complete cover letter with reviewer test credentials and video demo instructions ready for the submission box.",
      content: submissionCoverLetter,
    },
  ];

  return (
    <Card className="border border-sky-500/20 bg-gradient-to-b from-[#0a101f]/80 to-[#05070d] p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-sky-500/10 text-sky-400">
              <Bot className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400">
              Agent Prep Kit // Human Step Automations
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            AI Prep Kit for {appName} Human Review Gates
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Autonomous agents cannot solve vendor CAPTCHAs or click portal review buttons, but Setup-Copilot eliminates 90% of the friction by pre-drafting all required legal disclosures, scope justifications, and reviewer cover letters.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard(fullKitMarkdown, "full-kit")}
          className="shrink-0 font-mono text-xs gap-2 border-sky-500/30 text-sky-300 hover:bg-sky-500/10"
        >
          {copiedKey === "full-kit" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedKey === "full-kit" ? "Copied All (.md)" : "Copy Full Kit (.md)"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map((asset) => (
          <div
            key={asset.key}
            className="rounded-xl border border-white/[0.08] bg-[#0c0e17] p-5 flex flex-col justify-between space-y-4 hover:border-white/[0.16] transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  {asset.title}
                </span>
                <Badge variant="neutral" size="sm">
                  {asset.badge}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                {asset.description}
              </p>
            </div>

            <div className="space-y-3">
              <pre className="p-3 rounded-lg bg-black/60 border border-white/[0.04] text-[10px] font-mono text-slate-300 overflow-x-auto max-h-36 whitespace-pre-wrap leading-relaxed select-all">
                {asset.content.slice(0, 320)}...
              </pre>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(asset.content, asset.key)}
                className="w-full text-xs font-mono gap-1.5 justify-center"
              >
                {copiedKey === asset.key ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-bold">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Document Text</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
