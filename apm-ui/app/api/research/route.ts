import { executePipeline } from "@/lib/agent/pipeline";
import { PipelineProgressEvent } from "@/lib/agent/types";
import {
  BACKEND_BASE_URL,
  getBackendBaseUrl,
  checkBackendHealth,
  adaptBackendGuideToFrontend,
  BackendGuide,
} from "@/lib/backend";
import { saveGuideToCache } from "@/lib/data/guides";
import { Guide, GuideSchema } from "@/lib/schema/guide";
import { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Input schema
const RequestPayloadSchema = z.object({
  query: z
    .string()
    .min(2, "Query must be at least 2 characters")
    .max(120, "Query too long"),
});

// In-memory rate limiting (Free sliding-window rate limiter per client IP)
const ipRateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 15; // 15 requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

// In-memory research result cache (Free TTL cache)
const researchResultCache = new Map<string, { guide: Guide; cachedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting check
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const now = Date.now();

    const clientUsage = ipRateLimits.get(ip);
    if (clientUsage && now < clientUsage.resetTime) {
      if (clientUsage.count >= RATE_LIMIT_MAX) {
        return new Response(
          JSON.stringify({
            error: "Too many audit requests. Please wait a minute before retrying.",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "60",
            },
          }
        );
      }
      clientUsage.count += 1;
    } else {
      ipRateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    }

    // 2. Validate input payload with Zod
    const rawBody = await req.json();
    const validation = RequestPayloadSchema.safeParse(rawBody);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query payload",
          details: validation.error.flatten(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { query } = validation.data;
    const normalizedQuery = query.toLowerCase().trim();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(event: PipelineProgressEvent) {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        }

        // 3. Check in-memory research cache
        const cached = researchResultCache.get(normalizedQuery);
        if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
          sendEvent({
            step: "resolve",
            title: "Retrieved from Audit Cache",
            detail: `Found verified cache for '${query}' (TTL: ${Math.round((CACHE_TTL_MS - (now - cached.cachedAt)) / 1000)}s remaining)`,
            timestamp: new Date().toLocaleTimeString(),
          });
          sendEvent({
            step: "complete",
            title: "Audit Complete (Cached)",
            detail: `Verified dossier for ${cached.guide.app.name}`,
            timestamp: new Date().toLocaleTimeString(),
            guide: cached.guide,
          });
          controller.close();
          return;
        }

        // 4. Try APM Backend (FastAPI Python)
        let backendConnected = false;
        try {
          const health = await checkBackendHealth();
          if (health.ok) {
            backendConnected = true;
          }
        } catch {
          backendConnected = false;
        }

        let backendCompleted = false;
        if (backendConnected) {
          try {
            const baseUrl = getBackendBaseUrl();
            sendEvent({
              step: "resolve",
              title: "Connecting to Python Audit Engine",
              detail: `Dispatched '${query}' to backend at ${baseUrl}`,
              timestamp: new Date().toLocaleTimeString(),
            });

            const backendRes = await fetch(
              `${baseUrl}/api/generate/stream?q=${encodeURIComponent(query)}`,
              {
                headers: { Accept: "text/event-stream" },
                cache: "no-store",
              }
            );

            if (!backendRes.ok || !backendRes.body) {
              throw new Error(
                `Backend stream returned HTTP ${backendRes.status}: ${backendRes.statusText}`
              );
            }

            const reader = backendRes.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              let currentEventType = "message";
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) {
                  currentEventType = "message";
                  continue;
                }

                if (trimmed.startsWith("event:")) {
                  currentEventType = trimmed.slice(6).trim();
                } else if (trimmed.startsWith("data:")) {
                  const dataStr = trimmed.slice(5).trim();
                  try {
                    const data = JSON.parse(dataStr);

                    if (data.type === "progress" || currentEventType === "progress") {
                      let mappedStep: PipelineProgressEvent["step"] = "search_docs";
                      let title = "Pipeline Progress";
                      const stage = data.stage || "";

                      if (stage === "search") {
                        mappedStep = "search_docs";
                        title = "1. Fetching documentation";
                      } else if (stage === "fetch") {
                        mappedStep = "fetch_pages";
                        title = "2. Reading authoritative pages";
                      } else if (stage === "extract") {
                        mappedStep = "extract_schema";
                        title = "3. Extracting OAuth facts";
                      } else if (stage === "verify") {
                        mappedStep = "verify_claims";
                        title = "4. Verifying quotes & policy";
                      }

                      sendEvent({
                        step: mappedStep,
                        title,
                        detail: data.message || `Executing ${stage}...`,
                        timestamp: new Date().toLocaleTimeString(),
                      });
                    } else if (data.type === "done" || currentEventType === "done") {
                      const backendGuide = data.guide as BackendGuide;
                      const adapted = adaptBackendGuideToFrontend(backendGuide);

                      // Validate with Zod
                      const parseResult = GuideSchema.safeParse(adapted);
                      const finalGuide = parseResult.success ? parseResult.data : adapted;

                      saveGuideToCache(finalGuide);
                      researchResultCache.set(normalizedQuery, {
                        guide: finalGuide,
                        cachedAt: Date.now(),
                      });

                      backendCompleted = true;
                      sendEvent({
                        step: "complete",
                        title: "Audit Complete & Verified",
                        detail: `Successfully verified ${finalGuide.app.name} guide (Score: ${finalGuide.difficulty_score}/100 [${finalGuide.difficulty}]).`,
                        timestamp: new Date().toLocaleTimeString(),
                        guide: finalGuide,
                      });
                    } else if (data.type === "error" || currentEventType === "error") {
                      sendEvent({
                        step: "search_docs",
                        title: "Backend Notice",
                        detail: `${data.message || "Backend pipeline issue"}. Switching to internal verified library...`,
                        timestamp: new Date().toLocaleTimeString(),
                      });
                    }
                  } catch {
                    // Ignore non-json
                  }
                }
              }
            }

            if (backendCompleted) {
              controller.close();
              return;
            }
          } catch (backendErr: unknown) {
            const msg =
              backendErr instanceof Error
                ? backendErr.message
                : "Backend pipeline error";
            sendEvent({
              step: "search_docs",
              title: "Backend Disconnect",
              detail: `${msg}. Executing internal pipeline fallback...`,
              timestamp: new Date().toLocaleTimeString(),
            });
          }
        }

        // 5. Fallback: Internal Node.js pipeline
        try {
          await executePipeline(query, (event) => {
            sendEvent(event);
            if (event.step === "complete" && event.guide) {
              const parseResult = GuideSchema.safeParse(event.guide);
              const g = parseResult.success ? parseResult.data : event.guide;
              researchResultCache.set(normalizedQuery, { guide: g, cachedAt: Date.now() });
            }
          });
          controller.close();
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error ? err.message : "Pipeline execution failed";
          sendEvent({
            step: "error",
            title: "Pipeline Error",
            detail: errorMessage,
            timestamp: new Date().toLocaleTimeString(),
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
