import { ResearchSource } from "./types";

/**
 * Searches DuckDuckGo HTML for developer documentation with zero API keys.
 */
async function searchDuckDuckGo(query: string, maxResults = 5): Promise<ResearchSource[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!resp.ok) return [];

    const html = await resp.text();
    const results: ResearchSource[] = [];

    // Parse result links and snippets
    const linkRegex = /<a class="result__url" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const snippetRegex = /<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;

    const urls: { url: string; title: string }[] = [];
    let linkMatch: RegExpExecArray | null;

    while ((linkMatch = linkRegex.exec(html)) !== null) {
      let rawUrl = linkMatch[1];
      if (rawUrl.includes("uddg=")) {
        const match = rawUrl.match(/uddg=([^&]+)/);
        if (match) rawUrl = decodeURIComponent(match[1]);
      }
      const title = linkMatch[2].replace(/<[^>]+>/g, "").trim();
      if (rawUrl.startsWith("http")) {
        urls.push({ url: rawUrl, title });
      }
    }

    const snippets: string[] = [];
    let snippetMatch: RegExpExecArray | null;
    while ((snippetMatch = snippetRegex.exec(html)) !== null) {
      snippets.push(snippetMatch[1].replace(/<[^>]+>/g, "").trim());
    }

    for (let i = 0; i < Math.min(urls.length, maxResults); i++) {
      results.push({
        title: urls[i].title,
        url: urls[i].url,
        snippet: snippets[i] || `Documentation for ${query}`,
        retrieved_at: new Date().toISOString(),
      });
    }

    return results;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[searchDuckDuckGo] Search fetch failed, falling back:", err);
    }
    return [];
  }
}

/**
 * Fetches real webpage markdown content via Jina Reader (free, no auth required).
 */
export async function fetchLiveMarkdown(targetUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const resp = await fetch(`https://r.jina.ai/${targetUrl}`, {
      signal: controller.signal,
      headers: {
        Accept: "text/plain",
        "X-No-Cache": "true",
      },
    });
    clearTimeout(timeout);

    if (!resp.ok) return null;
    const text = await resp.text();
    return text.length > 200 ? text : null;
  } catch {
    return null;
  }
}

/**
 * Executes a resilient multi-tier live search for developer documentation.
 */
export async function searchDeveloperDocs(
  appName: string,
  queries: string[],
  onProgress?: (msg: string) => void
): Promise<ResearchSource[]> {
  const sources: ResearchSource[] = [];
  const seenUrls = new Set<string>();

  // 1. Tavily Search (if user configured key)
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    onProgress?.(`Querying Tavily search API for ${appName}...`);
    try {
      for (const q of queries.slice(0, 2)) {
        const resp = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: q,
            search_depth: "basic",
            max_results: 3,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          for (const item of data.results || []) {
            if (!seenUrls.has(item.url)) {
              seenUrls.add(item.url);
              sources.push({
                title: item.title,
                url: item.url,
                snippet: item.content?.slice(0, 400) || "",
                retrieved_at: new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch {
      // Tavily failed, continue to DuckDuckGo
    }
  }

  // 2. DuckDuckGo Live Search (zero API key fallback)
  if (sources.length < 3) {
    onProgress?.(`Searching live web for ${appName} OAuth & API documentation...`);
    for (const q of queries.slice(0, 3)) {
      const ddgResults = await searchDuckDuckGo(q, 3);
      for (const res of ddgResults) {
        if (!seenUrls.has(res.url)) {
          seenUrls.add(res.url);
          sources.push(res);
        }
      }
      if (sources.length >= 5) break;
    }
  }

  // 3. Deep-fetch live page contents from top official documentation URL
  const officialDocSource = sources.find(
    (s) =>
      s.url.includes("developer.") ||
      s.url.includes("docs.") ||
      s.url.includes("api.") ||
      s.url.includes("/docs") ||
      s.url.includes("/developer") ||
      s.url.includes("/oauth")
  );

  if (officialDocSource) {
    onProgress?.(`Reading live developer documentation from ${new URL(officialDocSource.url).hostname}...`);
    const liveMarkdown = await fetchLiveMarkdown(officialDocSource.url);
    if (liveMarkdown) {
      // Extract high-value paragraphs (endpoints, authorization, scopes, limits)
      const paragraphs = liveMarkdown
        .split("\n\n")
        .map((p) => p.trim())
        .filter(
          (p) =>
            p.length > 60 &&
            (p.toLowerCase().includes("oauth") ||
              p.toLowerCase().includes("token") ||
              p.toLowerCase().includes("scope") ||
              p.toLowerCase().includes("authorize") ||
              p.toLowerCase().includes("client_id") ||
              p.toLowerCase().includes("review") ||
              p.toLowerCase().includes("pkce"))
        );

      if (paragraphs.length > 0) {
        sources.unshift({
          title: `${appName} Official Documentation (Live Extracted)`,
          url: officialDocSource.url,
          snippet: paragraphs.slice(0, 3).join("\n\n").slice(0, 800),
          retrieved_at: new Date().toISOString(),
        });
      }
    }
  }

  return sources;
}

