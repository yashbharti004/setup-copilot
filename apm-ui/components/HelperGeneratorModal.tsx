"use client";

import React, { useState, useEffect } from "react";
import { Guide } from "@/lib/schema/guide";
import { generateHelperContent, HelperAction, HelperResult } from "@/lib/agent/helpers";
import { X, Copy, Check, Download } from "lucide-react";

interface HelperGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  guide: Guide;
  action: HelperAction | null;
}

export function HelperGeneratorModal({
  isOpen,
  onClose,
  guide,
  action,
}: HelperGeneratorModalProps) {
  const [data, setData] = useState<HelperResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && action && guide) {
      const res = generateHelperContent(guide, action);
      setData(res);
      setCopied(false);
    }
  }, [isOpen, action, guide]);

  if (!isOpen || !data) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([data.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = data.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-mono">
      <div className="bg-[#090a0f] border border-white/[0.15] w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-black/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-400 inline-block" />
              <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
                ARTIFACT GENERATOR // {data.filename}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5 font-sans">
              {data.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-white/[0.1] hover:border-white/[0.3] text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Info Note */}
        <div className="px-5 py-2.5 bg-indigo-950/20 border-b border-white/[0.06] text-xs text-indigo-300 flex items-center gap-2 font-sans">
          <span className="font-mono text-indigo-400 font-bold shrink-0">[NOTE]:</span>
          <span>{data.notes}</span>
        </div>

        {/* Code / Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-black font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-all border-b border-white/[0.08]">
          {data.content}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3.5 sm:p-4 bg-[#0c0e14] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            FORMAT: RFC / MARKDOWN COMPLIANT
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-semibold transition active:translate-y-px"
            >
              <Download className="w-3.5 h-3.5" />
              <span>[DOWNLOAD FILE]</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-1.5 bg-white text-black hover:bg-slate-200 text-xs font-bold transition active:translate-y-px"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>[COPIED]</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>[COPY TO CLIPBOARD]</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
