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
      <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
        TB
      </span>
      {!collapsed && (
        <span className="text-sidebar-accent-foreground truncate text-sm font-semibold">
          TBFernandes
        </span>
      )}
    </div>
  );
}
