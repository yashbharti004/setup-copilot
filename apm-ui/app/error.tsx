"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <div className="bg-[#050507] text-slate-100 min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-2xl border border-rose-500/30 bg-[#0c0d14] text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-rose-950/40 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
          <AlertOctagon className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white font-mono uppercase">
            Application Error
          </h2>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            {error.message || "An unexpected error occurred while rendering this view."}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="primary" size="sm" onClick={() => reset()}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Try Again</span>
          </Button>

          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="w-3.5 h-3.5 mr-1" />
              <span>Back Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
