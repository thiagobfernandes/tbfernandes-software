import {
  Briefcase,
  GraduationCap,
  HeartPulse,
  PiggyBank,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import type { GoalArea, GoalStatus } from "@/features/goals/types/goal";
import { cn } from "@/lib/utils";

export const goalAreaIcons: Record<GoalArea, LucideIcon> = {
  career: Briefcase,
  finance: PiggyBank,
  learning: GraduationCap,
  health: HeartPulse,
  personal: Sparkles,
};

const statusStyles: Record<GoalStatus, string> = {
  planned: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary",
  paused: "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
};

const statusLabels: Record<GoalStatus, string> = {
  planned: "Planejada",
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
};

export function GoalStatusBadge({ status }: { status: GoalStatus }) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        statusStyles[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
