"use client";

// Export (IDN-04) and import (IDN-05) of all data in the AppData format.

import { ApiError, apiFetch } from "@/lib/api/client";
import { endpoints, isUuid, reload } from "@/lib/api/remote-store";
import { uuidv5 } from "@/lib/api/uuid";
import type { AppData, CollectionKey } from "@/lib/sample-data/store";
import { STORAGE_KEY } from "@/lib/sample-data/store";

export type ExportFile = { version: 1; exportedAt: string; data: AppData };

export function downloadExport(data: AppData) {
  const file: ExportFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `tbfernandes-export-${file.exportedAt.slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Data the simulated mode saved in this browser, if any. */
export function readBrowserData(): Partial<AppData> | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<AppData>) : undefined;
  } catch {
    return undefined;
  }
}

export function parseExport(text: string): Partial<AppData> {
  const parsed = JSON.parse(text) as ExportFile | Partial<AppData>;
  return "data" in parsed && parsed.data
    ? parsed.data
    : (parsed as Partial<AppData>);
}

/** Parents before children, so every reference exists when it is sent. */
const importOrder: CollectionKey[] = [
  "companies",
  "goals",
  "projects",
  "tasks",
  "notes",
  "snippets",
  "methods",
  "milestones",
  "skills",
  "studies",
  "materials",
  "certifications",
  "educations",
  "financeEntries",
  "purchases",
  "contacts",
  "interactions",
];

const idListFields = ["projectIds", "taskIds", "skillIds", "studyIds"];

/** Short ids from the simulated mode become the same UUIDv5 the dev seed uses. */
async function mapIds(value: unknown, field?: string): Promise<unknown> {
  if (Array.isArray(value)) {
    return Promise.all(
      value.map((entry) =>
        idListFields.includes(field ?? "") ? toUuid(entry) : mapIds(entry),
      ),
    );
  }
  if (value && typeof value === "object") {
    const entries = await Promise.all(
      Object.entries(value).map(async ([name, entry]) => {
        if (name === "id" || name.endsWith("Id"))
          return [name, await toUuid(entry)];
        return [name, await mapIds(entry, name)];
      }),
    );
    return Object.fromEntries(entries);
  }
  return value;
}

async function toUuid(value: unknown) {
  if (typeof value !== "string" || isUuid(value)) return value;
  return uuidv5(value);
}

/** Sub-goals after their parent goal. */
function parentsFirst<T extends { id: string; parentId?: string }>(goals: T[]) {
  const ordered: T[] = [];
  const placed = new Set<string>();
  let pending = [...goals];
  while (pending.length) {
    const ready = pending.filter(
      (goal) =>
        !goal.parentId ||
        placed.has(goal.parentId) ||
        !goals.some((other) => other.id === goal.parentId),
    );
    if (!ready.length) break;
    ready.forEach((goal) => {
      ordered.push(goal);
      placed.add(goal.id);
    });
    pending = pending.filter((goal) => !placed.has(goal.id));
  }
  return [...ordered, ...pending];
}

export type ImportResult = {
  created: number;
  skipped: number;
  failed: string[];
};

/**
 * Sends every record to the API with a stable id. Records that already exist
 * (same id, e.g. the dev seed or an earlier import) answer 409 and are skipped.
 */
export async function importIntoApi(
  source: Partial<AppData>,
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const mapped = (await mapIds(source)) as Partial<AppData>;
  const jobs: { key: CollectionKey; item: { id: string } }[] = [];
  for (const key of importOrder) {
    let items = (mapped[key] ?? []) as { id: string; parentId?: string }[];
    if (key === "goals") items = parentsFirst(items);
    items.forEach((item) => jobs.push({ key, item }));
  }

  const result: ImportResult = { created: 0, skipped: 0, failed: [] };
  for (const [index, { key, item }] of jobs.entries()) {
    const { id, ...body } = item;
    try {
      await apiFetch(endpoints[key], { method: "POST", clientId: id, body });
      result.created++;
    } catch (error) {
      if (error instanceof ApiError && error.problem.status === 409) {
        result.skipped++;
      } else {
        result.failed.push(
          `${key} ${id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    onProgress?.(index + 1, jobs.length);
  }
  await reload();
  return result;
}
