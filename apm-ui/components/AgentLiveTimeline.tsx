"use client";

import React from "react";
import { PipelineProgressEvent } from "@/lib/agent/types";
import { ExternalLink, ArrowRight } from "lucide-react";

interface AgentLiveTimelineProps {
  events: PipelineProgressEvent[];
  isStreaming: boolean;
  onViewGuide?: () => void;
}

export function AgentLiveTimeline({
  events,
  isStreaming,
  onViewGuide,
}: AgentLiveTimelineProps) {
  return (
    <div className="border border-white/[0.12] bg-[#090a0f] font-mono text-xs">
      {/* Telemetry Header */}
      <div className="p-3.5 sm:p-4 bg-black/60 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2 h-2 inline-block ${
              isStreaming ? "bg-amber-400 animate-ping" : "bg-emerald-400"
            }`}
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
            TELEMETRY // AUTONOMOUS RESEARCH PIPELINE
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[10px] text-slate-400">
            {isStreaming ? "STATUS: PROCESSING" : "STATUS: AUDIT_COMPLETE"}
          </span>
        </div>

        {events.some((e) => e.step === "complete") && onViewGuide && (
          <button
            onClick={onViewGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider hover:bg-emerald-300 transition active:translate-y-px"
          >
            <span>[VIEW SETUP DOSSIER]</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Log Feed */}
      <div className="divide-y divide-white/[0.04] p-2 bg-black/40">
        {events.map((ev, index) => {
          const isLatest = index === events.length - 1;
          const isActive = isStreaming && isLatest;

          return (
            <div
              key={index}
              className={`p-3 space-y-1.5 ${
                isActive ? "bg-white/[0.04] border-l-2 border-indigo-400" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px]">[{ev.timestamp}]</span>
                  <span
                    className={`font-bold uppercase tracking-wider text-[11px] ${
                      ev.step === "complete"
                        ? "text-emerald-400"
                        : ev.step === "error"
                        ? "text-rose-400"
                        : ev.step === "verify_claims"
                        ? "text-amber-400"
                        : "text-indigo-400"
                    }`}
                  >
                    [{ev.step.toUpperCase()}]
                  </span>
                  <span className="text-white font-semibold text-xs">{ev.title}</span>
                </div>
                {isActive && (
                  <span className="text-indigo-400 text-[10px] animate-pulse">RUNNING...</span>
                )}
              </div>

              <p className="text-slate-400 pl-6 leading-relaxed text-xs">
                {ev.detail}
              </p>

              {/* Downgrade alert */}
              {typeof ev.downgrades_count === "number" && ev.downgrades_count > 0 && (
                <div className="ml-6 p-2 border border-amber-500/30 bg-amber-950/20 text-amber-300 text-[11px] font-mono">
                  [AUDIT_ALERT]: Verifier pass downgraded {ev.downgrades_count} claim(s) from &apos;verified&apos; to &apos;community-reported&apos; due to lack of explicit provider SLA documentation.
                </div>
              )}

              {/* Sourced URLs */}
              {ev.source_urls && ev.source_urls.length > 0 && (
                <div className="ml-6 flex flex-wrap gap-2 pt-1">
                  {ev.source_urls.map((url, uidx) => (
                    <a
                      key={uidx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:underline bg-white/[0.03] px-2 py-0.5 border border-white/[0.06]"
                    >
                      <span className="truncate max-w-[280px]">{url}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
