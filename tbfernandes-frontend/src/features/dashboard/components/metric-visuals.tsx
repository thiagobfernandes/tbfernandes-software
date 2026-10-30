import { cn } from "@/lib/utils";

/** Vertical tick bars; the last `highlight` bars use the accent color. */
export function TickBars({
  values,
  highlight = 4,
  className,
}: {
  values: number[];
  highlight?: number;
  className?: string;
}) {
  const max = Math.max(...values, 1);
  const width = values.length * 6;
  return (
    <svg
      viewBox={`0 0 ${width} 40`}
      className={cn("h-10 w-24", className)}
      aria-hidden
    >
      {values.map((value, index) => {
        const height = Math.max(4, (value / max) * 36);
        const accent = index >= values.length - highlight;
        return (
          <rect
            key={index}
            x={index * 6 + 1.5}
            y={40 - height}
            width={2}
            height={height}
            rx={1}
            className={accent ? "fill-primary" : "fill-muted-foreground/35"}
          />
        );
      })}
    </svg>
  );
}

/** Smooth trend line ending in a dot. */
export function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const width = 96;
  const height = 40;
  const points = values.map((value, index) => ({
    x: (index / (values.length - 1)) * (width - 6) + 3,
    y: height - 4 - ((value - min) / (max - min || 1)) * (height - 8),
  }));
  const path = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = points[index - 1];
      const midX = (previous.x + point.x) / 2;
      return `C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(" ");
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-10 w-24", className)}
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        strokeWidth={1.5}
        className="stroke-foreground"
      />
      <circle
        cx={last.x}
        cy={last.y}
        r={3}
        strokeWidth={1.5}
        className="fill-card stroke-primary"
      />
    </svg>
  );
}

/** Ring showing `value / total`. */
export function ProgressRing({
  value,
  total,
  className,
}: {
  value: number;
  total: number;
  className?: string;
}) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? value / total : 0;
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("size-12 -rotate-90", className)}
      aria-hidden
    >
      <circle
        cx={20}
        cy={20}
        r={radius}
        fill="none"
        strokeWidth={4}
        className="stroke-muted"
      />
      <circle
        cx={20}
        cy={20}
        r={radius}
        fill="none"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
        className="stroke-primary"
      />
    </svg>
  );
}

/** A row of dots, `active` of them highlighted in the warning color. */
export function DotRow({
  active,
  total = 8,
  className,
}: {
  active: number;
  total?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1.5", className)} aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "size-2 rounded-full",
            index < active ? "bg-warning" : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}
