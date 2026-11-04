"use client";

import React from "react";
import { ArrowUpRight, CheckCircle2, AlertCircle, Shield, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

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
  if (!inManaged) {
    return (
      <div className="border border-white/[0.08] bg-[#0c0d14] rounded-xl p-5 mb-6 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06] mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Managed OAuth Advisory // Custom BYOC Required
            </span>
          </div>
          <Badge variant="warning" size="sm">
            Not in Managed Directory
          </Badge>
        </div>
        <p className="text-slate-300 font-sans leading-relaxed text-xs">
          Composio does not currently host a pre-configured multi-tenant app for <strong>{appName}</strong>. Developers must follow the custom BYOC (Bring Your Own Credentials) checklist below to register their own OAuth app in the provider&apos;s developer console.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-sky-500/20 bg-gradient-to-b from-[#091122]/90 to-[#070b14] rounded-xl p-6 mb-8 font-mono space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400">
            Architectural Advisory // Composio Managed OAuth Available
          </span>
        </div>
        <Badge variant="success" size="sm">
          ✓ Skip Setup with Managed App
        </Badge>
      </div>

      {/* Main explanation & comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start font-sans">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Can you skip this entire OAuth setup for {appName}?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            {alternativeNote ||
              `Composio provides pre-verified managed authentication connectors for ${appName}. You can completely bypass developer portal bureaucracy, third-party security audits, and multi-week review queues by using Composio's managed credentials.`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
            <div className="border border-white/[0.08] bg-black/50 rounded-lg p-3 space-y-1">
              <span className="text-rose-400 block font-bold">[CUSTOM BYOC PATH]</span>
              <span className="text-slate-400 block text-[11px] leading-relaxed font-sans">
                Requires manual portal project setup, domain verification, video demo screencasts, and ongoing token rotation.
              </span>
            </div>
            <div className="border border-emerald-500/20 bg-emerald-950/20 rounded-lg p-3 space-y-1">
              <span className="text-emerald-400 block font-bold">[COMPOSIO MANAGED APP]</span>
              <span className="text-slate-300 block text-[11px] leading-relaxed font-sans">
                Zero developer portal registration. Pre-approved enterprise scopes with instant 1-click token handshakes.
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition shadow-sm active:translate-y-px"
          >
            <span>Skip with Composio</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-black" />
          </a>
          <span className="text-[10px] text-slate-500 font-mono mt-2 text-right">
            Pre-built connector active for {appName}
          </span>
        </div>
      </div>
    </div>
  );
}
