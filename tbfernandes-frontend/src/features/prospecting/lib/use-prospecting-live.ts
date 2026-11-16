"use client";

import { useEffect } from "react";
import { refreshProspecting } from "@/lib/api/remote-store";
import { env } from "@/lib/env";

export function useProspectingLive() {
  useEffect(() => {
    if (env.dataSource !== "api") return;
    const controller = new AbortController();
    let running = false;
    let pending = false;
    const refresh = async () => {
      if (running) {
        pending = true;
        return;
      }
      running = true;
      do {
        pending = false;
        try {
          await refreshProspecting(controller.signal);
        } catch {
          /* The next event or fallback refresh retries. */
        }
      } while (pending && !controller.signal.aborted);
      running = false;
    };
    // EventSource cannot attach the desktop authentication header.
    const stream = env.desktopToken
      ? undefined
      : new EventSource(`${env.apiUrl}/api/v1/prospecting/events`, {
          withCredentials: true,
        });
    stream?.addEventListener("changed", refresh);
    const timer = window.setInterval(
      refresh,
      env.desktopToken ? 3_000 : 30_000,
    );
    window.addEventListener("focus", refresh);
    void refresh();
    return () => {
      controller.abort();
      stream?.close();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
}
