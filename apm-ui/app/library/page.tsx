"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Guide } from "@/lib/schema/guide";
import { getAllGuides } from "@/lib/data/guides";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { Search, ArrowRight, ArrowLeft } from "lucide-react";

export default function LibraryPage() {
  const router = useRouter();
  const [guides, setGuides] = useState<Guide[]>(() => getAllGuides());
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [managedFilter, setManagedFilter] = useState(false);

  useEffect(() => {
    fetch("/api/guides")
      .then((res) => res.json())
      .then((data) => {
        if (data.guides && Array.isArray(data.guides) && data.guides.length > 0) {
          setGuides(data.guides);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = guides.filter((g) => {
    const matchesSearch =
      g.app.name.toLowerCase().includes(search.toLowerCase()) ||
      g.summary.toLowerCase().includes(search.toLowerCase()) ||
      g.app.category.toLowerCase().includes(search.toLowerCase());

    const matchesDiff =
      difficultyFilter === "all" || g.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

    const matchesApproval =
      approvalFilter === "all" ||
      (approvalFilter === "required" && g.approval.required) ||
      (approvalFilter === "none" && !g.approval.required);

    const matchesManaged = !managedFilter || g.app.in_composio_managed;

    return matchesSearch && matchesDiff && matchesApproval && matchesManaged;
  });

  return (
    <div className="bg-[#050507] text-slate-100 min-h-screen">
      {/* Top Metadata Strip */}
      <div className="border-b border-white/[0.08] bg-[#0c0d12] py-2 px-4 sm:px-6 lg:px-8 text-[11px] font-mono flex flex-wrap items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-300 hover:text-white transition flex items-center gap-1 font-bold">
            <ArrowLeft className="w-3 h-3" />
            <span>// COPILOT_HOME</span>
          </Link>
          <span className="text-slate-600">|</span>
          <span className="text-white font-bold">DIRECTORY: /REGISTRY</span>
          <span className="text-slate-600">|</span>
          <span>ENTRIES: {guides.length}</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400">STATUS: VERIFIED_CACHE</span>
        </div>
        <Link href="/" className="text-sky-400 hover:underline">
          [LAUNCH SETUP COPILOT →]
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-mono">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-950/20 text-[11px] font-mono text-sky-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>AUDITED INTEGRATION REGISTRY &amp; DOSSIER DIRECTORY</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-sans font-bold tracking-tight text-white">
            Integration Registry &amp; Blueprint Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-2xl leading-relaxed">
            Search verified OAuth specifications, scope taxonomies, and approval barriers.
            Compare setup effort and approval wait times across developer platforms.
          </p>
        </div>

        {/* Filter Controls Bar with macOS window style */}
        <div className="rounded-2xl border border-white/[0.12] bg-[#0c0d12]/95 p-4 mb-8 space-y-3 text-xs shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="md:col-span-2 relative flex items-center bg-black border border-white/[0.1] px-3 py-2 rounded-xl">
              <Search className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="grep by name, category, or scope keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-0 text-white placeholder-slate-600 focus:outline-none text-xs font-mono"
              />
            </div>

            {/* Difficulty Filter */}
            <div>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-white/[0.1] text-slate-300 focus:outline-none text-xs font-mono rounded-xl"
              >
                <option value="all">ALL_DIFFICULTIES</option>
                <option value="easy">EASY (0-24)</option>
                <option value="moderate">MODERATE (25-59)</option>
                <option value="hard">HARD (60-84)</option>
                <option value="gated">GATED (85+)</option>
              </select>
            </div>

            {/* Approval Filter */}
            <div>
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-white/[0.1] text-slate-300 focus:outline-none text-xs font-mono rounded-xl"
              >
                <option value="all">ALL_APPROVAL_MODES</option>
                <option value="none">NO_REVIEW_REQ (INSTANT)</option>
                <option value="required">MANDATORY_REVIEW_GATE</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06] text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">FILTER_TOGGLE:</span>
              <button
                onClick={() => setManagedFilter(!managedFilter)}
                className={`px-2.5 py-1 rounded border uppercase transition ${
                  managedFilter
                    ? "bg-white text-black font-bold border-white"
                    : "text-slate-400 border-white/[0.08] hover:border-white/[0.2]"
                }`}
              >
                [COMPOSIO_MANAGED_ONLY]
              </button>
            </div>

            <span className="text-slate-500 tabular-nums">
              MATCHES: {filtered.length} / {guides.length}
            </span>
          </div>
        </div>

        {/* Directory Ledger Table */}
        <div className="rounded-2xl border border-white/[0.12] bg-[#0c0d12]/95 overflow-hidden shadow-2xl">
          <div className="px-4 py-3 border-b border-white/[0.08] bg-black/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              <span className="text-[11px] text-slate-300 ml-2 font-mono">~/registry/all-dossiers</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase">
              RECONCILED_LEDGER
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-black/40 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold">App &amp; Portal</th>
                  <th className="py-3 px-4 font-bold">Difficulty Score</th>
                  <th className="py-3 px-4 font-bold">Active Effort</th>
                  <th className="py-3 px-4 font-bold">Typical Approval Wait</th>
                  <th className="py-3 px-4 font-bold">Review Mode</th>
                  <th className="py-3 px-4 font-bold">Managed Auth</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-slate-300">
                {filtered.map((guide) => (
                  <tr
                    key={guide.app.slug}
                    onClick={() => router.push(`/guide/${guide.app.slug}`)}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4 font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-black border border-white/[0.1] p-1 flex items-center justify-center shrink-0 rounded">
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
                          <span className="font-bold group-hover:text-sky-300 transition-colors block text-sm">
                            {guide.app.name}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase font-normal">
                            {guide.app.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <DifficultyBadge
                        difficulty={guide.difficulty}
                        score={guide.difficulty_score}
                        size="sm"
                      />
                    </td>

                    <td className="py-4 px-4 text-slate-200 tabular-nums">
                      {guide.time_estimate.setup_active_effort}
                    </td>

                    <td className="py-4 px-4 font-mono text-[11px]">
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

                    <td className="py-4 px-4">
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

                    <td className="py-4 px-4">
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

                    <td className="py-4 px-4 text-right">
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
  );
}
