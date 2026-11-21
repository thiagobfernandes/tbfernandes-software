"use client";

import { Star } from "lucide-react";

import {
  sidebarActions,
  useSidebarPrefs,
} from "@/components/layout/sidebar-state";
import { Button } from "@/components/ui/button";
import {
  type HealthLevel,
  type ProjectInsights,
  healthLabels,
  healthTone,
} from "@/features/projects/lib/project-insights";
import type { Project } from "@/features/projects/types/project";
import { projectHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** Health as a dot plus label; the reasons go in the title. */
export function HealthBadge({
  insights,
  showLabel = true,
  className,
}: {
  insights: Pick<ProjectInsights, "health" | "reasons">;
  showLabel?: boolean;
  className?: string;
}) {
  if (!insights.health) return null;
  const level: HealthLevel = insights.health;
  const why =
    insights.reasons.map((reason) => reason.text).join(" · ") ||
    "Nada pendente";
  return (
    <span
      title={`${healthLabels[level]}: ${why}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 text-xs",
        healthTone[level].text,
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", healthTone[level].dot)}
      />
      {showLabel ? (
        healthLabels[level]
      ) : (
        <span className="sr-only">{healthLabels[level]}</span>
      )}
    </span>
  );
}

/** Star that pins the project to the sidebar favorites. */
export function ProjectFavoriteButton({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  const [prefs] = useSidebarPrefs();
  const href = projectHref(project.id);
  const favorite = prefs.favorites.some((item) => item.href === href);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-pressed={favorite}
      aria-label={
        favorite
          ? `Desafixar ${project.name}`
          : `Fixar ${project.name} na sidebar`
      }
      title={favorite ? "Remover dos favoritos" : "Fixar na sidebar"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        sidebarActions.toggleFavorite({ href, label: project.name });
      }}
      className={cn(
        "text-muted-foreground hover:text-primary",
        favorite
          ? "text-primary"
          : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100",
        className,
      )}
    >
      <Star className={cn(favorite && "fill-current")} />
    </Button>
  );
}

/** Thin bar with a label and value, used for task and milestone progress. */
export function Meter({
  label,
  value,
  text,
  tone = "bg-primary",
}: {
  label: string;
  value: number;
  text: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{text}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", tone)}
          style={{
            width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`,
          }}
        />
      </div>
    </div>
  );
}
