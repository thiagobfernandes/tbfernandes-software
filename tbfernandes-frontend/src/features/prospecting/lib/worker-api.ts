"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api/client";
import { env } from "@/lib/env";

// Whether the sending worker on the user's computer is connected exists only on
// the server (in memory), so this one call goes to the API directly.

export type WorkerPresence = { connected: boolean; lastSeenAt?: string };

const POLL_MS = 30_000;

/** null in local mode or while the first answer is on its way. */
export function useWorkerPresence() {
  const [presence, setPresence] = useState<WorkerPresence | null>(null);
  useEffect(() => {
    if (env.dataSource !== "api") return;
    let alive = true;
    const load = () =>
      apiFetch<WorkerPresence>("/api/v1/prospecting/worker")
        .then((value) => alive && setPresence(value))
        .catch(() => alive && setPresence(null));
    void load();
    const timer = window.setInterval(load, POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);
  return presence;
}
