import { useState } from "react";

/**
 * Manages a map of per-item states keyed by a string ID.
 * Useful for lists where each item needs independent UI state
 * (e.g. loading, confirming, copied feedback).
 */
export function useItemStates<T extends object>(defaultState: T) {
  const [states, setStates] = useState<Record<string, T>>({});

  function getState(key: string): T {
    return states[key] ?? defaultState;
  }

  function patchState(key: string, patch: Partial<T>) {
    setStates((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? defaultState), ...patch },
    }));
  }

  return { getState, patchState };
}
