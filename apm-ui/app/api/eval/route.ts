import { BACKEND_BASE_URL } from "@/lib/backend";
import evalsData from "@/lib/data/evals.json";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/eval`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ source: "apm-backend", ...data });
    }
  } catch {
    // Fallback to local evals
  }

  return NextResponse.json({
    source: "local-evals",
    ...evalsData,
  });
}

