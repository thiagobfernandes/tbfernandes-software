import { cn } from "@/lib/utils";

export type Priority = "low" | "normal" | "high" | "urgent";

export const priorityText: Record<Priority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const tone: Record<Priority, string> = {
  low: "text-muted-foreground",
  normal: "text-muted-foreground",
  high: "text-warning",
  urgent: "text-destructive",
};

const level: Record<Priority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  urgent: 4,
};

/** Signal-strength bars: the number of filled bars is the priority. */
export function PriorityIcon({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const filled = level[priority];
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden
      className={cn("size-3 shrink-0", tone[priority], className)}
    >
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={i * 3}
          y={9 - i * 2.5}
          width="2"
          height={3 + i * 2.5}
          rx="0.5"
          className={i < filled ? "fill-current" : "fill-current opacity-25"}
        />
      ))}
    </svg>
  );
}

export function PriorityBadge({
  priority,
  iconOnly = false,
  className,
}: {
  priority: Priority;
  iconOnly?: boolean;
  className?: string;
}) {
  return (
    <span
      title={`Prioridade ${priorityText[priority].toLowerCase()}`}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        tone[priority],
        className,
      )}
    >
      <PriorityIcon priority={priority} />
      {iconOnly ? (
        <span className="sr-only">
          Prioridade {priorityText[priority].toLowerCase()}
        </span>
      ) : (
        priorityText[priority]
      )}
    </span>
  );
}
