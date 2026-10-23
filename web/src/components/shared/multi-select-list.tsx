"use client";

import { useId, useState } from "react";
import { Search } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type MultiSelectOption = {
  value: string;
  label: string;
  hint?: string;
};

type MultiSelectListProps = {
  id?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  emptyLabel?: string;
  className?: string;
};

/** Searchable checkbox list for linking an item to several others. */
export function MultiSelectList({
  id,
  options,
  value,
  onChange,
  emptyLabel = "Nothing to link yet.",
  className,
}: MultiSelectListProps) {
  const baseId = useId();
  const [query, setQuery] = useState("");
  const visible = options.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className={cn("flex flex-col rounded-md border", className)}>
      {options.length > 6 && (
        <label className="flex items-center gap-2 border-b px-2.5 py-1.5">
          <Search className="size-3.5 text-muted-foreground" aria-hidden />
          <input
            id={id}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
      )}
      <ul className="max-h-40 overflow-y-auto p-1">
        {visible.length === 0 && (
          <li className="px-2 py-2 text-xs text-muted-foreground">
            {options.length ? "No matches." : emptyLabel}
          </li>
        )}
        {visible.map((option) => {
          const checkboxId = `${baseId}-${option.value}`;
          const checked = value.includes(option.value);
          return (
            <li key={option.value}>
              <label
                htmlFor={checkboxId}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent/60"
              >
                <Checkbox
                  id={checkboxId}
                  checked={checked}
                  onCheckedChange={(next) =>
                    onChange(
                      next
                        ? [...value, option.value]
                        : value.filter((item) => item !== option.value),
                    )
                  }
                />
                <span className="truncate">{option.label}</span>
                {option.hint && (
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {option.hint}
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
