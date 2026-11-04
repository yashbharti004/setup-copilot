import { BACKEND_BASE_URL } from "@/lib/backend";
import { getDifficultyLevel } from "@/lib/schema/rubric";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/rubric`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ source: "apm-backend", ...data });
    }
  } catch {
    // Fallback to local schema
  }

  return NextResponse.json({
    source: "local-spec",
    tiers: [
      { label: "EASY", min: 0, max: 24 },
      { label: "MODERATE", min: 25, max: 59 },
      { label: "HARD", min: 60, max: 84 },
      { label: "GATED", min: 85, max: 100 },
    ],
    weights: {
      review_required_for_distribution: 25,
      uses_restricted_scopes: 25,
      requires_security_audit: 25,
      requires_business_verification: 20,
      requires_paid_plan: 20,
      requires_video_demo: 10,
    },
    evidence_labels: {
      VERIFIED: "Official page states it explicitly; quote found in fetched page text.",
      DOCS: "Official page implies it; quote found in fetched page text.",
      COMMUNITY: "Only non-official page says it; quote found in fetched page text.",
      UNKNOWN: "No checkable source found.",
    },
  });
}
