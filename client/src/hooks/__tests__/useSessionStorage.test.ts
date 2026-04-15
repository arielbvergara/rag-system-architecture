import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useSessionStorage } from "../useSessionStorage";

describe("useSessionStorage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("useSessionStorage_ShouldReturnInitialValue_WhenStorageIsEmpty", () => {
    const { result } = renderHook(() => useSessionStorage("key", []));
    expect(result.current[0]).toEqual([]);
  });

  it("useSessionStorage_ShouldReadPersistedValue_WhenStorageHasValue", () => {
    sessionStorage.setItem("key", JSON.stringify(["a", "b"]));
    const { result } = renderHook(() => useSessionStorage("key", [] as string[]));
    expect(result.current[0]).toEqual(["a", "b"]);
  });

  it("useSessionStorage_ShouldPersistStateToStorage_WhenStateChanges", () => {
    const { result } = renderHook(() => useSessionStorage("key", [] as string[]));
    act(() => {
      result.current[1](["hello"]);
    });
    expect(sessionStorage.getItem("key")).toBe(JSON.stringify(["hello"]));
  });

  it("useSessionStorage_ShouldReturnInitialValue_WhenStoredJsonIsInvalid", () => {
    sessionStorage.setItem("key", "not-valid-json{{{");
    const { result } = renderHook(() => useSessionStorage("key", 42));
    expect(result.current[0]).toBe(42);
  });

  it("useSessionStorage_ShouldSkipWrite_WhenValueEqualsInitialValue", () => {
    const { result } = renderHook(() => useSessionStorage("key", [] as string[]));
    // Initial value — storage should remain empty
    expect(result.current[0]).toEqual([]);
    expect(sessionStorage.getItem("key")).toBeNull();
  });

  it("useSessionStorage_ShouldHandleStringValues_WhenStoringStrings", () => {
    const { result } = renderHook(() => useSessionStorage("token", ""));
    act(() => {
      result.current[1]("my-token");
    });
    expect(sessionStorage.getItem("token")).toBe(JSON.stringify("my-token"));
    expect(result.current[0]).toBe("my-token");
  });
});
