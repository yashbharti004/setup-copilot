import { getGuideBySlug, saveGuideToCache } from "@/lib/data/guides";
import { getBackendGuideBySlug } from "@/lib/backend";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  // 1. Try APM Python backend first
  try {
    const bg = await getBackendGuideBySlug(slug);
    if (bg) {
      saveGuideToCache(bg);
      return NextResponse.json(bg);
    }
  } catch {
    // Backend offline or error; fallback below
  }

  // 2. Try preverified / cache
  const cached = getGuideBySlug(slug);
  if (cached) {
    return NextResponse.json(cached);
  }

  return NextResponse.json({ error: "Guide not found" }, { status: 404 });
}

