import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DocumentUploader } from "../DocumentUploader";

const VALID_FILE_PDF = new File(["content"], "report.pdf", { type: "application/pdf" });
const VALID_FILE_TXT = new File(["content"], "notes.txt", { type: "text/plain" });
const INVALID_FILE = new File(["content"], "image.png", { type: "image/png" });
const OVERSIZED_FILE = new File([new Uint8Array(11 * 1024 * 1024)], "big.pdf", {
  type: "application/pdf",
});

describe("DocumentUploader", () => {
  it("render_ShouldDisplayDropzone_WhenNotLoading", () => {
    render(<DocumentUploader onUpload={vi.fn()} loading={false} />);
    expect(screen.getByText(/drop a file here/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF, TXT, Markdown/i)).toBeInTheDocument();
  });

  it("render_ShouldDisplayUploadingText_WhenLoadingIsTrue", () => {
    render(<DocumentUploader onUpload={vi.fn()} loading={true} />);
    expect(screen.getByText("Uploading…")).toBeInTheDocument();
  });

  it("render_ShouldShowProgressBar_WhenProcessingStepIsProvided", () => {
    render(<DocumentUploader onUpload={vi.fn()} loading={false} processingStep="parsing" />);
    expect(screen.getByText("Parsing document…")).toBeInTheDocument();
  });

  it("render_ShouldNotShowProgressBar_WhenProcessingStepIsNull", () => {
    render(<DocumentUploader onUpload={vi.fn()} loading={false} processingStep={null} />);
    expect(screen.queryByText(/parsing/i)).not.toBeInTheDocument();
  });

  it("handleFile_ShouldCallOnUpload_WhenValidFileIsSelected", () => {
    const onUpload = vi.fn();
    render(<DocumentUploader onUpload={onUpload} loading={false} />);

    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [VALID_FILE_PDF] } });

    expect(onUpload).toHaveBeenCalledWith(VALID_FILE_PDF);
    expect(screen.queryByText(/only pdf/i)).not.toBeInTheDocument();
  });

  it("handleFile_ShouldShowValidationError_WhenFileTypeIsInvalid", () => {
    const onUpload = vi.fn();
    render(<DocumentUploader onUpload={onUpload} loading={false} />);

    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [INVALID_FILE] } });

    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByText(/only pdf, txt, and markdown/i)).toBeInTheDocument();
  });

  it("handleFile_ShouldShowValidationError_WhenFileSizeExceedsLimit", () => {
    const onUpload = vi.fn();
    render(<DocumentUploader onUpload={onUpload} loading={false} />);

    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [OVERSIZED_FILE] } });

    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByText(/10 mb limit/i)).toBeInTheDocument();
  });

  it("handleFile_ShouldAcceptTxtFileByExtension_WhenMimeTypeIsGeneric", () => {
    const onUpload = vi.fn();
    render(<DocumentUploader onUpload={onUpload} loading={false} />);

    const markdownFile = new File(["content"], "doc.md", { type: "text/plain" });
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [markdownFile] } });

    expect(onUpload).toHaveBeenCalledWith(markdownFile);
  });

  it("handleFile_ShouldClearValidationError_WhenValidFileFollowsInvalidOne", () => {
    const onUpload = vi.fn();
    render(<DocumentUploader onUpload={onUpload} loading={false} />);

    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [INVALID_FILE] } });
    expect(screen.getByText(/only pdf/i)).toBeInTheDocument();

    fireEvent.change(input, { target: { files: [VALID_FILE_TXT] } });
    expect(screen.queryByText(/only pdf/i)).not.toBeInTheDocument();
  });
});
