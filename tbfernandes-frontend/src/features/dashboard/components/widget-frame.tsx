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

/**
 * Shell of one widget: title, actions (collapse, maximize, size, move,
 * remove) and the drag handle. The content comes from the registry.
 */
export function WidgetFrame({
  widget,
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
  const titleId = `widget-${widget.id}-title`;

  return (
    <section
      aria-labelledby={titleId}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      className={cn(
        "group/widget flex min-w-0 flex-col rounded-lg border bg-card transition-[opacity,box-shadow]",
        maximized ? "col-span-12 min-h-full" : sizeClass[widget.size],
        dragging && "opacity-40",
        over && !dragging && "ring-2 ring-primary/40",
      )}
    >
      <header
        draggable={!maximized}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/widget-id", widget.id);
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        className={cn(
          "flex h-10 shrink-0 items-center gap-1 pr-1.5 pl-2",
          !maximized && "cursor-grab active:cursor-grabbing",
          !widget.collapsed && "border-b border-border/60",
        )}
      >
        {!maximized && (
          <GripVertical
            aria-hidden
            className="size-3.5 shrink-0 text-muted-foreground/0 transition-colors group-hover/widget:text-muted-foreground/60"
          />
        )}
        <button
          type="button"
          onClick={() => onChange({ collapsed: !widget.collapsed })}
          aria-expanded={!widget.collapsed}
          aria-label={
            widget.collapsed
              ? `Expandir ${meta.title}`
              : `Recolher ${meta.title}`
          }
          className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              widget.collapsed && "-rotate-90",
            )}
          />
        </button>
        <h2
          id={titleId}
          className="min-w-0 flex-1 truncate text-[13px] font-medium"
        >
          {meta.title}
        </h2>
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
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Tamanho
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={String(widget.size)}
              onValueChange={(value) =>
                onChange({ size: Number(value) as WidgetSize })
              }
            >
              {widgetSizes
                .filter((size) => size >= meta.minSize && size <= meta.maxSize)
                .map((size) => (
                  <DropdownMenuRadioItem key={size} value={String(size)}>
                    {sizeLabels[size]}
                  </DropdownMenuRadioItem>
                ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
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
      </header>
      {!widget.collapsed && (
        <div
          className={cn(
            "min-h-0 flex-1 px-4 py-3",
            maximized && "overflow-auto",
          )}
        >
          <WidgetBoundary>{children}</WidgetBoundary>
        </div>
      )}
    </section>
  );
}
