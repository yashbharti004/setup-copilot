import { Guide } from "@/lib/schema/guide";
import githubGuide from "./github.json";
import slackGuide from "./slack.json";
import googleGuide from "./google-workspace.json";
import notionGuide from "./notion.json";
import twitterGuide from "./twitter-x.json";
import linearGuide from "./linear.json";

export const ALL_VERIFIED_GUIDES: Guide[] = [
  githubGuide as unknown as Guide,
  slackGuide as unknown as Guide,
  googleGuide as unknown as Guide,
  notionGuide as unknown as Guide,
  twitterGuide as unknown as Guide,
  linearGuide as unknown as Guide,
];

// Alias export for backward compatibility
export const PREVERIFIED_GUIDES = ALL_VERIFIED_GUIDES;

// In-memory cache for dynamically generated live guides during server runtime
const runtimeGuideCache = new Map<string, Guide>();

// Canonical alias dictionary for prescribed URLs and developer synonyms
const SLUG_ALIASES: Record<string, string> = {
  "google-drive": "google-workspace",
  "gmail": "google-workspace",
  "google": "google-workspace",
  "gdrive": "google-workspace",
  "twitter": "twitter-x",
  "x": "twitter-x",
  "linear-app": "linear",
};

export function getGuideBySlug(slug: string): Guide | undefined {
  if (!slug) return undefined;
  const normalized = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
  
  // Resolve alias if mapped
  const targetSlug = SLUG_ALIASES[normalized] || normalized;

  // Check runtime cache first
  const cached = runtimeGuideCache.get(targetSlug) || runtimeGuideCache.get(normalized);
  if (cached) return cached;

  return ALL_VERIFIED_GUIDES.find(
    (g) =>
      g.app.slug.toLowerCase() === targetSlug ||
      g.app.slug.toLowerCase() === normalized ||
      g.app.name.toLowerCase().replace(/[^a-z0-9]/g, "-") === normalized ||
      g.app.name.toLowerCase().includes(targetSlug) ||
      (g.app.composio_app_id && g.app.composio_app_id.toLowerCase() === targetSlug)
  );
}

export function saveGuideToCache(guide: Guide): void {
  runtimeGuideCache.set(guide.app.slug.toLowerCase(), guide);
}

export function getAllGuides(): Guide[] {
  const dynamic = Array.from(runtimeGuideCache.values());
  const slugs = new Set(ALL_VERIFIED_GUIDES.map((g) => g.app.slug));
  const uniqueDynamic = dynamic.filter((g) => !slugs.has(g.app.slug));
  return [...ALL_VERIFIED_GUIDES, ...uniqueDynamic];
}
