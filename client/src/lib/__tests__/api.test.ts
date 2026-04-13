import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { admin, documents, rag } from "../api";

function makeFetchResponse(body: string, ok = true, status = 200) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(body);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });

  return Promise.resolve({
    ok,
    status,
    statusText: "OK",
    body: stream,
    json: () => Promise.resolve(JSON.parse(body)),
  } as unknown as Response);
}

function makeSseBody(chunks: object[]): string {
  return chunks.map((c) => `data: ${JSON.stringify(c)}`).join("\n\n") + "\n\n";
}

describe("api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── admin ──────────────────────────────────────────────────────────────────

  it("authenticate_ShouldReturnToken_WhenCredentialsAreValid", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFetchResponse(JSON.stringify({ success: true, data: { token: "tok-123" } }))
    );

    const res = await admin.authenticate("secret");
    expect(res.success).toBe(true);
    expect(res.data?.token).toBe("tok-123");
  });

  it("authenticate_ShouldReturnError_WhenRequestFails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFetchResponse(JSON.stringify({ error: "Invalid password" }), false, 401)
    );

    const res = await admin.authenticate("wrong");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Invalid password");
  });

  // ── documents ──────────────────────────────────────────────────────────────

  it("list_ShouldReturnDocuments_WhenRequestSucceeds", async () => {
    const payload = [{ id: "doc-1", filename: "a.pdf", status: "ready" }];
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFetchResponse(JSON.stringify({ success: true, data: payload }))
    );

    const res = await documents.list();
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
  });

  it("getStatus_ShouldReturnDocument_WhenIdExists", async () => {
    const doc = { id: "doc-1", status: "ready" };
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFetchResponse(JSON.stringify({ success: true, data: doc }))
    );

    const res = await documents.getStatus("doc-1");
    expect(res.success).toBe(true);
    expect(res.data?.id).toBe("doc-1");
  });

  it("getChunk_ShouldReturnChunkContent_WhenChunkExists", async () => {
    const chunk = { id: "c1", content: "Hello world", metadata: {} };
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFetchResponse(JSON.stringify({ success: true, data: chunk }))
    );

    const res = await documents.getChunk("doc-1", "c1");
    expect(res.success).toBe(true);
    expect(res.data?.content).toBe("Hello world");
  });

  // ── rag.chatStream ─────────────────────────────────────────────────────────

  it("chatStream_ShouldEmitCitationsChunk_WhenServerSendsCitations", async () => {
    const body = makeSseBody([
      { type: "citations", citations: [{ chunkId: "c1", documentId: "d1", filename: "f.pdf", excerpt: "ex" }] },
      { type: "done" },
    ]);
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFetchResponse(body, true, 200)
    );

    const chunks: object[] = [];
    await new Promise<void>((resolve) => {
      rag.chatStream(
        "session-1",
        "Hello",
        undefined,
        (chunk) => {
          chunks.push(chunk);
          if ((chunk as { type: string }).type === "done") resolve();
        },
        () => resolve()
      );
    });

    const citations = chunks.find((c) => (c as { type: string }).type === "citations");
    expect(citations).toBeDefined();
    const done = chunks.find((c) => (c as { type: string }).type === "done");
    expect(done).toBeDefined();
  });

  it("chatStream_ShouldEmitDeltaChunks_WhenServerStreamsContent", async () => {
    const body = makeSseBody([
      { type: "delta", content: "Hello " },
      { type: "delta", content: "world" },
      { type: "done" },
    ]);
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      makeFetchResponse(body, true, 200)
    );

    const deltas: string[] = [];
    await new Promise<void>((resolve) => {
      rag.chatStream(
        "session-1",
        "Hi",
        undefined,
        (chunk) => {
          if ((chunk as { type: string; content?: string }).type === "delta") {
            deltas.push((chunk as { content: string }).content);
          }
          if ((chunk as { type: string }).type === "done") resolve();
        },
        () => resolve()
      );
    });

    expect(deltas).toEqual(["Hello ", "world"]);
  });

  it("chatStream_ShouldCallOnError_WhenResponseIsNotOk", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(
      Promise.resolve({ ok: false, status: 500, statusText: "Server Error", body: null } as Response)
    );

    await new Promise<void>((resolve) => {
      rag.chatStream("session-1", "Hello", undefined, () => {}, (err) => {
        expect(err).toContain("500");
        resolve();
      });
    });
  });

  it("chatStream_ShouldReturnCancelFunction_WhenCalled", () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    const cancel = rag.chatStream("s", "q", undefined, () => {}, () => {});
    expect(typeof cancel).toBe("function");
    cancel(); // should not throw
  });
});
