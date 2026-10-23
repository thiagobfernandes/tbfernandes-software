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
        "bg-card text-card-foreground relative flex min-h-36 flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-sm",
        className,
      )}
    >
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="flex items-end justify-between gap-4">
        <p className="flex items-baseline gap-1.5">
          <span className="text-4xl font-light tracking-tight tabular-nums">
            {value}
          </span>
          {unit && (
            <span className="text-muted-foreground text-sm">{unit}</span>
          )}
        </p>
        {visual && <div className="text-foreground shrink-0">{visual}</div>}
      </div>
    </div>
  );
}
