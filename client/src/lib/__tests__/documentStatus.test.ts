import { describe, it, expect } from "vitest";
import {
  STATUS_STYLES,
  STATUS_LABELS,
  STEP_LABELS,
  PROCESSING_STEPS,
} from "../documentStatus";
import type { DocumentStatus } from "@/types";

const ALL_STATUSES: DocumentStatus[] = [
  "queued",
  "parsing",
  "chunking",
  "embedding",
  "ready",
  "error",
];

const TERMINAL_STATUSES: DocumentStatus[] = ["ready", "error"];

describe("documentStatus", () => {
  it("STATUS_STYLES_ShouldCoverAllDocumentStatuses_WhenDefined", () => {
    expect(Object.keys(STATUS_STYLES)).toHaveLength(ALL_STATUSES.length);
    for (const status of ALL_STATUSES) {
      expect(STATUS_STYLES[status]).toBeTruthy();
    }
  });

  it("STATUS_LABELS_ShouldCoverAllDocumentStatuses_WhenDefined", () => {
    expect(Object.keys(STATUS_LABELS)).toHaveLength(ALL_STATUSES.length);
    for (const status of ALL_STATUSES) {
      expect(STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it("PROCESSING_STEPS_ShouldNotIncludeTerminalStatuses_WhenDefined", () => {
    for (const terminal of TERMINAL_STATUSES) {
      expect(PROCESSING_STEPS).not.toContain(terminal);
    }
  });

  it("STEP_LABELS_ShouldOnlyContainProcessingStepKeys_WhenDefined", () => {
    for (const key of Object.keys(STEP_LABELS) as DocumentStatus[]) {
      expect(PROCESSING_STEPS).toContain(key);
    }
  });

  it("STATUS_LABELS_ShouldReturnReadyString_WhenStatusIsReady", () => {
    expect(STATUS_LABELS["ready"]).toBe("Ready");
  });

  it("STATUS_STYLES_ShouldReturnErrorStyles_WhenStatusIsError", () => {
    expect(STATUS_STYLES["error"]).toContain("var(--error)");
  });
});
