"use client";

import { Component } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Expand,
  GripVertical,
  MoreHorizontal,
  Shrink,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LucideIcon } from "lucide-react";

import {
  type WidgetInstance,
  type WidgetSize,
  sizeClass,
  sizeLabels,
  widgetCatalog,
  widgetSizes,
} from "@/features/dashboard/lib/widgets";
import { cn } from "@/lib/utils";

/** A broken widget shows a quiet message instead of taking the page down. */
class WidgetBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Não foi possível mostrar este widget.{" "}
          <button
            type="button"
            className="underline hover:text-foreground"
            onClick={() => this.setState({ failed: false })}
          >
            Tentar de novo
          </button>
        </p>
      );
    return this.props.children;
  }
}

/** Size, order and removal: the same menu on every frame style. */
function WidgetMenu({
  widget,
  index,
  count,
  onChange,
  onMove,
  onRemove,
}: {
  widget: WidgetInstance;
  index: number;
  count: number;
  onChange: (patch: Partial<WidgetInstance>) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const meta = widgetCatalog[widget.type];
  const sizes = widgetSizes.filter(
    (size) => size >= meta.minSize && size <= meta.maxSize,
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Ações de ${meta.title}`}
          className="size-7 text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {sizes.length > 1 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Tamanho
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={String(widget.size)}
              onValueChange={(value) =>
                onChange({ size: Number(value) as WidgetSize })
              }
            >
              {sizes.map((size) => (
                <DropdownMenuRadioItem key={size} value={String(size)}>
                  {sizeLabels[size]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          disabled={index === 0}
          onSelect={() => onMove(index - 1)}
        >
          <ArrowUp /> Mover para antes
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={index === count - 1}
          onSelect={() => onMove(index + 1)}
        >
          <ArrowDown /> Mover para depois
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onRemove}>
          <X /> Remover da visão geral
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Shell of one widget: title with icon, actions (collapse, maximize, size,
 * move, remove) and the drag handle. `chrome` comes from the catalog: a
 * card, the highlighted card, or no frame (page header, indicators), which
 * keeps its menu on hover so it stays configurable.
 */
export function WidgetFrame({
  widget,
  icon: Icon,
  index,
  count,
  maximized,
  dragging,
  over,
  onChange,
  onMove,
  onRemove,
  onMaximize,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  children,
}: {
  widget: WidgetInstance;
  icon?: LucideIcon;
  index: number;
  count: number;
  maximized: boolean;
  dragging: boolean;
  over: boolean;
  onChange: (patch: Partial<WidgetInstance>) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
  onMaximize: (maximized: boolean) => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  children: React.ReactNode;
}) {
  const meta = widgetCatalog[widget.type];
  const chrome = meta.chrome ?? "card";
  const titleId = `widget-${widget.id}-title`;
  const menu = (
    <WidgetMenu
      widget={widget}
      index={index}
      count={count}
      onChange={onChange}
      onMove={onMove}
      onRemove={onRemove}
    />
  );
  const drop = {
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      onDragOver();
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      onDrop();
    },
  };
  const drag = {
    draggable: !maximized,
    onDragStart: (event: React.DragEvent) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/widget-id", widget.id);
      onDragStart();
    },
    onDragEnd,
  };
  const layout = cn(
    "group/widget relative flex min-w-0 flex-col transition-[opacity,box-shadow,border-color] duration-200",
    maximized ? "col-span-12 min-h-full" : sizeClass[widget.size],
    dragging && "opacity-40",
    over && !dragging && "rounded-xl ring-2 ring-primary/40",
  );

  if (chrome === "bare") {
    return (
      <section aria-label={meta.title} {...drop} className={layout}>
        <div
          {...drag}
          className="absolute top-0 right-0 z-10 flex items-center gap-0.5 rounded-md bg-background/80 opacity-0 transition-opacity group-hover/widget:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100"
        >
          <GripVertical
            aria-hidden
            className="size-3.5 cursor-grab text-muted-foreground/60"
          />
          {menu}
        </div>
        <WidgetBoundary>{children}</WidgetBoundary>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={titleId}
      {...drop}
      className={cn(
        layout,
        "rounded-xl border bg-card shadow-[0_1px_0_0_color-mix(in_oklab,var(--foreground)_4%,transparent)_inset,0_8px_24px_-16px_rgb(0_0_0/0.6)] hover:border-foreground/15",
        chrome === "featured" &&
          "border-primary/30 bg-[linear-gradient(140deg,color-mix(in_oklab,var(--primary)_9%,var(--card))_0%,var(--card)_55%)] hover:border-primary/45",
      )}
    >
      <header
        {...drag}
        className={cn(
          "flex h-11 shrink-0 items-center gap-1.5 pr-1.5 pl-3",
          !maximized && "cursor-grab active:cursor-grabbing",
        )}
      >
        {Icon && (
          <Icon
            aria-hidden
            className={cn(
              "size-4 shrink-0",
              chrome === "featured" ? "text-primary" : "text-muted-foreground",
            )}
          />
        )}
        <h2
          id={titleId}
          className={cn(
            "min-w-0 flex-1 truncate text-[13px] font-medium",
            chrome === "featured" &&
              "text-[11px] font-semibold tracking-[0.14em] text-primary uppercase",
          )}
        >
          {meta.title}
        </h2>
        <GripVertical
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground/0 transition-colors group-hover/widget:text-muted-foreground/50"
        />
        <button
          type="button"
          onClick={() => onChange({ collapsed: !widget.collapsed })}
          aria-expanded={!widget.collapsed}
          aria-label={
            widget.collapsed
              ? `Expandir ${meta.title}`
              : `Recolher ${meta.title}`
          }
          title={widget.collapsed ? "Expandir" : "Recolher"}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 outline-none group-hover/widget:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50 pointer-coarse:opacity-100"
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              widget.collapsed && "-rotate-90",
            )}
          />
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={maximized ? "Restaurar" : `Maximizar ${meta.title}`}
          title={maximized ? "Restaurar (Esc)" : "Maximizar"}
          onClick={() => onMaximize(!maximized)}
          className="size-7 text-muted-foreground opacity-0 group-hover/widget:opacity-100 hover:text-foreground focus-visible:opacity-100 pointer-coarse:opacity-100"
        >
          {maximized ? <Shrink /> : <Expand />}
        </Button>
        {menu}
      </header>
      {!widget.collapsed && (
        <div
          className={cn(
            "min-h-0 flex-1 px-4 pt-1 pb-4",
            maximized && "overflow-auto",
          )}
        >
          <WidgetBoundary>{children}</WidgetBoundary>
        </div>
      )}
    </section>
  );
}
