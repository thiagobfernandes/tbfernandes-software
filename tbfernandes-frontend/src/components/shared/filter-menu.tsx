"use client";

import { Check, ListFilter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type FilterOption<T extends string = string> = {
  value: T;
  label: string;
  /** Token class for a leading color dot (e.g. a project color). */
  dotClass?: string;
  count?: number;
};

/**
 * "Filtros" popover: the filter lists live here instead of chips that are
 * always on screen. The trigger shows how many filters are active.
 */
export function FilterMenu({
  activeCount,
  children,
  onClear,
}: {
  activeCount: number;
  children: React.ReactNode;
  onClear?: () => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-muted-foreground hover:text-foreground",
            activeCount > 0 && "text-foreground",
          )}
        >
          <ListFilter />
          <span className="hidden sm:inline">Filtros</span>
          {activeCount > 0 && (
            <span className="rounded bg-primary/15 px-1 text-[11px] font-semibold text-primary tabular-nums">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-72 flex-col gap-0 p-0">
        <div className="flex max-h-[min(28rem,70svh)] flex-col divide-y overflow-y-auto">
          {children}
        </div>
        {onClear && activeCount > 0 && (
          <div className="flex justify-end border-t px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={onClear}
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** One multi-select list inside the FilterMenu. */
export function FilterGroup<T extends string>({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: FilterOption<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
}) {
  if (options.length === 0) return null;
  return (
    <section className="flex flex-col gap-0.5 p-1.5">
      <h3 className="px-2 pt-1 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {options.map((option) => {
        const on = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role="menuitemcheckbox"
            aria-checked={on}
            onClick={() =>
              onChange(
                on
                  ? selected.filter((value) => value !== option.value)
                  : [...selected, option.value],
              )
            }
            className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent pointer-coarse:h-10"
          >
            <span
              aria-hidden
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                on && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {on && <Check className="size-3" />}
            </span>
            {option.dotClass && (
              <span
                aria-hidden
                className={cn("size-2 shrink-0 rounded-full", option.dotClass)}
              />
            )}
            <span className="truncate">{option.label}</span>
            {option.count !== undefined && (
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </section>
  );
}

export type ActiveFilter = { key: string; label: string; onRemove: () => void };

/** Active filters as compact removable pills, next to the toolbar. */
export function ActiveFilters({
  filters,
  onClear,
  className,
}: {
  filters: ActiveFilter[];
  onClear?: () => void;
  className?: string;
}) {
  if (filters.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex h-6 items-center gap-1 rounded-md border bg-muted/40 pr-0.5 pl-2 text-xs"
        >
          <span className="max-w-40 truncate">{filter.label}</span>
          <button
            type="button"
            onClick={filter.onRemove}
            aria-label={`Remover filtro ${filter.label}`}
            className="flex size-5 items-center justify-center rounded text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {onClear && filters.length > 1 && (
        <button
          type="button"
          onClick={onClear}
          className="h-6 rounded px-1.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Limpar
        </button>
      )}
    </div>
  );
}
