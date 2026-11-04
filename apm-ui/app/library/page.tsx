"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Guide } from "@/lib/schema/guide";
import { getAllGuides } from "@/lib/data/guides";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { Search, ArrowRight, ArrowLeft, ArrowUpDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";

function LibraryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [guides, setGuides] = useState<Guide[]>(() => getAllGuides());
  const [search, setSearch] = useState("");

  const currentTierParam = searchParams?.get("tier") || "all";
  const [difficultyFilter, setDifficultyFilter] = useState(currentTierParam);
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [managedFilter, setManagedFilter] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<"name" | "score" | "category">("name");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/guides")
      .then((res) => res.json())
      .then((data) => {
        if (data.guides && Array.isArray(data.guides) && data.guides.length > 0) {
          setGuides(data.guides);
        }
      })
      .catch(() => {});
  }, []);

  const handleTierChange = (val: string) => {
    setDifficultyFilter(val);
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (val === "all") {
      params.delete("tier");
    } else {
      params.set("tier", val);
    }
    router.push(`/library?${params.toString()}`, { scroll: false });
  };

  const handleSort = (field: "name" | "score" | "category") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let list = guides.filter((g) => {
      const matchesSearch =
        g.app.name.toLowerCase().includes(search.toLowerCase()) ||
        g.summary.toLowerCase().includes(search.toLowerCase()) ||
        g.app.category.toLowerCase().includes(search.toLowerCase());

      const matchesDiff =
        difficultyFilter === "all" ||
        g.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

      const matchesApproval =
        approvalFilter === "all" ||
        (approvalFilter === "required" && g.approval.required) ||
        (approvalFilter === "none" && !g.approval.required);

      const matchesManaged = !managedFilter || g.app.in_composio_managed;

      return matchesSearch && matchesDiff && matchesApproval && matchesManaged;
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
  }, [guides, search, difficultyFilter, approvalFilter, managedFilter, sortField, sortAsc]);

  return (
    <div className="bg-[#050507] text-slate-100 min-h-screen">
      {/* Top Metadata Strip */}
      <div className="border-b border-white/[0.08] bg-[#0c0d14] py-2 px-4 sm:px-6 lg:px-8 text-[11px] font-mono flex flex-wrap items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-300 hover:text-white transition flex items-center gap-1 font-bold">
            <ArrowLeft className="w-3 h-3" />
            <span>// COPILOT_HOME</span>
          </Link>
          <span className="text-slate-600">|</span>
          <span className="text-white font-bold">DIRECTORY: /REGISTRY</span>
          <span className="text-slate-600">|</span>
          <span>ENTRIES: {guides.length}</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400">STATUS: AUDITED</span>
        </div>
        <Link href="/" className="text-sky-400 hover:underline">
          [LAUNCH SETUP COPILOT →]
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-950/20 text-xs font-mono text-sky-400">
            <Shield className="w-3.5 h-3.5" />
            <span>AUDITED INTEGRATION REGISTRY &amp; DOSSIER DIRECTORY</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Integration Registry &amp; Blueprint Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Search verified OAuth specifications, scope taxonomies, and approval barriers. Compare setup effort and approval wait times across developer platforms.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="md:col-span-2 relative flex items-center bg-black/60 border border-white/[0.1] px-3 py-2 rounded-xl focus-within:border-sky-400 transition">
              <Search className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="grep by provider name, category, or scope..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-0 text-white placeholder-slate-600 focus:outline-none text-xs font-sans"
              />
            </div>

            {/* Difficulty Filter */}
            <div>
              <select
                value={difficultyFilter}
                onChange={(e) => handleTierChange(e.target.value)}
                className="w-full px-3 py-2 bg-black/60 border border-white/[0.1] text-slate-200 focus:outline-none text-xs rounded-xl"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy (0–24)</option>
                <option value="moderate">Moderate (25–59)</option>
                <option value="hard">Hard (60–84)</option>
                <option value="gated">Gated (85+)</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            {/* Approval Filter */}
            <div>
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="w-full px-3 py-2 bg-black/60 border border-white/[0.1] text-slate-200 focus:outline-none text-xs rounded-xl"
              >
                <option value="all">All Approval Modes</option>
                <option value="none">Self-Serve (Instant)</option>
                <option value="required">Mandatory App Review</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06] text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px]">CONNECTOR FILTER:</span>
              <Button
                variant={managedFilter ? "primary" : "outline"}
                size="sm"
                onClick={() => setManagedFilter(!managedFilter)}
                className="text-[11px] font-mono h-7"
              >
                1-Click Managed Only
              </Button>
            </div>

            <span className="text-slate-400 font-mono text-xs tabular-nums">
              Showing {filteredAndSorted.length} of {guides.length} profiles
            </span>
          </div>
        </Card>

        {/* Directory Ledger Table */}
        <Card className="overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 hover:text-white transition"
                    >
                      <span>Provider &amp; Portal</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("score")}
                      className="flex items-center gap-1 hover:text-white transition"
                    >
                      <span>Difficulty Score</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </button>
                  </TableHead>
                  <TableHead>Active Effort</TableHead>
                  <TableHead>Typical Wait</TableHead>
                  <TableHead>Review Mode</TableHead>
                  <TableHead>Managed Auth</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.map((guide) => {
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
                          <div className="w-7 h-7 bg-black border border-white/[0.1] rounded p-1 flex items-center justify-center shrink-0">
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
                            <span className="font-bold group-hover:text-sky-300 transition-colors block text-sm">
                              {guide.app.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-sans">
                              {guide.app.category}
                            </span>
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
                            Review Required
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            Instant Dev
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {guide.app.in_composio_managed ? (
                          <span className="text-sky-400 font-mono text-xs font-bold">
                            1-Click Available
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-xs">
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

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-white/[0.08]">
            {filteredAndSorted.map((guide) => {
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
                        Review Req
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
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#050507] text-slate-100 min-h-screen p-8 text-center font-mono">
          Loading Directory...
        </div>
      }
    >
      <LibraryPageContent />
    </Suspense>
  );
}
