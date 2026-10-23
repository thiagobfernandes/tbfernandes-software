"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type TagInputProps = {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
};

/** Free tags: Enter or comma adds one, Backspace on an empty input removes the last. */
export function TagInput({
  id,
  value,
  onChange,
  placeholder = "Add a tag and press Enter",
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  }

  return (
    <div
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30",
        className,
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs"
        >
          #{tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            onClick={() => onChange(value.filter((item) => item !== tag))}
            className="rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => {
          const next = event.target.value;
          if (next.endsWith(",")) add(next.slice(0, -1));
          else setDraft(next);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            add(draft);
          } else if (event.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft && add(draft)}
        placeholder={value.length ? undefined : placeholder}
        className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
