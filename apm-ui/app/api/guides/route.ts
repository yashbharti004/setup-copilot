import { getAllGuides, saveGuideToCache } from "@/lib/data/guides";
import { getBackendGuides } from "@/lib/backend";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const backendGuides = await getBackendGuides();
    if (backendGuides.length > 0) {
      for (const g of backendGuides) {
        saveGuideToCache(g);
      }
    }
  } catch {
    // Graceful fallback to static verified guides
  }

  const guides = getAllGuides();
  return NextResponse.json({
    count: guides.length,
    guides,
  });
}
