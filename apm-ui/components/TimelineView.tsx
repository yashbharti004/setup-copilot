"use client";

import React from "react";
import { Guide, SetupStep } from "@/lib/schema/guide";
import { Clock, Zap, HelpCircle, User, Bot } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface TimelineViewProps {
  guide: Guide;
}

interface TimelineItem {
  id: string;
  order: number;
  title: string;
  detail: string;
  kind: "immediate" | "wait" | "unknown_wait";
  durationLabel: string;
  actor: "human" | "agent";
  quote?: string;
}

export function TimelineView({ guide }: TimelineViewProps) {
  const steps: SetupStep[] = guide.path || [];

  // Classify each step into Immediate vs Wait Gate vs Unknown Wait
  const timelineItems: TimelineItem[] = steps.map((s) => {
    const isApprovalRelated =
      s.action.toLowerCase().includes("review") ||
      s.action.toLowerCase().includes("approval") ||
      s.action.toLowerCase().includes("audit") ||
      s.action.toLowerCase().includes("verification") ||
      s.detail.toLowerCase().includes("wait") ||
      s.detail.toLowerCase().includes("submit for");

    const actorType: "human" | "agent" = s.who === "agent" ? "agent" : "human";

    if (isApprovalRelated && guide.approval.required) {
      if (guide.approval.min_days !== null && guide.approval.max_days !== null) {
        return {
          id: `step-${s.step_number}`,
          order: s.step_number,
          title: s.action,
          detail: s.detail,
          kind: "wait",
          durationLabel: `${guide.approval.min_days}–${guide.approval.max_days} days wait`,
          actor: actorType,
          quote: s.quote,
        };
      } else if (guide.approval.min_days !== null) {
        return {
          id: `step-${s.step_number}`,
          order: s.step_number,
          title: s.action,
          detail: s.detail,
          kind: "wait",
          durationLabel: `≥${guide.approval.min_days} days wait`,
          actor: actorType,
          quote: s.quote,
        };
      } else {
        return {
          id: `step-${s.step_number}`,
          order: s.step_number,
          title: s.action,
          detail: s.detail,
          kind: "unknown_wait",
          durationLabel: "Unknown wait (No SLA in docs)",
          actor: actorType,
          quote: s.quote,
        };
      }
    }

    if (s.action.toLowerCase().includes("domain") || s.action.toLowerCase().includes("dns")) {
      return {
        id: `step-${s.step_number}`,
        order: s.step_number,
        title: s.action,
        detail: s.detail,
        kind: "wait",
        durationLabel: "10–60 min (DNS propagation)",
        actor: actorType,
        quote: s.quote,
      };
    }

    return {
      id: `step-${s.step_number}`,
      order: s.step_number,
      title: s.action,
      detail: s.detail,
      kind: "immediate",
      durationLabel: "Immediate execution",
      actor: actorType,
      quote: s.quote,
    };
  });

  const totalImmediateSteps = timelineItems.filter((t) => t.kind === "immediate").length;
  const totalWaitSteps = timelineItems.filter((t) => t.kind !== "immediate").length;

  return (
    <Card className="border border-white/[0.12] bg-[#090b12] p-6 sm:p-8 space-y-6">
      {/* Overview Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400">
              Execution Timeline // Latency & Gates
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight mt-1">
            Setup Velocity vs. Approval Wait Gates
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-0.5">
            Differentiates instant developer console actions from external human review queues and uncommitted vendor turnaround windows.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-lg border border-white/[0.08] bg-black/40 text-center">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">
              Immediate Steps
            </span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {totalImmediateSteps}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-lg border border-white/[0.08] bg-black/40 text-center">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">
              Wait Gates
            </span>
            <span className="text-base font-bold text-amber-400 font-mono">
              {totalWaitSteps}
            </span>
          </div>
        </div>
      </div>

      {/* Sequential Timeline Flow */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/[0.08]">
        {timelineItems.map((item) => {
          const isImmediate = item.kind === "immediate";
          const isUnknown = item.kind === "unknown_wait";

          return (
            <div key={item.id} className="relative group">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                  isImmediate
                    ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-400"
                    : isUnknown
                    ? "bg-slate-900 border-slate-600 text-slate-400"
                    : "bg-amber-950/80 border-amber-500/50 text-amber-400"
                }`}
              >
                {isImmediate ? (
                  <Zap className="w-3 h-3" />
                ) : isUnknown ? (
                  <HelpCircle className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
              </div>

              {/* Timeline Step Content Card */}
              <div
                className={`p-4 sm:p-5 rounded-xl border transition-colors ${
                  isImmediate
                    ? "border-white/[0.08] bg-white/[0.01] hover:border-white/[0.16]"
                    : isUnknown
                    ? "border-slate-700/60 bg-slate-900/30 hover:border-slate-600"
                    : "border-amber-500/20 bg-amber-950/10 hover:border-amber-500/30"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                      Step {String(item.order).padStart(2, "0")}
                    </span>
                    <span className="text-slate-600">•</span>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {isImmediate ? (
                      <Badge variant="success" size="sm">
                        ⚡ {item.durationLabel}
                      </Badge>
                    ) : isUnknown ? (
                      <Badge variant="neutral" size="sm">
                        ⏳ {item.durationLabel}
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        ⏳ {item.durationLabel}
                      </Badge>
                    )}

                    <Badge variant="neutral" size="sm">
                      {item.actor === "agent" ? (
                        <span className="flex items-center gap-1">
                          <Bot className="w-3 h-3" /> Agent
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> Human
                        </span>
                      )}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {item.detail}
                </p>

                {item.quote && (
                  <div className="mt-3 pt-2.5 border-t border-white/[0.04]">
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      Official Source Quote:
                    </span>
                    <blockquote className="text-[11px] font-mono text-slate-400 italic bg-black/40 p-2.5 rounded border border-white/[0.04]">
                      &ldquo;{item.quote}&rdquo;
                    </blockquote>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
