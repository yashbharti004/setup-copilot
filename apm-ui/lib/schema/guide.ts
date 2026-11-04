import { z } from "zod";

export const EvidenceLevelSchema = z.enum([
  "VERIFIED",
  "DOCS",
  "COMMUNITY",
  "UNKNOWN",
]);

export type EvidenceLevel = z.infer<typeof EvidenceLevelSchema>;

export const ConfidenceLevelSchema = z.enum([
  "verified",
  "sourced",
  "community",
  "unknown",
]);

export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const DifficultyLevelSchema = z.enum([
  "Easy",
  "Moderate",
  "Hard",
  "Gated",
  "UNKNOWN",
]);

export type DifficultyLevel = z.infer<typeof DifficultyLevelSchema>;

export const ActorRoleSchema = z.enum(["agent", "you", "agent_assisted"]);

export type ActorRole = z.infer<typeof ActorRoleSchema>;

export const SensitivitySchema = z.enum(["basic", "sensitive", "restricted"]);

export type Sensitivity = z.infer<typeof SensitivitySchema>;

export const SourceItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  official: z.boolean(),
  via: z.enum(["fetch", "search_snippet"]).default("fetch"),
  cited: z.boolean().default(false),
});

export type SourceItem = z.infer<typeof SourceItemSchema>;

export const FactItemSchema = z.object({
  key: z.string(),
  value: z.union([z.boolean(), z.number()]),
  evidence: EvidenceLevelSchema,
  quote: z.string().default(""),
  source_id: z.string().default(""),
});

export type FactItem = z.infer<typeof FactItemSchema>;

export const EvidenceItemSchema = z.object({
  id: z.string(),
  claim: z.string(),
  source_url: z.string(),
  retrieved_at: z.string(),
  status: ConfidenceLevelSchema,
  snippet: z.string(),
});

export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export const SetupStepSchema = z.object({
  step_number: z.number(),
  action: z.string(),
  detail: z.string(),
  who: ActorRoleSchema,
  source: z.string(),
  confidence: ConfidenceLevelSchema,
  evidence_id: z.string().optional(),
  quote: z.string().optional(),
  source_id: z.string().optional(),
  source_url: z.string().optional(),
  generator_action: z
    .enum([
      "draft_privacy_policy",
      "scope_justification",
      "redirect_uri",
      "review_email",
    ])
    .optional(),
});

export type SetupStep = z.infer<typeof SetupStepSchema>;

export const ScopeItemSchema = z.object({
  scope: z.string(),
  unlocks: z.string(),
  sensitivity: SensitivitySchema,
  verification_required: z.boolean(),
});

export type ScopeItem = z.infer<typeof ScopeItemSchema>;

export const BlockerItemSchema = z.object({
  symptom: z.string(),
  cause: z.string(),
  fix: z.string(),
  quote: z.string().optional(),
  source_id: z.string().optional(),
  escalation_template: z.string().optional(),
});

export type BlockerItem = z.infer<typeof BlockerItemSchema>;

export const DifficultyMetaSchema = z.object({
  score: z.number().min(0).max(100),
  label: DifficultyLevelSchema,
  lower_bound: z.boolean().default(false),
  unknown_inputs: z.array(z.string()).default([]),
  breakdown: z
    .array(
      z.object({
        key: z.string(),
        points: z.number(),
      })
    )
    .default([]),
});

export type DifficultyMeta = z.infer<typeof DifficultyMetaSchema>;

export const ApprovalSchema = z.object({
  required: z.boolean(),
  min_days: z.number().nullable().optional(),
  max_days: z.number().nullable().optional(),
  evidence: EvidenceLevelSchema.default("UNKNOWN"),
  what_reviewed: z.string().default("Not stated in sources"),
  typical_rejection_reasons: z.array(z.string()).default([]),
  what_to_prepare: z.array(z.string()).default([]),
});

export type Approval = z.infer<typeof ApprovalSchema>;

const BaseGuideSchema = z.object({
  app: z.object({
    name: z.string(),
    slug: z.string(),
    logo: z.string(),
    docs_url: z.string(),
    category: z.string().default("Productivity"),
    in_composio_managed: z.boolean().default(false),
    composio_app_id: z.string().optional(),
    composio_tool_url: z.string().optional(),
    managed_alternative_note: z.string().optional(),
    when_to_byoc: z.array(z.string()).optional(),
  }),
  summary: z.string(),
  difficulty: DifficultyLevelSchema,
  difficulty_score: z.number().min(0).max(100),
  difficulty_factors: z.array(z.string()),
  difficulty_meta: DifficultyMetaSchema.optional(),
  time_estimate: z.object({
    setup_active_effort: z.string(),
    dev_wait_claim: z.string().optional(),
    dev_wait_confidence: ConfidenceLevelSchema.optional(),
    production_wait_claim: z.string().optional(),
    production_wait_confidence: ConfidenceLevelSchema.optional(),
    approval_wait: z.string(),
    confidence: ConfidenceLevelSchema,
  }),
  prerequisites: z.array(z.string()),
  path: z.array(SetupStepSchema),
  config_values: z.object({
    redirect_uri_format: z.string(),
    auth_url: z.string(),
    token_url: z.string(),
    default_scopes: z.array(z.string()),
    pkce_support: z.union([z.boolean(), z.enum(["optional", "required", "unknown"])]),
    token_rotation: z.union([z.boolean(), z.enum(["optional", "required", "unknown"])]),
  }),
  scopes: z.array(ScopeItemSchema),
  approval: ApprovalSchema,
  blockers_and_fixes: z.array(BlockerItemSchema),
  agent_vs_human: z.object({
    agent_can_do: z.array(z.string()),
    you_must_do: z.array(z.string()),
    handoff_critical_point: z.string(),
  }),
  what_to_do_next: z.array(z.string()),
  evidence: z.array(EvidenceItemSchema),
  uncertainties: z.array(z.string()),
  sources: z.array(SourceItemSchema).default([]),
  facts: z.array(FactItemSchema).default([]),
  coverage: z.record(z.string(), z.number()).default({}),
  notes: z.array(z.string()).default([]),
  has_official_source: z.boolean().default(true),
  last_verified: z.string(),
});

export const GuideSchema = BaseGuideSchema.superRefine((data, ctx) => {
  // Contradiction Check 1: Mandatory review cannot claim 0 days approval wait without explanation
  if (
    data.approval.required &&
    data.approval.min_days === 0 &&
    data.approval.max_days === 0 &&
    !data.approval.what_reviewed.toLowerCase().includes("instant")
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Contradiction: Approval is marked required but stated wait is 0 days.",
      path: ["approval", "min_days"],
    });
  }

  // Contradiction Check 2: If review is not required, min_days cannot be a multi-day review period
  if (!data.approval.required && data.approval.min_days != null && data.approval.min_days > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Contradiction: Approval is marked not required but review wait is > 0 days.",
      path: ["approval", "min_days"],
    });
  }

  // Contradiction Check 3: If difficulty is Easy (score < 25), cannot have unknown gating inputs
  const gatingKeys = [
    "review_required_for_distribution",
    "requires_paid_plan",
    "requires_security_audit",
    "requires_business_verification",
  ];
  if (
    data.difficulty === "Easy" &&
    data.difficulty_meta?.unknown_inputs &&
    data.difficulty_meta.unknown_inputs.some((k) => gatingKeys.includes(k))
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Contradiction: Cannot classify as Easy when gating inputs are unknown; must be UNKNOWN.",
      path: ["difficulty"],
    });
  }
});

export type Guide = z.infer<typeof BaseGuideSchema>;
