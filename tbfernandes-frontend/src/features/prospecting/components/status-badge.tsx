import { Badge } from "@/components/ui/badge";
import { statusMeta } from "@/features/prospecting/lib/prospecting";
import type { LeadStatus } from "@/features/prospecting/types/prospecting";
import { cn } from "@/lib/utils";

const toneClass = {
  muted: "text-muted-foreground",
  primary: "border-primary/50 text-primary",
  success: "border-success/50 text-success",
  danger: "border-destructive/50 text-destructive",
} as const;

export function StatusBadge({ status }: { status: LeadStatus }) {
  const meta = statusMeta[status];
  return (
    <Badge variant="outline" className={cn("shrink-0", toneClass[meta.tone])}>
      {meta.label}
    </Badge>
  );
}
