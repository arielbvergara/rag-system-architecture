import { type NextRequest } from "next/server";

/**
 * Server-side base URL for the Express backend.
 * This is a server-only variable — it is never embedded in the client bundle.
 * It defaults to the standard local development address so no .env.local entry
 * is required in a default dev setup.
 */
const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? "http://localhost:4000/api";

/**
 * POST /api/rag/chat/stream
 *
 * Streaming proxy for the Express SSE chat endpoint.
 *
 * Next.js `rewrites()` in next.config.ts proxies all /api/* requests to the
 * Express backend, but that internal proxy buffers the entire response before
 * forwarding it — which defeats Server-Sent Events (SSE) streaming entirely.
 *
 * App Router Route Handlers take precedence over rewrites for the same path,
 * so this handler intercepts the request first and pipes the upstream
 * ReadableStream straight back to the browser without any buffering.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const body = await request.json();

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_BASE_URL}/rag/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reach backend";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({ success: false, error: `Upstream error: ${upstream.status}` }),
      {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Pipe the upstream ReadableStream directly to the browser.
  // The Response constructor forwards the stream without buffering, preserving
  // the real-time SSE delivery that the rewrite proxy would otherwise suppress.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      // Disable buffering in Nginx / reverse-proxy environments (production)
      "X-Accel-Buffering": "no",
    },
  });
}
