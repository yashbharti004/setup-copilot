"use client";

import React, { useState } from "react";
import evalsData from "@/lib/data/evals.json";
import { Search, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EvalsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const filteredEntries = evalsData.entries.filter((entry) => {
    const matchesFilter = filter === "all" || entry.status === filter;
    const matchesSearch =
      entry.app.toLowerCase().includes(search.toLowerCase()) ||
      entry.field.toLowerCase().includes(search.toLowerCase()) ||
      entry.agent_claim.toLowerCase().includes(search.toLowerCase()) ||
      entry.ground_truth.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-emerald-500/40 text-emerald-400 bg-emerald-950/20">
            [CONFIRMED]
          </span>
        );
      case "corrected":
        return (
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-rose-500/40 text-rose-400 bg-rose-950/20">
            [CORRECTED]
          </span>
        );
      case "downgraded":
        return (
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-amber-500/40 text-amber-400 bg-amber-950/20">
            [DOWNGRADED]
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-slate-700 text-slate-400">
            [UNVERIFIED]
          </span>
        );
    }
  };

  return (
    <div className="bg-[#090a0f] text-slate-100 min-h-screen">
      {/* Top Metadata Strip */}
      <div className="border-b border-white/[0.08] bg-[#0c0e14] py-2 px-4 sm:px-6 lg:px-8 text-[11px] font-mono flex flex-wrap items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-300 hover:text-white transition flex items-center gap-1 font-bold">
            <ArrowLeft className="w-3 h-3" />
            <span>SYS: /HOME</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-white uppercase font-bold">EVALS_SUITE</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            FIRST-PASS ACCURACY: <strong className="text-emerald-400">{((evalsData.summary.confirmed / evalsData.summary.total_claims_evaluated) * 100).toFixed(1)}%</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span>
            VERIFIER SAFETY RATE: <strong className="text-sky-400">{(((evalsData.summary.confirmed + evalsData.summary.downgraded) / evalsData.summary.total_claims_evaluated) * 100).toFixed(1)}%</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span>LAST_AUDIT: <strong className="text-slate-200">{evalsData.summary.last_eval_run}</strong></span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-mono">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
            Verification Log &amp; Ground Truth Audits
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-3xl leading-relaxed">
            Engineering maturity means showing where models stumble. This log audits 24 claims made during
            agent research against manual test-portal ground truth, documenting corrections and verifier downgrades.
          </p>
        </div>

        {/* Ruled Metrics Summary Ledger */}
        <div className="border border-white/[0.08] bg-[#0c0e14] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] grid grid-cols-2 lg:grid-cols-4 mb-4 text-xs">
          <div className="p-4 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
              TOTAL_CLAIMS_AUDITED
            </span>
            <div className="text-2xl font-black text-white tabular-nums">
              {evalsData.summary.total_claims_evaluated}
            </div>
            <span className="text-[10px] text-slate-500 block">Across 9 provider portals (6 pre-verified + 3 unfamiliar live)</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
              CONFIRMED_ACCURATE
            </span>
            <div className="text-2xl font-black text-emerald-400 tabular-nums">
              {evalsData.summary.confirmed}
            </div>
            <span className="text-[10px] text-emerald-500/80 block font-bold">
              {((evalsData.summary.confirmed / evalsData.summary.total_claims_evaluated) * 100).toFixed(1)}% First-Pass Confirmed
            </span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
              SYSTEMATICALLY_CORRECTED
            </span>
            <div className="text-2xl font-black text-rose-400 tabular-nums">
              {evalsData.summary.corrected}
            </div>
            <span className="text-[10px] text-slate-500 block">
              {((evalsData.summary.corrected / evalsData.summary.total_claims_evaluated) * 100).toFixed(1)}% Fixed by Verifier Pass
            </span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
              VERIFIER_DOWNGRADED
            </span>
            <div className="text-2xl font-black text-amber-400 tabular-nums">
              {evalsData.summary.downgraded}
            </div>
            <span className="text-[10px] text-slate-500 block">
              {((evalsData.summary.downgraded / evalsData.summary.total_claims_evaluated) * 100).toFixed(1)}% Downgraded to Community
            </span>
          </div>
        </div>

        {/* Explicit Reconciliation Formula Callout */}
        <div className="border border-white/[0.08] bg-black/60 p-3 mb-8 text-[11px] text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono">
          <div>
            <strong className="text-white">AUDIT RECONCILIATION:</strong> 17 confirmed (70.8%) + 3 downgraded to community (12.5%) + 4 systematically corrected (16.7%) = 24 total claims audited (100% coverage).
          </div>
          <div className="text-slate-500 text-[10px]">
            METHODOLOGY: DUAL-PASS EXTRACTION + CRITIC
          </div>
        </div>

        {/* Field Level Accuracy Matrix */}
        <div className="border border-white/[0.08] bg-[#0c0e14] p-5 mb-8">
          <div className="border-b border-white/[0.08] pb-2.5 mb-4 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 uppercase tracking-wider">
              FIELD-LEVEL ACCURACY BENCHMARK
            </span>
            <span className="text-[10px] text-slate-500">METHOD: REPRODUCTION_CHECK</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {evalsData.field_accuracy.map((f, idx) => (
              <div key={idx} className="border border-white/[0.06] bg-black/40 p-3 space-y-1">
                <span className="text-[11px] text-slate-400 block truncate" title={f.field}>
                  {f.field}
                </span>
                <div className="text-lg font-bold text-white tabular-nums">
                  {f.accuracy}%
                </div>
                <div className="w-full bg-white/[0.08] h-1 mt-2">
                  <div
                    className="bg-indigo-400 h-full"
                    style={{ width: `${f.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="border border-white/[0.12] bg-[#0c0e14] p-3.5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 bg-black border border-white/[0.1] px-3 py-1.5 flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="grep audit entries by app, error, or fix..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-0 text-white placeholder-slate-600 focus:outline-none text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
            {["all", "confirmed", "corrected", "downgraded"].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-2 py-0.5 uppercase tracking-wider transition ${
                  filter === st
                    ? "bg-white text-black font-bold"
                    : "text-slate-400 hover:text-white border border-white/[0.06] hover:border-white/[0.15]"
                }`}
              >
                [{st}]
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Audit Table */}
        <div className="border border-white/[0.08] bg-[#0c0e14] overflow-x-auto mb-10">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-black/60 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">App &amp; Field</th>
                <th className="py-3 px-4 font-bold">Agent Initial Claim</th>
                <th className="py-3 px-4 font-bold">Ground Truth Audit</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Engineering Fix</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              {filteredEntries.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-bold text-white text-sm">{item.app}</div>
                    <span className="text-[10px] text-sky-400">{item.field}</span>
                  </td>

                  <td className="py-3.5 px-4 align-top max-w-xs leading-relaxed text-slate-300 text-xs">
                    &ldquo;{item.agent_claim}&rdquo;
                  </td>

                  <td className="py-3.5 px-4 align-top max-w-xs leading-relaxed font-sans text-xs">
                    <div className="text-white font-medium mb-1">{item.ground_truth}</div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Method: {item.method}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>

                  <td className="py-3.5 px-4 align-top max-w-xs leading-relaxed font-sans text-xs">
                    <div className="text-slate-200">
                      {(item as any).systematic_fix || (item as any).systemic_fix}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3 Unfamiliar App Tests */}
        <div className="border border-white/[0.08] bg-[#0c0e14] p-5 sm:p-6">
          <div className="border-b border-white/[0.08] pb-2.5 mb-4 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-white uppercase tracking-wider block">
                UNFAMILIAR TARGET APPS: LIVE BENCHMARK TELEMETRY (PORTALS 7, 8, &amp; 9)
              </span>
              <span className="text-[11px] text-slate-400 font-sans">
                Tested without pre-cached templates to evaluate autonomous zero-shot accuracy on live documentation.
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">EXECUTION: DYNAMIC_PIPELINE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {evalsData.unfamiliar_app_tests.map((test, idx) => (
              <div key={idx} className="border border-white/[0.06] bg-black/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{test.app}</span>
                  <span className="text-slate-500 text-[10px] tabular-nums">{test.run_time}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">
                    [{test.status}]
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  {test.accuracy_notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
