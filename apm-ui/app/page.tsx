"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CopilotWorkbench } from "@/components/CopilotWorkbench";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { ALL_VERIFIED_GUIDES } from "@/lib/data/guides";
import { DifficultyLevel } from "@/lib/schema/guide";
import { ArrowRight, ShieldCheck, Database, Terminal, SlidersHorizontal } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [backendStatus, setBackendStatus] = useState<{
    connected: boolean;
    model?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setBackendStatus({
          connected: Boolean(data.backend_connected),
          model: data.backend_health?.model || data.backend?.model || "gemini-3.8-flash",
        });
      })
      .catch(() => setBackendStatus({ connected: false }));
  }, []);

  const filteredGuides = ALL_VERIFIED_GUIDES.filter((guide) => {
    if (filterDifficulty === "all") return true;
    return guide.difficulty.toLowerCase() === filterDifficulty.toLowerCase();
  });

  return (
    <div className="bg-[#050507] text-slate-100 min-h-screen">
      {/* 1. TOP SYSTEM METADATA STRIP */}
      <div className="border-b border-white/[0.08] bg-[#0c0d12] py-2 px-4 sm:px-6 lg:px-8 text-[11px] font-mono flex flex-wrap items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold tracking-wider">// SYSTEM: COPILOT_CLI</span>
          <span className="text-slate-600">|</span>
          <span>MODE: DETERMINISTIC_RUBRIC_PLANNER</span>
          <span className="text-slate-600">|</span>
          {backendStatus ? (
            backendStatus.connected ? (
              <span className="text-emerald-400 font-bold">
                ● APM BACKEND: CONNECTED [{backendStatus.model}]
              </span>
            ) : (
              <span className="text-amber-400 font-bold">
                ○ APM BACKEND: OFFLINE
              </span>
            )
          ) : (
            <span className="text-slate-500">BACKEND: CHECKING...</span>
          )}
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400">GROUND TRUTH: 83.3% SAFE PASS RATE</span>
        </div>
        <Link href="/evals" className="text-sky-400 hover:underline">
          [VIEW 24-CLAIM GROUND TRUTH AUDIT →]
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        {/* 2. HERO COPY (Aesthetic inspired by inspire.png) */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-950/20 text-[11px] font-mono text-sky-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span>OAUTH &amp; INTEGRATION SETUP COPILOT // DETERMINISTIC AUDIT ENGINE</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-sans text-white tracking-tight font-bold leading-tight">
            Your agent gets the verified OAuth layer.
          </h1>

          <p className="text-sm sm:text-lg font-sans text-slate-400 leading-relaxed font-normal max-w-2xl mx-auto">
            Your users connect their own accounts. Composio audits setup complexity,
            human review barriers, and executes every tool call.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <a
              href="#workbench"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/[0.18] bg-white text-black hover:bg-slate-200 text-xs font-mono font-bold uppercase tracking-wider transition active:translate-y-px shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              <span>LAUNCH SETUP COPILOT</span>
              <ArrowRight className="w-3.5 h-3.5 text-black" />
            </a>

            <a
              href="#registry"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/[0.18] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-mono font-bold uppercase tracking-wider text-white transition active:translate-y-px"
            >
              <span>EXPLORE AUDITED MATRIX</span>
            </a>
          </div>
        </div>

        {/* 3. INTERACTIVE 3-WINDOW COPILOT WORKBENCH */}
        <div id="workbench" className="scroll-mt-20">
          <CopilotWorkbench />
        </div>

        {/* 4. GROUND TRUTH INTEGRATION MATRIX // AUDITED REGISTRY */}
        <div id="registry" className="mb-14 font-mono scroll-mt-20">
          {/* Header Bar styled like macOS / Tech window */}
          <div className="rounded-2xl border border-white/[0.12] bg-[#0c0d12]/95 overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-white/[0.08] bg-black/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white font-bold">~/registry/verified-providers</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400 text-[11px]">
                    {ALL_VERIFIED_GUIDES.length} PORTALS AUDITED
                  </span>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                {[
                  { key: "all", label: "ALL" },
                  { key: "easy", label: "EASY (0-24)" },
                  { key: "moderate", label: "MODERATE (25-59)" },
                  { key: "hard", label: "HARD (60-84)" },
                  { key: "gated", label: "GATED (85+)" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterDifficulty(tab.key)}
                    className={`px-2.5 py-1 rounded transition text-xs ${
                      filterDifficulty === tab.key
                        ? "bg-white text-black font-bold"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-black/40 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Provider &amp; Portal</th>
                    <th className="py-3 px-4 font-bold">Deterministic Score</th>
                    <th className="py-3 px-4 font-bold">Active Effort</th>
                    <th className="py-3 px-4 font-bold">Typical Approval Wait</th>
                    <th className="py-3 px-4 font-bold">Review Mode</th>
                    <th className="py-3 px-4 font-bold">Managed Auth</th>
                    <th className="py-3 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-slate-300">
                  {filteredGuides.map((guide) => (
                    <tr
                      key={guide.app.slug}
                      onClick={() => router.push(`/guide/${guide.app.slug}`)}
                      className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-medium text-white">
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-500 text-[10px]">#</span>
                          <span className="font-bold group-hover:text-sky-300 transition-colors">
                            {guide.app.name}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase font-normal">
                            ({guide.app.category})
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <DifficultyBadge
                          difficulty={guide.difficulty}
                          score={guide.difficulty_score}
                          size="sm"
                        />
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 tabular-nums">
                        {guide.time_estimate.setup_active_effort}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-200">
                              Dev: {guide.time_estimate.dev_wait_claim?.split("(")[0] || "Instant"}
                            </span>
                            <ConfidenceChip
                              status={guide.time_estimate.dev_wait_confidence || "verified"}
                              size="sm"
                            />
                          </div>
                          {guide.time_estimate.production_wait_claim && (
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <span className="text-slate-300">
                                Public: {guide.time_estimate.production_wait_claim.split("(")[0]}
                              </span>
                              <ConfidenceChip
                                status={guide.time_estimate.production_wait_confidence || guide.time_estimate.confidence}
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {guide.approval.required ? (
                          <span className="text-amber-400 font-bold uppercase text-[10px]">
                            [REVIEW_REQ]
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold uppercase text-[10px]">
                            [INSTANT_DEV]
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sky-400 font-bold text-[10px] uppercase">
                            [1-CLICK MANAGED]
                          </span>
                          {guide.app.composio_tool_url && (
                            <a
                              href={guide.app.composio_tool_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-400 hover:text-white transition text-xs"
                              title="View on Composio"
                            >
                              ↗
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-white font-bold transition">
                          <span>OPEN</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
