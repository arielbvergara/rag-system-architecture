import { describe, it, expect } from "vitest";
import { getErrorMessage } from "../lib/errorUtils";

describe("getErrorMessage", () => {
  it("getErrorMessage_ShouldReturnErrorMessage_WhenErrIsAnError", () => {
    const err = new Error("something went wrong");
    expect(getErrorMessage(err, "fallback")).toBe("something went wrong");
  });

  it("getErrorMessage_ShouldReturnFallback_WhenErrIsAString", () => {
    expect(getErrorMessage("oops", "fallback")).toBe("fallback");
  });

  it("getErrorMessage_ShouldReturnFallback_WhenErrIsNull", () => {
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
  });

  it("getErrorMessage_ShouldReturnFallback_WhenErrIsUndefined", () => {
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
  });

  it("getErrorMessage_ShouldReturnFallback_WhenErrIsAnObject", () => {
    expect(getErrorMessage({ code: 500 }, "fallback")).toBe("fallback");
  });
});
