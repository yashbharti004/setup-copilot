"use client";

import React, { useState } from "react";
import evalsData from "@/lib/data/evals.json";
import { Search, ArrowLeft, Shield, CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";

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
        return <Badge variant="success" size="sm">Confirmed</Badge>;
      case "corrected":
        return <Badge variant="danger" size="sm">Corrected</Badge>;
      case "downgraded":
        return <Badge variant="warning" size="sm">Downgraded</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Unverified</Badge>;
    }
  };

  const total = evalsData.summary.total_claims_evaluated;
  const confirmed = evalsData.summary.confirmed;
  const downgraded = evalsData.summary.downgraded;
  const corrected = evalsData.summary.corrected;

  const firstPassAccuracy = ((confirmed / total) * 100).toFixed(1);
  const verifierSafeRate = (((confirmed + downgraded) / total) * 100).toFixed(1);

  return (
    <div className="bg-[#050507] text-slate-100 min-h-screen">
      {/* Top Metadata Strip */}
      <div className="border-b border-white/[0.08] bg-[#0c0d14] py-2 px-4 sm:px-6 lg:px-8 text-[11px] font-mono flex flex-wrap items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-300 hover:text-white transition flex items-center gap-1 font-bold">
            <ArrowLeft className="w-3 h-3" />
            <span>// COPILOT_HOME</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-white uppercase font-bold">EVALS_SUITE</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            ACCURACY: <strong className="text-emerald-400">{firstPassAccuracy}%</strong> ({confirmed}/{total})
          </span>
          <span className="text-slate-600">|</span>
          <span>
            VERIFIER SAFETY: <strong className="text-sky-400">{verifierSafeRate}%</strong> ({confirmed + downgraded}/{total})
          </span>
          <span className="text-slate-600">|</span>
          <span>LAST_AUDIT: <strong className="text-slate-200">{evalsData.summary.last_eval_run}</strong></span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-950/20 text-xs font-mono text-sky-400">
            <Shield className="w-3.5 h-3.5" />
            <span>GROUND-TRUTH BENCHMARK &amp; AUDIT SUITE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Verification Log &amp; Ground Truth Audits
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Engineering maturity means showing where models stumble. This log audits 24 claims made during
            agent research against manual test-portal ground truth across 9 providers (6 pre-verified baseline plus 3 live portals), documenting corrections and verifier critic downgrades.
          </p>
        </div>

        {/* Ruled Metrics Summary Ledger */}
        <Card className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
          <div className="p-5 space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
              TOTAL CLAIMS AUDITED
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white tabular-nums font-mono">
              {total}
            </div>
            <span className="text-[11px] text-slate-400 block">Across 9 provider developer consoles</span>
          </div>

          <div className="p-5 space-y-1">
            <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider block">
              CONFIRMED CLAIMS
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums font-mono">
              {confirmed}
            </div>
            <span className="text-[11px] text-slate-400 block">{firstPassAccuracy}% raw agent accuracy</span>
          </div>

          <div className="p-5 space-y-1">
            <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider block">
              VERIFIER DOWNGRADED
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums font-mono">
              {downgraded}
            </div>
            <span className="text-[11px] text-slate-400 block">Caught &amp; downgraded to prevent traps</span>
          </div>

          <div className="p-5 space-y-1">
            <span className="text-[10px] text-rose-400 font-mono uppercase tracking-wider block">
              CORRECTED (HALLUCINATIONS)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 tabular-nums font-mono">
              {corrected}
            </div>
            <span className="text-[11px] text-slate-400 block">Flagged and corrected via manual test</span>
          </div>
        </Card>

        {/* Filter Controls Bar */}
        <Card className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md flex items-center bg-black/60 border border-white/[0.1] px-3 py-2 rounded-xl focus-within:border-sky-400 transition">
              <Search className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="grep by provider, field, claim, or ground truth..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-0 text-white placeholder-slate-600 focus:outline-none text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 font-mono">
              {[
                { key: "all", label: "ALL" },
                { key: "confirmed", label: "CONFIRMED" },
                { key: "downgraded", label: "DOWNGRADED" },
                { key: "corrected", label: "CORRECTED" },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setFilter(btn.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filter === btn.key
                      ? "bg-white text-black font-bold"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Evals Ledger Table */}
        <Card className="overflow-hidden">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Audited Field</TableHead>
                  <TableHead>Agent Initial Claim</TableHead>
                  <TableHead>Ground Truth / Manual Portal Fact</TableHead>
                  <TableHead>Verdict</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-semibold text-white font-mono">
                      {entry.app}
                    </TableCell>

                    <TableCell className="font-mono text-slate-400 text-xs">
                      {entry.field}
                    </TableCell>

                    <TableCell className="text-xs text-slate-300 max-w-xs font-sans">
                      {entry.agent_claim}
                    </TableCell>

                    <TableCell className="text-xs text-slate-200 max-w-sm font-sans">
                      <div className="space-y-1">
                        <div>{entry.ground_truth}</div>
                        <div className="text-slate-500 font-mono text-[10px]">
                          Method: {entry.method}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(entry.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Evals View */}
          <div className="md:hidden divide-y divide-white/[0.08]">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">{entry.app}</span>
                  {getStatusBadge(entry.status)}
                </div>

                <div className="text-[11px] font-mono text-slate-400">{entry.field}</div>

                <div className="space-y-1 pt-1 border-t border-white/[0.06]">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-mono">Claim:</span>
                    <p className="text-slate-300">{entry.agent_claim}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase block font-mono">Truth:</span>
                    <p className="text-slate-200">{entry.ground_truth}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
