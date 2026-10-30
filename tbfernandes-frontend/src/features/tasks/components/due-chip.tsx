import { CalendarDays } from "lucide-react";

import { describeDue, formatShort } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function DueChip({
  dueDate,
  today,
  done = false,
  className,
}: {
  dueDate: string;
  today: string;
  done?: boolean;
  className?: string;
}) {
  const { label, tone } = done
    ? { label: `Vence ${formatShort(dueDate)}`, tone: "normal" as const }
    : describeDue(dueDate, today);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-muted-foreground",
        !done && tone === "overdue" && "border-destructive/40 text-destructive",
        !done && tone === "soon" && "border-warning/40 text-warning",
        className,
      )}
    >
      <CalendarDays className="size-3" aria-hidden />
      {label}
    </span>
  );
}
