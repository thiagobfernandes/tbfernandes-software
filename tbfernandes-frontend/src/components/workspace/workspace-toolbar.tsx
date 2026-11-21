import { cn } from "@/lib/utils";

/**
 * The 44px action bar at the top of a tool area (a list, a board, a document).
 * Left: title or view switch; `actions` sit on the right.
 */
export function WorkspaceToolbar({
  children,
  actions,
  className,
}: {
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "@container/toolbar flex h-11 shrink-0 items-center gap-2 border-b px-3 pointer-coarse:h-12",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        {children}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-0.5">{actions}</div>
      )}
    </div>
  );
}

/** Thin vertical divider between toolbar groups. */
export function ToolbarDivider() {
  return <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border" />;
}

/**
 * Fills the space under the global header, so a tool page (notes, board,
 * graph) scrolls inside its panels instead of the window.
 */
export function WorkspaceFrame({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex h-[calc(100svh-var(--header-h))] min-h-0 overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}
