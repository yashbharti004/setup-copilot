import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Standard W3C Server-Sent Events (SSE) Stream Buffer Parser
 * Resolves CRLF desynchronization, packet chunk fragmentation, and multi-line data payloads.
 */
export function parseSSEBuffer<T>(
  rawBuffer: string,
  onEvent: (data: T) => void
): string {
  // Normalize CRLF (\r\n) and legacy CR (\r) to standard LF (\n)
  const normalized = rawBuffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const messages = normalized.split("\n\n");

  // The last slice is either empty or an incomplete buffer segment
  const remaining = messages.pop() || "";

  for (const message of messages) {
    const lines = message.split("\n");
    let eventData = "";

    for (const line of lines) {
      if (line.startsWith("data:")) {
        const content = line.slice(5).trim();
        eventData = eventData ? `${eventData}\n${content}` : content;
      }
    }

    if (eventData) {
      try {
        const parsed = JSON.parse(eventData) as T;
        onEvent(parsed);
      } catch {
        // Ignore malformed individual chunks without breaking stream
      }
    }
  }

  return remaining;
}
