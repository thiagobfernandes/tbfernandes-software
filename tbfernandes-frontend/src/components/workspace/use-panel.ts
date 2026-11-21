"use client";

import { useCallback, useState } from "react";

import { resetPreferences, usePreference } from "@/lib/preferences";

export type PanelPrefs = { width: number; collapsed: boolean };

const fallbacks = new Map<string, PanelPrefs>();
/** One stable default object per panel id, as usePreference requires. */
function fallbackFor(id: string, width: number, collapsed: boolean) {
  const key = `${id}|${width}|${collapsed}`;
  let value = fallbacks.get(key);
  if (!value) {
    value = { width, collapsed };
    fallbacks.set(key, value);
  }
  return value;
}

/**
 * Width and collapsed state of a side panel, persisted as `tbf:panel:<id>`.
 * While dragging, the live width stays local and is saved on release.
 */
export function usePanel(
  id: string,
  {
    defaultWidth,
    defaultCollapsed = false,
  }: { defaultWidth: number; defaultCollapsed?: boolean },
) {
  const [prefs, setPrefs] = usePreference(
    `panel:${id}`,
    fallbackFor(id, defaultWidth, defaultCollapsed),
  );
  const [dragWidth, setDragWidth] = useState<number>();

  const setCollapsed = useCallback(
    (collapsed: boolean) => setPrefs((current) => ({ ...current, collapsed })),
    [setPrefs],
  );
  const commitWidth = useCallback(
    (width: number) => {
      setDragWidth(undefined);
      setPrefs((current) => ({ ...current, width, collapsed: false }));
    },
    [setPrefs],
  );

  return {
    width: dragWidth ?? prefs.width,
    dragging: dragWidth !== undefined,
    collapsed: prefs.collapsed,
    setCollapsed,
    toggle: () => setCollapsed(!prefs.collapsed),
    setDragWidth,
    commitWidth,
  };
}

/** Clears every panel of a page (`prefix` like "notes:") and its view prefs. */
export function resetLayout(...prefixes: string[]) {
  prefixes.forEach((prefix) => resetPreferences(prefix));
}
