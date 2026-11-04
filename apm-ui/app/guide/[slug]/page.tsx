"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Guide, SetupStep, FactItem } from "@/lib/schema/guide";
import { getGuideBySlug } from "@/lib/data/guides";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { ComposioManagedBanner } from "@/components/ComposioManagedBanner";
import { AgentLiveTimeline } from "@/components/AgentLiveTimeline";
import { PipelineProgressEvent } from "@/lib/agent/types";
import { parseSSEBuffer } from "@/lib/utils";
import {
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Copy,
  Download,
  Share2,
  Check,
  User,
  Bot,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  FileText,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Banner } from "@/components/ui/Banner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";

const CANONICAL_FACT_SPECS: Array<{ key: string; label: string; kind: "bool" | "number" }> = [
  { key: "has_public_oauth_registration", label: "Public OAuth Registration", kind: "bool" },
  { key: "review_required_for_distribution", label: "App Review for Production", kind: "bool" },
  { key: "review_wait_days_min", label: "Min Review Wait (Days)", kind: "number" },
  { key: "review_wait_days_max", label: "Max Review Wait (Days)", kind: "number" },
  { key: "requires_paid_plan", label: "Paid Subscription Required", kind: "bool" },
  { key: "requires_security_audit", label: "Third-Party Security Audit (e.g. CASA)", kind: "bool" },
  { key: "requires_video_demo", label: "Video Screencast Required", kind: "bool" },
  { key: "requires_domain_verification", label: "Domain Verification (Search Console)", kind: "bool" },
  { key: "requires_business_verification", label: "Business Entity Verification", kind: "bool" },
  { key: "uses_restricted_scopes", label: "Uses Restricted / Sensitive Scopes", kind: "bool" },
];

export default function GuideDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const initialGuide = slug ? getGuideBySlug(slug) : null;
  const [guide, setGuide] = useState<Guide | null>(initialGuide || null);
  const [loading, setLoading] = useState(!initialGuide);

  // Re-run state
  const [isReRunning, setIsReRunning] = useState(false);
  const [reRunEvents, setReRunEvents] = useState<PipelineProgressEvent[]>([]);

  // Expanded quotes state
  const [expandedQuotes, setExpandedQuotes] = useState<Record<number, boolean>>({});

  // Active tab
  const [activeTab, setActiveTab] = useState<
    "summary" | "steps" | "blockers" | "facts" | "sources" | "rubric"
  >("summary");

  // Copy / Download state
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const local = getGuideBySlug(slug);
    if (local) {
      setGuide(local);
      setLoading(false);
    }

    fetch(`/api/guides/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.app) {
          setGuide(data);
          setLoading(false);
        } else if (!local) {
          handleReRun(slug);
        }
      })
      .catch(() => {
        if (!local) {
          handleReRun(slug);
        }
      });
  }, [slug]);

  const handleReRun = async (targetSlug?: string) => {
    const s = targetSlug || slug;
    setIsReRunning(true);
    setReRunEvents([]);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: s }),
      });

      if (!response.body) throw new Error("No stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = parseSSEBuffer<PipelineProgressEvent>(buffer, (event) => {
          setReRunEvents((prev) => [...prev, event]);
          if (event.step === "complete" && event.guide) {
            setGuide(event.guide);
            setLoading(false);
          }
        });
      }
    } catch {
      setLoading(false);
    } finally {
      setIsReRunning(false);
    }
  };

  const toggleQuote = (stepIdx: number) => {
    setExpandedQuotes((prev) => ({
      ...prev,
      [stepIdx]: !prev[stepIdx],
    }));
  };

  const handleCopyMarkdown = () => {
    if (!guide) return;
    const md = `# OAuth Setup Guide: ${guide.app.name}
**Difficulty Score**: ${guide.difficulty_score}/100 (${guide.difficulty})
**Active Effort**: ${guide.time_estimate.setup_active_effort}
**Approval Wait**: ${guide.time_estimate.approval_wait || "Not stated in sources"}
**Official Documentation**: ${guide.app.docs_url}

## Executive Summary
${guide.summary}

## Setup Steps
${guide.path
  .map(
    (s) => `### Step ${s.step_number}: ${s.action} (${s.who === "agent" ? "Agent" : "Human"})
${s.detail}
Source: ${s.source}${s.quote ? `\n> "${s.quote}"` : ""}`
  )
  .join("\n\n")}

## Known Blockers & Failure Modes
${guide.blockers_and_fixes
  .map(
    (b) => `### Issue: ${b.symptom}
- **Cause**: ${b.cause}
- **Resolution**: ${b.fix}`
  )
  .join("\n\n")}

## Verified Facts & Sources
${(guide.facts || [])
  .map((f) => `- **${f.key}**: ${String(f.value)} [${f.evidence}]`)
  .join("\n")}
`;

    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleDownloadJSON = () => {
    if (!guide) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(guide, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${guide.app.slug}-dossier.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyPermalink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading && !guide) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 font-mono">
        <Card className="text-center p-8 space-y-3">
          <div className="text-xs text-sky-400 font-bold animate-pulse">
            // TELEMETRY: AUDITING PROVIDER PORTAL
          </div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            Compiling Dossier: {slug}
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
            Parsing documentation, extracting OAuth requirements, and running deterministic scoring...
          </p>
        </Card>

        {reRunEvents.length > 0 && (
          <div className="mt-6">
            <AgentLiveTimeline events={reRunEvents} isStreaming={isReRunning} />
          </div>
        )}
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-4 font-mono">
        <AlertOctagon className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-white uppercase mb-1">Dossier Not Found</h2>
        <p className="text-xs text-slate-400 mb-5 font-sans">
          Could not locate or compile an audit record for &quot;{slug}&quot;.
        </p>
        <Button variant="primary" size="md" onClick={() => handleReRun()}>
          Run Live Pipeline
        </Button>
      </div>
    );
  }

  const isLower = Boolean(guide.difficulty_meta?.lower_bound);
  const isUnknown = guide.difficulty === "UNKNOWN";
  const verifiedFactsMap = new Map<string, FactItem>();
  for (const f of guide.facts || []) {
    verifiedFactsMap.set(f.key, f);
  }

  const verifiedCount = (guide.facts || []).filter((f) => f.evidence !== "UNKNOWN").length;

  return (
    <div className="bg-[#050507] text-slate-100 min-h-screen">
      {/* 1. TOP METADATA & BREADCRUMB STRIP */}
      <div className="border-b border-white/[0.08] bg-[#0c0d14] py-2 px-4 sm:px-6 lg:px-8 text-[11px] font-mono flex flex-wrap items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-slate-300 hover:text-white transition flex items-center gap-1 font-bold"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>// COPILOT</span>
          </Link>
          <span className="text-slate-600">/</span>
          <Link href="/library" className="text-slate-400 hover:text-white transition">
            DIRECTORY
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-white uppercase font-bold">{guide.app.slug}</span>
        </div>

        <div className="flex items-center gap-4">
          <span>
            VERIFIED_DATE: <strong className="text-slate-200">{guide.last_verified}</strong>
          </span>
          <span className="text-slate-600">|</span>
          <button
            onClick={() => handleReRun()}
            disabled={isReRunning}
            className="text-sky-400 hover:text-sky-300 transition flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isReRunning ? "animate-spin" : ""}`} />
            <span>[RE_AUDIT]</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Re-run Timeline if active */}
        {isReRunning && (
          <div>
            <AgentLiveTimeline events={reRunEvents} isStreaming={isReRunning} />
          </div>
        )}

        {/* Warning Banner if No Official Documentation Was Read */}
        {!guide.has_official_source && (
          <Banner variant="warning" title="No Official Documentation Read">
            This dossier was compiled from third-party posts, forums, or community reports. No official vendor documentation was accessible. Do not treat this profile as a verified blueprint.
          </Banner>
        )}

        {/* Composio Managed Alternative Advisory */}
        {guide.app.in_composio_managed && (
          <ComposioManagedBanner
            appName={guide.app.name}
            inManaged={guide.app.in_composio_managed}
            alternativeNote={guide.app.managed_alternative_note}
            toolUrl={guide.app.composio_tool_url}
            whenToByoc={guide.app.when_to_byoc}
          />
        )}

        {/* 2. DOSSIER HEADER CARD */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black border border-white/[0.1] rounded-xl p-2 flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={guide.app.logo}
                  alt={guide.app.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
                    {guide.app.name}
                  </h1>
                  <DifficultyBadge
                    difficulty={guide.difficulty}
                    score={guide.difficulty_score}
                    lowerBound={isLower}
                    size="lg"
                  />
                  {guide.has_official_source ? (
                    <Badge variant="success" size="sm">
                      Official Source
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      Unofficial
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                  <span>CATEGORY: {guide.app.category.toUpperCase()}</span>
                  <span className="text-slate-600">|</span>
                  <a
                    href={guide.app.docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>OFFICIAL PORTAL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Actions: Export Markdown / Download JSON / Share Permalink */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleCopyMarkdown}>
                {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMarkdown ? "Copied MD!" : "Copy Markdown"}</span>
              </Button>

              <Button variant="outline" size="sm" onClick={handleDownloadJSON}>
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </Button>

              <Button variant="outline" size="sm" onClick={handleCopyPermalink}>
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Link Copied!" : "Permalink"}</span>
              </Button>
            </div>
          </div>

          {/* Operational Ledger (4 Key Stats) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] border border-white/[0.08] rounded-xl bg-black/40 text-xs font-mono">
            <div className="p-4 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Active Effort</span>
              <div className="text-lg sm:text-xl font-bold text-white tabular-nums">
                {guide.time_estimate.setup_active_effort}
              </div>
              <span className="text-[10px] text-slate-500 block font-sans">Configuration &amp; code</span>
            </div>

            <div className="p-4 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Typical Wait</span>
              <div className="text-sm sm:text-base font-bold text-slate-200">
                {guide.time_estimate.approval_wait || "Not stated in sources"}
              </div>
              <span className="text-[10px] text-slate-500 block font-sans">
                Dev: {guide.time_estimate.dev_wait_claim?.split("(")[0] || "Instant"}
              </span>
            </div>

            <div className="p-4 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Review Gate</span>
              <div className="text-sm sm:text-base font-bold">
                {guide.approval.required ? (
                  <span className="text-amber-400">Mandatory App Review</span>
                ) : (
                  <span className="text-emerald-400">Self-Serve (No Review)</span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 block font-sans truncate">
                {guide.approval.required ? "Directory audit required" : "Immediate client credentials"}
              </span>
            </div>

            <div className="p-4 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Known Blockers</span>
              <div className="text-lg sm:text-xl font-bold text-rose-400 tabular-nums">
                {guide.blockers_and_fixes.length} Documented
              </div>
              <span className="text-[10px] text-slate-500 block font-sans">
                Resolution runbook attached
              </span>
            </div>
          </div>
        </Card>

        {/* 3. SEGMENTED SECTION TABS */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="summary">Summary &amp; Verdict</TabsTrigger>
              <TabsTrigger value="steps">Setup Steps ({guide.path.length})</TabsTrigger>
              <TabsTrigger value="blockers">Blockers &amp; Fixes ({guide.blockers_and_fixes.length})</TabsTrigger>
              <TabsTrigger value="facts">10 Facts Audit ({verifiedCount}/10)</TabsTrigger>
              <TabsTrigger value="sources">Sources &amp; Quotes ({guide.sources?.length || guide.evidence.length})</TabsTrigger>
              <TabsTrigger value="rubric">Deterministic Rubric ({guide.difficulty_score}/100)</TabsTrigger>
            </TabsList>

            {/* TAB 1: SUMMARY */}
            <TabsContent value="summary">
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    // Executive Audit Verdict
                  </h3>
                  <div className="p-4 rounded-xl border border-white/[0.08] bg-black/60 text-slate-200 text-sm font-sans leading-relaxed">
                    &ldquo;{guide.summary}&rdquo;
                  </div>
                </div>

                {/* Prerequisites */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    // Mandatory Prerequisites:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-sans">
                    {guide.prerequisites.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-white/[0.06] bg-black/40 text-slate-300 text-xs flex items-start gap-2"
                      >
                        <span className="font-mono text-emerald-400 font-bold select-none">[✓]</span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What to do next */}
                <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    // Recommended Action Runbook:
                  </h3>
                  <div className="space-y-1.5 font-sans text-xs text-slate-300">
                    {guide.what_to_do_next.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-sky-400 font-mono font-bold">{idx + 1}.</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 2: STEPS (WITH HUMAN/AGENT ICONS & EXPANDABLE SOURCE QUOTE) */}
            <TabsContent value="steps">
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <h3 className="text-sm font-mono font-bold text-white uppercase">
                    Setup Execution Path ({guide.path.length} Steps)
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5 text-sky-400" />
                      <span>Agent Automated</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Human Required</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {guide.path.map((step, idx) => {
                    const isAgent = step.who === "agent";
                    const isAssisted = step.who === "agent_assisted";
                    const isExpanded = Boolean(expandedQuotes[idx]);

                    return (
                      <div
                        key={step.step_number || idx}
                        className="p-4 rounded-xl border border-white/[0.08] bg-black/40 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                isAgent
                                  ? "bg-sky-950/40 border-sky-500/40 text-sky-400"
                                  : isAssisted
                                  ? "bg-indigo-950/40 border-indigo-500/40 text-indigo-400"
                                  : "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                              }`}
                            >
                              {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-400">
                                  Step {step.step_number}:
                                </span>
                                <span className="text-sm font-semibold text-white font-sans">
                                  {step.action}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
                                {step.detail}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <ConfidenceChip status={step.confidence} size="sm" />
                          </div>
                        </div>

                        {/* Expandable Source Quote */}
                        <div className="pt-2 border-t border-white/[0.06] text-xs font-mono">
                          <div className="flex items-center justify-between">
                            <a
                              href={step.source_url || step.source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px] truncate max-w-md"
                            >
                              <span>Source: {step.source}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            {step.quote && (
                              <button
                                onClick={() => toggleQuote(idx)}
                                className="text-sky-400 hover:text-sky-300 transition flex items-center gap-1 text-[11px]"
                              >
                                <span>{isExpanded ? "Hide Quote" : "Expand Quote"}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>

                          {isExpanded && step.quote && (
                            <blockquote className="mt-2 p-3 rounded-lg bg-sky-950/20 border border-sky-500/30 text-slate-300 font-sans text-xs italic leading-relaxed">
                              &ldquo;{step.quote}&rdquo;
                            </blockquote>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>

            {/* TAB 3: BLOCKERS */}
            <TabsContent value="blockers">
              <Card className="p-6 space-y-4">
                <h3 className="text-sm font-mono font-bold text-white uppercase pb-2 border-b border-white/[0.08]">
                  Incident Runbook &amp; Failure Modes ({guide.blockers_and_fixes.length})
                </h3>

                <div className="space-y-4">
                  {guide.blockers_and_fixes.map((blocker, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/10 space-y-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono text-[10px] text-rose-400 uppercase font-bold block">
                            Symptom:
                          </span>
                          <span className="font-semibold text-white text-sm font-sans">
                            {blocker.symptom}
                          </span>
                        </div>
                      </div>

                      <div className="pl-6 space-y-2 font-sans">
                        <div>
                          <span className="font-mono text-[10px] text-slate-400 uppercase block font-bold">
                            Root Cause:
                          </span>
                          <p className="text-slate-300 leading-relaxed">{blocker.cause}</p>
                        </div>

                        <div>
                          <span className="font-mono text-[10px] text-emerald-400 uppercase block font-bold">
                            Resolution Action:
                          </span>
                          <p className="text-slate-200 font-medium leading-relaxed">{blocker.fix}</p>
                        </div>

                        {blocker.escalation_template && (
                          <div className="mt-2 pt-2 border-t border-white/[0.06]">
                            <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                              Support Escalation Template:
                            </span>
                            <pre className="p-2.5 rounded bg-black/60 border border-white/[0.08] text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                              {blocker.escalation_template}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* TAB 4: 10 FACTS AUDIT (FOUND VS UNKNOWN) */}
            <TabsContent value="facts">
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div>
                    <h3 className="text-sm font-mono font-bold text-white uppercase">
                      10 Canonical OAuth Fact Verification
                    </h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      Deterministic audit against the 10 gating specifications.
                    </p>
                  </div>
                  <Badge variant={verifiedCount === 10 ? "success" : "warning"} size="md">
                    {verifiedCount} of 10 Verified
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fact Key &amp; Description</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Evidence Level</TableHead>
                        <TableHead>Verified Quote</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {CANONICAL_FACT_SPECS.map((spec) => {
                        const fact = verifiedFactsMap.get(spec.key);
                        const isFound = Boolean(fact && fact.evidence !== "UNKNOWN");

                        return (
                          <TableRow key={spec.key}>
                            <TableCell className="font-mono">
                              <div className="font-bold text-white">{spec.label}</div>
                              <div className="text-[10px] text-slate-500">{spec.key}</div>
                            </TableCell>

                            <TableCell className="font-mono font-bold">
                              {isFound ? (
                                fact?.value === true ? (
                                  <span className="text-emerald-400">TRUE</span>
                                ) : fact?.value === false ? (
                                  <span className="text-slate-400">FALSE</span>
                                ) : (
                                  <span className="text-white">{String(fact?.value)}</span>
                                )
                              ) : (
                                <span className="text-slate-500 italic">Not stated in sources</span>
                              )}
                            </TableCell>

                            <TableCell>
                              {isFound ? (
                                <Badge
                                  variant={
                                    fact?.evidence === "VERIFIED"
                                      ? "success"
                                      : fact?.evidence === "DOCS"
                                      ? "info"
                                      : "warning"
                                  }
                                  size="sm"
                                >
                                  {fact?.evidence}
                                </Badge>
                              ) : (
                                <Badge variant="neutral" size="sm">
                                  UNKNOWN
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="font-sans text-xs text-slate-300 max-w-md">
                              {fact?.quote ? (
                                <span className="italic">&ldquo;{fact.quote}&rdquo;</span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 5: SOURCES & QUOTES */}
            <TabsContent value="sources">
              <Card className="p-6 space-y-4">
                <h3 className="text-sm font-mono font-bold text-white uppercase pb-2 border-b border-white/[0.08]">
                  Retrieved Documentation Sources ({guide.sources?.length || guide.evidence.length})
                </h3>

                <div className="space-y-3">
                  {(guide.sources && guide.sources.length > 0
                    ? guide.sources
                    : guide.evidence.map((e) => ({
                        id: e.id,
                        url: e.source_url,
                        title: e.claim,
                        official: e.status === "verified" || e.status === "sourced",
                        via: "fetch" as const,
                        cited: true,
                      }))
                  ).map((source) => (
                    <div
                      key={source.id}
                      className="p-3.5 rounded-xl border border-white/[0.08] bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm font-sans">
                            {source.title}
                          </span>
                          {source.official ? (
                            <Badge variant="success" size="sm">
                              Official
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">
                              Third-Party
                            </Badge>
                          )}
                          {source.cited && (
                            <Badge variant="outline" size="sm">
                              Cited in Audit
                            </Badge>
                          )}
                        </div>

                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span className="truncate max-w-lg">{source.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>

                      <div className="text-[11px] font-mono text-slate-500 shrink-0">
                        Via: {source.via || "fetch"}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* TAB 6: DETERMINISTIC RUBRIC */}
            <TabsContent value="rubric">
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-mono font-bold text-white uppercase pb-2 border-b border-white/[0.08]">
                    Deterministic Scoring Equation ({guide.difficulty_score}/100)
                  </h3>
                  <p className="text-xs text-slate-400 font-sans mt-2">
                    Scores are computed strictly in code from verified boolean and numeric facts. Tiers map deterministically: Easy (0–24), Moderate (25–59), Hard (60–84), Gated (85+).
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                    Points Breakdown:
                  </span>
                  <div className="space-y-1.5 font-mono text-xs">
                    {guide.difficulty_factors.map((factor, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-white/[0.06] bg-black/40 text-slate-300 flex items-center justify-between"
                      >
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isLower && (
                  <Banner variant="warning" title="Partial Scoring Bound">
                    Because some scoring inputs were unknown, this score represents a strict lower bound. The actual friction may be higher if gating policies exist.
                  </Banner>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
