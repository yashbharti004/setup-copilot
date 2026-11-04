import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Composio Setup Copilot | Evidence-Graded OAuth Setup-Path Planner",
  description:
    "Autonomous setup-path planner and evidence-graded difficulty calculator for AI agent OAuth integrations (GitHub, Slack, Google Workspace, Notion, and live unfamiliar apps).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

