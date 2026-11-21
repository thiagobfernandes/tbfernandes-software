"use client";

import { useState } from "react";
import {
  Columns3,
  FolderKanban,
  GanttChart,
  LayoutGrid,
  List,
  Plus,
  Search,
} from "lucide-react";

import {
  DisplayChips,
  DisplayMenu,
  DisplaySection,
  DisplaySelect,
  DisplayToggle,
} from "@/components/shared/display-menu";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ActiveFilters,
  FilterGroup,
  FilterMenu,
} from "@/components/shared/filter-menu";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import {
  type SegmentedOption,
  SegmentedControl,
} from "@/components/shared/segmented-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ToolbarDivider,
  WorkspaceFrame,
  WorkspaceToolbar,
} from "@/components/workspace/workspace-toolbar";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
import {
  type HealthLevel,
  healthLabels,
  projectInsights,
} from "@/features/projects/lib/project-insights";
import {
  type ProjectDensity,
  type ProjectField,
  type ProjectGroupBy,
  type ProjectLayout,
  type ProjectSort,
  type ProjectsView,
  defaultProjectsView,
  emptyProjectFilters,
  fieldLabels,
  filterProjects,
  groupByLabels,
  groupProjects,
  layoutLabels,
  projectStatusOrder,
  sortLabels,
  sortProjects,
} from "@/features/projects/lib/project-view";
import {
  type ProjectCategory,
  projectCategoryLabels,
  projectStatusLabels,
} from "@/features/projects/types/project";
import { useNow } from "@/features/time-tracking/hooks/use-now";
import { usePreference } from "@/lib/preferences";
import { useWorkData } from "@/lib/sample-data/store";
import { useToday } from "@/lib/today";

import { ProjectCard } from "./project-card";
import {
  ProjectsBoard,
  ProjectsRoadmap,
  ProjectsTable,
} from "./projects-views";

const layoutOptions: SegmentedOption<ProjectLayout>[] = [
  { value: "cards", label: layoutLabels.cards, icon: LayoutGrid },
  { value: "list", label: layoutLabels.list, icon: List },
  { value: "board", label: layoutLabels.board, icon: Columns3 },
  { value: "timeline", label: layoutLabels.timeline, icon: GanttChart },
];

/**
 * Portfolio workspace: every project as cards, a compact list, a board by
 * status or a roadmap, grouped and filtered from one toolbar. Health is
 * computed from real records and kept apart from the lifecycle status.
 */
export function ProjectsPage() {
  const data = useWorkData();
  const today = useToday();
  const now = useNow(false);
  const [view, setView] = usePreference("projects:view", defaultProjectsView);
  const update = (patch: Partial<ProjectsView>) =>
    setView({ ...view, ...patch });
  const [query, setQuery] = useState("");

  const all = data.projects.map((project) => ({
    project,
    insights: projectInsights(project, data, today, now),
  }));
  const rows = sortProjects(filterProjects(all, view, query), view.sort);
  const groups = groupProjects(rows, view.groupBy, data);
  const { filters } = view;
  const setFilters = (patch: Partial<typeof filters>) =>
    update({ filters: { ...filters, ...patch } });

  const companyOptions = [
    ...data.companies
      .filter((company) =>
        data.projects.some((project) => project.companyId === company.id),
      )
      .map((company) => ({ value: company.id, label: company.name })),
    { value: "none", label: "Iniciativa pessoal" },
  ];
  const activeFilters = [
    ...filters.statuses.map((status) => ({
      key: `s:${status}`,
      label: projectStatusLabels[status],
      onRemove: () =>
        setFilters({
          statuses: filters.statuses.filter((item) => item !== status),
        }),
    })),
    ...filters.categories.map((category) => ({
      key: `c:${category}`,
      label: projectCategoryLabels[category],
      onRemove: () =>
        setFilters({
          categories: filters.categories.filter((item) => item !== category),
        }),
    })),
    ...filters.companyIds.map((id) => ({
      key: `e:${id}`,
      label: companyOptions.find((option) => option.value === id)?.label ?? id,
      onRemove: () =>
        setFilters({
          companyIds: filters.companyIds.filter((item) => item !== id),
        }),
    })),
    ...filters.health.map((level) => ({
      key: `h:${level}`,
      label: healthLabels[level],
      onRemove: () =>
        setFilters({ health: filters.health.filter((item) => item !== level) }),
    })),
  ];
  const attention = all.filter(
    (row) => row.insights.health && row.insights.health !== "ok",
  );
  const completedHidden =
    !view.showCompleted &&
    view.layout !== "board" &&
    all.some((row) => row.project.status === "completed");

  const viewProps = {
    companies: data.companies,
    fields: view.fields,
    density: view.density,
    today,
  };

  return (
    <WorkspaceFrame>
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceToolbar
          actions={
            <>
              <label className="relative hidden w-48 @[52rem]/toolbar:block">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar projeto"
                  aria-label="Buscar projetos"
                  className="h-8 border-transparent bg-muted/50 pl-8 text-sm shadow-none focus-visible:bg-background"
                />
              </label>
              <span className="hidden md:contents">
                <SampleDataBadge />
              </span>
              <FilterMenu
                activeCount={activeFilters.length}
                onClear={() => setFilters(emptyProjectFilters)}
              >
                <FilterGroup
                  title="Status"
                  selected={filters.statuses}
                  onChange={(statuses) => setFilters({ statuses })}
                  options={projectStatusOrder.map((status) => ({
                    value: status,
                    label: projectStatusLabels[status],
                    count: data.projects.filter(
                      (project) => project.status === status,
                    ).length,
                  }))}
                />
                <FilterGroup<HealthLevel>
                  title="Saúde"
                  selected={filters.health}
                  onChange={(health) => setFilters({ health })}
                  options={(["risk", "attention", "ok"] as const).map(
                    (level) => ({
                      value: level,
                      label: healthLabels[level],
                      count: all.filter((row) => row.insights.health === level)
                        .length,
                    }),
                  )}
                />
                <FilterGroup<ProjectCategory>
                  title="Categoria"
                  selected={filters.categories}
                  onChange={(categories) => setFilters({ categories })}
                  options={(
                    Object.keys(projectCategoryLabels) as ProjectCategory[]
                  ).map((category) => ({
                    value: category,
                    label: projectCategoryLabels[category],
                  }))}
                />
                <FilterGroup
                  title="Empresa"
                  selected={filters.companyIds}
                  onChange={(companyIds) => setFilters({ companyIds })}
                  options={companyOptions}
                />
              </FilterMenu>
              <DisplayMenu onReset={() => setView(defaultProjectsView)}>
                <DisplaySection title="Organizar">
                  <DisplaySelect<ProjectGroupBy>
                    label="Agrupar por"
                    value={view.groupBy}
                    onChange={(groupBy) => update({ groupBy })}
                    options={(
                      Object.keys(groupByLabels) as ProjectGroupBy[]
                    ).map((value) => ({ value, label: groupByLabels[value] }))}
                  />
                  <DisplaySelect<ProjectSort>
                    label="Ordenar por"
                    value={view.sort}
                    onChange={(sort) => update({ sort })}
                    options={(Object.keys(sortLabels) as ProjectSort[]).map(
                      (value) => ({ value, label: sortLabels[value] }),
                    )}
                  />
                  <DisplayToggle
                    label="Mostrar concluídos"
                    checked={view.showCompleted}
                    onChange={(showCompleted) => update({ showCompleted })}
                  />
                </DisplaySection>
                <DisplaySection title="Densidade">
                  <SegmentedControl<ProjectDensity>
                    label="Densidade"
                    value={view.density}
                    onChange={(density) => update({ density })}
                    options={[
                      { value: "compact", label: "Compacta" },
                      { value: "comfortable", label: "Confortável" },
                    ]}
                  />
                </DisplaySection>
                <DisplaySection title="Campos">
                  <DisplayChips<ProjectField>
                    label="Campos exibidos"
                    selected={view.fields}
                    onChange={(fields) => update({ fields })}
                    options={(Object.keys(fieldLabels) as ProjectField[]).map(
                      (value) => ({ value, label: fieldLabels[value] }),
                    )}
                  />
                </DisplaySection>
              </DisplayMenu>
              <ToolbarDivider />
              <ProjectFormDialog
                trigger={
                  <Button size="sm" className="h-8">
                    <Plus />{" "}
                    <span className="hidden sm:inline">Novo projeto</span>
                  </Button>
                }
              />
            </>
          }
        >
          <h1 className="hidden text-sm font-semibold sm:block">Projetos</h1>
          <span className="hidden sm:contents">
            <ToolbarDivider />
          </span>
          <SegmentedControl<ProjectLayout>
            label="Visualização"
            value={view.layout}
            onChange={(layout) => update({ layout })}
            options={layoutOptions}
            iconOnly
            className="@[60rem]/toolbar:hidden"
          />
          <SegmentedControl<ProjectLayout>
            label="Visualização"
            value={view.layout}
            onChange={(layout) => update({ layout })}
            options={layoutOptions}
            className="hidden @[60rem]/toolbar:inline-flex"
          />
        </WorkspaceToolbar>

        <div className="flex min-h-10 flex-wrap items-center gap-x-4 gap-y-1 border-b px-3 py-1.5 text-xs text-muted-foreground sm:px-4">
          <span className="tabular-nums">
            {rows.length} {rows.length === 1 ? "projeto" : "projetos"}
            {completedHidden && " · concluídos ocultos"}
          </span>
          {attention.length > 0 && (
            <button
              type="button"
              onClick={() => setFilters({ health: ["risk", "attention"] })}
              className="rounded-sm text-warning outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {attention.length}{" "}
              {attention.length === 1 ? "precisa" : "precisam"} de atenção
            </button>
          )}
          {activeFilters.length > 0 && (
            <ActiveFilters
              className="ml-auto"
              filters={activeFilters}
              onClear={() => setFilters(emptyProjectFilters)}
            />
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-auto">
          {data.projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="Nenhum projeto ainda"
              description="Projetos agrupam tarefas, notas e apontamentos em torno de um resultado."
              action={
                <ProjectFormDialog
                  trigger={
                    <Button size="sm">
                      <Plus /> Criar o primeiro projeto
                    </Button>
                  }
                />
              }
              className="m-4 border-0 sm:m-6"
            />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="Nenhum projeto com esses filtros"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFilters(emptyProjectFilters);
                    setQuery("");
                  }}
                >
                  Limpar filtros
                </Button>
              }
              className="m-4 border-0 sm:m-6"
            />
          ) : view.layout === "board" ? (
            <ProjectsBoard rows={rows} {...viewProps} />
          ) : (
            groups.map((group) => (
              <section key={group.key} aria-label={group.label || undefined}>
                {group.label && (
                  <h2 className="sticky top-0 z-20 flex h-9 items-center gap-2 border-b bg-background px-4 text-xs font-medium text-muted-foreground">
                    {group.label}
                    <span className="tabular-nums">{group.rows.length}</span>
                  </h2>
                )}
                {view.layout === "cards" ? (
                  <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3 2xl:grid-cols-4">
                    {group.rows.map(({ project, insights }) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        company={data.companies.find(
                          (company) => company.id === project.companyId,
                        )}
                        insights={insights}
                        {...viewProps}
                      />
                    ))}
                  </div>
                ) : view.layout === "list" ? (
                  <div className="overflow-x-auto">
                    <ProjectsTable rows={group.rows} {...viewProps} />
                  </div>
                ) : (
                  <ProjectsRoadmap rows={group.rows} {...viewProps} />
                )}
              </section>
            ))
          )}
        </div>
      </div>
    </WorkspaceFrame>
  );
}
