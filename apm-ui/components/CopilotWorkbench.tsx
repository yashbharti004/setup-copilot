"use client";

import React, { useState, useTransition, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  ExternalLink,
  Shield,
  Key,
  Search,
  Lock,
  Zap,
  AlertTriangle,
  RotateCcw,
  XCircle,
  HelpCircle,
  Clock,
  FileCheck,
  Layers,
} from "lucide-react";
import { ALL_GUIDES, getGuideBySlug } from "@/lib/data/guides";
import { Guide } from "@/lib/schema/guide";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { PipelineProgressEvent } from "@/lib/agent/types";
import { parseSSEBuffer } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";
import { Skeleton } from "@/components/ui/Skeleton";
import { Banner } from "@/components/ui/Banner";

export function CopilotWorkbench() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active guide
  const [selectedSlug, setSelectedSlug] = useState<string>("google-workspace");
  const [activeGuide, setActiveGuide] = useState<Guide>(
    () => getGuideBySlug("google-workspace") || ALL_GUIDES[0]
  );

  // Search & Filter in Picker
  const [pickerSearch, setPickerSearch] = useState<string>("");
  const [queryInput, setQueryInput] = useState<string>("");

  // Live generation state
  const [isResearching, setIsResearching] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<
    "idle" | "fetching" | "extracting" | "verifying" | "scoring" | "complete" | "error"
  >("idle");
  const [liveStreamEvents, setLiveStreamEvents] = useState<PipelineProgressEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const userCancelledRef = useRef<boolean>(false);
  const timedOutRef = useRef<boolean>(false);

  // Filtered providers for picker
  const filteredGuides = useMemo(() => {
    if (!pickerSearch.trim()) return ALL_GUIDES;
    const q = pickerSearch.toLowerCase();
    return ALL_GUIDES.filter(
      (g) =>
        g.app.name.toLowerCase().includes(q) ||
        g.app.category.toLowerCase().includes(q) ||
        g.difficulty.toLowerCase().includes(q)
    );
  }, [pickerSearch]);

  const handleSelectApp = (slug: string) => {
    setSelectedSlug(slug);
    const found = getGuideBySlug(slug);
    if (found) {
      setActiveGuide(found);
      setErrorMessage(null);
    }
  };

  const handleCancelResearch = () => {
    userCancelledRef.current = true;
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsResearching(false);
    setGenerationStep("idle");
    setErrorMessage(null);
  };

  const handleRunLiveResearch = async (targetQuery?: string) => {
    const q = (targetQuery || queryInput).trim();
    if (!q) return;

    // Check if pre-verified
    const local = getGuideBySlug(q);
    if (local) {
      handleSelectApp(local.app.slug);
      setQueryInput("");
      return;
    }

    userCancelledRef.current = false;
    timedOutRef.current = false;
    setIsResearching(true);
    setGenerationStep("fetching");
    setLiveStreamEvents([]);
    setErrorMessage(null);

    const controller = new AbortController();
    setAbortController(controller);

    // 120 seconds timeout for live LLM and web verification
    const timeoutId = setTimeout(() => {
      timedOutRef.current = true;
      controller.abort();
      setIsResearching(false);
      setGenerationStep("error");
      setErrorMessage("Research request timed out after 120 seconds. Please try again.");
    }, 120000);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
        signal: controller.signal,
      });

      if (!response.body) throw new Error("No response stream available");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = parseSSEBuffer<PipelineProgressEvent>(buffer, (event) => {
          setLiveStreamEvents((prev) => [...prev, event]);

          // Update stepper progress
          if (event.step === "search_docs" || event.step === "fetch_pages") {
            setGenerationStep("fetching");
          } else if (event.step === "extract_schema") {
            setGenerationStep("extracting");
          } else if (event.step === "verify_claims") {
            setGenerationStep("verifying");
          } else if (event.step === "compute_rubric") {
            setGenerationStep("scoring");
          } else if (event.step === "error") {
            setGenerationStep("error");
            setErrorMessage(event.detail || "Error during live audit execution.");
          } else if (event.step === "complete") {
            setGenerationStep("complete");
            if (event.guide) {
              setActiveGuide(event.guide);
              setSelectedSlug(event.guide.app.slug);
            }
          }
        });
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        if (timedOutRef.current) {
          setGenerationStep("error");
          setErrorMessage("Research request timed out after 120 seconds. Please try again.");
        } else if (userCancelledRef.current) {
          setGenerationStep("idle");
          setErrorMessage(null);
        } else {
          setGenerationStep("error");
          setErrorMessage("Audit was interrupted.");
        }
      } else {
        setGenerationStep("error");
        setErrorMessage(
          err.message || "Failed to connect to agent research pipeline. You can retry below."
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setIsResearching(false);
      setAbortController(null);
    }
  };

  // Derive honest metrics from activeGuide JSON
  const isLowerBound = Boolean(activeGuide.difficulty_meta?.lower_bound);
  const isUnknownTier = activeGuide.difficulty === "UNKNOWN";
  const verifiedFactsCount = activeGuide.facts
    ? activeGuide.facts.filter((f) => f.evidence !== "UNKNOWN").length
    : activeGuide.coverage?.verified_facts ?? 0;

  // Derive approval wait claim
  const approvalWaitText =
    activeGuide.time_estimate.approval_wait || "Not stated in sources";

  // Derive auth protocol and flow
  const authUrlVal = activeGuide.config_values?.auth_url;
  const isNoPublicOAuth = authUrlVal === "NOT_SUPPORTED";
  const authFlowText = isNoPublicOAuth
    ? "No public OAuth (Manual / API Key)"
    : authUrlVal && authUrlVal !== "Not assessed"
    ? "Authorization Code Flow"
    : "Not assessed";

  // Derive scope scrutiny
  const hasRestricted = activeGuide.facts?.some(
    (f) => f.key === "uses_restricted_scopes" && f.value === true
  );
  const scopeScrutinyText = hasRestricted
    ? "Restricted & Sensitive Scopes"
    : activeGuide.scopes.length > 0
    ? `${activeGuide.scopes.length} Scopes Configured`
    : "Not assessed";

  return (
    <div className="relative mb-14">
      {/* 3-Column Clean Grid Layout (No overlapping, stacked below lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================== */}
        {/* COLUMN 1 (lg:col-span-4): Search & Provider Picker       */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Search className="w-4 h-4 text-sky-400" />
                  <span>Provider Directory</span>
                </CardTitle>
                <Tooltip content="0–100 difficulty rubric. Higher score indicates greater setup effort and review friction.">
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 cursor-help hover:text-white transition">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Scoring Legend</span>
                  </span>
                </Tooltip>
              </div>
              <CardDescription>
                Select a verified integration or audit an unfamiliar provider.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              {/* Live Search Input */}
              <div className="space-y-1.5">
                <label htmlFor="audit-input" className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Audit Unfamiliar Provider:
                </label>
                <div className="flex items-center gap-2 bg-black/60 border border-white/[0.12] rounded-lg px-3 py-2 focus-within:border-sky-400 transition">
                  <span className="text-emerald-400 font-mono font-bold select-none">&gt;</span>
                  <input
                    id="audit-input"
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRunLiveResearch()}
                    placeholder="e.g. Zoom, Discord, Asana, HubSpot..."
                    disabled={isResearching}
                    className="w-full bg-transparent border-0 text-white placeholder-slate-500 focus:outline-none text-xs font-sans"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleRunLiveResearch()}
                    disabled={isResearching || !queryInput.trim()}
                    isLoading={isResearching}
                    className="h-7 text-[10px] uppercase font-mono tracking-wider shrink-0"
                  >
                    Audit
                  </Button>
                </div>
              </div>

              {/* Live Generation Stepper (Active during research) */}
              {isResearching && (
                <div className="p-3.5 rounded-xl border border-sky-500/40 bg-sky-950/20 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                      Live Research In Progress
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelResearch}
                      className="h-6 text-[10px] text-rose-400 hover:text-rose-300"
                    >
                      Cancel
                    </Button>
                  </div>

                  {/* Stepper indicators */}
                  <div className="space-y-1.5 text-[11px]">
                    {[
                      { key: "fetching", label: "1. Fetching documentation" },
                      { key: "extracting", label: "2. Extracting OAuth facts" },
                      { key: "verifying", label: "3. Verifying quotes & policy" },
                      { key: "scoring", label: "4. Deterministic scoring" },
                    ].map((step, idx) => {
                      const stepOrder = ["fetching", "extracting", "verifying", "scoring", "complete"];
                      const currentIdx = stepOrder.indexOf(generationStep);
                      const thisIdx = stepOrder.indexOf(step.key);
                      const isDone = currentIdx > thisIdx;
                      const isCurrent = currentIdx === thisIdx;

                      return (
                        <div key={step.key} className="flex items-center gap-2">
                          {isDone ? (
                            <span className="text-emerald-400 font-bold">✓</span>
                          ) : isCurrent ? (
                            <span className="w-3 h-3 border-2 border-sky-400 border-t-transparent animate-spin rounded-full inline-block" />
                          ) : (
                            <span className="text-slate-600 font-bold">○</span>
                          )}
                          <span
                            className={
                              isDone
                                ? "text-slate-300"
                                : isCurrent
                                ? "text-sky-300 font-bold"
                                : "text-slate-500"
                            }
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Skeleton className="h-2 w-full mt-2" />
                </div>
              )}

              {/* Error state with retry */}
              {errorMessage && (
                <Banner variant="error" title="Audit Error">
                  <p>{errorMessage}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRunLiveResearch()}
                    className="mt-2 text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Retry Research
                  </Button>
                </Banner>
              )}

              {/* Searchable Picker List */}
              <div className="space-y-2 pt-1 border-t border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <label htmlFor="picker-filter" className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                    Pre-Verified Profiles:
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {filteredGuides.length} available
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="picker-filter"
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Filter list by name or category..."
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-white/[0.2]"
                  />
                </div>

                {/* List items with no clipping */}
                <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
                  {filteredGuides.map((guide) => {
                    const isSelected = guide.app.slug === selectedSlug;
                    const isGuideLowerBound = Boolean(guide.difficulty_meta?.lower_bound);

                    return (
                      <button
                        key={guide.app.slug}
                        onClick={() => handleSelectApp(guide.app.slug)}
                        className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-sky-500/15 border-sky-500/50 shadow-sm"
                            : "border-white/[0.06] bg-black/40 hover:bg-white/[0.04] text-slate-300"
                        }`}
                      >
                        <div className="truncate">
                          <div className="font-semibold text-xs text-white truncate">
                            {guide.app.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {guide.app.category}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          <DifficultyBadge
                            difficulty={guide.difficulty}
                            score={guide.difficulty_score}
                            lowerBound={isGuideLowerBound}
                            size="sm"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 2 (lg:col-span-4): Deterministic Rubric Engine     */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <Card className="border-sky-500/30">
            <CardHeader className="pb-3 border-b border-sky-500/20 bg-sky-950/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-400" />
                  <span>Deterministic Rubric</span>
                </CardTitle>
                <Badge variant={isUnknownTier ? "neutral" : "info"} size="sm">
                  {isUnknownTier ? "Audited Unofficial" : "Code-Computed"}
                </Badge>
              </div>
              <CardDescription>
                Audited against 10 explicit criteria. Scores cannot drift.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Central Score Display */}
              <div className="p-4 rounded-xl border border-sky-400/30 bg-black/60 flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Difficulty Score &amp; Tier
                </span>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tabular-nums tracking-tight">
                    {isLowerBound ? `≥${activeGuide.difficulty_score}` : activeGuide.difficulty_score}
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-bold">/ 100</span>
                  <DifficultyBadge
                    difficulty={activeGuide.difficulty}
                    score={activeGuide.difficulty_score}
                    lowerBound={isLowerBound}
                    showScore={false}
                    size="md"
                    className="ml-1"
                  />
                </div>

                {isLowerBound && (
                  <div className="text-[11px] font-sans text-amber-300 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/30">
                    Partial data: {verifiedFactsCount} of 10 facts verified
                  </div>
                )}

                {isUnknownTier && (
                  <p className="text-[11px] text-slate-400 font-sans leading-normal max-w-xs">
                    Classified as UNKNOWN because key gating inputs were not stated in retrieved documentation.
                  </p>
                )}
              </div>

              {/* Derived Criteria Rows (Zero Hardcoded Values) */}
              <div className="space-y-2.5 font-mono text-xs divide-y divide-white/[0.06]">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-sky-400" />
                    <span>Auth Protocol</span>
                  </span>
                  <span className="text-slate-200 font-medium">{authFlowText}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Scope Scrutiny</span>
                  </span>
                  <span className="text-slate-200 font-medium">{scopeScrutinyText}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Human Review Gate</span>
                  </span>
                  <span
                    className={
                      activeGuide.approval.required
                        ? "text-amber-400 font-bold"
                        : "text-emerald-400 font-medium"
                    }
                  >
                    {activeGuide.approval.required
                      ? "Mandatory App Review"
                      : "Self-Serve (No Review)"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Typical Approval Wait</span>
                  </span>
                  <span className="text-slate-200 font-medium truncate max-w-[170px] text-right">
                    {approvalWaitText}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Managed Auth</span>
                  </span>
                  <span className="text-sky-400 font-medium">
                    {activeGuide.app.in_composio_managed
                      ? "1-Click Connector Available"
                      : "BYOC Only"}
                  </span>
                </div>
              </div>

              {/* Rubric Factor Breakdown */}
              <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  Scoring Breakdown Factors:
                </span>
                <div className="space-y-1">
                  {activeGuide.difficulty_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] text-slate-300 font-sans flex items-start gap-1.5"
                    >
                      <span className="text-sky-400 font-mono shrink-0">•</span>
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 3 (lg:col-span-4): OAuth Blueprint & Runbook Dossier */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono flex items-center gap-2 truncate">
                  <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{activeGuide.app.name}</span>
                </CardTitle>
                {activeGuide.has_official_source ? (
                  <Badge variant="success" size="sm">
                    Verified Source
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">
                    Unofficial Data
                  </Badge>
                )}
              </div>
              <CardDescription>
                Audited integration specification and blocker runbook.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              {/* Unofficial Banner if no official source */}
              {!activeGuide.has_official_source && (
                <Banner variant="warning" title="No Official Documentation Read">
                  Claims are derived exclusively from third-party community sources. Do not treat this as a verified provider blueprint.
                </Banner>
              )}

              {/* Real Factual Summary */}
              <div className="p-3.5 rounded-xl border border-white/[0.08] bg-black/50 text-slate-200 text-xs font-sans leading-relaxed">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block mb-1">
                  Executive Verdict:
                </span>
                {activeGuide.summary}
              </div>

              {/* Operational Ledger Metrics */}
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="p-2.5 rounded-xl border border-white/[0.06] bg-black/40">
                  <span className="text-[10px] text-slate-500 uppercase block">Active Effort</span>
                  <span className="font-bold text-white text-xs mt-0.5 block">
                    {activeGuide.time_estimate.setup_active_effort}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl border border-white/[0.06] bg-black/40">
                  <span className="text-[10px] text-slate-500 uppercase block">Approval Wait</span>
                  <span className="font-bold text-slate-200 text-xs mt-0.5 block truncate">
                    {approvalWaitText}
                  </span>
                </div>
              </div>

              {/* Setup Prerequisites */}
              <div className="space-y-1.5 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                  Prerequisites Required:
                </span>
                <div className="space-y-1 font-sans text-slate-300 text-xs">
                  {activeGuide.prerequisites.slice(0, 3).map((prereq, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-mono shrink-0 select-none">[✓]</span>
                      <span className="text-[11px] leading-relaxed">{prereq}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Known Blockers Tally */}
              {activeGuide.blockers_and_fixes.length > 0 && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div className="font-bold text-rose-300">
                        {activeGuide.blockers_and_fixes.length} Documented Blockers
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        Fix runbook ready for common integration failure modes.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push(`/guide/${activeGuide.app.slug}`)}
                className="flex-1 w-full"
              >
                <span>View Full Dossier</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <a
                href={activeGuide.app.docs_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center p-2 rounded-lg border border-white/[0.1] hover:bg-white/[0.06] text-slate-300 hover:text-white transition"
                title="Open Official Provider Docs"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </CardFooter>
          </Card>
        </div>

      </div>
    </div>
  );
}
