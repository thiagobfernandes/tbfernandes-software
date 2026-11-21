"use client";

import { ResizeHandle } from "@/components/workspace/resize-handle";
import { cn } from "@/lib/utils";

/**
 * A side panel of a page layout (the notes list, a task detail, the graph
 * inspector). It owns no state: pass `usePanel()` values in. Collapsed, it
 * takes no space but stays mounted, so its scroll and inputs survive.
 */
export function ResizablePanel({
  panel,
  min,
  max,
  defaultWidth,
  side = "left",
  label,
  className,
  children,
  ...props
}: {
  panel: {
    width: number;
    dragging: boolean;
    collapsed: boolean;
    setDragWidth: (width: number | undefined) => void;
    commitWidth: (width: number) => void;
    setCollapsed: (collapsed: boolean) => void;
  };
  min: number;
  max: number;
  defaultWidth: number;
  /** Where the panel sits; the handle goes on the opposite edge. */
  side?: "left" | "right";
  label: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<"aside">, "children">) {
  return (
    <aside
      aria-label={label}
      aria-hidden={panel.collapsed || undefined}
      inert={panel.collapsed || undefined}
      style={{ width: panel.collapsed ? 0 : panel.width }}
      className={cn(
        "relative flex min-h-0 shrink-0 flex-col bg-background",
        side === "left" ? "border-r" : "border-l",
        panel.collapsed && "overflow-hidden border-0",
        !panel.dragging &&
          "transition-[width] duration-200 ease-out motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{ minWidth: panel.collapsed ? panel.width : undefined }}
      >
        {children}
      </div>
      {!panel.collapsed && (
        <ResizeHandle
          side={side === "left" ? "right" : "left"}
          width={panel.width}
          min={min}
          max={max}
          defaultWidth={defaultWidth}
          label={`Redimensionar ${label.toLowerCase()}`}
          onResize={panel.setDragWidth}
          onResizeEnd={panel.commitWidth}
          collapseBelow={min - 60}
          onCollapse={() => {
            panel.setDragWidth(undefined);
            panel.setCollapsed(true);
          }}
        />
      )}
    </aside>
  );
}
