import { Suspense } from "react";

import { HeaderSearch } from "@/components/layout/header-search";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavigationBreadcrumbs } from "@/components/layout/navigation-breadcrumbs";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <MobileNav />
      <div className="min-w-0 shrink-0">
        <Suspense>
          <NavigationBreadcrumbs />
        </Suspense>
      </div>
      <div className="flex flex-1 justify-center">
        <HeaderSearch />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <span
          aria-label="Thiago Borges Fernandes"
          className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
        >
          TF
        </span>
      </div>
    </header>
  );
}
