import { useState, useEffect, Dispatch, SetStateAction } from "react";

export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = sessionStorage.getItem(key);
      if (!stored) return initialValue;
      const parsed = JSON.parse(stored) as T;
      return parsed ?? initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (JSON.stringify(state) === JSON.stringify(initialValue)) return;
    sessionStorage.setItem(key, JSON.stringify(state));
  }, [state, key]); // eslint-disable-line react-hooks/exhaustive-deps

  return [state, setState];
}
