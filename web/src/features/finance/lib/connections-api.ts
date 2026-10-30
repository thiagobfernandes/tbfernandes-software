import type {
  BankConnection,
  ConnectToken,
  SyncResult,
} from "@/features/finance/types/connections";
import type { EntryScope } from "@/features/finance/types/finance";
import { apiFetch } from "@/lib/api/client";

// Bank connections exist only on the server: the store's local mode has nothing
// to simulate them with, so this screen talks to the API directly.
const BASE = "/api/v1/finance/connections";

export const connectionsApi = {
  availability: () => apiFetch<{ enabled: boolean }>(`${BASE}/availability`),
  list: () => apiFetch<BankConnection[]>(BASE),
  token: (scope: EntryScope) =>
    apiFetch<ConnectToken>(`${BASE}/token`, {
      method: "POST",
      body: { scope },
    }),
  reconnectToken: (id: string) =>
    apiFetch<ConnectToken>(`${BASE}/${id}/token`, { method: "POST" }),
  register: (itemId: string, scope: EntryScope) =>
    apiFetch<BankConnection>(BASE, {
      method: "POST",
      body: { itemId, scope },
    }),
  sync: (id: string) =>
    apiFetch<SyncResult>(`${BASE}/${id}/sync`, { method: "POST" }),
  disconnect: (id: string) =>
    apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" }),
};
