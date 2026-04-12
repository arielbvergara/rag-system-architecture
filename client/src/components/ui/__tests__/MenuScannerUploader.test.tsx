import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { MenuScannerUploader } from "../MenuScannerUploader";

const mockOnFilesChanged = vi.fn();

beforeAll(() => {
  // jsdom does not implement URL.createObjectURL / revokeObjectURL
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
  URL.revokeObjectURL = vi.fn();
});

function makeImageFile(name = "menu.jpg", type = "image/jpeg", size = 1024): File {
  return new File(["x".repeat(size)], name, { type });
}

function makeFiles(count: number): File[] {
  return Array.from({ length: count }, (_, i) =>
    makeImageFile(`menu-page-${i + 1}.jpg`, "image/jpeg")
  );
}

describe("MenuScannerUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Empty state ──────────────────────────────────────────────────────────────

  it("render_ShouldShowDropZone_WhenNoFilesSelected", () => {
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={[]}
        disabled={false}
      />
    );
    expect(screen.getByText(/Drop menu images here/i)).toBeInTheDocument();
    expect(screen.getByText(/JPEG, PNG, WEBP/i)).toBeInTheDocument();
  });

  it("render_ShouldNotShowThumbnailGrid_WhenNoFilesSelected", () => {
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={[]}
        disabled={false}
      />
    );
    expect(screen.queryByText(/Page 1/)).not.toBeInTheDocument();
  });

  // ── Single file ──────────────────────────────────────────────────────────────

  it("render_ShouldShowPageOneBadge_WhenOneFileIsSelected", () => {
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={[makeImageFile("steak-menu.jpg")]}
        disabled={false}
      />
    );
    expect(screen.getByText("Page 1")).toBeInTheDocument();
  });

  it("render_ShouldShowRemoveButton_WhenOneFileIsSelected", () => {
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={[makeImageFile()]}
        disabled={false}
      />
    );
    expect(screen.getByRole("button", { name: "Remove page 1" })).toBeInTheDocument();
  });

  it("render_ShouldStillShowDropZone_WhenOnlyOneFileIsSelected", () => {
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={[makeImageFile()]}
        disabled={false}
      />
    );
    // With 1 file (< max), drop zone should still appear with "Add more" text
    expect(screen.getByText(/Drop more images here/i)).toBeInTheDocument();
  });

  // ── Multiple files ───────────────────────────────────────────────────────────

  it("render_ShouldShowCorrectPageBadges_WhenMultipleFilesSelected", () => {
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={makeFiles(3)}
        disabled={false}
      />
    );
    expect(screen.getByText("Page 1")).toBeInTheDocument();
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    expect(screen.getByText("Page 3")).toBeInTheDocument();
  });

  it("render_ShouldShowOrderingHint_WhenFilesAreSelected", () => {
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={makeFiles(2)}
        disabled={false}
      />
    );
    expect(screen.getByText(/processed in the order shown/i)).toBeInTheDocument();
  });

  // ── Max limit ────────────────────────────────────────────────────────────────

  it("render_ShouldHideDropZone_WhenMaxFilesReached", () => {
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={makeFiles(5)}
        disabled={false}
      />
    );
    expect(screen.queryByRole("button", { name: /upload menu images/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add more menu images/i })).not.toBeInTheDocument();
  });

  it("render_ShouldShowMaxReachedMessage_WhenMaxFilesReached", () => {
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={makeFiles(5)}
        disabled={false}
      />
    );
    expect(screen.getByText(/Maximum 5 images reached/i)).toBeInTheDocument();
  });

  // ── Removing files ───────────────────────────────────────────────────────────

  it("render_ShouldCallOnFilesChangedWithFileRemoved_WhenRemoveButtonClicked", () => {
    const files = makeFiles(2);
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={files}
        disabled={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove page 1" }));
    // Should receive array without the first file
    expect(mockOnFilesChanged).toHaveBeenCalledWith([files[1]]);
  });

  it("render_ShouldCallOnFilesChangedWithEmptyArray_WhenLastFileRemoved", () => {
    const files = [makeImageFile()];
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={files}
        disabled={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove page 1" }));
    expect(mockOnFilesChanged).toHaveBeenCalledWith([]);
  });

  it("render_ShouldNotShowRemoveButtons_WhenDisabledPropIsTrue", () => {
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={makeFiles(2)}
        disabled={true}
      />
    );
    expect(screen.queryByRole("button", { name: /Remove page/i })).not.toBeInTheDocument();
  });

  // ── File input ───────────────────────────────────────────────────────────────

  it("render_ShouldCallOnFilesChangedWithMergedFiles_WhenUserSelectsNewFile", () => {
    const existing = [makeImageFile("page1.jpg")];
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={existing}
        disabled={false}
      />
    );
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const newFile = makeImageFile("page2.png", "image/png");
    fireEvent.change(input, { target: { files: [newFile] } });
    expect(mockOnFilesChanged).toHaveBeenCalledWith([existing[0], newFile]);
  });

  it("render_ShouldDeduplicateFiles_WhenFileWithSameNameIsAdded", () => {
    const existing = [makeImageFile("menu.jpg")];
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={existing}
        disabled={false}
      />
    );
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const duplicate = makeImageFile("menu.jpg"); // same name
    fireEvent.change(input, { target: { files: [duplicate] } });
    // Duplicate should be filtered out — result is still just the original file
    expect(mockOnFilesChanged).toHaveBeenCalledWith(existing);
  });

  it("render_ShouldBeDisabled_WhenDisabledPropIsTrue", () => {
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={[]}
        disabled={true}
      />
    );
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  // ── Drag-and-drop ────────────────────────────────────────────────────────────

  it("render_ShouldCallOnFilesChanged_WhenUserDropsValidFile", () => {
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={[]}
        disabled={false}
      />
    );
    const dropZone = screen.getByRole("button", { name: "Upload menu images" });
    const file = makeImageFile("menu.jpg", "image/jpeg");
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    expect(mockOnFilesChanged).toHaveBeenCalledWith([file]);
  });

  it("render_ShouldNotCallOnFilesChanged_WhenDroppedOnDisabledZone", () => {
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={[]}
        disabled={true}
      />
    );
    const dropZone = screen.getByRole("button", { name: "Upload menu images" });
    fireEvent.drop(dropZone, { dataTransfer: { files: [makeImageFile()] } });
    expect(mockOnFilesChanged).not.toHaveBeenCalled();
  });

  it("render_ShouldCallOnFilesChangedWithMergedFiles_WhenUserDropsAdditionalFile", () => {
    const existing = [makeImageFile("page1.jpg")];
    render(
      <MenuScannerUploader
        onFilesChanged={mockOnFilesChanged}
        selectedFiles={existing}
        disabled={false}
      />
    );
    const dropZone = screen.getByRole("button", { name: "Add more menu images" });
    const dropped = makeImageFile("page2.jpg");
    fireEvent.drop(dropZone, { dataTransfer: { files: [dropped] } });
    expect(mockOnFilesChanged).toHaveBeenCalledWith([existing[0], dropped]);
  });
});
