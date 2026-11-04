import { generateHelperContent, HelperAction } from "@/lib/agent/helpers";
import { getGuideBySlug } from "@/lib/data/guides";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { slug, action } = (await req.json()) as {
      slug?: string;
      action?: HelperAction;
    };

    if (!slug || !action) {
      return NextResponse.json(
        { error: "Both 'slug' and 'action' parameters are required" },
        { status: 400 }
      );
    }

    const guide = getGuideBySlug(slug);
    if (!guide) {
      return NextResponse.json({ error: `Guide not found for slug '${slug}'` }, { status: 404 });
    }

    const result = generateHelperContent(guide, action);
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal helper error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

