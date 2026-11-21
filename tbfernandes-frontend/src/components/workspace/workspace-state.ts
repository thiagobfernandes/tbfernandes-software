"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Session-only workspace state: "immersive" hides the global sidebar and
 * header so a page (a maximized note, a board, the graph) can use the whole
 * window. Pages turn it on and must turn it off when they unmount.
 */
let immersive = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setImmersive(next: boolean) {
  if (immersive === next) return;
  immersive = next;
  document.documentElement.dataset.immersive = next ? "true" : "false";
  listeners.forEach((listener) => listener());
}

export function useImmersive() {
  return useSyncExternalStore(
    subscribe,
    () => immersive,
    () => false,
  );
}

/** Keeps immersive mode on while `active`, and always clears it on unmount. */
export function useImmersiveWhile(active: boolean) {
  useEffect(() => {
    setImmersive(active);
    return () => setImmersive(false);
  }, [active]);
}

export function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

/** True while a modal dialog or menu is open, so Escape belongs to it. */
export function overlayOpen() {
  return Boolean(
    document.querySelector(
      '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [role="menu"][data-state="open"]',
    ),
  );
}
