import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReadableStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

function makeSseBody(events: object[]): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
}

async function readResponseText(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost:3000/api/rag/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/rag/chat/stream route handler", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POST_ShouldStreamSseChunks_WhenUpstreamRespondsWithEventStream", async () => {
    const sseText = makeSseBody([
      { type: "citations", citations: [] },
      { type: "delta", content: "Hello " },
      { type: "delta", content: "world" },
      { type: "done" },
    ]);

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      body: makeReadableStream(sseText),
    } as unknown as Response);

    const response = await POST(makeRequest({ sessionId: "s1", message: "Hi" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
    expect(response.headers.get("X-Accel-Buffering")).toBe("no");

    const text = await readResponseText(response);
    expect(text).toContain('"type":"delta"');
    expect(text).toContain('"content":"Hello "');
    expect(text).toContain('"type":"done"');
  });

  it("POST_ShouldReturnErrorResponse_WhenUpstreamFails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      body: null,
    } as unknown as Response);

    const response = await POST(makeRequest({ sessionId: "s1", message: "Hi" }));

    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe("application/json");

    const json = await response.json() as { success: boolean; error: string };
    expect(json.success).toBe(false);
    expect(json.error).toContain("500");
  });

  it("POST_ShouldReturn502_WhenUpstreamIsUnreachable", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("ECONNREFUSED")
    );

    const response = await POST(makeRequest({ sessionId: "s1", message: "Hi" }));

    expect(response.status).toBe(502);

    const json = await response.json() as { success: boolean; error: string };
    expect(json.success).toBe(false);
    expect(json.error).toContain("ECONNREFUSED");
  });

  it("POST_ShouldForwardBodyToUpstream_WhenRequestContainsDocumentIds", async () => {
    const sseText = makeSseBody([{ type: "done" }]);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      body: makeReadableStream(sseText),
    } as unknown as Response);

    const payload = {
      sessionId: "s2",
      message: "What is in the PDF?",
      documentIds: ["doc-1", "doc-2"],
    };

    await POST(makeRequest(payload));

    expect(fetch).toHaveBeenCalledOnce();
    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("/rag/chat/stream");
    expect(options.method).toBe("POST");

    const sentBody = JSON.parse(options.body as string) as typeof payload;
    expect(sentBody).toEqual(payload);
  });
});
