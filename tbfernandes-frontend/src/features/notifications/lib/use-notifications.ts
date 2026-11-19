"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { notificationsApi } from "@/features/notifications/lib/notifications-api";
import type { AppNotification } from "@/features/notifications/types";
import { env } from "@/lib/env";

const POLL_MS = 60_000;

/** The bell's data: loads, listens for new ones in real time and keeps the count. */
export function useNotifications() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(0);
  const enabled = env.dataSource === "api";
  const seen = useRef(new Set<string>());
  const initialized = useRef(false);

  const arrived = useCallback(
    (item: AppNotification) => {
      if (seen.current.has(item.id)) return;
      seen.current.add(item.id);
      setItems((current) =>
        [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, 50),
      );
      if (!item.readAt) setUnread((count) => count + 1);
      const open = () => {
        if (item.href?.startsWith("/") && !item.href.startsWith("//"))
          router.push(item.href);
      };
      toast(item.title, {
        description: item.body ?? undefined,
        action: item.href ? { label: "Ver", onClick: open } : undefined,
      });
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.visibilityState === "hidden"
      ) {
        const alert = new Notification(item.title, {
          body: item.body ?? undefined,
          tag: item.id,
          icon: "/brand/logo-symbol.png",
        });
        alert.onclick = () => {
          window.focus();
          open();
          alert.close();
        };
      }
    },
    [router],
  );

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const list = await notificationsApi.list();
      if (initialized.current)
        list.filter((item) => !item.readAt).forEach(arrived);
      list.forEach((item) => seen.current.add(item.id));
      initialized.current = true;
      setItems(list);
      setUnread((await notificationsApi.summary()).unread);
      setError(null);
    } catch {
      setError("Não foi possível carregar as notificações.");
    } finally {
      setReady(true);
    }
  }, [enabled, arrived]);

  useEffect(() => {
    if (!enabled) return;
    const initial = window.setTimeout(() => void load(), 0);
    // EventSource cannot attach the desktop authentication header: poll instead.
    const stream = env.desktopToken
      ? undefined
      : new EventSource(notificationsApi.eventsUrl(env.apiUrl), {
          withCredentials: true,
        });
    stream?.addEventListener("notification", (event) => {
      try {
        arrived(
          JSON.parse((event as MessageEvent<string>).data) as AppNotification,
        );
      } catch {
        /* malformed event: ignore */
      }
    });
    const timer = window.setInterval(load, env.desktopToken ? 15_000 : POLL_MS);
    window.addEventListener("focus", load);
    return () => {
      window.clearTimeout(initial);
      stream?.close();
      window.clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [enabled, load, arrived]);

  const markRead = useCallback(async (id: string) => {
    try {
      const updated = await notificationsApi.markRead(id);
      setItems((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      setUnread((await notificationsApi.summary()).unread);
    } catch {
      toast.error("Não foi possível marcar a notificação como lida.");
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setBusy(true);
    try {
      await notificationsApi.markAllRead();
      await load();
    } catch {
      toast.error("Não foi possível marcar as notificações como lidas.");
    } finally {
      setBusy(false);
    }
  }, [load]);

  return {
    enabled,
    ready,
    error,
    busy,
    items,
    unread,
    reload: load,
    markRead,
    markAllRead,
  };
}
