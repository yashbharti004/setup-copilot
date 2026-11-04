import React from "react";
import Link from "next/link";
import { ALL_VERIFIED_GUIDES } from "@/lib/data/guides";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0c0e14] text-slate-400 text-xs py-10 font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 pb-8 border-b border-white/[0.06]">
          {/* Brand Col */}
          <div className="space-y-2.5 md:col-span-2">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/composio-full-white.svg"
                alt="Composio"
                className="h-5 w-auto object-contain opacity-80"
              />
              <span className="text-xs text-slate-500 font-mono">//</span>
              <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                SETUP-COPILOT
              </span>
            </div>
            <p className="text-slate-300 text-xs max-w-sm leading-relaxed font-sans">
              Know how hard an OAuth app will be to set up, and how long approval will take, before you start.
              Every claim carries an audited confidence label to protect AI agent engineers from approval traps.
            </p>
            <div className="text-[10px] text-slate-500 pt-1">
              DETERMINISTIC_RUBRIC: COMPUTED_IN_CODE • DUAL_PASS_CRITIC: ACTIVE • GROUND_TRUTH: AUDITED
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-200 uppercase tracking-wider block mb-2.5">
              // AUDITED_REGISTRY ({ALL_VERIFIED_GUIDES.length} APPS)
            </span>
            <ul className="space-y-1.5">
              {ALL_VERIFIED_GUIDES.map((g, idx) => (
                <li key={g.app.slug}>
                  <Link href={`/guide/${g.app.slug}`} className="hover:text-white transition">
                    [{String(idx + 1).padStart(2, "0")}] {g.app.name.split(" ")[0].toUpperCase()} ({g.difficulty.toUpperCase()} // {String(g.difficulty_score).padStart(2, "0")})
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Evals & Docs */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-200 uppercase tracking-wider block mb-2.5">
              // EVALS_&amp;_SPECS
            </span>
            <ul className="space-y-1.5">
              <li>
                <Link href="/evals" className="hover:text-white transition">
                  VERIFICATION_LOG (/evals)
                </Link>
              </li>
              <li>
                <Link href="/library" className="hover:text-white transition">
                  FULL_REGISTRY_LEDGER ({ALL_VERIFIED_GUIDES.length})
                </Link>
              </li>
              <li>
                <a
                  href="https://composio.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  COMPOSIO_MANAGED_AUTH ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] text-slate-500">
          <p>© {new Date().getFullYear()} COMPOSIO SETUP COPILOT. BUILT FOR THE COMPOSIO CHALLENGE.</p>
          <p>ENGINE: NEXT.JS 14 • TYPESCRIPT • TAILWIND • ZOD</p>
        </div>
      </div>
    </footer>
  );
}
