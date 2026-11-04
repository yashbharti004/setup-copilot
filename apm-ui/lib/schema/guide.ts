import { z } from "zod";

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
]);

export type DifficultyLevel = z.infer<typeof DifficultyLevelSchema>;

export const ActorRoleSchema = z.enum(["agent", "you", "agent_assisted"]);

export type ActorRole = z.infer<typeof ActorRoleSchema>;

export const SensitivitySchema = z.enum(["basic", "sensitive", "restricted"]);

export type Sensitivity = z.infer<typeof SensitivitySchema>;

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
  escalation_template: z.string().optional(),
});

export type BlockerItem = z.infer<typeof BlockerItemSchema>;

export const GuideSchema = z.object({
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
  approval: z.object({
    required: z.boolean(),
    what_reviewed: z.string(),
    typical_rejection_reasons: z.array(z.string()),
    what_to_prepare: z.array(z.string()),
  }),
  blockers_and_fixes: z.array(BlockerItemSchema),
  agent_vs_human: z.object({
    agent_can_do: z.array(z.string()),
    you_must_do: z.array(z.string()),
    handoff_critical_point: z.string(),
  }),
  what_to_do_next: z.array(z.string()),
  evidence: z.array(EvidenceItemSchema),
  uncertainties: z.array(z.string()),
  last_verified: z.string(),
});

export type Guide = z.infer<typeof GuideSchema>;

