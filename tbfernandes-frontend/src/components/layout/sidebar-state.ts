"use client";

import { useEffect } from "react";

import { isTyping } from "@/components/workspace/workspace-state";
import {
  isNavGroup,
  mainNavigation,
  type NavEntry,
  type NavGroup,
  type NavItem,
} from "@/lib/constants/navigation";
import {
  readPreference,
  usePreference,
  writePreference,
} from "@/lib/preferences";

export type SidebarMode = "expanded" | "compact" | "hidden";

export type Favorite = { href: string; label: string };

export type SidebarPrefs = {
  mode: SidebarMode;
  /** Expanded width in px. */
  width: number;
  /** Groups opened or closed by hand; the rest open when they hold the page. */
  openGroups: Record<string, boolean>;
  /** Entry keys (group title or top-level href) in the user's order. */
  order: string[];
  /** Per group, item hrefs in the user's order. */
  itemOrder: Record<string, string[]>;
  /** Entry keys and item hrefs moved to "Ocultos". */
  hidden: string[];
  favorites: Favorite[];
  projectsOpen: boolean;
};

export const SIDEBAR_WIDTH = { min: 200, max: 360, default: 240 } as const;
/** Dragging the edge narrower than this switches to the compact rail. */
export const SIDEBAR_COLLAPSE_AT = 150;

const KEY = "sidebar";
export const defaultSidebarPrefs: SidebarPrefs = {
  mode: "expanded",
  width: SIDEBAR_WIDTH.default,
  openGroups: {},
  order: [],
  itemOrder: {},
  hidden: [],
  favorites: [],
  projectsOpen: true,
};

export function useSidebarPrefs() {
  return usePreference(KEY, defaultSidebarPrefs);
}

export const entryKey = (entry: NavEntry) =>
  isNavGroup(entry) ? `group:${entry.title}` : entry.href;

/** Applies a stored order to a list, keeping unknown (new) entries at the end. */
function ordered<T>(list: T[], keyOf: (item: T) => string, order?: string[]) {
  if (!order?.length) return list;
  const rank = new Map(order.map((key, index) => [key, index]));
  return [...list].sort(
    (a, b) =>
      (rank.get(keyOf(a)) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(keyOf(b)) ?? Number.MAX_SAFE_INTEGER),
  );
}

export type ArrangedEntry =
  | { type: "item"; key: string; item: NavItem }
  | { type: "group"; key: string; group: NavGroup; items: NavItem[] };

/**
 * The navigation in the user's order, split in visible entries and the ones
 * moved to "Ocultos". `includeHidden` keeps hidden items inside their group
 * (the customize mode shows everything).
 */
export function arrangeNavigation(prefs: SidebarPrefs, includeHidden = false) {
  const hidden = new Set(prefs.hidden);
  const visible: ArrangedEntry[] = [];
  const hiddenItems: NavItem[] = [];
  for (const entry of ordered(mainNavigation, entryKey, prefs.order)) {
    const key = entryKey(entry);
    if (isNavGroup(entry)) {
      const items = ordered(
        entry.items,
        (item) => item.href,
        prefs.itemOrder[entry.title],
      );
      if (hidden.has(key) && !includeHidden) {
        hiddenItems.push(...items.filter((item) => !item.soon));
        continue;
      }
      const shown = includeHidden
        ? items
        : items.filter((item) => !hidden.has(item.href));
      hiddenItems.push(
        ...items.filter((item) => hidden.has(item.href) && !includeHidden),
      );
      visible.push({ type: "group", key, group: entry, items: shown });
    } else if (hidden.has(key) && !includeHidden) {
      hiddenItems.push(entry);
    } else {
      visible.push({ type: "item", key, item: entry });
    }
  }
  return { visible, hiddenItems };
}

function update(change: (prefs: SidebarPrefs) => SidebarPrefs) {
  writePreference(KEY, change(readPreference(KEY, defaultSidebarPrefs)));
}

export const sidebarActions = {
  setMode(mode: SidebarMode) {
    update((prefs) => ({ ...prefs, mode }));
  },
  toggleCompact() {
    update((prefs) => ({
      ...prefs,
      mode: prefs.mode === "expanded" ? "compact" : "expanded",
    }));
  },
  toggleHidden() {
    update((prefs) => ({
      ...prefs,
      mode: prefs.mode === "hidden" ? "expanded" : "hidden",
    }));
  },
  setWidth(width: number) {
    update((prefs) => ({ ...prefs, width, mode: "expanded" }));
  },
  setGroupOpen(title: string, open: boolean) {
    update((prefs) => ({
      ...prefs,
      openGroups: { ...prefs.openGroups, [title]: open },
    }));
  },
  setProjectsOpen(open: boolean) {
    update((prefs) => ({ ...prefs, projectsOpen: open }));
  },
  collapseGroups() {
    update((prefs) => ({ ...prefs, openGroups: {} }));
  },
  toggleFavorite(favorite: Favorite) {
    update((prefs) => {
      const exists = prefs.favorites.some((f) => f.href === favorite.href);
      return {
        ...prefs,
        favorites: exists
          ? prefs.favorites.filter((f) => f.href !== favorite.href)
          : [...prefs.favorites, favorite],
      };
    });
  },
  moveFavorite(href: string, toIndex: number) {
    update((prefs) => ({
      ...prefs,
      favorites: moveTo(
        prefs.favorites,
        prefs.favorites.findIndex((f) => f.href === href),
        toIndex,
      ),
    }));
  },
  toggleHiddenEntry(key: string) {
    update((prefs) => ({
      ...prefs,
      hidden: prefs.hidden.includes(key)
        ? prefs.hidden.filter((value) => value !== key)
        : [...prefs.hidden, key],
    }));
  },
  /** Moves a top-level entry to `toIndex` in the current visible order. */
  moveEntry(key: string, toIndex: number) {
    update((prefs) => {
      const keys = ordered(mainNavigation, entryKey, prefs.order).map(entryKey);
      return { ...prefs, order: moveTo(keys, keys.indexOf(key), toIndex) };
    });
  },
  moveItem(groupTitle: string, href: string, toIndex: number) {
    update((prefs) => {
      const group = mainNavigation.find(
        (entry): entry is NavGroup =>
          isNavGroup(entry) && entry.title === groupTitle,
      );
      if (!group) return prefs;
      const hrefs = ordered(
        group.items,
        (item) => item.href,
        prefs.itemOrder[groupTitle],
      ).map((item) => item.href);
      return {
        ...prefs,
        itemOrder: {
          ...prefs.itemOrder,
          [groupTitle]: moveTo(hrefs, hrefs.indexOf(href), toIndex),
        },
      };
    });
  },
  /** Back to the default layout; favorites stay. */
  resetLayout() {
    update((prefs) => ({
      ...defaultSidebarPrefs,
      favorites: prefs.favorites,
    }));
  },
};

function moveTo<T>(list: T[], from: number, to: number) {
  if (from < 0 || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, to)), 0, item);
  return next;
}

/**
 * Ctrl/⌘ B: expanded ↔ compact. Ctrl/⌘ \: hide or show the sidebar.
 * Ctrl/⌘ .: restore the default sidebar layout.
 */
export function useSidebarShortcuts() {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "b" && !event.shiftKey) {
        if (isTyping(event.target)) return;
        event.preventDefault();
        sidebarActions.toggleCompact();
      } else if (key === "\\") {
        event.preventDefault();
        sidebarActions.toggleHidden();
      } else if (key === ".") {
        event.preventDefault();
        sidebarActions.resetLayout();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
