"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function read(key: string) {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

/** A boolean preference kept in localStorage; false on the server and when storage is unavailable. */
export function useLocalStorageFlag(key: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => false,
  );

  const setValue = useCallback(
    (next: boolean) => {
      try {
        localStorage.setItem(key, String(next));
      } catch {
        // Storage unavailable: nothing to persist.
      }
      listeners.forEach((listener) => listener());
    },
    [key],
  );

  return [value, setValue] as const;
}
