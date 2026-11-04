"use client";

import React, { useState } from "react";
import { Guide } from "@/lib/schema/guide";
import { Check, ChevronDown } from "lucide-react";

interface ShareButtonProps {
  guide: Guide;
}

export function ShareButton({ guide }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    setDropdownOpen(false);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(guide, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${guide.app.slug}-setup-guide.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDropdownOpen(false);
  };

  const handleExportMarkdown = () => {
    let md = `# OAuth Setup Guide: ${guide.app.name}\n\n`;
    md += `**Verdict:** ${guide.summary}\n`;
    md += `**Difficulty:** ${guide.difficulty} (${guide.difficulty_score}/100)\n`;
    md += `**Active Effort:** ${guide.time_estimate.setup_active_effort}\n`;
    md += `**Approval Wait:** ${guide.time_estimate.approval_wait}\n\n`;
    md += `## Prerequisites\n`;
    guide.prerequisites.forEach((p) => (md += `- ${p}\n`));
    md += `\n## Setup Steps\n`;
    guide.path.forEach((s) => {
      md += `### Step ${s.step_number}: ${s.action} (${s.who.toUpperCase()})\n`;
      md += `${s.detail}\n`;
      md += `*Source:* [Official Docs](${s.source}) - Confidence: ${s.confidence}\n\n`;
    });
    md += `## Scopes\n`;
    guide.scopes.forEach((s) => {
      md += `- \`${s.scope}\` (${s.sensitivity}): ${s.unlocks}\n`;
    });
    md += `\n## Blockers & Fixes\n`;
    guide.blockers_and_fixes.forEach((b) => {
      md += `### Symptom: ${b.symptom}\n- **Cause:** ${b.cause}\n- **Fix:** ${b.fix}\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${guide.app.slug}-setup-guide.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDropdownOpen(false);
  };

  return (
    <div className="relative inline-block text-left font-mono">
      <div className="inline-flex">
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.12] text-xs font-medium tracking-tight transition active:translate-y-px"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">[URL COPIED]</span>
            </>
          ) : (
            <span>[SHARE]</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="inline-flex items-center px-1.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border-y border-r border-white/[0.12] text-xs transition"
          aria-label="Export options"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {dropdownOpen && (
        <div className="origin-top-right absolute right-0 mt-1.5 w-52 bg-[#0c0e14] border border-white/[0.15] py-1 z-30 shadow-2xl">
          <button
            onClick={handleCopyLink}
            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] flex items-center justify-between"
          >
            <span>COPY SHAREABLE URL</span>
            <span className="text-slate-600">LINK</span>
          </button>
          <button
            onClick={handleExportMarkdown}
            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] flex items-center justify-between"
          >
            <span>EXPORT MARKDOWN</span>
            <span className="text-slate-600">.MD</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] flex items-center justify-between"
          >
            <span>EXPORT SCHEMA</span>
            <span className="text-slate-600">.JSON</span>
          </button>
        </div>
      )}
    </div>
  );
}
