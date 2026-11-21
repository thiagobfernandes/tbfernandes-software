"use client";

import { Suspense } from "react";

import { FavoritePageButton } from "@/components/layout/favorite-page-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavigationBreadcrumbs } from "@/components/layout/navigation-breadcrumbs";
import { SidebarToggle } from "@/components/layout/sidebar-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useImmersive } from "@/components/workspace/workspace-state";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { CommandPalette } from "@/features/search/command-palette";
import { RunningTimerChip } from "@/features/time-tracking/components/running-timer-chip";

export function AppHeader() {
  // A maximized page takes the whole window, header included.
  if (useImmersive()) return null;

  return (
    <header className="sticky top-0 z-30 flex h-(--header-h) shrink-0 items-center gap-3 border-b bg-background px-3 md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <MobileNav />
        <SidebarToggle />
        <span
          aria-hidden
          className="mx-1.5 hidden h-4 w-px bg-border md:block"
        />
        <Suspense>
          <NavigationBreadcrumbs />
          <FavoritePageButton />
        </Suspense>
      </div>
      <div className="flex justify-center sm:w-full sm:max-w-md">
        <CommandPalette />
      </div>
      <div className="flex items-center justify-end gap-1 sm:flex-1">
        <RunningTimerChip />
        <NotificationBell />
        <ThemeToggle />
        <span
          aria-label="Thiago Borges Fernandes"
          title="Thiago Borges Fernandes"
          className="ml-1 flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
        >
          TF
        </span>
      </div>
    </header>
  );
}
