"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  checklistProgress,
  type ChecklistItem,
  type Task,
} from "@/features/tasks/types/task";
import { workActions } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

/** Itemized checklist inside the task sheet; methods add their steps here. */
export function TaskChecklist({ task }: { task: Task }) {
  const [draft, setDraft] = useState("");
  const items = task.checklistItems ?? [];
  const progress = checklistProgress(task);

  function save(next: ChecklistItem[]) {
    // Itemized items replace the old aggregate counter.
    workActions.updateTask(task.id, {
      checklistItems: next,
      checklist: undefined,
    });
  }

  function add() {
    const title = draft.trim();
    if (!title) return;
    save([
      ...items,
      { id: crypto.randomUUID().slice(0, 8), title, done: false },
    ]);
    setDraft("");
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">Checklist</h3>
      {progress && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {progress.done}/{progress.total}
          </span>
        </div>
      )}
      {items.length > 0 && (
        <ul className="flex flex-col">
          {items.map((item) => (
            <li
              key={item.id}
              className="group/item flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-accent/40"
            >
              <Checkbox
                id={`check-${item.id}`}
                checked={item.done}
                onCheckedChange={(next) =>
                  save(
                    items.map((current) =>
                      current.id === item.id
                        ? { ...current, done: next === true }
                        : current,
                    ),
                  )
                }
              />
              <label
                htmlFor={`check-${item.id}`}
                className={cn(
                  "flex-1 cursor-pointer text-sm",
                  item.done && "text-muted-foreground line-through",
                )}
              >
                {item.title}
              </label>
              <button
                type="button"
                aria-label={`Remover "${item.title}"`}
                onClick={() =>
                  save(items.filter((current) => current.id !== item.id))
                }
                className="rounded p-0.5 text-muted-foreground opacity-0 outline-none group-hover/item:opacity-100 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Adicionar item"
          aria-label="Novo item da checklist"
          className="h-8"
        />
        <button
          type="submit"
          aria-label="Adicionar"
          className="flex size-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Plus className="size-4" />
        </button>
      </form>
    </section>
  );
}
