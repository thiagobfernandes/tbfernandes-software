"use client";

import { useSyncExternalStore } from "react";

import { templateOf } from "@/features/documents/lib/templates";
import type {
  DocumentDataByTemplate,
  DocumentTemplateId,
  SavedDocument,
} from "@/features/documents/types";
import { uuidv7 } from "@/lib/api/uuid";

/*
 * Documents live in this browser's localStorage, apart from the app store:
 * the API has no documents collection yet. Exported HTML/PDF files are the
 * durable copy; the template itself lives in the code.
 */
const STORAGE_KEY = "tbf-documents-v1";
const EMPTY: SavedDocument[] = [];

let cache: SavedDocument[] | null = null;
const listeners = new Set<() => void>();

function read(): SavedDocument[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as SavedDocument[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: SavedDocument[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep the in-memory copy for this session.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useDocuments() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

function now() {
  return new Date().toISOString();
}

/** Next number for the year, e.g. "2026-004". */
function nextNumber(templateId: DocumentTemplateId, today: string) {
  const year = today.slice(0, 4);
  const used = read()
    .filter((d) => d.templateId === templateId)
    .map((d) => d.data.number)
    .filter((n) => n.startsWith(`${year}-`))
    .map((n) => Number(n.slice(5)) || 0);
  const next = Math.max(0, ...used) + 1;
  return `${year}-${String(next).padStart(3, "0")}`;
}

function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const documentActions = {
  create<T extends DocumentTemplateId>(templateId: T): SavedDocument<T> {
    const template = templateOf(templateId);
    const today = localToday();
    const data = template.defaults(today, nextNumber(templateId, today));
    const doc: SavedDocument<T> = {
      id: uuidv7(),
      templateId,
      name: template.suggestedName(data),
      data,
      createdAt: now(),
      updatedAt: now(),
    };
    write([doc as SavedDocument, ...read()]);
    return doc;
  },

  update<T extends DocumentTemplateId>(
    id: string,
    patch: { name?: string; data?: DocumentDataByTemplate[T] },
  ) {
    write(
      read().map((d) =>
        d.id === id
          ? ({ ...d, ...patch, updatedAt: now() } as SavedDocument)
          : d,
      ),
    );
  },

  duplicate(id: string): SavedDocument | undefined {
    const source = read().find((d) => d.id === id);
    if (!source) return undefined;
    const copy: SavedDocument = {
      ...source,
      id: uuidv7(),
      name: `${source.name} (cópia)`,
      data: structuredClone(source.data),
      createdAt: now(),
      updatedAt: now(),
    };
    write([copy, ...read()]);
    return copy;
  },

  remove(id: string) {
    write(read().filter((d) => d.id !== id));
  },
};
