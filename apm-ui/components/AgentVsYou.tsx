"use client";

import React from "react";
import { HelperAction } from "@/lib/agent/helpers";

interface AgentVsYouProps {
  agentCanDo: string[];
  youMustDo: string[];
  handoffPoint: string;
  onOpenGenerator?: (action: HelperAction) => void;
}

export function AgentVsYou({
  agentCanDo,
  youMustDo,
  handoffPoint,
  onOpenGenerator,
}: AgentVsYouProps) {
  return (
    <div className="border border-white/[0.08] bg-[#0c0e14] font-mono">
      {/* Top Protocol Header */}
      <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-400 inline-block" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-200">
            SYSTEM BOUNDARY SPECIFICATION // AUTOMATION SPLIT
          </span>
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          RFC_BOUNDARY: ENFORCED
        </span>
      </div>

      {/* Critical Handoff Point Callout */}
      <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-indigo-950/10">
        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block mb-1">
          // CRITICAL HANDOFF COORDINATE:
        </span>
        <p className="text-xs sm:text-sm text-slate-200 font-sans leading-relaxed">
          {handoffPoint}
        </p>
      </div>

      {/* Dual Track Split Ledger */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
        {/* Track 1: Agent Automated */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              [TRACK_01: AGENT AUTOMATED]
            </span>
            <span className="text-[10px] text-slate-500">AUTONOMOUS</span>
          </div>

          <ul className="space-y-3 font-sans text-xs sm:text-sm text-slate-300">
            {agentCanDo.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                <span className="font-mono text-emerald-400 shrink-0 select-none">[✓]</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {onOpenGenerator && (
            <div className="pt-4 border-t border-white/[0.06]">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-2.5">
                // ONE-CLICK AGENT CODE & POLICY GENERATORS:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenGenerator("scope_justification")}
                  className="px-2.5 py-1.5 text-xs font-mono font-medium border border-indigo-500/30 bg-indigo-950/20 text-indigo-300 hover:bg-indigo-900/30 transition active:translate-y-px"
                >
                  [+ DRAFT_SCOPE_JUSTIFICATION]
                </button>
                <button
                  type="button"
                  onClick={() => onOpenGenerator("draft_privacy_policy")}
                  className="px-2.5 py-1.5 text-xs font-mono font-medium border border-indigo-500/30 bg-indigo-950/20 text-indigo-300 hover:bg-indigo-900/30 transition active:translate-y-px"
                >
                  [+ DRAFT_PRIVACY_POLICY]
                </button>
                <button
                  type="button"
                  onClick={() => onOpenGenerator("redirect_uri")}
                  className="px-2.5 py-1.5 text-xs font-mono font-medium border border-indigo-500/30 bg-indigo-950/20 text-indigo-300 hover:bg-indigo-900/30 transition active:translate-y-px"
                >
                  [+ FORMAT_REDIRECT_URIS]
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Track 2: Human Mandatory */}
        <div className="p-5 sm:p-6 space-y-5 bg-black/20">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              [TRACK_02: HUMAN MANDATORY]
            </span>
            <span className="text-[10px] text-slate-500">LEGAL_AUTHORITY</span>
          </div>

          <ul className="space-y-3 font-sans text-xs sm:text-sm text-slate-300">
            {youMustDo.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                <span className="font-mono text-amber-400 shrink-0 select-none">[!]</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="p-3 border border-white/[0.06] bg-black/40 text-[11px] text-slate-400 font-sans leading-relaxed">
            <strong className="text-slate-200 font-mono">NON-AUTOMATABLE:</strong> Agents cannot sign developer agreements, provide credit cards, pass CAPTCHAs, or record video proof.
          </div>
        </div>
      </div>
    </div>
  );
}
