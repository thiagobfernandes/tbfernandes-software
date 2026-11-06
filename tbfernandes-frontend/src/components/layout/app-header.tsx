import { Suspense } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { NavigationBreadcrumbs } from "@/components/layout/navigation-breadcrumbs";
import { SidebarToggle } from "@/components/layout/sidebar-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CommandPalette } from "@/features/search/command-palette";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <MobileNav />
        <SidebarToggle />
        <span aria-hidden className="mx-1 hidden h-5 w-px bg-border md:block" />
        <Suspense>
          <NavigationBreadcrumbs />
        </Suspense>
      </div>
      <div className="flex justify-center sm:w-full sm:max-w-md">
        <CommandPalette />
      </div>
      <div className="flex items-center justify-end gap-1 sm:flex-1">
        <ThemeToggle />
        <span
          aria-label="Thiago Borges Fernandes"
          title="Thiago Borges Fernandes"
          className="ml-1 flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-xs font-semibold text-primary-foreground ring-2 ring-background"
        >
          TF
        </span>
      </div>
    </header>
  );
}
