"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Guide, SetupStep } from "@/lib/schema/guide";
import { getGuideBySlug } from "@/lib/data/guides";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { EvidenceDrawer } from "@/components/EvidenceDrawer";
import { AgentVsYou } from "@/components/AgentVsYou";
import { BlockersPlaybook } from "@/components/BlockersPlaybook";
import { ComposioManagedBanner } from "@/components/ComposioManagedBanner";
import { HelperGeneratorModal } from "@/components/HelperGeneratorModal";
import { ShareButton } from "@/components/ShareButton";
import { AgentLiveTimeline } from "@/components/AgentLiveTimeline";
import { PipelineProgressEvent } from "@/lib/agent/types";
import { HelperAction } from "@/lib/agent/helpers";
import { parseSSEBuffer } from "@/lib/utils";
import {
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  AlertOctagon,
} from "lucide-react";

export default function GuideDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const initialGuide = slug ? getGuideBySlug(slug) : null;
  const [guide, setGuide] = useState<Guide | null>(initialGuide || null);
  const [loading, setLoading] = useState(!initialGuide);

  // Modal / Drawer state
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [highlightedEvidenceId, setHighlightedEvidenceId] = useState<string | null>(null);
  const [generatorAction, setGeneratorAction] = useState<HelperAction | null>(null);

  // Re-run live research state
  const [isReRunning, setIsReRunning] = useState(false);
  const [reRunEvents, setReRunEvents] = useState<PipelineProgressEvent[]>([]);

  // Active tab
  const [activeTab, setActiveTab] = useState<
    "path" | "agent_vs_you" | "blockers" | "scopes" | "approval" | "rubric"
  >("path");

  useEffect(() => {
    if (!slug) return;
    const local = getGuideBySlug(slug);
    if (local) {
      setGuide(local);
      setLoading(false);
    }

    // Query API (which queries APM Backend SQLite database)
    fetch(`/api/guides/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.app) {
          setGuide(data);
          setLoading(false);
        } else if (!local) {
          handleReRun(slug);
        }
      })
      .catch(() => {
        if (!local) {
          handleReRun(slug);
        }
      });
  }, [slug]);

  const handleReRun = async (targetSlug?: string) => {
    const s = targetSlug || slug;
    setIsReRunning(true);
    setReRunEvents([]);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: s }),
      });

      if (!response.body) throw new Error("No stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = parseSSEBuffer<PipelineProgressEvent>(buffer, (event) => {
          setReRunEvents((prev) => [...prev, event]);
          if (event.step === "complete" && event.guide) {
            setGuide(event.guide);
            setLoading(false);
          }
        });
      }
    } catch {
      setLoading(false);
    } finally {
      setIsReRunning(false);
    }
  };

  const openEvidence = (id?: string) => {
    setHighlightedEvidenceId(id || null);
    setIsEvidenceOpen(true);
  };

  if (loading && !guide) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 font-mono">
        <div className="border border-white/[0.12] bg-[#0c0e14] p-6 text-center mb-6">
          <div className="text-xs text-emerald-400 mb-2 font-bold animate-pulse">
            // TELEMETRY: AUTONOMOUS AGENT ACTIVE
          </div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-1">
            Auditing Setup Path: {slug}
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Parsing developer documentation, verifying scope sensitivity, and executing verifier critic pass...
          </p>
        </div>

        {reRunEvents.length > 0 && (
          <AgentLiveTimeline events={reRunEvents} isStreaming={isReRunning} />
        )}
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4 font-mono">
        <AlertOctagon className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-white uppercase mb-1">DOSSIER_NOT_FOUND</h2>
        <p className="text-xs text-slate-400 mb-5">
          Could not locate or compile an audit record for &quot;{slug}&quot;.
        </p>
        <button
          onClick={() => handleReRun()}
          className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition"
        >
          [RETRY_AUTONOMOUS_PIPELINE]
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#090a0f] text-slate-100 min-h-screen">
      {/* 1. TOP SYSTEM BREADCRUMB STRIP */}
      <div className="border-b border-white/[0.08] bg-[#0c0e14] py-2 px-4 sm:px-6 lg:px-8 text-[11px] font-mono flex flex-wrap items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center gap-3">
          <Link
            href="/library"
            className="text-slate-300 hover:text-white transition flex items-center gap-1 font-bold"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>DIR: /REGISTRY</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-white uppercase font-bold">{guide.app.slug}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-400">
            AUDITED_DATE: <strong className="text-slate-200">{guide.last_verified}</strong>
          </span>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => handleReRun()}
            disabled={isReRunning}
            className="text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isReRunning ? "animate-spin" : ""}`} />
            <span>[RE_AUDIT]</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Re-run Timeline if active */}
        {isReRunning && (
          <div className="mb-8">
            <AgentLiveTimeline events={reRunEvents} isStreaming={isReRunning} />
          </div>
        )}

        {/* Composio Managed Auth Architectural Advisory Banner */}
        <ComposioManagedBanner
          appName={guide.app.name}
          inManaged={guide.app.in_composio_managed}
          alternativeNote={guide.app.managed_alternative_note}
          toolUrl={guide.app.composio_tool_url}
          whenToByoc={guide.app.when_to_byoc}
        />

        {/* 2. 5-SECOND VERDICT DOSSIER HEADER (TECHNICAL BLUEPRINT LEDGER) */}
        <div className="border border-white/[0.12] bg-[#0c0e14] p-6 sm:p-8 mb-8 font-mono">
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black border border-white/[0.1] p-2 flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={guide.app.logo}
                  alt={guide.app.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-mono">
                    {guide.app.name}
                  </h1>
                  <DifficultyBadge
                    difficulty={guide.difficulty}
                    score={guide.difficulty_score}
                    size="lg"
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>CATEGORY: {guide.app.category.toUpperCase()}</span>
                  <span className="text-slate-600">|</span>
                  <a
                    href={guide.app.docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>OFFICIAL_PORTAL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-center">
              <button
                onClick={() => openEvidence()}
                className="px-3 py-1.5 border border-white/[0.15] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-slate-200 transition"
              >
                [INSPECT EVIDENCE ({guide.evidence.length})]
              </button>
              <ShareButton guide={guide} />
            </div>
          </div>

          {/* Non-OAuth Architectural Warning Banner */}
          {guide.config_values.auth_url.includes("NOT_SUPPORTED") && (
            <div className="mb-6 p-4 border border-amber-500/40 bg-amber-950/20 font-mono text-xs">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                <AlertOctagon className="w-4 h-4 shrink-0 text-amber-400" />
                <span>ARCHITECTURAL GOTCHA: NO PUBLIC OAUTH 2.0 PROVIDER</span>
              </div>
              <p className="font-sans text-slate-300 text-xs sm:text-sm leading-relaxed">
                <strong className="text-white">{guide.app.name}</strong> does not operate a public third-party OAuth 2.0 authorization server or external client-registration portal. Standard authorization code flow is unsupported. Follow the API Key / Personal Token runbook below.
              </p>
            </div>
          )}

          {/* Verdict Quote Box */}
          <div className="p-4 bg-black/60 border border-white/[0.06] mb-6">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">
              // VERDICT_STATEMENT:
            </span>
            <p className="text-sm sm:text-base font-sans text-slate-100 font-medium leading-relaxed">
              &ldquo;{guide.summary}&rdquo;
            </p>
          </div>

          {/* Ruled 4-Metric Technical Ledger */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] border border-white/[0.08] bg-black/40 text-xs">
            <div className="p-4 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                [01. ACTIVE EFFORT]
              </span>
              <div className="text-lg sm:text-xl font-black text-white tabular-nums">
                {guide.time_estimate.setup_active_effort}
              </div>
              <span className="text-[10px] text-slate-500 block font-sans">Configuration &amp; code</span>
            </div>

            <div className="p-4 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                [02. TYPICAL WAIT]
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate">
                    Dev: {guide.time_estimate.dev_wait_claim?.split("(")[0] || "Instant"}
                  </span>
                  <ConfidenceChip
                    status={guide.time_estimate.dev_wait_confidence || "verified"}
                    size="sm"
                    onClick={() => openEvidence()}
                  />
                </div>
                {guide.time_estimate.production_wait_claim && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-[11px] text-slate-300 truncate">
                      Public: {guide.time_estimate.production_wait_claim.split("(")[0]}
                    </span>
                    <ConfidenceChip
                      status={guide.time_estimate.production_wait_confidence || guide.time_estimate.confidence}
                      size="sm"
                      onClick={() => openEvidence()}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                [03. REVIEW GATE]
              </span>
              <div className="text-sm sm:text-base font-bold">
                {guide.approval.required ? (
                  <span className="text-amber-400">[MANDATORY]</span>
                ) : (
                  <span className="text-emerald-400">[SELF-SERVE]</span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 block truncate">
                {guide.approval.required ? "App directory audit" : "Direct install URLs"}
              </span>
            </div>

            <div className="p-4 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                [04. BLOCKER TALLY]
              </span>
              <div className="text-lg sm:text-xl font-black text-rose-400 tabular-nums">
                {guide.blockers_and_fixes.length} KNOWN
              </div>
              <button
                onClick={() => setActiveTab("blockers")}
                className="text-[10px] text-sky-400 hover:underline block text-left"
              >
                view runbook →
              </button>
            </div>
          </div>
        </div>

        {/* 3. MANDATORY PREREQUISITES STRIP */}
        <div className="border border-white/[0.08] bg-[#0c0e14] p-4 sm:p-5 mb-8 font-mono text-xs">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-slate-500 font-bold">//</span>
            <span className="text-slate-300 font-bold uppercase tracking-wider">
              MANDATORY PREREQUISITES (MUST SATISFY BEFORE STARTING):
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-sans">
            {guide.prerequisites.map((prereq, idx) => (
              <div
                key={idx}
                className="p-2.5 border border-white/[0.06] bg-black/40 text-slate-300 text-xs flex items-start gap-2"
              >
                <span className="font-mono text-emerald-400 shrink-0 select-none">[✓]</span>
                <span>{prereq}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. SEGMENTED TAB NAVIGATION */}
        <div className="flex items-center gap-1 border-b border-white/[0.08] pb-2 mb-8 overflow-x-auto text-xs font-mono">
          {[
            { key: "path", label: `01. PATH_STEPS (${guide.path.length})` },
            { key: "agent_vs_you", label: "02. AUTOMATION_SPLIT" },
            { key: "blockers", label: `03. INCIDENT_RUNBOOK (${guide.blockers_and_fixes.length})` },
            { key: "scopes", label: `04. SCOPES_CONFIG (${guide.scopes.length})` },
            { key: "approval", label: "05. POLICY_AUDIT" },
            { key: "rubric", label: `06. CODE_RUBRIC (${guide.difficulty_score}/100)` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-3 py-1.5 whitespace-nowrap font-bold tracking-wider transition ${
                activeTab === tab.key
                  ? "bg-white text-black"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 5. TAB CONTENT: STEP-BY-STEP PATH */}
        {activeTab === "path" && (
          <div className="border border-white/[0.08] divide-y divide-white/[0.08] bg-[#0c0e14] font-mono">
            <div className="p-4 bg-black/40 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-200">
                SEQUENTIAL EXECUTION BLUEPRINT
              </span>
              <span className="text-[10px] text-slate-500">
                TOTAL_PHASES: {String(guide.path.length).padStart(2, "0")}
              </span>
            </div>

            {guide.path.map((step: SetupStep) => (
              <div key={step.step_number} className="p-5 sm:p-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.04] pb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">
                      PHASE_{String(step.step_number).padStart(2, "0")}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white font-sans">
                      {step.action}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold border ${
                        step.who === "agent"
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/20"
                          : step.who === "agent_assisted"
                          ? "border-indigo-500/40 text-indigo-300 bg-indigo-950/20"
                          : "border-amber-500/40 text-amber-400 bg-amber-950/20"
                      }`}
                    >
                      {step.who === "agent"
                        ? "[AGENT: AUTO]"
                        : step.who === "agent_assisted"
                        ? "[AGENT: ASSIST]"
                        : "[HUMAN: MANDATORY]"}
                    </span>

                    <ConfidenceChip
                      status={step.confidence}
                      size="sm"
                      onClick={() => openEvidence(step.evidence_id)}
                    />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {step.detail}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => openEvidence(step.evidence_id)}
                    className="text-slate-400 hover:text-sky-400 transition inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>SOURCE_REF: {step.source.replace(/^https?:\/\//, "").split("/")[0]}</span>
                    <ExternalLink className="w-3 h-3 text-slate-600" />
                  </button>

                  {step.generator_action && (
                    <button
                      type="button"
                      onClick={() => setGeneratorAction(step.generator_action!)}
                      className="px-3 py-1.5 border border-indigo-500/40 bg-indigo-950/20 text-indigo-300 hover:bg-indigo-900/30 text-xs font-bold uppercase tracking-wider transition active:translate-y-px"
                    >
                      [+ RUN ARTIFACT GENERATOR]
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB CONTENT: AGENT VS YOU */}
        {activeTab === "agent_vs_you" && (
          <AgentVsYou
            agentCanDo={guide.agent_vs_human.agent_can_do}
            youMustDo={guide.agent_vs_human.you_must_do}
            handoffPoint={guide.agent_vs_human.handoff_critical_point}
            onOpenGenerator={(act) => setGeneratorAction(act)}
          />
        )}

        {/* TAB CONTENT: BLOCKERS */}
        {activeTab === "blockers" && (
          <BlockersPlaybook blockers={guide.blockers_and_fixes} />
        )}

        {/* TAB CONTENT: SCOPES & CONFIG */}
        {activeTab === "scopes" && (
          <div className="space-y-6 font-mono text-xs">
            {/* Endpoints */}
            <div className="border border-white/[0.08] bg-[#0c0e14] p-5">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-200 block mb-3">
                // OAUTH 2.0 PROTOCOL &amp; ENDPOINT CONFIGURATION
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-black border border-white/[0.06]">
                  <span className="text-slate-500 block text-[10px] uppercase">AUTHORIZATION_URL:</span>
                  <span className="text-sky-400 break-all">{guide.config_values.auth_url}</span>
                </div>
                <div className="p-3 bg-black border border-white/[0.06]">
                  <span className="text-slate-500 block text-[10px] uppercase">TOKEN_EXCHANGE_URL:</span>
                  <span className="text-sky-400 break-all">{guide.config_values.token_url}</span>
                </div>
                <div className="p-3 bg-black border border-white/[0.06]">
                  <span className="text-slate-500 block text-[10px] uppercase">CALLBACK_URI_FORMAT:</span>
                  <span className="text-slate-300 break-all">{guide.config_values.redirect_uri_format}</span>
                </div>
                <div className="p-3 bg-black border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">PKCE_ENFORCED:</span>
                    <span className="text-emerald-400 uppercase font-bold">{String(guide.config_values.pkce_support)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">TOKEN_ROTATION:</span>
                    <span className="text-slate-200 uppercase font-bold">{String(guide.config_values.token_rotation)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scopes Table */}
            <div className="border border-white/[0.08] bg-[#0c0e14] overflow-x-auto">
              <div className="p-4 bg-black/40 border-b border-white/[0.08]">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-200">
                  SCOPE TAXONOMY &amp; SENSITIVITY CLASSIFICATION
                </span>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 bg-black/20 text-[11px] uppercase">
                    <th className="py-3 px-4 font-bold">Scope Identifier</th>
                    <th className="py-3 px-4 font-bold">Capability Unlocked</th>
                    <th className="py-3 px-4 font-bold">Sensitivity</th>
                    <th className="py-3 px-4 font-bold">Review Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-slate-300">
                  {guide.scopes.map((s, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.03]">
                      <td className="py-3 px-4 text-sky-400 font-semibold">{s.scope}</td>
                      <td className="py-3 px-4 font-sans text-xs text-slate-300">{s.unlocks}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 border ${
                            s.sensitivity === "restricted"
                              ? "border-rose-500/40 text-rose-400"
                              : s.sensitivity === "sensitive"
                              ? "border-amber-500/40 text-amber-400"
                              : "border-emerald-500/40 text-emerald-400"
                          }`}
                        >
                          [{s.sensitivity}]
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {s.verification_required ? (
                          <span className="text-rose-400 font-bold">[TRIGGERS_AUDIT]</span>
                        ) : (
                          <span className="text-slate-500">[SELF_SERVE]</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB CONTENT: APPROVAL */}
        {activeTab === "approval" && (
          <div className="border border-white/[0.08] bg-[#0c0e14] p-5 sm:p-6 font-mono text-xs space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-200 block mb-2">
                // WHAT PROVIDER REVIEWERS ACTUALLY EVALUATE:
              </span>
              <p className="text-sm font-sans text-slate-300 leading-relaxed font-normal">
                {guide.approval.what_reviewed}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 border border-rose-500/20 bg-rose-950/10 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">
                  [COMMON REJECTION VECTORS]:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside font-sans">
                  {guide.approval.typical_rejection_reasons.map((r, idx) => (
                    <li key={idx} className="leading-relaxed">{r}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 border border-white/[0.08] bg-black/40 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 block">
                  [REQUIRED SUBMISSION ASSETS]:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside font-sans">
                  {guide.approval.what_to_prepare.map((p, idx) => (
                    <li key={idx} className="leading-relaxed">{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: RUBRIC */}
        {activeTab === "rubric" && (
          <div className="border border-white/[0.08] bg-[#0c0e14] p-5 sm:p-6 font-mono text-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-white">
                  RUBRIC SCORE BREAKDOWN: {guide.difficulty_score}/100 ({guide.difficulty})
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  CRITERIA EVALUATED MATHEMATICALLY VIA LIB/SCHEMA/RUBRIC.TS
                </p>
              </div>
              <DifficultyBadge
                difficulty={guide.difficulty}
                score={guide.difficulty_score}
                size="md"
              />
            </div>

            <div className="divide-y divide-white/[0.06] border border-white/[0.06]">
              {guide.difficulty_factors.map((factor, idx) => (
                <div key={idx} className="p-3 bg-black/40 flex items-center gap-2">
                  <span className="text-emerald-400 shrink-0 select-none">[+]</span>
                  <span className="text-slate-200">{factor}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slide-over Evidence Drawer */}
        <EvidenceDrawer
          isOpen={isEvidenceOpen}
          onClose={() => setIsEvidenceOpen(false)}
          evidence={guide.evidence}
          highlightedId={highlightedEvidenceId}
          uncertainties={guide.uncertainties}
        />

        {/* Generator Modal */}
        <HelperGeneratorModal
          isOpen={generatorAction !== null}
          onClose={() => setGeneratorAction(null)}
          guide={guide}
          action={generatorAction}
        />
      </div>
    </div>
  );
}
