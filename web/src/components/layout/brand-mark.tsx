import { cn } from "@/lib/utils";

export function BrandMark({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
        TB
      </span>
      {!collapsed && (
        <span className="truncate text-sm font-semibold text-sidebar-accent-foreground">
          TBFernandes
        </span>
      )}
    </div>
  );
}
