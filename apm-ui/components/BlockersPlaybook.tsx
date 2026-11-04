"use client";

import React, { useState } from "react";
import { BlockerItem } from "@/lib/schema/guide";
import { Copy, Check } from "lucide-react";

interface BlockersPlaybookProps {
  blockers: BlockerItem[];
}

export function BlockersPlaybook({ blockers }: BlockersPlaybookProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="border border-white/[0.08] divide-y divide-white/[0.08] bg-[#0c0e14] font-mono">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-rose-400 inline-block" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-200">
            INCIDENT PLAYBOOK // KNOWN TRAPS & ESCALATION PROTOCOLS
          </span>
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          COUNT: {String(blockers.length).padStart(2, "0")}
        </span>
      </div>

      {blockers.map((blocker, idx) => (
        <div key={idx} className="p-5 sm:p-6 space-y-4">
          {/* Incident title line */}
          <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] pb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
              [INCIDENT #{String(idx + 1).padStart(2, "0")}]
            </span>
            <span className="text-[10px] text-slate-500 uppercase">
              STATUS: RESOLVABLE
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
              ERROR_SYMPTOM:
            </span>
            <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
              {blocker.symptom}
            </h4>
          </div>

          {/* Root cause and fix split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-sans">
            <div className="border border-white/[0.06] bg-black/30 p-3.5">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
                // ROOT CAUSE:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {blocker.cause}
              </p>
            </div>

            <div className="border border-emerald-500/20 bg-emerald-950/10 p-3.5">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">
                // ACTIONABLE RESOLUTION:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {blocker.fix}
              </p>
            </div>
          </div>

          {/* Escalation Template */}
          {blocker.escalation_template && (
            <div className="pt-2">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  PROVIDER_ESCALATION_TEMPLATE:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(blocker.escalation_template!, idx)}
                  className="px-2.5 py-1 text-[11px] border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 transition active:translate-y-px inline-flex items-center gap-1.5"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">[COPIED]</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>[COPY TEMPLATE]</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-black/60 border border-white/[0.06] text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap select-all font-mono leading-relaxed">
                {blocker.escalation_template}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
