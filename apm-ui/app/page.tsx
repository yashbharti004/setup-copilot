"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CopilotWorkbench } from "@/components/CopilotWorkbench";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { ALL_GUIDES } from "@/lib/data/guides";
import { DifficultyLevel } from "@/lib/schema/guide";
import {
  ArrowRight,
  ArrowUpDown,
  Search,
  CheckCircle2,
  ExternalLink,
  Shield,
  Zap,
  Terminal,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tier filter synced with URL query params
  const currentTierParam = searchParams?.get("tier") || "all";
  const [filterDifficulty, setFilterDifficulty] = useState<string>(currentTierParam);

  // Sorting
  const [sortField, setSortField] = useState<"name" | "score" | "category">("score");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Backend telemetry status
  const [backendStatus, setBackendStatus] = useState<{
    connected: boolean;
    model?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setBackendStatus({
          connected: Boolean(data.backend_connected),
          model: data.backend_health?.model || data.backend?.model || "gemini-3.8-flash",
        });
      })
      .catch(() => setBackendStatus({ connected: false }));
  }, []);

  const handleTierFilterChange = (tier: string) => {
    setFilterDifficulty(tier);
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (tier === "all") {
      params.delete("tier");
    } else {
      params.set("tier", tier);
    }
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const handleSort = (field: "name" | "score" | "category") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredAndSortedGuides = useMemo(() => {
    let list = ALL_GUIDES.filter((guide) => {
      if (filterDifficulty === "all") return true;
      return guide.difficulty.toLowerCase() === filterDifficulty.toLowerCase();
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = a.app.name.localeCompare(b.app.name);
      } else if (sortField === "score") {
        cmp = a.difficulty_score - b.difficulty_score;
      } else if (sortField === "category") {
        cmp = a.app.category.localeCompare(b.app.category);
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [filterDifficulty, sortField, sortAsc]);

  return (
    <div className="bg-[#050507] text-slate-100 min-h-screen">
      {/* 1. TOP SYSTEM METADATA STRIP (INTERNAL STRINGS CONFINED HERE) */}
      <div className="border-b border-white/[0.08] bg-[#0c0d14] py-2 px-4 sm:px-6 lg:px-8 text-[11px] font-mono flex flex-wrap items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold tracking-wider">// SYSTEM: SETUP_COPILOT</span>
          <span className="text-slate-600">|</span>
          <span>ENGINE: DETERMINISTIC_RUBRIC</span>
          <span className="text-slate-600">|</span>
          {backendStatus ? (
            backendStatus.connected ? (
              <span className="text-emerald-400 font-bold">
                ● BACKEND: CONNECTED [{backendStatus.model}]
              </span>
            ) : (
              <span className="text-amber-400 font-bold">○ BACKEND: OFFLINE</span>
            )
          ) : (
            <span className="text-slate-500">BACKEND: CHECKING...</span>
          )}
        </div>
        <Link
          href="/evals"
          className="text-sky-400 hover:underline flex items-center gap-1 font-mono"
        >
          <span>EVALS: 17 OF 24 CLAIMS CONFIRMED (83.3% SAFE PASS RATE) →</span>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        {/* 2. HERO SECTION WITH H1, VALUE PROP, 3-STEP "HOW IT WORKS" & CTAS */}
        <section aria-labelledby="hero-heading" className="text-center max-w-4xl mx-auto mb-14 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-950/20 text-xs font-mono text-sky-400">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span>EVIDENCE-BASED OAUTH AUDIT &amp; INTEGRATION COPILOT</span>
          </div>

          <h1
            id="hero-heading"
            className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight font-sans"
          >
            OAuth &amp; Integration Setup Copilot for AI Agents
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 font-sans leading-relaxed max-w-2xl mx-auto">
            Know how hard an OAuth provider will be to configure, how long human approval takes, and automate the setup before you write integration code.
          </p>

          {/* 3-Step "How It Works" Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3 pb-2 text-left">
            <div className="p-4 rounded-xl border border-white/[0.08] bg-black/40 space-y-1.5">
              <div className="font-mono text-xs font-bold text-sky-400">01. QUERY PROVIDER</div>
              <h2 className="text-sm font-semibold text-white font-sans">Search or Audit Portal</h2>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Inspect official developer portals, documentation endpoints, and scope requirements.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-white/[0.08] bg-black/40 space-y-1.5">
              <div className="font-mono text-xs font-bold text-amber-400">02. AUDIT GATES</div>
              <h2 className="text-sm font-semibold text-white font-sans">Deterministic Scoring</h2>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Code-computed rubric measures review barriers, CASA audits, and wait days with 0–100 difficulty.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-white/[0.08] bg-black/40 space-y-1.5">
              <div className="font-mono text-xs font-bold text-emerald-400">03. EXPORT RUNBOOK</div>
              <h2 className="text-sm font-semibold text-white font-sans">Deploy Blueprint</h2>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Get exact setup steps, blocker fixes, and 1-click Composio managed connectors.
              </p>
            </div>
          </div>

          {/* Primary CTAs */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                const el = document.getElementById("workbench");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span>Launch Setup Copilot</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const el = document.getElementById("registry");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span>Browse Audited Directory</span>
            </Button>
          </div>
        </section>

        {/* 3. INTERACTIVE 3-COLUMN WORKBENCH */}
        <section id="workbench" aria-label="Interactive Copilot Workbench" className="scroll-mt-20">
          <CopilotWorkbench />
        </section>

        {/* 4. AUDITED INTEGRATION DIRECTORY & MATRIX */}
        <section id="registry" aria-labelledby="registry-heading" className="mb-14 scroll-mt-20">
          <Card className="overflow-hidden">
            {/* Header & Filter Controls */}
            <div className="px-5 py-4 border-b border-white/[0.08] bg-black/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 id="registry-heading" className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-400" />
                  <span>Audited Integration Matrix</span>
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Verified developer specifications, code-computed difficulty scores, and approval wait times.
                </p>
              </div>

              {/* Tier Filters Synced with URL */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" role="group" aria-label="Filter by difficulty tier">
                {[
                  { key: "all", label: "All" },
                  { key: "easy", label: "Easy (0–24)" },
                  { key: "moderate", label: "Moderate (25–59)" },
                  { key: "hard", label: "Hard (60–84)" },
                  { key: "gated", label: "Gated (85+)" },
                  { key: "unknown", label: "Unknown" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTierFilterChange(tab.key)}
                    className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors whitespace-nowrap select-none ${
                      filterDifficulty === tab.key
                        ? "bg-white text-black font-bold shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Table View (Hidden on mobile < md) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-1 hover:text-white transition"
                        title="Sort by Provider Name"
                      >
                        <span>Provider &amp; Portal</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("score")}
                        className="flex items-center gap-1 hover:text-white transition"
                        title="Sort by Difficulty Score"
                      >
                        <span>Difficulty Rubric</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </button>
                    </TableHead>
                    <TableHead>Active Effort</TableHead>
                    <TableHead>Approval Wait</TableHead>
                    <TableHead>Review Mode</TableHead>
                    <TableHead>Managed Auth</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedGuides.map((guide) => {
                    const isLower = Boolean(guide.difficulty_meta?.lower_bound);
                    return (
                      <TableRow
                        key={guide.app.slug}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            router.push(`/guide/${guide.app.slug}`);
                          }
                        }}
                        onClick={() => router.push(`/guide/${guide.app.slug}`)}
                        className="cursor-pointer group"
                      >
                        <TableCell className="font-medium text-white">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-bold group-hover:text-sky-300 transition-colors">
                                {guide.app.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-sans">
                                {guide.app.category}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <DifficultyBadge
                            difficulty={guide.difficulty}
                            score={guide.difficulty_score}
                            lowerBound={isLower}
                            size="sm"
                          />
                        </TableCell>

                        <TableCell className="text-slate-300 font-mono text-xs">
                          {guide.time_estimate.setup_active_effort}
                        </TableCell>

                        <TableCell className="font-mono text-xs text-slate-200">
                          {guide.time_estimate.approval_wait || "Not stated in sources"}
                        </TableCell>

                        <TableCell>
                          {guide.approval.required ? (
                            <Badge variant="warning" size="sm">
                              Review Req
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              Instant Dev
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          {guide.app.in_composio_managed ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-sky-400 font-mono text-[11px] font-bold">
                                1-Click Available
                              </span>
                              {guide.app.composio_tool_url && (
                                <a
                                  href={guide.app.composio_tool_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-slate-400 hover:text-white transition"
                                  title="View on Composio"
                                  aria-label={`View ${guide.app.name} on Composio`}
                                >
                                  ↗
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">
                              BYOC Only
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-white font-mono text-xs font-bold transition">
                            <span>Open</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card Layout (Shown on mobile < md) */}
            <div className="md:hidden divide-y divide-white/[0.08]">
              {filteredAndSortedGuides.map((guide) => {
                const isLower = Boolean(guide.difficulty_meta?.lower_bound);
                return (
                  <div
                    key={guide.app.slug}
                    onClick={() => router.push(`/guide/${guide.app.slug}`)}
                    className="p-4 space-y-3 active:bg-white/[0.04] transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-sm">{guide.app.name}</div>
                        <div className="text-[11px] text-slate-400">{guide.app.category}</div>
                      </div>
                      <DifficultyBadge
                        difficulty={guide.difficulty}
                        score={guide.difficulty_score}
                        lowerBound={isLower}
                        size="sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Effort</span>
                        <span className="text-slate-200">{guide.time_estimate.setup_active_effort}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Wait</span>
                        <span className="text-slate-200 truncate block">
                          {guide.time_estimate.approval_wait || "Not stated in sources"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] text-xs">
                      {guide.approval.required ? (
                        <Badge variant="warning" size="sm">
                          Review Required
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm">
                          Instant Dev
                        </Badge>
                      )}
                      <span className="text-sky-400 font-mono text-xs flex items-center gap-1 font-bold">
                        <span>View Dossier</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#050507] text-slate-100 min-h-screen p-8 text-center font-mono">
          Loading Setup Copilot...
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
