"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  History,
  ListChecks,
  Plus,
  Repeat,
} from "lucide-react";

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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { ResizablePanel } from "@/components/workspace/resizable-panel";
import { useMediaQuery } from "@/components/workspace/use-media-query";
import { usePanel } from "@/components/workspace/use-panel";
import {
  ToolbarDivider,
  WorkspaceFrame,
  WorkspaceToolbar,
} from "@/components/workspace/workspace-toolbar";
import {
  checkIndex,
  dayTally,
  daysBetween,
  monthWeeks,
  percent,
  rate,
  shiftMonth,
  weekDays,
} from "@/features/routines/lib/routine-stats";
import {
  type RoutineLayout,
  byTimeThenTitle,
  defaultRoutinesView,
  layoutLabels,
  matchesFilters,
} from "@/features/routines/lib/routine-view";
import {
  checkOn,
  routineSeconds,
  routinesDueOn,
  streak,
} from "@/features/routines/lib/routines";
import type { Routine } from "@/features/routines/types/routine";
import { useNow } from "@/features/time-tracking/hooks/use-now";
import {
  formatDuration,
  localDay,
  runningEntry,
  shiftDay,
} from "@/features/time-tracking/lib/time";
import { usePreference } from "@/lib/preferences";
import { projectColorClasses } from "@/lib/project-colors";
import { useAppData } from "@/lib/sample-data/store";

import { RoutineDayList } from "./routine-day-list";
import { RoutineDetail } from "./routine-detail";
import { RoutineFormDialog } from "./routine-form-dialog";
import { RoutineHistory } from "./routine-history";
import { RoutineInsights } from "./routine-insights";
import { RoutineManageList } from "./routine-manage-list";
import { RoutineMonthView } from "./routine-month-view";
import { RoutineWeekMatrix } from "./routine-week-matrix";

const DETAIL = { min: 300, max: 560, default: 360 };

const layoutOptions: SegmentedOption<RoutineLayout>[] = [
  { value: "today", label: layoutLabels.today, icon: CalendarCheck },
  { value: "week", label: layoutLabels.week, icon: CalendarRange },
  { value: "month", label: layoutLabels.month, icon: CalendarDays },
  { value: "all", label: layoutLabels.all, icon: ListChecks },
  { value: "history", label: layoutLabels.history, icon: History },
  { value: "insights", label: layoutLabels.insights, icon: ChartColumn },
];

const longDay = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const monthYear = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});
const shortDay = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
});

const asDate = (day: string) => new Date(`${day}T12:00:00`);

/**
 * Routines workspace: daily execution (today, week, month) apart from the
 * register (all), with history and consistency analysis. The routine detail
 * opens beside any view.
 */
export function RoutinesPage() {
  const data = useAppData();
  const { routines, routineChecks, timeEntries } = data;
  const running = runningEntry(timeEntries);
  const now = useNow(Boolean(running?.routineId));
  const today = localDay(now);
  const desktop = useMediaQuery("(min-width: 1024px)");

  const [view, setView] = usePreference("routines:view", defaultRoutinesView);
  const update = (patch: Partial<typeof view>) =>
    setView({ ...view, ...patch });
  const [anchor, setAnchor] = useState<string>();
  const day = anchor ?? today;
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string>();
  const detail = usePanel("routines:detail", { defaultWidth: DETAIL.default });

  const index = useMemo(() => checkIndex(routineChecks), [routineChecks]);
  const filtered = routines
    .filter((routine) => matchesFilters(routine, view))
    .sort(byTimeThenTitle);
  /** Active routines plus paused ones that still have history to show. */
  const tracked = filtered.filter(
    (routine) => routine.active || index.has(routine.id),
  );
  const openRoutine = routines.find((routine) => routine.id === openId);

  useEffect(() => {
    if (!openId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented)
        setOpenId(undefined);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openId]);

  const select = (routine: Routine) =>
    setOpenId((current) => (current === routine.id ? undefined : routine.id));

  const step = (direction: 1 | -1) => {
    if (view.layout === "today") setAnchor(shiftDay(day, direction));
    else if (view.layout === "week") setAnchor(shiftDay(day, direction * 7));
    else setAnchor(shiftMonth(day, direction));
  };
  const navigable = ["today", "week", "month"].includes(view.layout);
  const atToday =
    view.layout === "today"
      ? day === today
      : view.layout === "week"
        ? weekDays(day)[0] === weekDays(today)[0]
        : day.slice(0, 7) === today.slice(0, 7);

  const periodLabel =
    view.layout === "today"
      ? day === today
        ? "Hoje"
        : longDay.format(asDate(day))
      : view.layout === "week"
        ? (() => {
            const days = weekDays(day);
            return `${shortDay.format(asDate(days[0]))} – ${shortDay.format(asDate(days[6]))}`.replaceAll(
              ".",
              "",
            );
          })()
        : monthYear.format(asDate(day));

  const projectOptions = [
    ...data.projects
      .filter((project) =>
        routines.some((routine) => routine.projectId === project.id),
      )
      .map((project) => ({
        value: project.id,
        label: project.name,
        dotClass: projectColorClasses[project.color].bg,
      })),
    { value: "none", label: "Sem projeto", dotClass: "bg-muted-foreground/40" },
  ];
  const goalOptions = [
    ...data.goals
      .filter((goal) => routines.some((routine) => routine.goalId === goal.id))
      .map((goal) => ({ value: goal.id, label: goal.name })),
    { value: "none", label: "Sem meta" },
  ];
  const activeFilters = [
    ...view.projectIds.map((id) => ({
      key: `p:${id}`,
      label: projectOptions.find((option) => option.value === id)?.label ?? id,
      onRemove: () =>
        update({ projectIds: view.projectIds.filter((value) => value !== id) }),
    })),
    ...view.goalIds.map((id) => ({
      key: `g:${id}`,
      label: goalOptions.find((option) => option.value === id)?.label ?? id,
      onRemove: () =>
        update({ goalIds: view.goalIds.filter((value) => value !== id) }),
    })),
  ];

  const showDetail = Boolean(openRoutine) && desktop;

  return (
    <WorkspaceFrame>
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceToolbar
          actions={
            <>
              <span className="hidden md:contents">
                <SampleDataBadge />
              </span>
              <FilterMenu
                activeCount={activeFilters.length}
                onClear={() => update({ projectIds: [], goalIds: [] })}
              >
                <FilterGroup
                  title="Projeto"
                  selected={view.projectIds}
                  onChange={(projectIds) => update({ projectIds })}
                  options={projectOptions}
                />
                <FilterGroup
                  title="Meta"
                  selected={view.goalIds}
                  onChange={(goalIds) => update({ goalIds })}
                  options={goalOptions}
                />
              </FilterMenu>
              <ToolbarDivider />
              <Button
                size="sm"
                className="h-8"
                onClick={() => setCreating(true)}
              >
                <Plus /> <span className="hidden sm:inline">Nova rotina</span>
              </Button>
            </>
          }
        >
          <h1 className="hidden text-sm font-semibold sm:block">Rotinas</h1>
          <span className="hidden sm:contents">
            <ToolbarDivider />
          </span>
          <SegmentedControl<RoutineLayout>
            label="Visualização"
            value={view.layout}
            onChange={(layout) => update({ layout })}
            options={layoutOptions}
            iconOnly
            className="@[56rem]/toolbar:hidden"
          />
          <SegmentedControl<RoutineLayout>
            label="Visualização"
            value={view.layout}
            onChange={(layout) => update({ layout })}
            options={layoutOptions}
            className="hidden @[56rem]/toolbar:inline-flex"
          />
        </WorkspaceToolbar>

        <div className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1 border-b px-3 py-1.5 sm:px-4">
          {navigable ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Anterior"
                onClick={() => step(-1)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Próximo"
                onClick={() => step(1)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronRight />
              </Button>
              <h2 className="ml-1 text-sm font-semibold first-letter:uppercase">
                {periodLabel}
              </h2>
              {!atToday && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 h-7 text-xs"
                  onClick={() => setAnchor(undefined)}
                >
                  Hoje
                </Button>
              )}
            </div>
          ) : view.layout === "insights" ? (
            <SegmentedControl<"30" | "90">
              label="Período"
              size="sm"
              value={String(view.window) as "30" | "90"}
              onChange={(value) => update({ window: Number(value) as 30 | 90 })}
              options={[
                { value: "30", label: "30 dias" },
                { value: "90", label: "90 dias" },
              ]}
            />
          ) : (
            <h2 className="text-sm font-semibold">
              {layoutLabels[view.layout]}
            </h2>
          )}
          <Summary
            layout={view.layout}
            routines={tracked}
            day={day}
            today={today}
            now={now}
            index={index}
          />
          {activeFilters.length > 0 && (
            <ActiveFilters
              className="ml-auto"
              filters={activeFilters}
              onClear={() => update({ projectIds: [], goalIds: [] })}
            />
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-auto">
          {routines.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="Nenhuma rotina ainda"
              description="Rotinas são o que se repete em dias escolhidos: estudar, treinar, revisar a semana. Marque cada dia e aponte o tempo."
              action={
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus /> Criar a primeira rotina
                </Button>
              }
              className="m-4 border-0 sm:m-6"
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="Nenhuma rotina com esses filtros"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => update({ projectIds: [], goalIds: [] })}
                >
                  Limpar filtros
                </Button>
              }
              className="m-4 border-0 sm:m-6"
            />
          ) : (
            <Body
              layout={view.layout}
              filtered={filtered}
              tracked={tracked}
              day={day}
              today={today}
              now={now}
              running={running}
              index={index}
              window={view.window}
              activeId={openId}
              onSelect={select}
              onOpenDay={(target) => {
                setAnchor(target === today ? undefined : target);
                update({ layout: "today" });
              }}
              onShowAll={() => update({ layout: "all" })}
            />
          )}
        </div>
      </div>

      {showDetail && openRoutine && (
        <ResizablePanel
          panel={detail}
          side="right"
          min={DETAIL.min}
          max={DETAIL.max}
          defaultWidth={DETAIL.default}
          label="Detalhes da rotina"
        >
          <RoutineDetail
            routine={openRoutine}
            today={today}
            now={now}
            index={index}
            onClose={() => setOpenId(undefined)}
          />
        </ResizablePanel>
      )}
      {!desktop && (
        <Sheet
          open={Boolean(openRoutine)}
          onOpenChange={(open) => !open && setOpenId(undefined)}
        >
          <SheetContent className="w-full gap-0 p-0 sm:max-w-md [&>button:last-child]:hidden">
            <SheetTitle className="sr-only">
              {openRoutine?.title ?? "Rotina"}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Detalhes da rotina
            </SheetDescription>
            {openRoutine && (
              <RoutineDetail
                routine={openRoutine}
                today={today}
                now={now}
                index={index}
                onClose={() => setOpenId(undefined)}
              />
            )}
          </SheetContent>
        </Sheet>
      )}

      <RoutineFormDialog
        today={today}
        open={creating}
        onOpenChange={setCreating}
      />
    </WorkspaceFrame>
  );
}

function Body({
  layout,
  filtered,
  tracked,
  day,
  today,
  now,
  running,
  index,
  window,
  activeId,
  onSelect,
  onOpenDay,
  onShowAll,
}: {
  layout: RoutineLayout;
  filtered: Routine[];
  tracked: Routine[];
  day: string;
  today: string;
  now: Date;
  running: ReturnType<typeof runningEntry>;
  index: ReturnType<typeof checkIndex>;
  window: 30 | 90;
  activeId?: string;
  onSelect: (routine: Routine) => void;
  onOpenDay: (day: string) => void;
  onShowAll: () => void;
}) {
  switch (layout) {
    case "today": {
      const due = routinesDueOn(filtered, day);
      if (due.length === 0)
        return (
          <EmptyState
            icon={CalendarCheck}
            title={
              day === today
                ? "Nada planejado para hoje"
                : "Nada planejado para este dia"
            }
            description="Dia livre também conta: só o que estava planejado entra nas sequências."
            action={
              <Button size="sm" variant="outline" onClick={onShowAll}>
                Ver todas as rotinas
              </Button>
            }
            className="m-4 border-0 sm:m-6"
          />
        );
      return (
        <RoutineDayList
          routines={due}
          day={day}
          today={today}
          now={now}
          running={running}
          activeId={activeId}
          onSelect={onSelect}
        />
      );
    }
    case "week":
      return (
        <RoutineWeekMatrix
          routines={tracked}
          days={weekDays(day)}
          today={today}
          index={index}
          activeId={activeId}
          onSelect={onSelect}
        />
      );
    case "month":
      return (
        <RoutineMonthView
          routines={tracked}
          month={day}
          today={today}
          index={index}
          onOpenDay={onOpenDay}
        />
      );
    case "all":
      return (
        <RoutineManageList
          routines={filtered}
          today={today}
          index={index}
          activeId={activeId}
          onSelect={onSelect}
        />
      );
    case "history":
      return (
        <RoutineHistory
          routines={tracked}
          today={today}
          index={index}
          activeId={activeId}
          onSelect={onSelect}
        />
      );
    case "insights":
      return (
        <RoutineInsights
          routines={tracked}
          today={today}
          now={now}
          index={index}
          window={window}
          activeId={activeId}
          onSelect={onSelect}
        />
      );
  }
}

/** One quiet line of numbers for the current view, instead of metric cards. */
function Summary({
  layout,
  routines,
  day,
  today,
  now,
  index,
}: {
  layout: RoutineLayout;
  routines: Routine[];
  day: string;
  today: string;
  now: Date;
  index: ReturnType<typeof checkIndex>;
}) {
  const { routineChecks, timeEntries } = useAppData();
  const parts: string[] = [];

  if (layout === "today") {
    const due = routinesDueOn(routines, day);
    const done = due.filter((routine) =>
      checkOn(routineChecks, routine.id, day),
    ).length;
    const seconds = due.reduce(
      (sum, routine) => sum + routineSeconds(routine.id, timeEntries, day, now),
      0,
    );
    const best = Math.max(
      0,
      ...routines
        .filter((routine) => routine.active)
        .map((routine) => streak(routine, routineChecks, today)),
    );
    if (due.length > 0) parts.push(`${done} de ${due.length} feitas`);
    if (seconds > 0) parts.push(`${formatDuration(seconds)} apontadas`);
    if (best > 0) parts.push(`maior sequência: ${best} d`);
  } else if (layout === "week" || layout === "month") {
    const days =
      layout === "week"
        ? weekDays(day)
        : daysBetween(
            `${day.slice(0, 7)}-01`,
            monthWeeks(day).at(-1)![6],
          ).filter((item) => item.slice(0, 7) === day.slice(0, 7));
    let due = 0;
    let done = 0;
    let planned = 0;
    for (const item of days) {
      const result = dayTally(routines, index, item);
      if (item > today || (item === today && result.done < result.due)) {
        planned += result.due - (item === today ? result.done : 0);
        if (item === today) {
          due += result.done;
          done += result.done;
        }
        continue;
      }
      due += result.due;
      done += result.done;
    }
    if (due > 0)
      parts.push(`${done} de ${due} feitas (${percent(rate({ due, done }))})`);
    if (planned > 0)
      parts.push(
        `${planned} ainda ${planned === 1 ? "planejada" : "planejadas"}`,
      );
  } else if (layout === "all") {
    const active = routines.filter((routine) => routine.active).length;
    parts.push(`${active} ativas`);
  }

  if (parts.length === 0) return null;
  return (
    <p className="text-xs text-muted-foreground tabular-nums">
      {parts.join(" · ")}
    </p>
  );
}
