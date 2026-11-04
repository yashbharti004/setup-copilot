"use client";

import React from "react";
import { Guide, SetupStep } from "@/lib/schema/guide";
import { Check, ExternalLink, ArrowRight, Sparkles, CheckCircle2, User, Bot, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface StartHerePanelProps {
  guide: Guide;
  completedStepOrders: number[];
  onToggleStep: (stepNumber: number) => void;
}

export function StartHerePanel({
  guide,
  completedStepOrders,
  onToggleStep,
}: StartHerePanelProps) {
  const steps: SetupStep[] = guide.path || [];
  const totalSteps = steps.length;
  const completedCount = steps.filter((s) => completedStepOrders.includes(s.step_number)).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  // Find the first uncompleted step (the true "Next Action")
  const nextStep = steps.find((s) => !completedStepOrders.includes(s.step_number)) || steps[0];
  const isAllComplete = totalSteps > 0 && completedCount === totalSteps;

  const consoleUrl =
    nextStep?.source_url ||
    (nextStep?.source && nextStep.source.startsWith("http") ? nextStep.source : guide.app.docs_url);

  const isNextAgent = nextStep ? nextStep.who === "agent" : false;
  const isNextAssisted = nextStep ? nextStep.who === "agent_assisted" : false;

  return (
    <Card className="border border-white/[0.12] bg-[#090b12] p-6 sm:p-8 space-y-6">
      {/* Header & Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              Start Here // Interactive Action Plan
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Setup Checklist for {guide.app.name}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-white block">
              {completedCount} of {totalSteps} Steps Complete
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {progressPercent}% configured
            </span>
          </div>
          <div className="w-24 h-2 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Immediate Next Action Spotlight Card */}
      {!isAllComplete && nextStep && (
        <div className="rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-950/20 via-[#0c1220] to-[#0c101c] p-5 sm:p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs text-sky-400 font-bold uppercase">
              <span>NEXT IMMEDIATE ACTION</span>
              <span className="text-slate-500">•</span>
              <span>STEP {String(nextStep.step_number).padStart(2, "0")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isNextAgent ? "info" : isNextAssisted ? "warning" : "success"} size="sm">
                {isNextAgent ? (
                  <span className="flex items-center gap-1">
                    <Bot className="w-3 h-3" /> Agent Automatable
                  </span>
                ) : isNextAssisted ? (
                  <span className="flex items-center gap-1">
                    <Bot className="w-3 h-3" /> Agent Assisted
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> Human Portal Action
                  </span>
                )}
              </Badge>
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {nextStep.action}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {nextStep.detail}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-mono text-xs font-bold transition shadow-sm active:translate-y-px"
            >
              <span>Open Console Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStep(nextStep.step_number)}
              className="font-mono text-xs gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark Step {nextStep.step_number} Complete</span>
            </Button>
          </div>
        </div>
      )}

      {/* Completion Banner */}
      {isAllComplete && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-5 flex items-center gap-3.5 text-emerald-300">
          <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold font-mono">
              All Setup Steps Completed!
            </h3>
            <p className="text-xs text-slate-300 font-sans">
              You have verified and checked off all configuration gates for {guide.app.name}. Your OAuth client credentials can now be integrated into your agent environment.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Step-by-Step Checkboxes */}
      <div className="space-y-2 pt-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-3">
          // All Configuration Steps ({completedCount}/{totalSteps})
        </span>

        <div className="divide-y divide-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden bg-black/40">
          {steps.map((step) => {
            const isDone = completedStepOrders.includes(step.step_number);
            const isStepAgent = step.who === "agent";
            const isStepAssisted = step.who === "agent_assisted";

            return (
              <div
                key={step.step_number}
                onClick={() => onToggleStep(step.step_number)}
                className={`p-4 flex items-start gap-3.5 cursor-pointer transition-colors ${
                  isDone
                    ? "bg-white/[0.01] hover:bg-white/[0.03]"
                    : "hover:bg-white/[0.04]"
                }`}
              >
                {/* Custom Accessible Checkbox */}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isDone}
                  aria-label={`Mark step ${step.step_number} as ${isDone ? "incomplete" : "complete"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStep(step.step_number);
                  }}
                  className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                    isDone
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-white/20 bg-black/50 hover:border-white/40"
                  }`}
                >
                  {isDone && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                </button>

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`text-xs sm:text-sm font-bold tracking-tight transition-colors ${
                        isDone ? "text-slate-500 line-through" : "text-white"
                      }`}
                    >
                      Step {step.step_number}: {step.action}
                    </span>

                    <div className="flex items-center gap-2">
                      <Badge variant={isStepAgent ? "info" : isStepAssisted ? "warning" : "neutral"} size="sm">
                        {isStepAgent ? "Agent" : isStepAssisted ? "Assisted" : "Human"}
                      </Badge>
                    </div>
                  </div>

                  <p
                    className={`text-xs leading-relaxed font-sans transition-colors ${
                      isDone ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
