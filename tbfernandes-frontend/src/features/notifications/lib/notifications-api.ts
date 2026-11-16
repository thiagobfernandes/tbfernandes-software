import { apiFetch } from "@/lib/api/client";
import type { AppNotification } from "@/features/notifications/types";

// Notifications exist only on the server (the store's local mode has nothing to
// simulate them with), so the bell talks to the API directly.
const BASE = "/api/v1/notifications";

export const notificationsApi = {
  summary: () => apiFetch<{ unread: number }>(`${BASE}/summary`),
  list: () => apiFetch<AppNotification[]>(BASE),
  markRead: (id: string) =>
    apiFetch<AppNotification>(`${BASE}/${id}/read`, { method: "PUT" }),
  markAllRead: () => apiFetch<void>(`${BASE}/read-all`, { method: "POST" }),
  eventsUrl: (apiUrl: string) => `${apiUrl}${BASE}/events`,
};
