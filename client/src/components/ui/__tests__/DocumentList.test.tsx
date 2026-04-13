import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DocumentList } from "../DocumentList";
import type { RagDocument } from "@/types";

function makeDocument(overrides: Partial<RagDocument> = {}): RagDocument {
  return {
    id: "doc-1",
    filename: "report.pdf",
    mimeType: "application/pdf",
    uploadedAt: "2026-04-01T10:00:00.000Z",
    chunkCount: 42,
    status: "ready",
    ...overrides,
  };
}

describe("DocumentList", () => {
  it("render_ShouldShowEmptyState_WhenNoDocuments", () => {
    render(<DocumentList documents={[]} onDelete={vi.fn()} deleting={null} />);
    expect(screen.getByText(/no documents yet/i)).toBeInTheDocument();
  });

  it("render_ShouldDisplayFilename_WhenDocumentsProvided", () => {
    render(
      <DocumentList documents={[makeDocument()]} onDelete={vi.fn()} deleting={null} />
    );
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("render_ShouldDisplayReadyBadge_WhenStatusIsReady", () => {
    render(
      <DocumentList documents={[makeDocument({ status: "ready" })]} onDelete={vi.fn()} deleting={null} />
    );
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("render_ShouldDisplayParsingBadge_WhenStatusIsParsing", () => {
    render(
      <DocumentList
        documents={[makeDocument({ status: "parsing" })]}
        onDelete={vi.fn()}
        deleting={null}
      />
    );
    expect(screen.getByText("Parsing…")).toBeInTheDocument();
  });

  it("render_ShouldDisplayEmbeddingBadge_WhenStatusIsEmbedding", () => {
    render(
      <DocumentList
        documents={[makeDocument({ status: "embedding" })]}
        onDelete={vi.fn()}
        deleting={null}
      />
    );
    expect(screen.getByText("Embedding…")).toBeInTheDocument();
  });

  it("render_ShouldShowErrorMessage_WhenDocumentHasErrorMessage", () => {
    render(
      <DocumentList
        documents={[makeDocument({ status: "error", errorMessage: "Parse failed" })]}
        onDelete={vi.fn()}
        deleting={null}
      />
    );
    expect(screen.getByText("Parse failed")).toBeInTheDocument();
  });

  it("handleDelete_ShouldCallOnDelete_WhenDeleteButtonClicked", () => {
    const onDelete = vi.fn();
    render(
      <DocumentList documents={[makeDocument()]} onDelete={onDelete} deleting={null} />
    );
    fireEvent.click(screen.getByRole("button", { name: /delete report\.pdf/i }));
    expect(onDelete).toHaveBeenCalledWith("doc-1");
  });

  it("render_ShouldDisableDeleteButton_WhenDeletingMatchesDocumentId", () => {
    render(
      <DocumentList documents={[makeDocument()]} onDelete={vi.fn()} deleting="doc-1" />
    );
    expect(screen.getByRole("button", { name: /delete report\.pdf/i })).toBeDisabled();
  });

  it("render_ShouldShowMultipleDocuments_WhenListHasMoreThanOne", () => {
    const docs = [
      makeDocument({ id: "doc-1", filename: "file-a.pdf" }),
      makeDocument({ id: "doc-2", filename: "file-b.txt" }),
    ];
    render(<DocumentList documents={docs} onDelete={vi.fn()} deleting={null} />);
    expect(screen.getByText("file-a.pdf")).toBeInTheDocument();
    expect(screen.getByText("file-b.txt")).toBeInTheDocument();
  });
});
