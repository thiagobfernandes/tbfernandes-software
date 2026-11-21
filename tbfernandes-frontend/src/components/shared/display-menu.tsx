"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * "Exibição" popover shared by every tool page: density, visible fields,
 * sorting and grouping. Compose it with the Display* rows below.
 */
export function DisplayMenu({
  children,
  onReset,
  label = "Exibição",
  iconOnly = false,
  className,
}: {
  children: React.ReactNode;
  onReset?: () => void;
  label?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={iconOnly ? "icon-sm" : "sm"}
          aria-label={iconOnly ? label : undefined}
          title={iconOnly ? label : undefined}
          className="text-muted-foreground hover:text-foreground"
        >
          <SlidersHorizontal />
          {!iconOnly && <span className="hidden sm:inline">{label}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn("flex w-80 flex-col gap-0 p-0", className)}
      >
        <div className="flex flex-col divide-y">{children}</div>
        {onReset && (
          <div className="flex justify-end border-t px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-7 text-xs text-muted-foreground"
            >
              <RotateCcw /> Restaurar padrão
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** A titled block inside the DisplayMenu. */
export function DisplaySection({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-2 px-3 py-3", className)}>
      {title && (
        <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

export function DisplayToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

/** Field chips: each toggles one property on the cards or rows. */
export function DisplayChips<T extends string>({
  options,
  selected,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const on = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() =>
              onChange(
                on
                  ? selected.filter((value) => value !== option.value)
                  : [...selected, option.value],
              )
            }
            className={cn(
              "inline-flex h-7 items-center rounded-md border px-2 text-xs transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-9",
              on
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function DisplaySelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <Select value={value} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger size="sm" className="h-8 w-40" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function DisplaySlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (n) => String(n),
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {format(value)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
        aria-label={label}
      />
    </div>
  );
}
