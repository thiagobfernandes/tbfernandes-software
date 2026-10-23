import { Suspense } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { NavigationBreadcrumbs } from "@/components/layout/navigation-breadcrumbs";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AppHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
      <MobileNav />
      <Suspense>
        <NavigationBreadcrumbs />
      </Suspense>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
