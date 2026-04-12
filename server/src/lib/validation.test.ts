import { describe, it, expect } from "vitest";
import { isValidEmail, isValidSpreadsheetId, isValidDriveFileId } from "./validation";

describe("isValidEmail", () => {
  it("isValidEmail_ShouldReturnTrue_WhenEmailIsValid", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user+tag@sub.domain.org")).toBe(true);
  });

  it("isValidEmail_ShouldReturnFalse_WhenEmailHasNoAtSign", () => {
    expect(isValidEmail("notanemail")).toBe(false);
  });

  it("isValidEmail_ShouldReturnFalse_WhenEmailHasSpaces", () => {
    expect(isValidEmail("user @example.com")).toBe(false);
  });

  it("isValidEmail_ShouldReturnFalse_WhenEmailIsEmpty", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("isValidEmail_ShouldReturnFalse_WhenEmailMissingDomain", () => {
    expect(isValidEmail("user@")).toBe(false);
  });
});

describe("isValidSpreadsheetId", () => {
  it("isValidSpreadsheetId_ShouldReturnTrue_WhenIdIsValid", () => {
    expect(isValidSpreadsheetId("1f1RxKGchgGyGHl9lQdOG8DIiOa6lh8xVIk")).toBe(true);
    expect(isValidSpreadsheetId("abcdefghij_-ABCDEFGHIJ1234567890")).toBe(true);
  });

  it("isValidSpreadsheetId_ShouldReturnFalse_WhenIdIsTooShort", () => {
    expect(isValidSpreadsheetId("short")).toBe(false);
  });

  it("isValidSpreadsheetId_ShouldReturnFalse_WhenIdHasInvalidChars", () => {
    expect(isValidSpreadsheetId("id with spaces!@#")).toBe(false);
  });
});

describe("isValidDriveFileId", () => {
  it("isValidDriveFileId_ShouldReturnTrue_WhenIdIsValid", () => {
    expect(isValidDriveFileId("1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms")).toBe(true);
    expect(isValidDriveFileId("abcde_-FGHIJ")).toBe(true);
  });

  it("isValidDriveFileId_ShouldReturnFalse_WhenIdIsTooShort", () => {
    expect(isValidDriveFileId("abc")).toBe(false);
  });

  it("isValidDriveFileId_ShouldReturnFalse_WhenIdHasInvalidChars", () => {
    expect(isValidDriveFileId("id with spaces")).toBe(false);
  });
});
