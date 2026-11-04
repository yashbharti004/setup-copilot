import assert from "node:assert/strict";
import { adaptBackendGuideToFrontend, BackendGuide } from "../lib/backend";
import { GuideSchema } from "../lib/schema/guide";
import { calculateDifficulty } from "../lib/schema/rubric";

console.log("\n=======================================================");
console.log("RUNNING MAPPER, CONTRADICTION & DATA INTEGRITY TESTS");
console.log("=======================================================\n");

// ---------------------------------------------------------------------------
// TEST 1: Mapper accurately handles null approval with honest "Not stated"
// ---------------------------------------------------------------------------
console.log("[TEST 1] Testing null approval and honest fallback in adapter...");

const mockBackendNullApproval: BackendGuide = {
  slug: "test-oauth",
  query: "test oauth",
  app_name: "Test Provider",
  category: "Developer Tools",
  status: "partial",
  generated_at: "2026-11-04T12:00:00Z",
  model: "gemini-3.8-flash",
  difficulty: {
    score: 35,
    label: "UNKNOWN",
    lower_bound: true,
    unknown_inputs: ["review_required_for_distribution", "requires_security_audit"],
    breakdown: [{ key: "uses_restricted_scopes", points: 10 }],
  },
  effort: null,
  approval: {
    min_days: null,
    max_days: null,
    evidence: "UNKNOWN",
  },
  facts: [
    {
      key: "has_public_oauth_registration",
      value: true,
      evidence: "COMMUNITY",
      quote: "Found in community post",
      source_id: "src-1",
    },
  ],
  steps: [
    {
      order: 1,
      title: "Register app",
      detail: "Go to console",
      actor: "human",
      evidence: "COMMUNITY",
      quote: "Register in console",
      source_id: "src-1",
    },
  ],
  blockers: [],
  sources: [
    {
      id: "src-1",
      url: "https://example.com/blog",
      title: "Unofficial Blog",
      official: false,
      via: "search_snippet",
      cited: true,
    },
  ],
  coverage: { verified_facts: 1, total_facts: 10 },
  notes: ["Partial guide from unofficial sources."],
};

const mappedNull = adaptBackendGuideToFrontend(mockBackendNullApproval);

// Verify that null approval renders as "Not stated in sources", never "Instant"
assert.equal(
  mappedNull.time_estimate.approval_wait,
  "Not stated in sources",
  "approval_wait must be 'Not stated in sources' when approval data is missing!"
);
assert.equal(
  mappedNull.time_estimate.dev_wait_claim,
  "Not stated in sources",
  "dev_wait_claim must be 'Not stated in sources' when approval data is missing!"
);
assert.equal(
  mappedNull.time_estimate.production_wait_claim,
  "Not stated in sources",
  "production_wait_claim must be 'Not stated in sources' when approval data is missing!"
);
assert.equal(
  mappedNull.has_official_source,
  false,
  "has_official_source must be false when no official source is present!"
);
assert.equal(
  mappedNull.difficulty,
  "UNKNOWN",
  "difficulty must map to UNKNOWN!"
);
assert.equal(
  mappedNull.difficulty_meta?.lower_bound,
  true,
  "lower_bound must be true!"
);
assert.equal(
  mappedNull.time_estimate.setup_active_effort,
  "Not assessed",
  "effort must be 'Not assessed' when effort is null!"
);

console.log("  ✓ Missing approval and effort render honestly as 'Not stated in sources' and 'Not assessed'.");

// ---------------------------------------------------------------------------
// TEST 2: Zod Schema flags contradictory approval requirements
// ---------------------------------------------------------------------------
console.log("\n[TEST 2] Testing Zod schema contradiction refinements...");

// Case A: Approval is marked required, but wait is claimed to be 0 days
const contradictoryGuideA = {
  ...mappedNull,
  approval: {
    required: true,
    min_days: 0,
    max_days: 0,
    evidence: "VERIFIED" as const,
    what_reviewed: "Mandatory human review process",
    typical_rejection_reasons: [],
    what_to_prepare: [],
  },
};

const resultA = GuideSchema.safeParse(contradictoryGuideA);
assert.equal(resultA.success, false, "Schema must reject required approval with 0 days wait!");
const issueA = resultA.error?.issues.find((i) => i.path.includes("min_days"));
assert.ok(issueA, "Expected contradiction issue on approval.min_days");
console.log("  ✓ Correctly flagged contradiction: required approval with 0-day turnaround.");

// Case B: Approval is marked NOT required, but claims a 14-day turnaround
const contradictoryGuideB = {
  ...mappedNull,
  approval: {
    required: false,
    min_days: 14,
    max_days: 28,
    evidence: "VERIFIED" as const,
    what_reviewed: "No review",
    typical_rejection_reasons: [],
    what_to_prepare: [],
  },
};

const resultB = GuideSchema.safeParse(contradictoryGuideB);
assert.equal(resultB.success, false, "Schema must reject non-required approval with >0 days wait!");
const issueB = resultB.error?.issues.find((i) => i.path.includes("required") || i.path.includes("min_days"));
assert.ok(issueB, "Expected contradiction issue on approval");
console.log("  ✓ Correctly flagged contradiction: non-required approval claiming 14-day wait.");

// Case C: Difficulty claims Easy, but gating inputs are unknown
const contradictoryGuideC = {
  ...mappedNull,
  difficulty: "Easy" as const,
  difficulty_score: 10,
  difficulty_meta: {
    score: 10,
    label: "Easy" as const,
    lower_bound: true,
    unknown_inputs: ["review_required_for_distribution", "requires_paid_plan"],
    breakdown: [],
  },
};

const resultC = GuideSchema.safeParse(contradictoryGuideC);
assert.equal(resultC.success, false, "Schema must reject Easy rating when gating inputs are unknown!");
console.log("  ✓ Correctly flagged contradiction: Easy difficulty with unknown gating inputs.");

// ---------------------------------------------------------------------------
// TEST 3: Deterministic Rubric returns UNKNOWN when easy but gating unverified
// ---------------------------------------------------------------------------
console.log("\n[TEST 3] Testing calculateDifficulty UNKNOWN and lower bound generation...");

const rubricResult = calculateDifficulty(
  {
    review_required_for_distribution: undefined, // unknown gate
    requires_paid_plan: undefined,              // unknown gate
    uses_restricted_scopes: false,
  },
  true
);

assert.equal(rubricResult.level, "UNKNOWN", "Rubric must return UNKNOWN when gating inputs are missing");
assert.equal(rubricResult.lower_bound, true, "lower_bound must be true when inputs are missing");
assert.ok(rubricResult.unknown_inputs.length > 0, "unknown_inputs must be populated");

console.log("  ✓ calculateDifficulty generates UNKNOWN tier with lower_bound flag.");

console.log("\n=======================================================");
console.log("ALL MAPPER & CONTRADICTION UNIT TESTS PASSED! ✓");
console.log("=======================================================\n");
