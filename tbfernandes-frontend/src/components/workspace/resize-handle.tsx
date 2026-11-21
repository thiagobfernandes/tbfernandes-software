"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Vertical drag handle on a panel edge. Drag with the pointer, or focus it and
 * use the arrow keys (Shift for bigger steps); double-click restores the
 * default width. `side` is the edge it sits on: a left sidebar has it on the
 * right, a right detail panel on the left.
 */
export function ResizeHandle({
  width,
  min,
  max,
  defaultWidth,
  onResize,
  onResizeEnd,
  onDragState,
  side = "right",
  label,
  collapseBelow,
  onCollapse,
  className,
}: {
  width: number;
  min: number;
  max: number;
  defaultWidth: number;
  onResize: (width: number) => void;
  onResizeEnd?: (width: number) => void;
  onDragState?: (dragging: boolean) => void;
  side?: "left" | "right";
  label: string;
  /** Dragging under this width calls onCollapse instead of resizing. */
  collapseBelow?: number;
  onCollapse?: () => void;
  className?: string;
}) {
  const start = useRef<{ x: number; width: number; last: number }>(undefined);
  const clamp = (value: number) => Math.min(max, Math.max(min, value));

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = { x: event.clientX, width, last: width };
    onDragState?.(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = start.current;
    if (!drag) return;
    const delta = event.clientX - drag.x;
    const raw = drag.width + (side === "right" ? delta : -delta);
    drag.last = raw;
    if (collapseBelow !== undefined && raw < collapseBelow) return;
    onResize(clamp(raw));
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = start.current;
    if (!drag) return;
    start.current = undefined;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    onDragState?.(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    if (collapseBelow !== undefined && drag.last < collapseBelow && onCollapse)
      return onCollapse();
    onResizeEnd?.(clamp(drag.last));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 48 : 16;
    const grow = side === "right" ? "ArrowRight" : "ArrowLeft";
    const shrink = side === "right" ? "ArrowLeft" : "ArrowRight";
    let next: number | undefined;
    if (event.key === grow) next = clamp(width + step);
    else if (event.key === shrink) next = clamp(width - step);
    else if (event.key === "Home") next = min;
    else if (event.key === "End") next = max;
    else if (event.key === "Enter") next = defaultWidth;
    if (next === undefined) return;
    event.preventDefault();
    onResize(next);
    onResizeEnd?.(next);
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={Math.round(width)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => {
        onResize(defaultWidth);
        onResizeEnd?.(defaultWidth);
      }}
      onKeyDown={onKeyDown}
      title={`${label} (duplo clique restaura)`}
      className={cn(
        "group/resize absolute inset-y-0 z-20 w-2 cursor-col-resize touch-none outline-none",
        side === "right" ? "-right-1" : "-left-1",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover/resize:bg-primary/60 group-focus-visible/resize:bg-primary group-active/resize:bg-primary"
      />
    </div>
  );
}
