import { DifficultyLevel } from "./guide";

export interface RubricInput {
  review_required_for_distribution?: boolean;
  uses_restricted_scopes?: boolean;
  requires_domain_verification?: boolean;
  requires_video_demo?: boolean;
  requires_security_audit?: boolean;
  requires_business_verification?: boolean;
  requires_paid_plan?: boolean;
  review_wait_days_max?: number | null;
  has_official_source?: boolean;
  // Legacy aliases
  approval_required?: boolean;
  has_restricted_scopes?: boolean;
  has_sensitive_scopes?: boolean;
  requires_security_assessment?: boolean;
  has_manual_partner_vetting?: boolean;
  instant_self_serve_available?: boolean;
  has_no_public_oauth?: boolean;
}

export interface Contribution {
  key: string;
  points: number;
}

export interface RubricResult {
  score: number;
  level: DifficultyLevel;
  lower_bound: boolean;
  unknown_inputs: string[];
  breakdown: Contribution[];
  breakdown_strings: string[];
}

export const TIERS: Array<{ label: DifficultyLevel; min: number; max: number }> = [
  { label: "Easy", min: 0, max: 24 },
  { label: "Moderate", min: 25, max: 59 },
  { label: "Hard", min: 60, max: 84 },
  { label: "Gated", min: 85, max: 100 },
];

export const WEIGHTS: Record<string, number> = {
  review_required_for_distribution: 25,
  uses_restricted_scopes: 10,
  requires_domain_verification: 5,
  requires_video_demo: 10,
  requires_security_audit: 25,
  requires_business_verification: 15,
};

export const WAIT_STEPS: Array<[number, number]> = [
  [7, 10],
  [28, 10],
];

export const PAID_FLOOR = 85;

export const GATE_KEYS = [
  "review_required_for_distribution",
  "requires_paid_plan",
  "requires_security_audit",
  "requires_business_verification",
];

export const SCORING_KEYS = [
  ...Object.keys(WEIGHTS),
  "review_wait_days_max",
  "requires_paid_plan",
];

export function getDifficultyLevel(score: number): DifficultyLevel {
  for (const tier of TIERS) {
    if (score >= tier.min && score <= tier.max) {
      return tier.label;
    }
  }
  return score >= 85 ? "Gated" : "Easy";
}

/**
 * Deterministic Difficulty Rubric
 * Single source of truth in TypeScript, matching backend rubric.py exactly.
 */
export function calculateDifficulty(
  rawInputs: RubricInput,
  hasOfficialSource: boolean = true
): RubricResult {
  // Normalize legacy and modern inputs
  const inputs: Record<string, boolean | number | undefined> = {
    review_required_for_distribution:
      rawInputs.review_required_for_distribution ?? rawInputs.approval_required,
    uses_restricted_scopes:
      rawInputs.uses_restricted_scopes ?? rawInputs.has_restricted_scopes,
    requires_domain_verification: rawInputs.requires_domain_verification,
    requires_video_demo: rawInputs.requires_video_demo,
    requires_security_audit:
      rawInputs.requires_security_audit ?? rawInputs.requires_security_assessment,
    requires_business_verification: rawInputs.requires_business_verification,
    requires_paid_plan: rawInputs.requires_paid_plan,
    review_wait_days_max:
      rawInputs.review_wait_days_max != null ? rawInputs.review_wait_days_max : undefined,
  };

  const officialSource = rawInputs.has_official_source ?? hasOfficialSource;

  const breakdown: Contribution[] = [];
  const breakdown_strings: string[] = [];
  let total = 0;

  for (const [key, points] of Object.entries(WEIGHTS)) {
    if (inputs[key] === true) {
      breakdown.push({ key, points });
      breakdown_strings.push(`+${points} pts: ${key.replace(/_/g, " ")}`);
      total += points;
    }
  }

  const wait = inputs.review_wait_days_max;
  if (typeof wait === "number" && !isNaN(wait)) {
    for (const [threshold, points] of WAIT_STEPS) {
      if (wait >= threshold) {
        const itemKey = `review_wait_days_max>=${threshold}`;
        breakdown.push({ key: itemKey, points });
        breakdown_strings.push(`+${points} pts: Review wait exceeds ${threshold} days`);
        total += points;
      }
    }
  }

  if (inputs.requires_paid_plan === true && total < PAID_FLOOR) {
    const diff = PAID_FLOOR - total;
    breakdown.push({ key: `requires_paid_plan (floor ${PAID_FLOOR})`, points: diff });
    breakdown_strings.push(`+${diff} pts: Developer API access requires paid subscription (Gated floor)`);
    total = PAID_FLOOR;
  }

  if (rawInputs.has_no_public_oauth) {
    if (total < PAID_FLOOR) {
      const diff = PAID_FLOOR - total;
      breakdown.push({ key: "has_no_public_oauth", points: diff });
      total = PAID_FLOOR;
    }
    breakdown_strings.push("+85 pts: Provider lacks a public 3rd-party OAuth 2.0 authorization server");
  }

  const score = Math.max(0, Math.min(total, 100));

  const unknown_inputs = SCORING_KEYS.filter((key) => inputs[key] === undefined);

  if (
    inputs.review_required_for_distribution === false &&
    unknown_inputs.includes("review_wait_days_max")
  ) {
    const idx = unknown_inputs.indexOf("review_wait_days_max");
    if (idx !== -1) unknown_inputs.splice(idx, 1);
  }

  let label: DifficultyLevel = getDifficultyLevel(score);

  const easyButUnverified =
    label === "Easy" && unknown_inputs.some((k) => GATE_KEYS.includes(k));

  if (easyButUnverified || !officialSource) {
    label = "UNKNOWN";
  }

  return {
    score,
    level: label,
    lower_bound: unknown_inputs.length > 0,
    unknown_inputs,
    breakdown,
    breakdown_strings,
  };
}
