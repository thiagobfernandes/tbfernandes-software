"use client";

import Link from "next/link";
import { Square } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useNow } from "@/features/time-tracking/hooks/use-now";
import {
  entrySeconds,
  formatClock,
  runningEntry,
} from "@/features/time-tracking/lib/time";
import { timeActions } from "@/features/time-tracking/lib/time-actions";
import { useAppData } from "@/lib/sample-data/store";

export function RunningTimerChip() {
  const { timeEntries } = useAppData();
  const running = runningEntry(timeEntries);
  const now = useNow(Boolean(running));
  if (!running) return null;

  return (
    <div className="flex items-center gap-1 rounded-full border bg-card py-0.5 pr-0.5 pl-3 text-sm">
      <Link
        href="/time-tracking"
        className="flex min-w-0 items-center gap-2"
        title={running.description}
      >
        <span
          aria-hidden
          className="size-2 shrink-0 animate-pulse rounded-full bg-primary"
        />
        <span className="hidden max-w-40 truncate lg:inline">
          {running.description}
        </span>
        <span className="tabular-nums">
          {formatClock(entrySeconds(running, now))}
        </span>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        aria-label="Parar apontamento"
        onClick={() => {
          timeActions.stop();
          toast.success("Apontamento parado", {
            description: running.description,
          });
        }}
      >
        <Square className="size-3.5" />
      </Button>
    </div>
  );
}
