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
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body?.query;

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query string is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(event: PipelineProgressEvent) {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        }

        // 1. Try APM Backend (FastAPI Python)
        let backendConnected = false;
        try {
          const health = await checkBackendHealth();
          if (health.ok) {
            backendConnected = true;
          }
        } catch {
          backendConnected = false;
        }

        if (backendConnected) {
          try {
            const baseUrl = getBackendBaseUrl();
            sendEvent({
              step: "resolve",
              title: "Connecting to APM Backend",
              detail: `Dispatched '${query}' to Python FastAPI generation engine at ${baseUrl}`,
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
                        title = "Search Documentation";
                      } else if (stage === "fetch") {
                        mappedStep = "fetch_pages";
                        title = "Fetch Authoritative Pages";
                      } else if (stage === "extract") {
                        mappedStep = "extract_schema";
                        title = "Extract Quote-Backed Claims";
                      } else if (stage === "verify") {
                        mappedStep = "verify_claims";
                        title = "Verify Quotes & Compute Rubric";
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
                      saveGuideToCache(adapted);

                      sendEvent({
                        step: "complete",
                        title: "Audit Complete & Verified",
                        detail: `Successfully generated and verified ${adapted.app.name} guide (Score: ${adapted.difficulty_score}/100, Tier: ${adapted.difficulty.toUpperCase()}). Stored in backend SQLite.`,
                        timestamp: new Date().toLocaleTimeString(),
                        guide: adapted,
                      });
                    } else if (data.type === "error" || currentEventType === "error") {
                      sendEvent({
                        step: "error",
                        title: "Backend Error",
                        detail: data.message || "Pipeline error reported by APM backend",
                        timestamp: new Date().toLocaleTimeString(),
                      });
                    }
                  } catch {
                    // Ignore non-json lines
                  }
                }
              }
            }

            controller.close();
            return;
          } catch (backendErr: unknown) {
            const msg =
              backendErr instanceof Error
                ? backendErr.message
                : "Backend pipeline error";
            sendEvent({
              step: "error",
              title: "Backend Communication Error",
              detail: `${msg}. Falling back to internal engine...`,
              timestamp: new Date().toLocaleTimeString(),
            });
            // Fall through to local pipeline below
          }
        }

        // 2. Fallback: Internal Node.js pipeline
        try {
          await executePipeline(query, (event) => {
            sendEvent(event);
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
