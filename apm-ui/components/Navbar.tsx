"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "01. PLANNER" },
    { href: "/library", label: "02. DIRECTORY" },
    { href: "/evals", label: "03. EVALS-LOG" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#050507]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/composio-full-white.svg"
              alt="Composio"
              className="h-6 w-auto object-contain transition-opacity group-hover:opacity-90"
            />
            <span className="text-xs text-slate-500 font-mono">//</span>
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-300 uppercase">
              COPILOT
            </span>
          </Link>

          {/* Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 border-l border-white/[0.08] pl-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-mono tracking-wider rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                    isActive
                      ? "text-white font-bold bg-white/[0.06] border border-white/[0.12]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                  }`}
                >
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right CTA Area (direct styling from inspire.png) */}
        <div className="flex items-center gap-4">
          <a
            href="https://docs.composio.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-slate-300 hover:text-white transition uppercase font-semibold hidden sm:inline"
          >
            DOCS
          </a>

          <a
            href="https://app.composio.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-slate-300 hover:text-white transition uppercase font-semibold"
          >
            LOG IN
          </a>

          <a
            href="https://app.composio.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-1.5 bg-white hover:bg-slate-200 text-black font-mono font-bold text-xs uppercase tracking-wider rounded transition active:translate-y-px"
          >
            <span>GET STARTED — FREE</span>
          </a>
        </div>
      </div>
    </header>
  );
}
