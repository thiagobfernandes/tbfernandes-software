"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  Check,
  Columns3,
  Expand,
  List,
  Plus,
  Save,
  Search,
  Shrink,
  Star,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  sidebarActions,
  useSidebarPrefs,
} from "@/components/layout/sidebar-state";
import {
  DisplayChips,
  DisplayMenu,
  DisplaySection,
  DisplaySelect,
  DisplayToggle,
} from "@/components/shared/display-menu";
import {
  ActiveFilters,
  FilterGroup,
  FilterMenu,
  type ActiveFilter,
} from "@/components/shared/filter-menu";
import { priorityText } from "@/components/shared/priority-badge";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResizablePanel } from "@/components/workspace/resizable-panel";
import { useMediaQuery } from "@/components/workspace/use-media-query";
import { usePanel } from "@/components/workspace/use-panel";
import {
  isTyping,
  overlayOpen,
  useImmersiveWhile,
} from "@/components/workspace/workspace-state";
import {
  ToolbarDivider,
  WorkspaceFrame,
  WorkspaceToolbar,
} from "@/components/workspace/workspace-toolbar";
import { TaskDetail } from "@/features/tasks/components/task-detail";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import {
  TasksBoard,
  type Swimlane,
} from "@/features/tasks/components/tasks-board";
import { TasksTable } from "@/features/tasks/components/tasks-table";
import {
  activeFilterCount,
  defaultTasksView,
  densityLabels,
  doneLabels,
  emptyTaskFilters,
  fieldLabels,
  filterTasks,
  groupByLabels,
  groupTasks,
  layoutLabels,
  priorityOrder,
  sortLabels,
  sortTasks,
  swimlaneLabels,
  timeByTask,
  type DoneFilter,
  type SavedTaskView,
  type TaskDensity,
  type TaskField,
  type TaskFilters,
  type TaskGroupBy,
  type TaskLayout,
  type TaskSort,
  type TaskSwimlane,
  type TasksView,
} from "@/features/tasks/lib/task-view";
import {
  taskStatuses,
  taskStatusLabels,
  type TaskPriority,
  type TaskStatus,
} from "@/features/tasks/types/task";
import { uuidv7 } from "@/lib/api/uuid";
import { usePreference, writePreference } from "@/lib/preferences";
import { projectColorClasses } from "@/lib/project-colors";
import { selectors, useAppData, workActions } from "@/lib/sample-data/store";
import { useToday } from "@/lib/today";
import { cn } from "@/lib/utils";

const DETAIL = { min: 340, max: 760, default: 420 } as const;
const noSavedViews: SavedTaskView[] = [];
const viewHref = (id: string) => `/tasks?view=${id}`;

export function TasksPage() {
  const data = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = useToday();
  const { projectsById } = selectors(data);
  const [view, setView] = usePreference("tasks:view", defaultTasksView);
  const [filters, setFilters] = usePreference(
    "tasks:filters",
    emptyTaskFilters,
  );
  const [savedViews, setSavedViews] = usePreference(
    "tasks:saved",
    noSavedViews,
  );
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [openId, setOpenId] = useState<string>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [maximized, setMaximized] = useState(false);
  const [detailMaximized, setDetailMaximized] = useState(false);
  const detail = usePanel("tasks:detail", { defaultWidth: DETAIL.default });
  const desktop = useMediaQuery("(min-width: 768px)");
  const searchRef = useRef<HTMLInputElement>(null);
  const lastClicked = useRef<string>(undefined);
  const [sidebarPrefs] = useSidebarPrefs();
  const activeViewId = searchParams.get("view") ?? undefined;
  const activeView = savedViews.find((saved) => saved.id === activeViewId);

  // Opening a saved view (from the menu or a sidebar favorite) applies it.
  const applied = useRef<string>(undefined);
  useEffect(() => {
    if (!activeView || applied.current === activeView.id) return;
    applied.current = activeView.id;
    writePreference("tasks:view", activeView.view);
    writePreference("tasks:filters", activeView.filters);
    setQuery(activeView.query);
  }, [activeView]);

  const update = (patch: Partial<TasksView>) => setView({ ...view, ...patch });
  const groupContext = {
    projects: data.projects,
    companies: data.companies,
    today,
  };
  const visibleTasks = useMemo(
    () =>
      sortTasks(
        filterTasks(data.tasks, { query, filters, done: view.done, today }),
        view.sort,
      ),
    [data.tasks, query, filters, view.done, view.sort, today],
  );
  const columns = useMemo(
    () => groupTasks(visibleTasks, view.groupBy, groupContext),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleTasks, view.groupBy, data.projects, data.companies, today],
  );
  const swimlanes = useMemo<Swimlane[] | undefined>(() => {
    if (
      view.layout !== "board" ||
      view.swimlane === "none" ||
      view.swimlane === view.groupBy
    )
      return undefined;
    return groupTasks(visibleTasks, view.swimlane, groupContext)
      .filter((lane) => lane.tasks.length > 0)
      .map((lane) => ({
        key: lane.key,
        label: lane.label,
        dotClass: lane.dotClass,
        patch: lane.patch,
        columns: groupTasks(lane.tasks, view.groupBy, groupContext),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    visibleTasks,
    view.layout,
    view.swimlane,
    view.groupBy,
    data.projects,
    today,
  ]);
  const secondsByTask = useMemo(
    () => timeByTask(data.timeEntries),
    [data.timeEntries],
  );
  const ordered = useMemo(
    () => columns.flatMap((column) => column.tasks),
    [columns],
  );
  const openTask = data.tasks.find((task) => task.id === openId);

  useImmersiveWhile(maximized || detailMaximized);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "/" && !isTyping(event.target)) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (event.key !== "Escape" || event.defaultPrevented || overlayOpen())
        return;
      if (isTyping(event.target)) return;
      if (detailMaximized) setDetailMaximized(false);
      else if (selected.size > 0) setSelected(new Set());
      else if (openId) setOpenId(undefined);
      else if (maximized) setMaximized(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, openId, maximized, detailMaximized]);

  /** Click opens; Ctrl/⌘-click toggles selection; Shift-click selects a range. */
  function onSelectTask(id: string, event?: React.MouseEvent) {
    if (event && (event.metaKey || event.ctrlKey)) {
      setSelected((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      lastClicked.current = id;
      return;
    }
    if (event?.shiftKey && lastClicked.current) {
      const from = ordered.findIndex((task) => task.id === lastClicked.current);
      const to = ordered.findIndex((task) => task.id === id);
      if (from >= 0 && to >= 0) {
        const [a, b] = from < to ? [from, to] : [to, from];
        setSelected(new Set(ordered.slice(a, b + 1).map((task) => task.id)));
        return;
      }
    }
    lastClicked.current = id;
    setSelected(new Set());
    setOpenId(id);
    detail.setCollapsed(false);
  }

  function saveView(name: string) {
    const saved: SavedTaskView = { id: uuidv7(), name, view, filters, query };
    setSavedViews([...savedViews, saved]);
    applied.current = saved.id;
    router.replace(viewHref(saved.id), { scroll: false });
    toast.success(`Visualização "${name}" salva`);
  }

  const activeFilters: ActiveFilter[] = [
    ...filters.projectIds.map((id) => ({
      key: `p:${id}`,
      label:
        id === "none"
          ? "Sem projeto"
          : (projectsById.get(id)?.name ?? "Projeto"),
      onRemove: () =>
        setFilters({
          ...filters,
          projectIds: filters.projectIds.filter((v) => v !== id),
        }),
    })),
    ...filters.priorities.map((value) => ({
      key: `pr:${value}`,
      label: `Prioridade ${priorityText[value].toLowerCase()}`,
      onRemove: () =>
        setFilters({
          ...filters,
          priorities: filters.priorities.filter((v) => v !== value),
        }),
    })),
    ...filters.statuses.map((value) => ({
      key: `s:${value}`,
      label: taskStatusLabels[value],
      onRemove: () =>
        setFilters({
          ...filters,
          statuses: filters.statuses.filter((v) => v !== value),
        }),
    })),
    ...filters.tags.map((value) => ({
      key: `t:${value}`,
      label: value,
      onRemove: () =>
        setFilters({
          ...filters,
          tags: filters.tags.filter((v) => v !== value),
        }),
    })),
    ...filters.due.map((value) => ({
      key: `d:${value}`,
      label:
        value === "overdue"
          ? "Atrasadas"
          : value === "week"
            ? "Próximos 7 dias"
            : "Sem prazo",
      onRemove: () =>
        setFilters({ ...filters, due: filters.due.filter((v) => v !== value) }),
    })),
  ];
  const tags = [
    ...new Set(data.tasks.map((task) => task.tag).filter(Boolean) as string[]),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const favoriteViews = new Set(sidebarPrefs.favorites.map((f) => f.href));
  const showDetail = Boolean(openTask) && desktop;

  return (
    <WorkspaceFrame>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          detailMaximized && showDetail && "hidden",
        )}
      >
        <WorkspaceToolbar
          actions={
            <>
              <TaskSearch
                value={query}
                onChange={setQuery}
                inputRef={searchRef}
              />
              <FilterMenu
                activeCount={activeFilterCount(filters)}
                onClear={() => setFilters(emptyTaskFilters)}
              >
                <FilterGroup<TaskStatus>
                  title="Status"
                  selected={filters.statuses}
                  onChange={(statuses) => setFilters({ ...filters, statuses })}
                  options={[...taskStatuses, "canceled" as const].map(
                    (status) => ({
                      value: status,
                      label: taskStatusLabels[status],
                      count: data.tasks.filter((task) => task.status === status)
                        .length,
                    }),
                  )}
                />
                <FilterGroup<TaskPriority>
                  title="Prioridade"
                  selected={filters.priorities}
                  onChange={(priorities) =>
                    setFilters({ ...filters, priorities })
                  }
                  options={priorityOrder.map((priority) => ({
                    value: priority,
                    label: priorityText[priority],
                  }))}
                />
                <FilterGroup
                  title="Prazo"
                  selected={filters.due}
                  onChange={(due) =>
                    setFilters({ ...filters, due: due as TaskFilters["due"] })
                  }
                  options={[
                    { value: "overdue", label: "Atrasadas" },
                    { value: "week", label: "Próximos 7 dias" },
                    { value: "none", label: "Sem prazo" },
                  ]}
                />
                <FilterGroup
                  title="Projeto"
                  selected={filters.projectIds}
                  onChange={(projectIds) =>
                    setFilters({ ...filters, projectIds })
                  }
                  options={[
                    ...data.projects
                      .filter((project) => project.status !== "completed")
                      .map((project) => ({
                        value: project.id,
                        label: project.name,
                        dotClass: projectColorClasses[project.color].bg,
                      })),
                    {
                      value: "none",
                      label: "Sem projeto",
                      dotClass: "bg-muted-foreground/40",
                    },
                  ]}
                />
                <FilterGroup
                  title="Categoria"
                  selected={filters.tags}
                  onChange={(next) => setFilters({ ...filters, tags: next })}
                  options={tags.map((tag) => ({ value: tag, label: tag }))}
                />
              </FilterMenu>
              <TasksDisplayMenu view={view} onChange={update} />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-pressed={maximized}
                aria-label={maximized ? "Restaurar" : "Maximizar"}
                title={maximized ? "Restaurar (Esc)" : "Maximizar"}
                onClick={() => setMaximized(!maximized)}
                className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
              >
                {maximized ? <Shrink /> : <Expand />}
              </Button>
              <ToolbarDivider />
              <TaskFormDialog
                defaultProjectId={
                  filters.projectIds.length === 1
                    ? filters.projectIds[0]
                    : undefined
                }
                trigger={
                  <Button size="sm" className="h-8">
                    <Plus />{" "}
                    <span className="hidden sm:inline">Nova tarefa</span>
                  </Button>
                }
              />
            </>
          }
        >
          <h1 className="hidden text-sm font-semibold sm:block">Tarefas</h1>
          <SavedViewsMenu
            views={savedViews}
            active={activeView}
            favorites={favoriteViews}
            onOpen={(saved) => {
              applied.current = undefined;
              router.replace(viewHref(saved.id), { scroll: false });
            }}
            onClose={() => router.replace("/tasks", { scroll: false })}
            onSave={saveView}
            onUpdate={() => {
              if (!activeView) return;
              setSavedViews(
                savedViews.map((saved) =>
                  saved.id === activeView.id
                    ? { ...saved, view, filters, query }
                    : saved,
                ),
              );
              toast.success(`"${activeView.name}" atualizada`);
            }}
            onDelete={(saved) => {
              setSavedViews(savedViews.filter((item) => item.id !== saved.id));
              if (favoriteViews.has(viewHref(saved.id)))
                sidebarActions.toggleFavorite({
                  href: viewHref(saved.id),
                  label: saved.name,
                });
              if (saved.id === activeViewId)
                router.replace("/tasks", { scroll: false });
            }}
          />
          <ToolbarDivider />
          <SegmentedControl<TaskLayout>
            label="Visualização"
            value={view.layout}
            onChange={(layout) => update({ layout })}
            options={[
              { value: "board", label: layoutLabels.board, icon: Columns3 },
              { value: "list", label: layoutLabels.list, icon: List },
              { value: "table", label: layoutLabels.table, icon: Table2 },
            ]}
            iconOnly
            className="@[60rem]/toolbar:hidden"
          />
          <SegmentedControl<TaskLayout>
            label="Visualização"
            value={view.layout}
            onChange={(layout) => update({ layout })}
            options={[
              { value: "board", label: layoutLabels.board, icon: Columns3 },
              { value: "list", label: layoutLabels.list, icon: List },
              { value: "table", label: layoutLabels.table, icon: Table2 },
            ]}
            className="hidden @[60rem]/toolbar:inline-flex"
          />
        </WorkspaceToolbar>

        {(activeFilters.length > 0 || selected.size > 0) && (
          <div className="flex min-h-10 flex-wrap items-center gap-2 border-b px-3 py-1.5">
            {selected.size > 0 ? (
              <BulkBar
                ids={[...selected]}
                projects={data.projects}
                onDone={() => setSelected(new Set())}
              />
            ) : (
              <ActiveFilters
                filters={activeFilters}
                onClear={() => setFilters(emptyTaskFilters)}
              />
            )}
          </div>
        )}

        <div
          className={cn(
            "min-h-0 flex-1",
            view.layout !== "board" && "overflow-auto",
          )}
        >
          {view.layout === "board" ? (
            <TasksBoard
              tasks={visibleTasks}
              projectsById={projectsById}
              today={today}
              onSelectTask={onSelectTask}
              allowCreate
              columns={columns}
              swimlanes={swimlanes}
              view={view}
              onViewChange={update}
              selectedIds={selected}
              activeId={openId}
              secondsByTask={secondsByTask}
              fill
            />
          ) : (
            <TasksTable
              sections={columns.filter(
                (column) => !view.hidden.includes(column.key),
              )}
              variant={view.layout}
              projectsById={projectsById}
              today={today}
              density={view.density}
              fields={view.fields}
              onSelectTask={onSelectTask}
              selectedIds={selected}
              activeId={openId}
              secondsByTask={secondsByTask}
            />
          )}
        </div>
      </div>

      {showDetail && openTask && (
        <ResizablePanel
          panel={detailMaximized ? { ...detail, collapsed: false } : detail}
          side="right"
          min={DETAIL.min}
          max={DETAIL.max}
          defaultWidth={DETAIL.default}
          label="Detalhes da tarefa"
          className={cn(detailMaximized && "!w-full flex-1 border-0")}
        >
          <TaskDetail
            task={openTask}
            wide={detailMaximized}
            onClose={() => setOpenId(undefined)}
            toolbar={
              <>
                <ToolbarDivider />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={
                    detailMaximized ? "Restaurar painel" : "Abrir em tela cheia"
                  }
                  title={
                    detailMaximized ? "Restaurar (Esc)" : "Abrir em tela cheia"
                  }
                  onClick={() => setDetailMaximized(!detailMaximized)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {detailMaximized ? <Shrink /> : <Expand />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Fechar detalhes"
                  title="Fechar (Esc)"
                  onClick={() => {
                    setOpenId(undefined);
                    setDetailMaximized(false);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X />
                </Button>
              </>
            }
          />
        </ResizablePanel>
      )}
      {!desktop && (
        <TaskDetailSheet
          taskId={openId}
          onOpenChange={(open) => !open && setOpenId(undefined)}
        />
      )}
    </WorkspaceFrame>
  );
}

/** Inline search on a wide toolbar; a button with a popover when it is narrow. */
function TaskSearch({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const field = (
    <Input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Buscar  /"
      aria-label="Buscar tarefas"
      className="h-8 border-transparent bg-muted/50 pl-8 text-sm shadow-none focus-visible:bg-background"
    />
  );
  return (
    <>
      <label className="relative hidden w-52 @[56rem]/toolbar:block">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Buscar  /"
          aria-label="Buscar tarefas"
          className="h-8 border-transparent bg-muted/50 pl-8 text-sm shadow-none focus-visible:bg-background"
        />
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Buscar tarefas"
            className={cn(
              "text-muted-foreground hover:text-foreground @[56rem]/toolbar:hidden",
              value && "text-primary",
            )}
          >
            <Search />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-2">
          <label className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            {field}
          </label>
        </PopoverContent>
      </Popover>
    </>
  );
}

function TasksDisplayMenu({
  view,
  onChange,
}: {
  view: TasksView;
  onChange: (patch: Partial<TasksView>) => void;
}) {
  const option = <T extends string>(labels: Record<T, string>) =>
    (Object.keys(labels) as T[]).map((value) => ({
      value,
      label: labels[value],
    }));
  return (
    <DisplayMenu
      onReset={() => writePreference("tasks:view", defaultTasksView)}
    >
      <DisplaySection title="Organização">
        <DisplaySelect<TaskGroupBy>
          label="Agrupar por"
          value={view.groupBy}
          onChange={(groupBy) => onChange({ groupBy })}
          options={option(groupByLabels)}
        />
        {view.layout === "board" && (
          <DisplaySelect<TaskSwimlane>
            label="Swimlanes"
            value={view.swimlane}
            onChange={(swimlane) => onChange({ swimlane })}
            options={option(swimlaneLabels)}
          />
        )}
        <DisplaySelect<TaskSort>
          label="Ordenar por"
          value={view.sort}
          onChange={(sort) => onChange({ sort })}
          options={option(sortLabels)}
        />
        <DisplaySelect<DoneFilter>
          label="Concluídas"
          value={view.done}
          onChange={(done) => onChange({ done })}
          options={option(doneLabels)}
        />
      </DisplaySection>
      <DisplaySection title="Densidade">
        <SegmentedControl<TaskDensity>
          label="Densidade"
          value={view.density}
          onChange={(density) => onChange({ density })}
          options={option(densityLabels)}
          className="w-full [&>*]:flex-1"
        />
      </DisplaySection>
      <DisplaySection title="Propriedades">
        <DisplayChips<TaskField>
          label="Propriedades exibidas"
          selected={view.fields}
          onChange={(fields) => onChange({ fields })}
          options={option(fieldLabels)}
        />
      </DisplaySection>
      {(view.hidden.length > 0 || view.collapsed.length > 0) && (
        <DisplaySection title="Colunas">
          <DisplayToggle
            label={`Mostrar colunas ocultas (${view.hidden.length})`}
            checked={view.hidden.length === 0}
            onChange={(checked) => checked && onChange({ hidden: [] })}
          />
          <DisplayToggle
            label={`Expandir recolhidas (${view.collapsed.length})`}
            checked={view.collapsed.length === 0}
            onChange={(checked) => checked && onChange({ collapsed: [] })}
          />
        </DisplaySection>
      )}
    </DisplayMenu>
  );
}

function SavedViewsMenu({
  views,
  active,
  favorites,
  onOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
}: {
  views: SavedTaskView[];
  active?: SavedTaskView;
  favorites: Set<string>;
  onOpen: (view: SavedTaskView) => void;
  onClose: () => void;
  onSave: (name: string) => void;
  onUpdate: () => void;
  onDelete: (view: SavedTaskView) => void;
}) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  return (
    <Popover open={naming} onOpenChange={setNaming}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 max-w-48 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground",
              active && "text-foreground",
            )}
          >
            <Bookmark
              className={cn("size-3.5", active && "fill-primary text-primary")}
            />
            <span className="hidden truncate sm:inline">
              {active?.name ?? "Visualizações"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Visualizações salvas
          </DropdownMenuLabel>
          {views.length === 0 && (
            <p className="px-2 pb-2 text-xs text-muted-foreground">
              Salve filtros, agrupamento e campos para voltar a eles depois.
            </p>
          )}
          {views.map((saved) => {
            const href = viewHref(saved.id);
            const favorite = favorites.has(href);
            return (
              <DropdownMenuItem
                key={saved.id}
                onSelect={() => onOpen(saved)}
                className="group/item pr-1"
              >
                {active?.id === saved.id ? <Check /> : <span className="w-4" />}
                <span className="truncate">{saved.name}</span>
                <span className="ml-auto flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={
                      favorite ? "Remover da sidebar" : "Fixar na sidebar"
                    }
                    title={favorite ? "Remover da sidebar" : "Fixar na sidebar"}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      sidebarActions.toggleFavorite({
                        href,
                        label: saved.name,
                      });
                    }}
                    className="flex size-6 items-center justify-center rounded hover:bg-background"
                  >
                    <Star
                      className={cn(
                        "size-3.5",
                        favorite && "fill-primary text-primary",
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    aria-label={`Excluir ${saved.name}`}
                    title="Excluir"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onDelete(saved);
                    }}
                    className="flex size-6 items-center justify-center rounded hover:bg-background hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          {active && (
            <DropdownMenuItem onSelect={onUpdate}>
              <Save /> Atualizar &ldquo;{active.name}&rdquo;
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() => {
              setName("");
              // Let the menu close before the popover takes focus.
              setTimeout(() => setNaming(true), 0);
            }}
          >
            <Plus /> Salvar visualização atual
          </DropdownMenuItem>
          {active && (
            <DropdownMenuItem onSelect={onClose}>
              <X /> Sair da visualização
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <PopoverTrigger asChild>
        <span aria-hidden className="-ml-2 w-0" />
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = name.trim();
            if (!trimmed) return;
            onSave(trimmed);
            setNaming(false);
          }}
        >
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor="view-name"
          >
            Nome da visualização
          </label>
          <Input
            id="view-name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Atrasadas do cliente"
            maxLength={60}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setNaming(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim()}>
              Salvar
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/** Batch actions for the selected tasks. */
function BulkBar({
  ids,
  projects,
  onDone,
}: {
  ids: string[];
  projects: { id: string; name: string; status: string }[];
  onDone: () => void;
}) {
  const apply = (
    patch: Parameters<typeof workActions.updateTask>[1],
    label: string,
  ) => {
    ids.forEach((id) => workActions.updateTask(id, patch));
    toast.success(
      `${ids.length} ${ids.length === 1 ? "tarefa" : "tarefas"}: ${label}`,
    );
    onDone();
  };
  return (
    <div
      className="flex flex-wrap items-center gap-2 text-sm"
      role="toolbar"
      aria-label="Ações em lote"
    >
      <span className="font-medium tabular-nums">
        {ids.length} {ids.length === 1 ? "selecionada" : "selecionadas"}
      </span>
      <Select
        onValueChange={(status) =>
          apply(
            { status: status as TaskStatus },
            taskStatusLabels[status as TaskStatus],
          )
        }
      >
        <SelectTrigger
          size="sm"
          className="h-7 w-36 text-xs"
          aria-label="Mudar status"
        >
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {taskStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {taskStatusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        onValueChange={(priority) =>
          apply(
            { priority: priority as TaskPriority },
            `prioridade ${priorityText[priority as TaskPriority].toLowerCase()}`,
          )
        }
      >
        <SelectTrigger
          size="sm"
          className="h-7 w-32 text-xs"
          aria-label="Mudar prioridade"
        >
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          {priorityOrder.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {priorityText[priority]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        onValueChange={(projectId) =>
          apply(
            { projectId: projectId === "none" ? undefined : projectId },
            "projeto alterado",
          )
        }
      >
        <SelectTrigger
          size="sm"
          className="h-7 w-40 text-xs"
          aria-label="Mudar projeto"
        >
          <SelectValue placeholder="Projeto" />
        </SelectTrigger>
        <SelectContent>
          {projects
            .filter((project) => project.status !== "completed")
            .map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          <SelectItem value="none">Sem projeto</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-destructive hover:text-destructive"
        onClick={() => {
          if (
            !window.confirm(
              `Excluir ${ids.length} ${ids.length === 1 ? "tarefa" : "tarefas"}?`,
            )
          )
            return;
          ids.forEach((id) => workActions.deleteTask(id));
          toast.success(`${ids.length} excluídas`);
          onDone();
        }}
      >
        <Trash2 /> Excluir
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-muted-foreground"
        onClick={onDone}
      >
        Limpar seleção <kbd className="ml-1 font-mono text-[10px]">Esc</kbd>
      </Button>
    </div>
  );
}
