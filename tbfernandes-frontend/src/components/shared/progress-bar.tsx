import { cn } from "@/lib/utils";

type ProgressBarProps = {
  /** 0–100. */
  value: number;
  label: string;
  className?: string;
  barClassName?: string;
};

export function ProgressBar({
  value,
  label,
  className,
  barClassName,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width]",
          barClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
