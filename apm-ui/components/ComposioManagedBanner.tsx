"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

interface ComposioManagedBannerProps {
  appName: string;
  inManaged: boolean;
  alternativeNote?: string;
  toolUrl?: string;
  whenToByoc?: string[];
}

export function ComposioManagedBanner({
  appName,
  inManaged,
  alternativeNote,
  toolUrl,
  whenToByoc,
}: ComposioManagedBannerProps) {
  if (!inManaged) return null;

  return (
    <div className="border border-white/[0.12] bg-[#0c0e14] p-5 sm:p-6 mb-8 font-mono">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-sky-400 inline-block" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400">
            ARCHITECTURAL ADVISORY // COMPOSIO MANAGED AUTH AVAILABLE
          </span>
        </div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          STATUS: SUPPORTED IN COMPOSIO DIRECTORY
        </span>
      </div>

      {/* Main explanation & comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-3 font-sans">
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Do you need to register a custom OAuth app for {appName}?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            {alternativeNote ||
              `Composio provides pre-verified managed authentication connectors for ${appName}. Skip developer portal bureaucracy, third-party security audits, and multi-week review queues.`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
            <div className="border border-white/[0.06] bg-black/40 p-3 space-y-1">
              <span className="text-rose-400 block font-bold">[CUSTOM BYOC PATH]</span>
              <span className="text-slate-400 block text-[11px] leading-relaxed font-sans">
                Requires manual portal project setup, redirect domain verification, screencast recording, and potential security audits.
              </span>
            </div>
            <div className="border border-emerald-500/20 bg-emerald-950/10 p-3 space-y-1">
              <span className="text-emerald-400 block font-bold">[COMPOSIO MANAGED]</span>
              <span className="text-slate-300 block text-[11px] leading-relaxed font-sans">
                Zero infrastructure setup. Pre-configured enterprise scopes with 1-click token handshakes.
              </span>
            </div>
          </div>

          {whenToByoc && whenToByoc.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06] text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1.5">
                // WHEN YOU STILL NEED YOUR OWN OAUTH APP (BYOC):
              </span>
              <ul className="space-y-1 text-slate-400 text-[11px] font-sans">
                {whenToByoc.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-slate-500 font-mono select-none">▸</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col items-start lg:items-end justify-center pt-2">
          <a
            href={toolUrl || "https://composio.dev"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition active:translate-y-px"
          >
            <span>CONNECT VIA COMPOSIO</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-black" />
          </a>
          <span className="text-[10px] text-slate-500 font-mono mt-2 text-right">
            Pre-built connector for {appName}
          </span>
        </div>
      </div>
    </div>
  );
}
