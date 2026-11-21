"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

/**
 * One-of-many switch for views and modes (Lista | Quadro | Por projeto).
 * `iconOnly` keeps the label for screen readers and the tooltip-less title.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  iconOnly = false,
  size = "default",
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  label: string;
  iconOnly?: boolean;
  size?: "sm" | "default";
  className?: string;
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => next && onChange(next as T)}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-md bg-muted/70 p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <ToggleGroupPrimitive.Item
            key={option.value}
            value={option.value}
            aria-label={iconOnly ? option.label : undefined}
            title={iconOnly ? option.label : undefined}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-xs [&_svg]:size-3.5 [&_svg]:shrink-0",
              size === "sm" ? "h-6" : "h-7 pointer-coarse:h-9",
              iconOnly && "px-2",
            )}
          >
            {Icon && <Icon aria-hidden />}
            {!iconOnly && option.label}
          </ToggleGroupPrimitive.Item>
        );
      })}
    </ToggleGroupPrimitive.Root>
  );
}
