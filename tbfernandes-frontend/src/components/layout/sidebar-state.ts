"use client";

import { useEffect, useSyncExternalStore } from "react";

import { useLocalStorageFlag } from "@/hooks/use-local-storage-flag";

const COLLAPSED_KEY = "sidebar-collapsed";

/**
 * Groups the user opened or closed by hand. A group without an override
 * follows the default: open only when it holds the current page.
 */
let groupOverrides: Record<string, boolean> = {};
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

const emptyOverrides: Record<string, boolean> = {};

export function useNavGroupOverrides() {
  return useSyncExternalStore(
    subscribe,
    () => groupOverrides,
    () => emptyOverrides,
  );
}

export function setNavGroupOpen(title: string, open: boolean) {
  groupOverrides = { ...groupOverrides, [title]: open };
  notify();
}

export function resetNavGroups() {
  groupOverrides = {};
  notify();
}

export function useSidebarCollapsed() {
  return useLocalStorageFlag(COLLAPSED_KEY);
}

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

/**
 * Ctrl/⌘ B toggles the sidebar rail; Ctrl/⌘ . restores the default layout
 * (sidebar expanded, only the current page's group open).
 */
export function useSidebarShortcuts() {
  const [collapsed, setCollapsed] = useSidebarCollapsed();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      if (event.key.toLowerCase() === "b" && !event.shiftKey) {
        if (isTyping(event.target)) return;
        event.preventDefault();
        setCollapsed(!collapsed);
      } else if (event.key === ".") {
        event.preventDefault();
        setCollapsed(false);
        resetNavGroups();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [collapsed, setCollapsed]);
}
