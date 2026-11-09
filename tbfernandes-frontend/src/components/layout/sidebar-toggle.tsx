"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { useSidebarCollapsed } from "@/components/layout/sidebar-state";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Header button that collapses the desktop sidebar to an icon rail (Ctrl/⌘ B). */
export function SidebarToggle() {
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const label = collapsed ? "Expandir menu" : "Recolher menu";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={label}
          className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {label}
        <kbd className="ml-2 font-mono text-[10px] opacity-70">Ctrl B</kbd>
      </TooltipContent>
    </Tooltip>
  );
}
