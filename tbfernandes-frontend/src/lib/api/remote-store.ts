"use client";

// Keeps the client store in sync with the Spring Boot API when
// NEXT_PUBLIC_DATA_SOURCE=api. The store stays the source of truth for the
// screens: changes are applied locally first, then sent here one at a time.
// When the API refuses a change, the data is reloaded from the API, so the
// screen never keeps something the server does not have.

import { useSyncExternalStore } from "react";
import { toast } from "sonner";

import { ApiError, apiFetch } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";
import type { AppData, CollectionKey } from "@/lib/sample-data/store";

/** One flat REST resource per collection (docs/backend/api.md). */
export const endpoints: Record<CollectionKey, string> = {
  companies: "/api/v1/companies",
  projects: "/api/v1/projects",
  tasks: "/api/v1/tasks",
  notes: "/api/v1/notes",
  snippets: "/api/v1/snippets",
  methods: "/api/v1/methods",
  goals: "/api/v1/goals",
  milestones: "/api/v1/milestones",
  studies: "/api/v1/studies",
  materials: "/api/v1/materials",
  skills: "/api/v1/skills",
  certifications: "/api/v1/certifications",
  educations: "/api/v1/educations",
  financeEntries: "/api/v1/finance/entries",
  purchases: "/api/v1/finance/purchases",
  contacts: "/api/v1/contacts",
  interactions: "/api/v1/interactions",
};

/** Timestamps the API sends as instants but the screens handle as days. */
const dayFields: Partial<Record<CollectionKey, string[]>> = {
  tasks: ["completedAt"],
  notes: ["createdAt", "updatedAt"],
  snippets: ["createdAt", "updatedAt"],
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown) =>
  typeof value === "string" && UUID.test(value);

/** null → absent, as the frontend types use optional fields. */
function withoutNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutNulls);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, field]) => field !== null)
        .map(([name, field]) => [name, withoutNulls(field)]),
    );
  }
  return value;
}

export function fromApi<K extends CollectionKey>(key: K, raw: unknown) {
  const item = withoutNulls(raw) as Record<string, unknown>;
  for (const field of dayFields[key] ?? []) {
    if (typeof item[field] === "string")
      item[field] = (item[field] as string).slice(0, 10);
  }
  return item as AppData[K][number];
}

function toApi(key: CollectionKey, item: Record<string, unknown>) {
  const body: Record<string, unknown> = { ...item };
  delete body.id;
  if (key === "tasks" && Array.isArray(body.checklistItems)) {
    // Items added in the browser have short ids; the API assigns real ones.
    body.checklistItems = (body.checklistItems as { id?: string }[]).map(
      ({ id, ...rest }) => (isUuid(id) ? { id, ...rest } : rest),
    );
  }
  return body;
}

export async function fetchAppData(): Promise<AppData> {
  const keys = Object.keys(endpoints) as CollectionKey[];
  const lists = await Promise.all(
    keys.map((key) => apiFetch<unknown[]>(endpoints[key])),
  );
  return Object.fromEntries(
    keys.map((key, i) => [key, lists[i].map((raw) => fromApi(key, raw))]),
  ) as AppData;
}

// Connection state, for the data gate and the settings page.

export type RemoteStatus =
  | { state: "loading" }
  | { state: "ready"; mode: "single-user" | "session" }
  | { state: "signed-out" }
  | { state: "unreachable"; message: string };

let status: RemoteStatus = { state: "loading" };
const statusListeners = new Set<() => void>();

function setStatus(next: RemoteStatus) {
  status = next;
  statusListeners.forEach((listener) => listener());
}

export function useRemoteStatus() {
  return useSyncExternalStore(
    (listener) => {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    () => status,
    () => status,
  );
}

// Sync with the store.

type StoreHooks = {
  /** Replaces all data, e.g. after loading or after a refused change. */
  replaceAll(data: AppData): void;
  /** Puts the server's version of one record in place of the local one. */
  replaceItem<K extends CollectionKey>(key: K, item: AppData[K][number]): void;
};

let hooks: StoreHooks | undefined;
let queue: Promise<void> = Promise.resolve();

/** Changes go out one at a time and in order, so a follow-up never beats its parent. */
function enqueue(send: () => Promise<void>) {
  queue = queue.then(send).catch(handleFailure);
}

async function handleFailure(error: unknown) {
  if (error instanceof ApiError && error.problem.status === 401) {
    setStatus({ state: "signed-out" });
    return;
  }
  toast.error(
    error instanceof ApiError ? error.message : "The API could not be reached",
    { description: "Your change was not saved; showing the saved data." },
  );
  await reload();
}

export async function reload() {
  try {
    const session = await apiFetch<{
      mode: "single-user" | "session";
      signedIn: boolean;
    }>("/api/v1/auth/session");
    if (session.mode === "session" && !session.signedIn) {
      setStatus({ state: "signed-out" });
      return;
    }
    hooks?.replaceAll(await fetchAppData());
    setStatus({ state: "ready", mode: session.mode });
  } catch (error) {
    if (error instanceof ApiError && error.problem.status === 401) {
      setStatus({ state: "signed-out" });
    } else {
      setStatus({
        state: "unreachable",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export function connectRemote(storeHooks: StoreHooks) {
  if (hooks) return;
  hooks = storeHooks;
  void reload();
}

export const remote = {
  create<K extends CollectionKey>(key: K, item: AppData[K][number]) {
    enqueue(async () => {
      const saved = await apiFetch<unknown>(endpoints[key], {
        method: "POST",
        clientId: item.id,
        body: toApi(key, item as Record<string, unknown>),
      });
      hooks?.replaceItem(key, fromApi(key, saved));
    });
  },
  update<K extends CollectionKey>(key: K, item: AppData[K][number]) {
    enqueue(async () => {
      const saved = await apiFetch<unknown>(`${endpoints[key]}/${item.id}`, {
        method: "PUT",
        body: toApi(key, item as Record<string, unknown>),
      });
      hooks?.replaceItem(key, fromApi(key, saved));
    });
  },
  /** The API also unlinks or deletes what depends on the record, as the store does. */
  remove(key: CollectionKey, id: string) {
    enqueue(async () => {
      await apiFetch(`${endpoints[key]}/${id}`, { method: "DELETE" });
    });
  },
  /** Waits until every change sent so far has been answered. */
  settled: () => queue,
};

export async function signIn(email: string, password: string) {
  // Reading the session first sets the CSRF cookie the login needs.
  await apiFetch("/api/v1/auth/session");
  const body: components["schemas"]["LoginRequest"] = { email, password };
  await apiFetch("/api/v1/auth/login", { method: "POST", body });
  setStatus({ state: "loading" });
  await reload();
}

export async function signOut() {
  await apiFetch("/api/v1/auth/logout", { method: "POST" });
  setStatus({ state: "signed-out" });
}
