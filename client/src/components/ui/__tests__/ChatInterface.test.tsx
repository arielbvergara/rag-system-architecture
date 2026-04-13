import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChatInterface } from "../ChatInterface";
import type { ChatMessage, RagDocument } from "@/types";

const noOp = vi.fn();

const READY_DOC: RagDocument = {
  id: "doc-1",
  filename: "guide.pdf",
  mimeType: "application/pdf",
  uploadedAt: "2026-04-01T10:00:00.000Z",
  chunkCount: 10,
  status: "ready",
};

const USER_MSG: ChatMessage = { role: "user", content: "What is RAG?" };
const ASSISTANT_MSG: ChatMessage = {
  role: "assistant",
  content: "RAG stands for Retrieval-Augmented Generation.",
  citations: [],
};

function renderChat(overrides: Partial<Parameters<typeof ChatInterface>[0]> = {}) {
  return render(
    <ChatInterface
      messages={[]}
      streaming={false}
      streamBuffer=""
      input=""
      onInputChange={noOp}
      onSend={noOp}
      documents={[]}
      selectedDocumentIds={[]}
      onDocumentFilterChange={noOp}
      {...overrides}
    />
  );
}

describe("ChatInterface", () => {
  it("render_ShouldShowEmptyState_WhenNoMessages", () => {
    renderChat();
    expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
  });

  it("render_ShouldShowUploadPrompt_WhenNoDocumentsReady", () => {
    renderChat({ documents: [] });
    expect(screen.getByText(/upload documents first/i)).toBeInTheDocument();
  });

  it("render_ShouldShowAskPrompt_WhenDocumentsAreReady", () => {
    renderChat({ documents: [READY_DOC] });
    expect(screen.getByText(/ask anything about your uploaded documents/i)).toBeInTheDocument();
  });

  it("render_ShouldDisplayUserMessage_WhenMessageInHistory", () => {
    renderChat({ messages: [USER_MSG] });
    expect(screen.getByText("What is RAG?")).toBeInTheDocument();
  });

  it("render_ShouldDisplayAssistantMessage_WhenMessageInHistory", () => {
    renderChat({ messages: [ASSISTANT_MSG] });
    expect(screen.getByText(/RAG stands for/i)).toBeInTheDocument();
  });

  it("render_ShouldShowDocumentFilterPills_WhenReadyDocumentsExist", () => {
    renderChat({ documents: [READY_DOC] });
    expect(screen.getByText("guide.pdf")).toBeInTheDocument();
    expect(screen.getByText(/filter by document/i)).toBeInTheDocument();
  });

  it("render_ShouldNotShowDocumentFilter_WhenNoReadyDocuments", () => {
    const processingDoc: RagDocument = { ...READY_DOC, status: "parsing" };
    renderChat({ documents: [processingDoc] });
    expect(screen.queryByText(/filter by document/i)).not.toBeInTheDocument();
  });

  it("handleKeyDown_ShouldCallOnSend_WhenEnterPressedWithInput", () => {
    const onSend = vi.fn();
    renderChat({ input: "Hello", onSend });

    fireEvent.keyDown(screen.getByPlaceholderText(/ask a question/i), { key: "Enter" });
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("handleKeyDown_ShouldNotCallOnSend_WhenShiftEnterPressed", () => {
    const onSend = vi.fn();
    renderChat({ input: "Hello", onSend });

    fireEvent.keyDown(screen.getByPlaceholderText(/ask a question/i), {
      key: "Enter",
      shiftKey: true,
    });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("handleKeyDown_ShouldNotCallOnSend_WhenInputIsEmpty", () => {
    const onSend = vi.fn();
    renderChat({ input: "", onSend });

    fireEvent.keyDown(screen.getByPlaceholderText(/ask a question/i), { key: "Enter" });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("handleKeyDown_ShouldNotCallOnSend_WhenStreaming", () => {
    const onSend = vi.fn();
    renderChat({ input: "Hello", streaming: true, onSend });

    fireEvent.keyDown(screen.getByPlaceholderText(/ask a question/i), { key: "Enter" });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("render_ShouldShowStreamBuffer_WhenStreamingAndBufferHasContent", () => {
    renderChat({ streaming: true, streamBuffer: "Partial response…" });
    expect(screen.getByText(/partial response/i)).toBeInTheDocument();
  });

  it("render_ShouldDisableSendButton_WhenStreaming", () => {
    renderChat({ streaming: true, input: "Hello" });
    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
  });

  it("render_ShouldDisableSendButton_WhenInputIsEmpty", () => {
    renderChat({ streaming: false, input: "" });
    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
  });

  it("handleDocumentFilter_ShouldToggleSelection_WhenPillClicked", () => {
    const onDocumentFilterChange = vi.fn();
    renderChat({ documents: [READY_DOC], selectedDocumentIds: [], onDocumentFilterChange });

    fireEvent.click(screen.getByText("guide.pdf"));
    expect(onDocumentFilterChange).toHaveBeenCalledWith(["doc-1"]);
  });

  it("handleDocumentFilter_ShouldDeselect_WhenActivePillClicked", () => {
    const onDocumentFilterChange = vi.fn();
    renderChat({
      documents: [READY_DOC],
      selectedDocumentIds: ["doc-1"],
      onDocumentFilterChange,
    });

    fireEvent.click(screen.getByText("guide.pdf"));
    expect(onDocumentFilterChange).toHaveBeenCalledWith([]);
  });
});
