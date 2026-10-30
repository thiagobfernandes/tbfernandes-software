"use client";

import { Suspense } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { NavLinks } from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import { useLocalStorageFlag } from "@/hooks/use-local-storage-flag";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sidebar-collapsed";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useLocalStorageFlag(STORAGE_KEY);

  function toggle() {
    setCollapsed(!collapsed);
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border",
          collapsed ? "justify-center" : "px-4",
        )}
      >
        <BrandMark collapsed={collapsed} />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto p-3">
        <Suspense>
          <NavLinks collapsed={collapsed} />
        </Suspense>
      </div>
      <div
        className={cn(
          "flex border-t border-sidebar-border p-3",
          collapsed ? "justify-center" : "justify-end",
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          aria-label={
            collapsed ? "Expandir menu lateral" : "Recolher menu lateral"
          }
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>
    </aside>
  );
}
