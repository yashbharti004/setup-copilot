import { EvidenceItem, Guide } from "../schema/guide";
import { ResearchSource } from "./types";

export interface VerificationResult {
  verified_guide: Guide;
  downgrades_count: number;
  audit_log: Array<{
    claim: string;
    original_status: string;
    final_status: string;
    reason: string;
  }>;
}

/**
 * Verifier / Critic Agent Pass
 * Audits every claim against fetched research text snippets.
 * Downgrades unsupported assertions, flags stale timeline claims, and enforces honesty.
 */
export function runVerifier(guide: Guide, sources: ResearchSource[]): VerificationResult {
  let downgradesCount = 0;
  const auditLog: VerificationResult["audit_log"] = [];

  const combinedSourceText = sources
    .map((s) => `${s.title} ${s.snippet}`)
    .join(" ")
    .toLowerCase();

  // Audit Evidence Items
  const verifiedEvidence: EvidenceItem[] = guide.evidence.map((ev) => {
    const claimLower = ev.claim.toLowerCase();

    // Check if timeline assertion has an official citation
    if (claimLower.includes("day") || claimLower.includes("week") || claimLower.includes("hour")) {
      const hasTimelineInSource =
        combinedSourceText.includes("day") ||
        combinedSourceText.includes("week") ||
        combinedSourceText.includes("turnaround") ||
        combinedSourceText.includes("sla");

      if (!hasTimelineInSource && ev.status === "verified") {
        downgradesCount++;
        auditLog.push({
          claim: ev.claim,
          original_status: "verified",
          final_status: "community",
          reason: "No official committed SLA found in provider documentation. Downgraded to community-reported.",
        });
        return { ...ev, status: "community" };
      }
    }

    // Check if unconfirmed quota limits are asserted
    if (claimLower.includes("user limit") || claimLower.includes("quota")) {
      const mentionsQuota =
        combinedSourceText.includes("limit") ||
        combinedSourceText.includes("user") ||
        combinedSourceText.includes("quota");

      if (!mentionsQuota && ev.status !== "unknown") {
        downgradesCount++;
        auditLog.push({
          claim: ev.claim,
          original_status: ev.status,
          final_status: "unknown",
          reason: "Specific quota limits uncorroborated in primary doc snippet. Flagged as unknown.",
        });
        return { ...ev, status: "unknown" };
      }
    }

    return ev;
  });

  // Audit Approval Wait confidence
  let finalApprovalWait = guide.time_estimate.approval_wait;
  let finalApprovalConfidence = guide.time_estimate.confidence;

  if (guide.approval.required) {
    if (
      !combinedSourceText.includes("turnaround") &&
      !combinedSourceText.includes("sla") &&
      finalApprovalConfidence === "verified"
    ) {
      downgradesCount++;
      finalApprovalConfidence = "community";
      finalApprovalWait = `${guide.time_estimate.approval_wait} (community-reported)`;
      auditLog.push({
        claim: `Approval wait: ${guide.time_estimate.approval_wait}`,
        original_status: "verified",
        final_status: "community",
        reason: "Provider does not guarantee public review turnaround SLA. Downgraded to community-reported.",
      });
    }
  }

  // Update uncertainties if downgrades happened
  const uncertainties = [...guide.uncertainties];
  if (downgradesCount > 0) {
    uncertainties.unshift(
      `Verifier pass downgraded ${downgradesCount} claim(s) due to lack of explicit provider SLA documentation; unverified turnaround estimates labeled as community-reported.`
    );
  }

  const updatedGuide: Guide = {
    ...guide,
    time_estimate: {
      ...guide.time_estimate,
      approval_wait: finalApprovalWait,
      confidence: finalApprovalConfidence,
    },
    evidence: verifiedEvidence,
    uncertainties,
  };

  return {
    verified_guide: updatedGuide,
    downgrades_count: downgradesCount,
    audit_log: auditLog,
  };
}

