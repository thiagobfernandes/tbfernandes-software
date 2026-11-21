"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Per-user UI preferences kept in localStorage as JSON under `tbf:<key>`.
 * Every hook on the same key shares one value, other tabs follow through the
 * `storage` event, and the server render (and a blocked storage) gets the
 * default. Use it for layout and display choices, never for data.
 */
const PREFIX = "tbf:";
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(PREFIX)) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

function readRaw(key: string) {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

/** Parsed value, cached by its raw string so snapshots stay referentially stable. */
function read<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return (hit.value ?? fallback) as T;
  let value: unknown = undefined;
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      // Objects merge over the default, so a new field gets its default value.
      value =
        isPlainObject(parsed) && isPlainObject(fallback)
          ? { ...fallback, ...parsed }
          : parsed;
    } catch {
      value = undefined;
    }
  }
  cache.set(key, { raw, value });
  return (value ?? fallback) as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Current value outside React (actions, event handlers). */
export function readPreference<T>(key: string, fallback: T): T {
  return read(key, fallback);
}

export function writePreference<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the choice lasts until the page reloads.
    cache.set(key, { raw: readRaw(key), value });
  }
  notify();
}

/** Removes every preference whose key starts with `prefix` ("" clears all). */
export function resetPreferences(prefix: string) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX + prefix)) localStorage.removeItem(key);
    }
  } catch {
    // Nothing stored.
  }
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  notify();
}

/**
 * A persisted preference. `fallback` must be stable (a module constant), since
 * it is returned as-is while nothing is stored.
 */
export function usePreference<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  );
  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const current = read(key, fallback);
      const resolved =
        typeof next === "function"
          ? (next as (current: T) => T)(current)
          : next;
      writePreference(key, resolved);
    },
    [key, fallback],
  );
  return [value, setValue] as const;
}
