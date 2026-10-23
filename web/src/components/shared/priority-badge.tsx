import { cn } from "@/lib/utils";

export type Priority = "low" | "normal" | "high" | "urgent";

const styles: Record<Priority, string> = {
  low: "text-muted-foreground",
  normal: "text-foreground",
  high: "text-warning",
  urgent: "text-destructive",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium capitalize",
        styles[priority],
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {priority}
    </span>
  );
}
