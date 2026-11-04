import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const viewport: Viewport = {
  themeColor: "#050507",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Setup-Copilot | Evidence-Based OAuth Difficulty & Blueprint Engine",
  description:
    "Know how hard an OAuth integration will be before writing agent code. Audits scope sensitivity, human review barriers, and approval turnaround across 150+ developer portals with deterministic rubric scoring.",
  keywords: [
    "OAuth 2.0",
    "AI Agent Integrations",
    "Setup Copilot",
    "Composio",
    "Developer Portals",
    "App Review Audits",
    "Deterministic Rubric",
  ],
  authors: [{ name: "Composio Engineering Team", url: "https://composio.dev" }],
  icons: {
    icon: "/composio-full-white.svg",
    shortcut: "/composio-full-white.svg",
    apple: "/composio-full-white.svg",
  },
  openGraph: {
    title: "Setup-Copilot | Evidence-Based OAuth Setup Planner",
    description:
      "Audit OAuth 2.0 setup complexity, human review gates, and wait times before you write integration code. Powered by deterministic rubric scoring.",
    url: "https://setup-copilot.composio.dev",
    siteName: "Setup-Copilot",
    images: [
      {
        url: "/composio-full-white.svg",
        width: 1200,
        height: 630,
        alt: "Composio Setup-Copilot",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Setup-Copilot | Evidence-Based OAuth Setup Planner",
    description:
      "Audit OAuth 2.0 setup complexity, human review gates, and wait times before you write integration code.",
    images: ["/composio-full-white.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-[#050507] text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-sky-500/30 selection:text-sky-200">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
