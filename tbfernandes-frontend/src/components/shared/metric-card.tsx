import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: number | string;
  unit?: string;
  visual?: React.ReactNode;
  className?: string;
};

/** Large-number card after the Luma reference: label, value with unit, and a small visual. */
export function MetricCard({
  label,
  value,
  unit,
  visual,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-24 flex-col justify-between gap-2 overflow-hidden rounded-lg border bg-card p-4 text-card-foreground",
        className,
      )}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-end justify-between gap-4">
        <p className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </span>
          {unit && (
            <span className="text-xs text-muted-foreground">{unit}</span>
          )}
        </p>
        {visual && <div className="shrink-0 text-foreground">{visual}</div>}
      </div>
    </div>
  );
}
