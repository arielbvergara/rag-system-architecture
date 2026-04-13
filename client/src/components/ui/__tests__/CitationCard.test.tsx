import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CitationCard } from "../CitationCard";
import type { Citation } from "@/types";

vi.mock("@/lib/api", () => ({
  api: {
    documents: {
      getChunk: vi.fn(),
    },
  },
}));

import { api } from "@/lib/api";

function makeCitation(overrides: Partial<Citation> = {}): Citation {
  return {
    chunkId: "chunk-abc",
    documentId: "doc-1",
    filename: "guide.pdf",
    pageNumber: 3,
    excerpt: "This is the relevant excerpt from the document.",
    ...overrides,
  };
}

describe("CitationCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("render_ShouldReturnNull_WhenNoCitations", () => {
    const { container } = render(<CitationCard citations={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("render_ShouldDisplaySources_WhenCitationsProvided", () => {
    render(<CitationCard citations={[makeCitation()]} />);
    expect(screen.getByText(/sources/i)).toBeInTheDocument();
  });

  it("render_ShouldDisplayFilenameAndPageNumber_WhenPageNumberIsProvided", () => {
    render(<CitationCard citations={[makeCitation({ filename: "guide.pdf", pageNumber: 3 })]} />);
    expect(screen.getByText(/guide\.pdf · p\. 3/i)).toBeInTheDocument();
  });

  it("render_ShouldDisplayFilenameOnly_WhenPageNumberIsAbsent", () => {
    render(<CitationCard citations={[makeCitation({ pageNumber: undefined })]} />);
    expect(screen.getByText("guide.pdf")).toBeInTheDocument();
  });

  it("render_ShouldDisplayExcerpt_WhenCitationHasExcerpt", () => {
    render(<CitationCard citations={[makeCitation()]} />);
    expect(screen.getByText(/relevant excerpt/i)).toBeInTheDocument();
  });

  it("render_ShouldShowIndexBadge_WhenMultipleCitationsProvided", () => {
    render(
      <CitationCard
        citations={[
          makeCitation({ chunkId: "c1", filename: "a.pdf" }),
          makeCitation({ chunkId: "c2", filename: "b.pdf" }),
        ]}
      />
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("handleClick_ShouldOpenModal_WhenCitationButtonIsClicked", async () => {
    (api.documents.getChunk as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: {
        id: "chunk-abc",
        content: "Full chunk content here.",
        metadata: { documentId: "doc-1", filename: "guide.pdf", chunkIndex: 0, charStart: 0, charEnd: 100 },
      },
    });

    render(<CitationCard citations={[makeCitation()]} />);
    fireEvent.click(screen.getByRole("button", { name: /guide\.pdf/i }));

    await waitFor(() => {
      expect(screen.getByText("Full chunk content here.")).toBeInTheDocument();
    });
  });

  it("handleClick_ShouldShowError_WhenChunkFetchFails", async () => {
    (api.documents.getChunk as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: "Chunk not found",
    });

    render(<CitationCard citations={[makeCitation()]} />);
    fireEvent.click(screen.getByRole("button", { name: /guide\.pdf/i }));

    await waitFor(() => {
      expect(screen.getByText("Chunk not found")).toBeInTheDocument();
    });
  });

  it("handleClose_ShouldDismissModal_WhenCloseButtonClicked", async () => {
    (api.documents.getChunk as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: {
        id: "chunk-abc",
        content: "Full content.",
        metadata: { documentId: "doc-1", filename: "guide.pdf", chunkIndex: 0, charStart: 0, charEnd: 100 },
      },
    });

    render(<CitationCard citations={[makeCitation()]} />);
    fireEvent.click(screen.getByRole("button", { name: /guide\.pdf/i }));

    await waitFor(() => screen.getByText("Full content."));

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByText("Full content.")).not.toBeInTheDocument();
  });
});
