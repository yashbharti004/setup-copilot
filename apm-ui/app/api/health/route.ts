import { BACKEND_BASE_URL, checkBackendHealth } from "@/lib/backend";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const backend = await checkBackendHealth();
  return NextResponse.json({
    status: "ok",
    frontend: "composio-setup-copilot",
    backend_url: BACKEND_BASE_URL,
    backend_connected: backend.ok,
    backend,
  });
}

