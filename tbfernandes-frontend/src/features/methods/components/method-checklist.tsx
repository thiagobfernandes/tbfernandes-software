"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { MethodStep } from "@/features/methods/types/method";
import { cn } from "@/lib/utils";

/**
 * Walk through a method's steps. Progress is local to this visit; saving a
 * run against a task comes with the "Use this method" feature.
 */
export function MethodChecklist({ steps }: { steps: MethodStep[] }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const progress = Math.round((done.size / steps.length) * 100);

  function toggle(index: number) {
    setDone((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-label="Passos concluídos"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {done.size}/{steps.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDone(new Set())}
          disabled={done.size === 0}
        >
          <RotateCcw /> Recomeçar
        </Button>
      </div>

      <ol className="relative flex flex-col">
        {steps.map((step, index) => {
          const checked = done.has(index);
          const last = index === steps.length - 1;
          return (
            <li key={index} className="relative flex gap-4 pb-5 last:pb-0">
              {/* Connector between step markers, echoing the relationship tree. */}
              {!last && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-[2.875rem] bottom-0 left-[15px] w-px bg-border",
                    checked && "bg-primary/60",
                  )}
                />
              )}
              <span
                aria-hidden
                className={cn(
                  "relative z-10 mt-[7px] flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-xs font-medium tabular-nums",
                  checked &&
                    "border-primary bg-primary text-primary-foreground",
                )}
              >
                {index + 1}
              </span>
              <label className="flex flex-1 cursor-pointer items-start justify-between gap-4 rounded-xl border bg-card px-4 py-3 transition-colors hover:border-input">
                <span className="flex flex-col gap-0.5">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      checked && "text-muted-foreground line-through",
                    )}
                  >
                    {step.title}
                  </span>
                  {step.detail && (
                    <span className="text-sm text-muted-foreground">
                      {step.detail}
                    </span>
                  )}
                </span>
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(index)}
                  className="mt-0.5"
                  aria-label={`Marcar "${step.title}" como feito`}
                />
              </label>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
