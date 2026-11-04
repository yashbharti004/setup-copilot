"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  ExternalLink,
  Shield,
  Key,
  Terminal,
  Search,
  Lock,
  BookOpen,
  Zap,
  Box,
  FileText,
  AlertTriangle,
  Play,
  RotateCcw,
} from "lucide-react";
import { ALL_VERIFIED_GUIDES, getGuideBySlug } from "@/lib/data/guides";
import { Guide } from "@/lib/schema/guide";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { PipelineProgressEvent } from "@/lib/agent/types";
import { parseSSEBuffer } from "@/lib/utils";

export function CopilotWorkbench() {
  const router = useRouter();

  // Selected guide state
  const [selectedSlug, setSelectedSlug] = useState<string>("google-workspace");
  const [activeGuide, setActiveGuide] = useState<Guide>(
    () => getGuideBySlug("google-workspace") || ALL_VERIFIED_GUIDES[0]
  );

  // Search input & agent research state
  const [queryInput, setQueryInput] = useState<string>("");
  const [isResearching, setIsResearching] = useState<boolean>(false);
  const [liveStreamEvents, setLiveStreamEvents] = useState<PipelineProgressEvent[]>([]);

  // Quick preset catalog
  const preverifiedPresets = [
    { name: "Google Workspace", slug: "google-workspace", difficulty: "Hard" as const, score: 80 },
    { name: "Slack", slug: "slack", difficulty: "Moderate" as const, score: 45 },
    { name: "GitHub", slug: "github", difficulty: "Easy" as const, score: 0 },
    { name: "Notion", slug: "notion", difficulty: "Moderate" as const, score: 25 },
    { name: "Linear", slug: "linear", difficulty: "Easy" as const, score: 15 },
    { name: "X (Twitter)", slug: "twitter-x", difficulty: "Gated" as const, score: 85 },
  ];

  const liveAgentPresets = [
    { name: "Zoom", query: "Zoom Developer Marketplace" },
    { name: "Discord", query: "Discord Developer Portal" },
    { name: "HubSpot", query: "HubSpot Developer Account" },
  ];

  const handleSelectApp = (slug: string) => {
    setSelectedSlug(slug);
    const found = getGuideBySlug(slug);
    if (found) {
      setActiveGuide(found);
    }
  };

  const handleRunLiveResearch = async (targetQuery?: string) => {
    const q = (targetQuery || queryInput).trim();
    if (!q) return;

    // Check if it's already a pre-verified app
    const local = getGuideBySlug(q);
    if (local) {
      setSelectedSlug(local.app.slug);
      setActiveGuide(local);
      setQueryInput("");
      return;
    }

    setIsResearching(true);
    setLiveStreamEvents([]);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = parseSSEBuffer<PipelineProgressEvent>(buffer, (event) => {
          setLiveStreamEvents((prev) => [...prev, event]);
          if (event.step === "complete" && event.guide) {
            setActiveGuide(event.guide);
            setSelectedSlug(event.guide.app.slug);
          }
        });
      }
    } catch {
      setLiveStreamEvents((prev) => [
        ...prev,
        {
          step: "error",
          title: "Pipeline Error",
          detail: "Failed to connect to APM backend research stream.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsResearching(false);
    }
  };

  // Score meter percentage
  const scorePercent = Math.min(100, Math.max(0, activeGuide.difficulty_score));
  const scoreColor =
    activeGuide.difficulty_score >= 85
      ? "text-purple-400 border-purple-500"
      : activeGuide.difficulty_score >= 60
      ? "text-rose-400 border-rose-500"
      : activeGuide.difficulty_score >= 25
      ? "text-amber-400 border-amber-500"
      : "text-emerald-400 border-emerald-500";

  return (
    <div className="relative mb-14">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[400px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />

      {/* 3-Window Interactive Setup Console */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-0 items-stretch">
        
        {/* ======================================================== */}
        {/* 1. LEFT PANEL: ~/copilot-agent Terminal Window           */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 z-10 flex flex-col">
          <div className="flex-1 rounded-2xl border border-white/[0.12] bg-[#0c0d12]/95 backdrop-blur-xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col justify-between">
            {/* macOS Title Bar */}
            <div>
              <div className="px-4 py-3 border-b border-white/[0.08] bg-black/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  <span className="text-[11px] text-slate-300 ml-2 font-mono">~/copilot-agent/planner</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  ● ACTIVE
                </span>
              </div>

              {/* Terminal Body */}
              <div className="p-4 space-y-3.5">
                {/* Search / Target Input Bar */}
                <div className="p-2.5 rounded-xl border border-white/[0.1] bg-black/80 flex items-center gap-2">
                  <span className="text-emerald-400 font-bold select-none">&gt;</span>
                  <input
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRunLiveResearch()}
                    placeholder="Audit provider (e.g. Slack, Zoom, HubSpot)..."
                    disabled={isResearching}
                    className="w-full bg-transparent border-0 text-white placeholder-slate-600 focus:outline-none text-xs font-mono"
                  />
                  <button
                    onClick={() => handleRunLiveResearch()}
                    disabled={isResearching || !queryInput.trim()}
                    className="px-2.5 py-1 bg-white hover:bg-slate-200 text-black font-bold text-[10px] uppercase rounded transition shrink-0 disabled:opacity-40"
                  >
                    {isResearching ? "..." : "RUN"}
                  </button>
                </div>

                {/* Preset Chips */}
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">
                    // SELECT VERIFIED TARGET:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {preverifiedPresets.map((p) => {
                      const isSelected = p.slug === selectedSlug;
                      return (
                        <button
                          key={p.slug}
                          onClick={() => handleSelectApp(p.slug)}
                          className={`px-2.5 py-1.5 rounded-lg text-left transition flex items-center justify-between border ${
                            isSelected
                              ? "bg-sky-500/15 border-sky-500/50 text-white font-bold shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                              : "border-white/[0.06] bg-black/40 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                          }`}
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {p.score}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Zero-Shot Triggers */}
                <div>
                  <div className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>OR TRIGGER ZERO-SHOT AGENT AUDIT:</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {liveAgentPresets.map((app) => (
                      <button
                        key={app.name}
                        onClick={() => {
                          setQueryInput(app.query);
                          handleRunLiveResearch(app.query);
                        }}
                        disabled={isResearching}
                        className="px-2 py-0.5 rounded border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-950/60 text-indigo-300 text-[10px] transition"
                      >
                        ⚡ {app.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Execution Pipeline Steps for Current App */}
                <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    // AUDIT CHECKLIST: {activeGuide.app.name.toUpperCase()}
                  </div>

                  {isResearching ? (
                    <div className="space-y-1.5 py-1">
                      {liveStreamEvents.slice(-3).map((ev, i) => (
                        <div key={i} className="text-[11px] text-indigo-300 flex items-center gap-1.5">
                          <span className="animate-spin text-sky-400">●</span>
                          <span className="font-bold">[{ev.step.toUpperCase()}]</span>
                          <span className="text-slate-400 truncate">{ev.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-[11px] text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">01. SCAN_DOCS: {activeGuide.app.docs_url.replace("https://", "")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>02. AUDIT_SCOPES: {activeGuide.scopes.length} sensitive permissions</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>03. APPROVAL_GATE: {activeGuide.approval.required ? "Mandatory human review" : "Instant dev credentials"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>04. BLOCKER_AUDIT: {activeGuide.blockers_and_fixes.length} known failure modes</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Terminal Footer Status */}
            <div className="px-4 py-2 border-t border-white/[0.06] bg-black/40 text-[10px] text-slate-500 flex items-center justify-between">
              <span>ENGINE: DETERMINISTIC_RUBRIC</span>
              <span className="text-emerald-400">GROUND_TRUTH: 83.3%</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. CENTER PANEL: Chamfered Deterministic Rubric Core     */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 z-20 flex flex-col justify-center my-4 lg:my-0 lg:-mx-2">
          {/* Glowing Horizontal Circuit Line connecting Left -> Center -> Right */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/50 to-transparent -translate-y-1/2 pointer-events-none z-0" />

          <div className="relative rounded-2xl border border-sky-500/30 bg-[#0d0f17] shadow-2xl p-5 text-xs font-mono space-y-4">
            {/* Top Spec Metrics */}
            <div className="space-y-2 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <Search className="w-3.5 h-3.5 text-sky-400" />
                  <span>SPEC MATURITY</span>
                </span>
                <span className="text-slate-200 font-bold">RFC 6749 OAuth 2.0</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AUTH FLOW</span>
                </span>
                <span className="text-slate-200">
                  {activeGuide.config_values.auth_url.includes("NOT_SUPPORTED")
                    ? "API Key / Token"
                    : "Auth Code + PKCE"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SCOPE SCRUTINY</span>
                </span>
                <span className="text-slate-200">
                  {activeGuide.difficulty_score >= 60 ? "Restricted & Sensitive" : "Standard Scopes"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>APPROVAL BARRIER</span>
                </span>
                <span className={activeGuide.approval.required ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                  {activeGuide.approval.required ? "Human Verification" : "Self-Serve Instant"}
                </span>
              </div>
            </div>

            {/* Central Composio Engine Rubric Badge */}
            <div className="relative my-2 py-3 px-4 rounded-xl border border-sky-400/40 bg-gradient-to-b from-[#131722] to-[#0a0c12] shadow-[0_0_25px_rgba(56,189,248,0.15)] flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 mb-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/composio-full-white.svg"
                  alt="Composio"
                  className="h-4 w-auto object-contain"
                />
                <span className="text-[10px] text-sky-400 font-bold tracking-widest uppercase">
                  DETERMINISTIC ENGINE
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white tabular-nums">
                  {activeGuide.difficulty_score}
                </span>
                <span className="text-xs text-slate-500 font-bold">/ 100</span>
                <span className={`text-xs font-bold uppercase ml-1 px-2 py-0.5 rounded border ${scoreColor}`}>
                  [{activeGuide.difficulty}]
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-black/60 h-1.5 rounded-full mt-2.5 overflow-hidden border border-white/[0.08]">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-500"
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
            </div>

            {/* Bottom Engine Specs */}
            <div className="space-y-2 pt-1 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span>MANAGED AUTH</span>
                </span>
                <span className="text-sky-400 font-bold">
                  {activeGuide.app.in_composio_managed ? "1-Click Available" : "BYOC Custom"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>KNOWN GOTCHAS</span>
                </span>
                <span className="text-rose-400 font-bold">
                  {activeGuide.blockers_and_fixes.length} Runbook Fixes
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-400">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>VERIFIER CRITIC</span>
                </span>
                <span className="text-emerald-400">Dual-Pass Audited</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. RIGHT PANEL: OAuth Blueprint & Dossier Window         */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 z-10 flex flex-col">
          <div className="relative flex-1 rounded-2xl border border-white/[0.12] bg-[#0c0d12]/95 backdrop-blur-xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col justify-between">
            {/* Window Header */}
            <div>
              <div className="px-4 py-3 border-b border-white/[0.08] bg-black/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  <span className="text-[11px] text-slate-300 ml-2 font-mono truncate">
                    {activeGuide.app.name} · Dossier
                  </span>
                </div>
                <span className="text-[10px] text-sky-400 uppercase">
                  VERIFIED_BLUEPRINT
                </span>
              </div>

              {/* Floating Toast Notification anchored to line */}
              <div className="p-3 border-b border-white/[0.06] bg-sky-950/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-white font-bold">
                      Audit ready for {activeGuide.app.name.split(" ")[0]}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Score {activeGuide.difficulty_score} · {activeGuide.difficulty.toUpperCase()} tier
                    </div>
                  </div>
                </div>
                <Link
                  href={`/guide/${activeGuide.app.slug}`}
                  className="text-[10px] text-sky-400 hover:text-white uppercase font-bold transition shrink-0"
                >
                  FULL DOSSIER →
                </Link>
              </div>

              {/* Blueprint Summary Card */}
              <div className="p-4 space-y-3 font-sans">
                {/* 2-Column Ledger */}
                <div className="grid grid-cols-2 gap-2 border border-white/[0.06] bg-black/40 p-2.5 rounded-xl font-mono text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">ACTIVE EFFORT</span>
                    <span className="font-bold text-white text-xs">{activeGuide.time_estimate.setup_active_effort}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">APPROVAL WAIT</span>
                    <span className="font-bold text-slate-200 text-xs">
                      {activeGuide.time_estimate.dev_wait_claim?.split("(")[0] || "Instant dev"}
                    </span>
                  </div>
                </div>

                {/* Verdict Statement */}
                <div className="p-2.5 rounded-xl border border-white/[0.06] bg-black/50 text-slate-300 text-xs leading-relaxed">
                  <span className="font-mono text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    // AUDIT VERDICT:
                  </span>
                  &ldquo;{activeGuide.summary}&rdquo;
                </div>

                {/* Prerequisites Checklist */}
                <div className="font-mono text-[11px] space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    // TOP PREREQUISITES:
                  </span>
                  {activeGuide.prerequisites.slice(0, 2).map((prereq, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-slate-400 text-[10px]">
                      <span className="text-emerald-400 select-none">[✓]</span>
                      <span className="truncate">{prereq}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="p-4 border-t border-white/[0.06] bg-black/40 flex items-center gap-2">
              <Link
                href={`/guide/${activeGuide.app.slug}`}
                className="flex-1 py-2 bg-white hover:bg-slate-200 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition text-center flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
              >
                <span>OPEN FULL DOSSIER</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <a
                href={activeGuide.app.docs_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-white/[0.1] hover:bg-white/[0.08] text-slate-300 hover:text-white rounded-lg transition"
                title="Open Official Documentation"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
