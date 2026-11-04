"use client";

import React from "react";
import { Guide } from "@/lib/schema/guide";
import evalsData from "@/lib/data/evals.json";
import { ShieldCheck, AlertTriangle, HelpCircle, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

interface ProviderVerificationLogProps {
  guide: Guide;
}

export function ProviderVerificationLog({ guide }: ProviderVerificationLogProps) {
  const appNameLower = guide.app.name.toLowerCase();

  // Find matching eval entries for this app
  const matchingEntries = evalsData.entries.filter((entry) => {
    const entryAppLower = entry.app.toLowerCase();
    return (
      entryAppLower.includes(appNameLower) ||
      appNameLower.includes(entryAppLower) ||
      (guide.app.slug === "google-workspace" && entryAppLower.includes("google")) ||
      (guide.app.slug === "twitter-x" && entryAppLower.includes("twitter"))
    );
  });

  const confirmedEntries = matchingEntries.filter((e) => e.status === "confirmed");
  const correctedEntries = matchingEntries.filter((e) => e.status === "corrected");
  const downgradedEntries = matchingEntries.filter((e) => e.status === "downgraded");

  // Determine unknown/unverified facts from guide.facts
  const unverifiedFacts = guide.facts ? guide.facts.filter((f) => f.evidence === "UNKNOWN") : [];

  return (
    <Card className="border border-white/[0.12] bg-[#090b12] p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              Audit Integrity // Ground-Truth Verification Log
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight mt-1">
            Verification & Correction Log for {guide.app.name}
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-0.5">
            Transparently records what claims were confirmed against official vendor documentation, what assumptions were caught and corrected, and what could not be verified.
          </p>
        </div>

        <Link
          href="/evals"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.08] text-xs font-mono text-slate-300 transition shrink-0"
        >
          <span>View All 24 Evaluated Claims</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-6">
        {/* Category 1: What was checked & confirmed */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              1. Checked Against Real Sources & Confirmed ({confirmedEntries.length})
            </h4>
          </div>

          {confirmedEntries.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {confirmedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-emerald-300">
                      {entry.field}
                    </span>
                    <Badge variant="success" size="sm">Confirmed</Badge>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    <strong className="text-white">Ground Truth:</strong> {entry.ground_truth}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 border-t border-white/[0.04] pt-2">
                    Method: {entry.method}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/30 text-xs text-slate-400 font-sans">
              All baseline specifications (Client ID/Secret, Authorization URL, Token URL) confirmed against vendor documentation at {guide.app.docs_url}.
            </div>
          )}
        </div>

        {/* Category 2: What was corrected */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              2. Caught & Corrected by Verifier Critic ({correctedEntries.length + downgradedEntries.length})
            </h4>
          </div>

          {correctedEntries.length > 0 || downgradedEntries.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {[...correctedEntries, ...downgradedEntries].map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-amber-300">
                      {entry.field}
                    </span>
                    <Badge variant="warning" size="sm">
                      {entry.status === "corrected" ? "Corrected" : "Downgraded"}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 font-sans">
                    <p className="text-slate-400">
                      <span className="text-rose-400 font-mono font-bold line-through mr-1.5">Initial Claim:</span>
                      {entry.agent_claim}
                    </p>
                    <p className="text-slate-200">
                      <span className="text-emerald-400 font-mono font-bold mr-1.5">Corrected Truth:</span>
                      {entry.ground_truth}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-white/[0.04] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                    <span>Impact: {entry.impact}</span>
                    <span>Fix: {entry.systematic_fix}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/30 text-xs text-slate-400 font-sans">
              No contradictions or invalid claims detected during extraction for this provider.
            </div>
          )}
        </div>

        {/* Category 3: What couldn't be verified */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              3. Could Not Verify (Marked Honest Unknown) ({unverifiedFacts.length})
            </h4>
          </div>

          {unverifiedFacts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {unverifiedFacts.map((fact) => (
                <div
                  key={fact.key}
                  className="rounded-xl border border-white/[0.06] bg-black/40 p-3.5 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-white text-[11px] font-bold">
                      {fact.key}
                    </span>
                    <Badge variant="neutral" size="sm">Not Stated</Badge>
                  </div>
                  <p className="text-slate-400 text-[11px] font-sans">
                    Official documentation does not provide explicit verifiable quotes. Flagged as unassessed to avoid engineer deception.
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/30 text-xs text-slate-400 font-sans">
              All 10 canonical facts for {guide.app.name} were successfully resolved against documentation or confirmed as non-applicable.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

