"use client";

import React, { useState } from "react";
import { EvidenceItem } from "@/lib/schema/guide";
import { ConfidenceChip } from "./ConfidenceChip";
import { X, ExternalLink, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  evidence: EvidenceItem[];
  highlightedId?: string | null;
  uncertainties?: string[];
}

export function EvidenceDrawer({
  isOpen,
  onClose,
  evidence,
  highlightedId,
  uncertainties = [],
}: EvidenceDrawerProps) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  if (!isOpen) return null;

  const filteredEvidence = evidence.filter((item) => {
    const matchesFilter = filter === "all" || item.status === filter;
    const matchesSearch =
      item.claim.toLowerCase().includes(search.toLowerCase()) ||
      item.snippet.toLowerCase().includes(search.toLowerCase()) ||
      item.source_url.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm transition-opacity font-mono">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <div className="w-screen max-w-2xl bg-[#090a0f] border-l border-white/[0.12] text-slate-100 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-black/60 sticky top-0 z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 inline-block" />
                <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  EVIDENCE LEDGER // PRIMARY SOURCE AUDIT
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                TOTAL_RECORDS: {evidence.length} | PROVENANCE_GRADE: AUDITED
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 border border-white/[0.1] hover:border-white/[0.3] text-slate-400 hover:text-white transition"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-3.5 border-b border-white/[0.08] bg-[#0c0e14] space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="grep claims, citations, or domain URLs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-black border border-white/[0.1] text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-white/[0.3] font-mono"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
              {["all", "verified", "sourced", "community", "unknown"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 uppercase tracking-wider transition ${
                    filter === f
                      ? "bg-white text-black font-bold"
                      : "text-slate-400 hover:text-white border border-white/[0.06] hover:border-white/[0.15]"
                  }`}
                >
                  {f} {f === "all" ? `(${evidence.length})` : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Uncertainties Section */}
            {uncertainties.length > 0 && (
              <div className="border border-amber-500/30 bg-amber-950/10 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-2">
                  // EXPLICIT_UNCERTAINTIES & SLA_DISCLAIMERS:
                </span>
                <ul className="space-y-1.5 text-xs text-amber-200/90 list-disc list-inside font-sans">
                  {uncertainties.map((u, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Evidence List */}
            <div className="divide-y divide-white/[0.08] border border-white/[0.08]">
              {filteredEvidence.length === 0 ? (
                <div className="text-center py-16 text-slate-600 text-xs">
                  NO_MATCHES_FOUND for current filter query.
                </div>
              ) : (
                filteredEvidence.map((item, idx) => {
                  const isHighlighted = highlightedId === item.id;
                  return (
                    <div
                      key={item.id}
                      id={item.id}
                      className={`p-4 space-y-3 transition-colors ${
                        isHighlighted
                          ? "bg-indigo-950/30 border-l-2 border-indigo-400"
                          : "bg-black/20 hover:bg-black/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-bold">
                            #{String(idx + 1).padStart(2, "0")}
                          </span>
                          <ConfidenceChip status={item.status} size="sm" />
                        </div>
                        <span className="text-[10px] text-slate-500 tabular-nums">
                          AUDITED: {formatDate(item.retrieved_at)}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white font-sans leading-snug">
                        {item.claim}
                      </h4>

                      <div className="p-3 bg-black border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
                        &ldquo;{item.snippet}&rdquo;
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-500">REF: {item.id}</span>
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-400 hover:underline"
                        >
                          <span className="truncate max-w-[280px]">{item.source_url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/[0.08] bg-black text-center text-[10px] text-slate-500">
            AUDIT_POLICY: ZERO HALLUCINATION TOLERANCE. UNCONFIRMED SLAS DOWNGRADED.
          </div>
        </div>
      </div>
    </div>
  );
}
