import { DifficultyLevel } from "./guide";

export interface RubricInput {
  approval_required: boolean;
  has_restricted_scopes: boolean;
  has_sensitive_scopes: boolean;
  requires_business_verification: boolean;
  requires_paid_plan: boolean;
  requires_security_assessment: boolean; // e.g. CASA Tier 2/3 for Google restricted
  requires_video_demo: boolean;
  has_manual_partner_vetting: boolean;
  instant_self_serve_available: boolean;
  has_no_public_oauth?: boolean; // e.g. Replit, OpenAI (API keys / internal auth only)
}

export interface RubricResult {
  score: number;
  level: DifficultyLevel;
  breakdown: string[];
}

/**
 * Evaluates the categorical difficulty tier strictly from the computed 0-100 score.
 * Band Specification:
 * - Easy:     0 - 24 pts (instant self-serve, no review)
 * - Moderate: 25 - 59 pts (app review required for directory/distribution)
 * - Hard:     60 - 84 pts (sensitive/restricted scopes, security audits, video demo)
 * - Gated:    85 - 100 pts (paywalled developer API, manual vetting, partner contracts)
 */
export function getDifficultyLevel(score: number): DifficultyLevel {
  if (score >= 85) return "Gated";
  if (score >= 60) return "Hard";
  if (score >= 25) return "Moderate";
  return "Easy";
}

/**
 * Deterministic Difficulty Rubric
 * Calculates an explainable 0-100 difficulty score based on provable provider requirements.
 */
export function calculateDifficulty(input: RubricInput): RubricResult {
  let score = 0;
  const breakdown: string[] = [];

  if (input.has_no_public_oauth) {
    score += 85;
    breakdown.push("+85 pts: Provider lacks a public 3rd-party OAuth 2.0 authorization server (Architectural Blocker / Gated)");
  }

  if (input.requires_paid_plan) {
    score += 35;
    breakdown.push("+35 pts: Developer API access requires paid subscription paywall");
  }

  if (input.has_manual_partner_vetting) {
    score += 30;
    breakdown.push("+30 pts: Requires manual partner review or gated enterprise developer waitlist");
  }

  if (input.approval_required) {
    score += 25;
    breakdown.push("+25 pts: App review or verification is mandatory before production access");
  } else {
    breakdown.push("+0 pts: No mandatory review required for developer/internal usage");
  }

  if (input.has_restricted_scopes) {
    score += 25;
    breakdown.push("+25 pts: Uses restricted scopes (triggers high-scrutiny policy audit)");
  } else if (input.has_sensitive_scopes) {
    score += 15;
    breakdown.push("+15 pts: Uses sensitive scopes (triggers consent screen verification)");
  }

  if (input.requires_security_assessment) {
    score += 20;
    breakdown.push("+20 pts: Requires formal third-party security assessment (e.g. CASA Tier 2/3)");
  }

  if (input.requires_business_verification) {
    score += 20;
    breakdown.push("+20 pts: Requires official business entity verification (DUNS, tax/legal docs)");
  }

  if (input.requires_video_demo) {
    score += 10;
    breakdown.push("+10 pts: Requires submitting a recorded demo video showing OAuth consent grant");
  }

  // Cap at 100
  score = Math.min(100, score);

  const level = getDifficultyLevel(score);

  return {
    score,
    level,
    breakdown,
  };
}

