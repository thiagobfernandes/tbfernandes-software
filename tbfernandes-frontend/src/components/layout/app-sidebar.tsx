"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ListCollapse } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { NavLinks } from "@/components/layout/nav-links";
import {
  resetNavGroups,
  useSidebarCollapsed,
  useSidebarShortcuts,
} from "@/components/layout/sidebar-state";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const [collapsed] = useSidebarCollapsed();
  useSidebarShortcuts();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-sidebar-border",
          collapsed ? "justify-center" : "justify-between pr-2 pl-4",
        )}
      >
        <Link
          href="/"
          aria-label="Ir para a visão geral"
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <BrandMark collapsed={collapsed} />
        </Link>
        {!collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={resetNavGroups}
                aria-label="Recolher grupos"
                className="text-muted-foreground hover:text-sidebar-accent-foreground"
              >
                <ListCollapse />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Recolher grupos
              <kbd className="ml-2 font-mono text-[10px] opacity-70">
                Ctrl .
              </kbd>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div
        className={cn(
          "flex flex-1 [scrollbar-width:thin] flex-col overflow-y-auto py-3",
          collapsed ? "px-2" : "px-2.5",
        )}
      >
        <Suspense>
          <NavLinks collapsed={collapsed} />
        </Suspense>
      </div>
    </aside>
  );
}
