import type {
  Company,
  Project,
  ProjectCategory,
  ProjectStatus,
} from "@/features/projects/types/project";
import {
  projectCategoryLabels,
  projectStatusLabels,
} from "@/features/projects/types/project";

import type { HealthLevel, ProjectInsights } from "./project-insights";

export type ProjectLayout = "cards" | "list" | "board" | "timeline";
export type ProjectGroupBy =
  "none" | "company" | "category" | "status" | "goal" | "health";
export type ProjectSort = "name" | "due" | "activity" | "progress";
export type ProjectDensity = "compact" | "comfortable";
export type ProjectField =
  | "company"
  | "description"
  | "health"
  | "tasks"
  | "milestones"
  | "next"
  | "due"
  | "activity"
  | "time"
  | "knowledge";

export type ProjectFilters = {
  statuses: ProjectStatus[];
  categories: ProjectCategory[];
  companyIds: string[];
  health: HealthLevel[];
};

/** Persisted as `tbf:projects:view`. */
export type ProjectsView = {
  layout: ProjectLayout;
  groupBy: ProjectGroupBy;
  sort: ProjectSort;
  density: ProjectDensity;
  fields: ProjectField[];
  filters: ProjectFilters;
  /** Completed projects stay out of cards, list and timeline unless asked. */
  showCompleted: boolean;
};

export const emptyProjectFilters: ProjectFilters = {
  statuses: [],
  categories: [],
  companyIds: [],
  health: [],
};

export const defaultProjectsView: ProjectsView = {
  layout: "cards",
  groupBy: "none",
  sort: "activity",
  density: "comfortable",
  fields: ["company", "health", "tasks", "milestones", "next", "due"],
  filters: emptyProjectFilters,
  showCompleted: false,
};

export const layoutLabels: Record<ProjectLayout, string> = {
  cards: "Portfólio",
  list: "Lista",
  board: "Quadro",
  timeline: "Roadmap",
};

export const groupByLabels: Record<ProjectGroupBy, string> = {
  none: "Sem agrupamento",
  company: "Empresa",
  category: "Categoria",
  status: "Status",
  goal: "Meta",
  health: "Saúde",
};

export const sortLabels: Record<ProjectSort, string> = {
  name: "Nome",
  due: "Prazo",
  activity: "Última atividade",
  progress: "Progresso das tarefas",
};

export const fieldLabels: Record<ProjectField, string> = {
  company: "Empresa",
  description: "Descrição",
  health: "Saúde",
  tasks: "Progresso das tarefas",
  milestones: "Marcos",
  next: "Próxima entrega",
  due: "Prazo",
  activity: "Última atividade",
  time: "Tempo investido",
  knowledge: "Notas e snippets",
};

export const projectStatusOrder: ProjectStatus[] = [
  "active",
  "planned",
  "paused",
  "completed",
];

export type ProjectRow = { project: Project; insights: ProjectInsights };

export function filterProjects(
  rows: ProjectRow[],
  view: ProjectsView,
  query: string,
) {
  const { filters } = view;
  const needle = query.trim().toLocaleLowerCase("pt-BR");
  return rows.filter(({ project, insights }) => {
    if (
      !view.showCompleted &&
      view.layout !== "board" &&
      project.status === "completed" &&
      !filters.statuses.includes("completed")
    )
      return false;
    if (filters.statuses.length && !filters.statuses.includes(project.status))
      return false;
    if (
      filters.categories.length &&
      !filters.categories.includes(project.category)
    )
      return false;
    if (
      filters.companyIds.length &&
      !filters.companyIds.includes(project.companyId ?? "none")
    )
      return false;
    if (
      filters.health.length &&
      (!insights.health || !filters.health.includes(insights.health))
    )
      return false;
    if (
      needle &&
      !`${project.name} ${project.description ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(needle)
    )
      return false;
    return true;
  });
}

export function sortProjects(rows: ProjectRow[], sort: ProjectSort) {
  const byName = (a: ProjectRow, b: ProjectRow) =>
    a.project.name.localeCompare(b.project.name, "pt-BR");
  return [...rows].sort((a, b) => {
    switch (sort) {
      case "due":
        return (
          (a.project.dueDate ?? "9").localeCompare(b.project.dueDate ?? "9") ||
          byName(a, b)
        );
      case "activity":
        return (
          (b.insights.lastActivity ?? "").localeCompare(
            a.insights.lastActivity ?? "",
          ) || byName(a, b)
        );
      case "progress":
        return (
          (b.insights.taskProgress ?? -1) - (a.insights.taskProgress ?? -1) ||
          byName(a, b)
        );
      default:
        return byName(a, b);
    }
  });
}

export type ProjectGroup = { key: string; label: string; rows: ProjectRow[] };

const healthOrder: (HealthLevel | "none")[] = [
  "risk",
  "attention",
  "ok",
  "none",
];
const healthGroupLabels: Record<HealthLevel | "none", string> = {
  risk: "Em risco",
  attention: "Precisa de atenção",
  ok: "Em dia",
  none: "Sem acompanhamento (pausados e concluídos)",
};

export function groupProjects(
  rows: ProjectRow[],
  groupBy: ProjectGroupBy,
  {
    companies,
    goals,
  }: { companies: Company[]; goals: { id: string; name: string }[] },
): ProjectGroup[] {
  if (groupBy === "none") return [{ key: "all", label: "", rows }];
  const groups = new Map<string, ProjectGroup>();
  const add = (key: string, label: string, row: ProjectRow) => {
    let group = groups.get(key);
    if (!group) {
      group = { key, label, rows: [] };
      groups.set(key, group);
    }
    group.rows.push(row);
  };
  for (const row of rows) {
    const { project, insights } = row;
    switch (groupBy) {
      case "company": {
        const company = companies.find((item) => item.id === project.companyId);
        add(company?.id ?? "none", company?.name ?? "Iniciativa pessoal", row);
        break;
      }
      case "category":
        add(project.category, projectCategoryLabels[project.category], row);
        break;
      case "status":
        add(project.status, projectStatusLabels[project.status], row);
        break;
      case "goal": {
        const goal = goals.find((item) => item.id === project.goalId);
        add(goal?.id ?? "none", goal?.name ?? "Sem meta", row);
        break;
      }
      case "health": {
        const key = insights.health ?? "none";
        add(key, healthGroupLabels[key], row);
        break;
      }
    }
  }
  const list = [...groups.values()];
  if (groupBy === "status")
    return list.sort(
      (a, b) =>
        projectStatusOrder.indexOf(a.key as ProjectStatus) -
        projectStatusOrder.indexOf(b.key as ProjectStatus),
    );
  if (groupBy === "health")
    return list.sort(
      (a, b) =>
        healthOrder.indexOf(a.key as HealthLevel) -
        healthOrder.indexOf(b.key as HealthLevel),
    );
  // "none" (personal, no goal) last, the rest by name.
  return list.sort(
    (a, b) =>
      Number(a.key === "none") - Number(b.key === "none") ||
      a.label.localeCompare(b.label, "pt-BR"),
  );
}
