"use client";

import { useSyncExternalStore } from "react";

import { apiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import { env } from "@/lib/env";

type Me = components["schemas"]["MeResponse"];

/**
 * The signed-in user (`GET /api/v1/me`), loaded once per page load and shared.
 * Local mode has no user, so it stays undefined there and screens fall back
 * to a neutral text instead of a made-up name.
 */
let current: Me | undefined;
let requested = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!requested && env.dataSource === "api") {
    requested = true;
    apiFetch<Me>("/api/v1/me")
      .then((me) => {
        current = me;
        listeners.forEach((notify) => notify());
      })
      .catch(() => {
        // Without the profile the screens just omit the name.
      });
  }
  return () => listeners.delete(listener);
}

export function useMe() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => undefined,
  );
}

/** "Thiago" from "Thiago Borges Fernandes". */
export function firstName(me?: Me) {
  return me?.name?.trim().split(/\s+/)[0];
}
