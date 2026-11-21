import type { Routine } from "@/features/routines/types/routine";

export type RoutineLayout =
  "today" | "week" | "month" | "all" | "history" | "insights";

export const layoutLabels: Record<RoutineLayout, string> = {
  today: "Hoje",
  week: "Semana",
  month: "Mês",
  all: "Todas",
  history: "Histórico",
  insights: "Análise",
};

/** Persisted as `tbf:routines:view`. */
export type RoutinesView = {
  layout: RoutineLayout;
  projectIds: string[];
  goalIds: string[];
  /** Days covered by the analysis view. */
  window: 30 | 90;
};

export const defaultRoutinesView: RoutinesView = {
  layout: "today",
  projectIds: [],
  goalIds: [],
  window: 30,
};

/** Project and goal filters; "none" matches routines without one. */
export function matchesFilters(routine: Routine, view: RoutinesView) {
  if (
    view.projectIds.length > 0 &&
    !view.projectIds.includes(routine.projectId ?? "none")
  )
    return false;
  if (
    view.goalIds.length > 0 &&
    !view.goalIds.includes(routine.goalId ?? "none")
  )
    return false;
  return true;
}

export function byTimeThenTitle(first: Routine, second: Routine) {
  return (
    (first.startTime?.slice(0, 5) ?? "99").localeCompare(
      second.startTime?.slice(0, 5) ?? "99",
    ) || first.title.localeCompare(second.title, "pt-BR")
  );
}
