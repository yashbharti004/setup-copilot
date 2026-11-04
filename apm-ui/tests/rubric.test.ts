import assert from "node:assert/strict";
import { getDifficultyLevel, calculateDifficulty } from "../lib/schema/rubric";
import { PREVERIFIED_GUIDES } from "../lib/data/guides";
import evalsData from "../lib/data/evals.json";

console.log("\n=======================================================");
console.log("RUNNING COMPOSIO SETUP COPILOT INTEGRITY & RUBRIC SUITE");
console.log("=======================================================\n");

// ---------------------------------------------------------------------------
// TEST 1: Rubric Score Band Invariants
// ---------------------------------------------------------------------------
console.log("[TEST 1] Verifying deterministic rubric boundary conditions...");

// Easy: 0 - 24
assert.equal(getDifficultyLevel(0), "Easy", "Score 0 must be Easy");
assert.equal(getDifficultyLevel(15), "Easy", "Score 15 must be Easy");
assert.equal(getDifficultyLevel(24), "Easy", "Score 24 must be Easy");

// Moderate: 25 - 59
assert.equal(getDifficultyLevel(25), "Moderate", "Score 25 must be Moderate");
assert.equal(getDifficultyLevel(45), "Moderate", "Score 45 must be Moderate");
assert.equal(getDifficultyLevel(59), "Moderate", "Score 59 must be Moderate");

// Hard: 60 - 84
assert.equal(getDifficultyLevel(60), "Hard", "Score 60 must be Hard");
assert.equal(getDifficultyLevel(80), "Hard", "Score 80 must be Hard");
assert.equal(getDifficultyLevel(84), "Hard", "Score 84 must be Hard");

// Gated: 85 - 100
assert.equal(getDifficultyLevel(85), "Gated", "Score 85 must be Gated");
assert.equal(getDifficultyLevel(95), "Gated", "Score 95 must be Gated");
assert.equal(getDifficultyLevel(100), "Gated", "Score 100 must be Gated");

console.log("  ✓ All boundary thresholds match specification [0-24, 25-59, 60-84, 85+].");

// ---------------------------------------------------------------------------
// TEST 2: Every Preverified Registry Entry Matches its Score Band
// ---------------------------------------------------------------------------
console.log("\n[TEST 2] Asserting all PREVERIFIED_GUIDES match their rubric score band...");

assert.equal(PREVERIFIED_GUIDES.length, 6, "Expected 6 pre-verified ground-truth guides");

for (const guide of PREVERIFIED_GUIDES) {
  const computedLevel = getDifficultyLevel(guide.difficulty_score);
  
  assert.equal(
    guide.difficulty,
    computedLevel,
    `Guide '${guide.app.name}' has difficulty '${guide.difficulty}' but its score ${guide.difficulty_score} maps to '${computedLevel}'!`
  );

  console.log(
    `  ✓ [${guide.app.slug}] ${guide.app.name.padEnd(32)}: Score ${String(guide.difficulty_score).padStart(2, " ")} => ${guide.difficulty.toUpperCase()}`
  );
}

// ---------------------------------------------------------------------------
// TEST 3: Dynamic calculateDifficulty synthesis matches contract
// ---------------------------------------------------------------------------
console.log("\n[TEST 3] Testing dynamic calculateDifficulty with realistic provider flags...");

const githubResult = calculateDifficulty({
  approval_required: false,
  has_restricted_scopes: false,
  has_sensitive_scopes: false,
  requires_business_verification: false,
  requires_paid_plan: false,
  requires_security_assessment: false,
  requires_video_demo: false,
  has_manual_partner_vetting: false,
  instant_self_serve_available: true,
});
assert.equal(githubResult.score, 0);
assert.equal(githubResult.level, "Easy");

const googleResult = calculateDifficulty({
  approval_required: true, // +25
  has_restricted_scopes: true, // +10
  has_sensitive_scopes: false,
  requires_business_verification: false,
  requires_paid_plan: false,
  requires_security_assessment: true, // +25
  requires_video_demo: true, // +10
  review_wait_days_max: 14, // +10 (wait >= 7 days)
  has_manual_partner_vetting: false,
  instant_self_serve_available: false,
});
assert.equal(googleResult.score, 80);
assert.equal(googleResult.level, "Hard");

const xResult = calculateDifficulty({
  approval_required: false,
  has_restricted_scopes: false,
  has_sensitive_scopes: false,
  requires_business_verification: true, // +20
  requires_paid_plan: true, // +35
  requires_security_assessment: false,
  requires_video_demo: false,
  has_manual_partner_vetting: true, // +30
  instant_self_serve_available: false,
});
assert.equal(xResult.score, 85);
assert.equal(xResult.level, "Gated");

const replitResult = calculateDifficulty({
  approval_required: false,
  has_restricted_scopes: false,
  has_sensitive_scopes: false,
  requires_business_verification: false,
  requires_paid_plan: false,
  requires_security_assessment: false,
  requires_video_demo: false,
  has_manual_partner_vetting: false,
  instant_self_serve_available: false,
  has_no_public_oauth: true, // +85 (Gated / Architectural Blocker)
});
assert.equal(replitResult.score, 85);
assert.equal(replitResult.level, "Gated");
assert.ok(replitResult.breakdown_strings.some((b) => b.includes("lacks a public 3rd-party OAuth")));

console.log("  ✓ Dynamic rubric calculations produce exact expected scores & tier levels.");

// ---------------------------------------------------------------------------
// TEST 4: Evals Ledger Mathematical Reconciliation
// ---------------------------------------------------------------------------
console.log("\n[TEST 4] Verifying mathematical reconciliation of evals ledger...");

const summary = evalsData.summary;
const totalClaims = summary.total_claims_evaluated;
const sum = summary.confirmed + summary.corrected + summary.downgraded;

assert.equal(sum, totalClaims, `Sum of statuses (${sum}) must equal total claims (${totalClaims})`);

const firstPassAccuracy = Number(((summary.confirmed / totalClaims) * 100).toFixed(1));
assert.equal(firstPassAccuracy, 70.8, "First-pass confirmed accuracy must be exactly 70.8%");

const auditSafeRate = Number((((summary.confirmed + summary.downgraded) / totalClaims) * 100).toFixed(1));
assert.equal(auditSafeRate, 83.3, "Audit-safe rate (confirmed + downgraded to community) must be 83.3%");

console.log(`  ✓ Total claims: ${totalClaims} = ${summary.confirmed} confirmed + ${summary.corrected} corrected + ${summary.downgraded} downgraded`);
console.log(`  ✓ Strict First-Pass Accuracy: ${firstPassAccuracy}%`);
console.log(`  ✓ Verifier Safe Pass Rate: ${auditSafeRate}%`);

console.log("\n=======================================================");
console.log("ALL INTEGRITY & RUBRIC UNIT TESTS PASSED SUCCESSFULLY! ✓");
console.log("=======================================================\n");

