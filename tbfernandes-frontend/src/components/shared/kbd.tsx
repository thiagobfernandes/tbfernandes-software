import { cn } from "@/lib/utils";

/** A keyboard shortcut hint ("Ctrl B"), the same look everywhere. */
export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 items-center rounded border border-border/70 bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
