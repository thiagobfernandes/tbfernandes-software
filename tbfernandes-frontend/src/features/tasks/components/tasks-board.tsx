"use client";

import { useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Copy,
  ExternalLink,
  EyeOff,
  Minimize2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { priorityText } from "@/components/shared/priority-badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ResizeHandle } from "@/components/workspace/resize-handle";
import { TaskCard } from "@/features/tasks/components/task-card";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { useTouchDrag } from "@/features/tasks/hooks/use-touch-drag";
import {
  COLUMN_WIDTH,
  defaultTasksView,
  groupTasks,
  priorityOrder,
  type TaskColumn,
  type TasksView,
} from "@/features/tasks/lib/task-view";
import {
  taskStatuses,
  taskStatusLabels,
  type Task,
} from "@/features/tasks/types/task";
import type { Project } from "@/features/projects/types/project";
import { uuidv7 } from "@/lib/api/uuid";
import { workActions } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

/** Cards rendered per column before "Mostrar mais" (old done tasks pile up). */
const COLUMN_PAGE = 30;

export type Swimlane = {
  key: string;
  label: string;
  dotClass: string;
  columns: TaskColumn[];
  patch?: Partial<Task>;
};

type BoardView = Pick<
  TasksView,
  "density" | "fields" | "collapsed" | "hidden" | "columnWidth" | "columnOrder"
>;

type TasksBoardProps = {
  tasks: Task[];
  projectsById: Map<string, Project>;
  today: string;
  onSelectTask?: (taskId: string, event?: React.MouseEvent) => void;
  /** Shows a "+" per column that creates a task there. */
  allowCreate?: boolean;
  defaultProjectId?: string;
  /** Pre-grouped columns; default is one column per status. */
  columns?: TaskColumn[];
  /** Horizontal lanes, each with its own set of the same columns. */
  swimlanes?: Swimlane[];
  view?: Partial<BoardView>;
  onViewChange?: (patch: Partial<BoardView>) => void;
  selectedIds?: Set<string>;
  activeId?: string;
  secondsByTask?: Map<string, number>;
  /** Fill the parent height: the board scrolls inside, headers stay. */
  fill?: boolean;
};

export function TasksBoard({
  tasks,
  projectsById,
  today,
  onSelectTask,
  allowCreate = false,
  defaultProjectId,
  columns: givenColumns,
  swimlanes,
  view: givenView,
  onViewChange,
  selectedIds,
  activeId,
  secondsByTask,
  fill = false,
}: TasksBoardProps) {
  const view: BoardView = { ...defaultTasksView, ...givenView };
  const [draggingId, setDraggingId] = useState<string>();
  const [overKey, setOverKey] = useState<string>();
  const [draggingColumn, setDraggingColumn] = useState<string>();
  const [touchDragging, setTouchDragging] = useState(false);
  const [liveWidth, setLiveWidth] = useState<number>();
  const [collapsedLanes, setCollapsedLanes] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const scrollerRef = useRef<HTMLDivElement>(null);

  const baseColumns = useMemo(
    () =>
      givenColumns ??
      groupTasks(tasks, "status", { projects: [], companies: [], today }),
    [givenColumns, tasks, today],
  );
  const lanes: Swimlane[] = swimlanes ?? [
    { key: "all", label: "", dotClass: "", columns: baseColumns },
  ];
  const order = (cols: TaskColumn[]) =>
    orderColumns(cols, view.columnOrder).filter(
      (col) => !view.hidden.includes(col.key),
    );
  const headerColumns = order(baseColumns);
  const width = liveWidth ?? view.columnWidth;
  const collapsed = new Set(view.collapsed);

  const findDrop = (key: string) => {
    const [laneKey, columnKey] = key.split("|");
    const lane = lanes.find((l) => l.key === laneKey);
    const column = lane?.columns.find((c) => c.key === columnKey);
    return { lane, column };
  };

  // Touch screens: press and hold a card, then move it to another column.
  const {
    ghostRef,
    handlers: touchHandlers,
    isTouchDragging,
  } = useTouchDrag({
    targetAt: (x, y) =>
      document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-drop]")
        ?.dataset.drop,
    onStart: (id) => {
      setDraggingId(id);
      setTouchDragging(true);
    },
    onOver: (key) => setOverKey(key),
    // Near the screen edge, scroll the board so off-screen columns come in.
    onMove: (x) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const edge = 48;
      if (x < edge) scroller.scrollBy({ left: -24 });
      else if (x > window.innerWidth - edge) scroller.scrollBy({ left: 24 });
    },
    onDrop: (key) => {
      setTouchDragging(false);
      if (key) drop(key);
      else {
        setDraggingId(undefined);
        setOverKey(undefined);
      }
    },
  });
  const draggedTask = tasks.find((task) => task.id === draggingId);

  /** Dropping on a cell applies the column's change (and the lane's). */
  function drop(key: string) {
    const task = tasks.find((item) => item.id === draggingId);
    setDraggingId(undefined);
    setOverKey(undefined);
    const { lane, column } = findDrop(key);
    if (!task || !column?.patch) return;
    const patch = { ...lane?.patch, ...column.patch };
    const changed = Object.entries(patch).some(
      ([field, value]) => task[field as keyof Task] !== value,
    );
    if (!changed) return;
    const previous = Object.fromEntries(
      Object.keys(patch).map((field) => [field, task[field as keyof Task]]),
    ) as Partial<Task>;
    workActions.updateTask(task.id, patch);
    toast.success(`Movida para ${column.label}`, {
      description: task.title,
      action: {
        label: "Desfazer",
        onClick: () => workActions.updateTask(task.id, previous),
      },
    });
  }

  function toggleColumn(key: string) {
    onViewChange?.({
      collapsed: collapsed.has(key)
        ? view.collapsed.filter((value) => value !== key)
        : [...view.collapsed, key],
    });
  }

  function moveColumn(from: string, to: string) {
    if (from === to) return;
    const keys = orderColumns(baseColumns, view.columnOrder).map(
      (col) => col.key,
    );
    const next = keys.filter((key) => key !== from);
    next.splice(next.indexOf(to), 0, from);
    onViewChange?.({ columnOrder: next });
  }

  const cardFor = (task: Task) => (
    <TaskCard
      task={task}
      project={task.projectId ? projectsById.get(task.projectId) : undefined}
      today={today}
      onSelect={onSelectTask}
      density={view.density}
      fields={view.fields}
      seconds={secondsByTask?.get(task.id)}
      selected={selectedIds?.has(task.id)}
      active={activeId === task.id}
    />
  );

  return (
    <div
      ref={scrollerRef}
      className={cn(
        "[scrollbar-width:thin] overflow-auto overscroll-contain",
        fill ? "h-full" : "-mx-4 px-4 pb-2 md:-mx-6 md:px-6",
      )}
    >
      <div className="inline-flex min-w-full flex-col">
        {/* Column headers stay visible while the board scrolls. */}
        <div className="sticky top-0 z-20 flex gap-3 bg-background px-3 pt-3 pb-2">
          {swimlanes && <div aria-hidden className="w-0 shrink-0" />}
          {headerColumns.map((column) => {
            const count = lanes.reduce(
              (sum, lane) =>
                sum +
                (lane.columns.find((c) => c.key === column.key)?.tasks.length ??
                  0),
              0,
            );
            const isCollapsed = collapsed.has(column.key);
            return (
              <div
                key={column.key}
                draggable={Boolean(onViewChange)}
                onDragStart={(event) => {
                  if (draggingId) return;
                  setDraggingColumn(column.key);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(event) => {
                  if (draggingColumn) event.preventDefault();
                }}
                onDrop={(event) => {
                  if (!draggingColumn) return;
                  event.preventDefault();
                  moveColumn(draggingColumn, column.key);
                  setDraggingColumn(undefined);
                }}
                onDragEnd={() => setDraggingColumn(undefined)}
                style={{ width: isCollapsed ? 40 : width }}
                className={cn(
                  "group/col relative flex h-8 shrink-0 items-center gap-2 rounded-md px-2",
                  isCollapsed && "justify-center px-0",
                  draggingColumn === column.key && "opacity-40",
                )}
              >
                {isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleColumn(column.key)}
                    aria-label={`Expandir ${column.label}`}
                    title={`${column.label} (${count})`}
                    className="flex size-7 items-center justify-center rounded outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <span
                      aria-hidden
                      className={cn("size-2 rounded-full", column.dotClass)}
                    />
                  </button>
                ) : (
                  <>
                    <span
                      aria-hidden
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        column.dotClass,
                      )}
                    />
                    <h2 className="truncate text-[13px] font-medium">
                      {column.label}
                    </h2>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {count}
                    </span>
                    <div className="ml-auto flex items-center opacity-0 transition-opacity group-hover/col:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
                      {onViewChange && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-6 text-muted-foreground"
                            aria-label={`Recolher ${column.label}`}
                            title="Recolher coluna"
                            onClick={() => toggleColumn(column.key)}
                          >
                            <Minimize2 className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-6 text-muted-foreground"
                            aria-label={`Ocultar ${column.label}`}
                            title="Ocultar coluna"
                            onClick={() =>
                              onViewChange({
                                hidden: [...view.hidden, column.key],
                              })
                            }
                          >
                            <EyeOff className="size-3.5" />
                          </Button>
                        </>
                      )}
                      {allowCreate && (
                        <TaskFormDialog
                          defaultStatus={column.defaults?.status}
                          defaultProjectId={
                            column.defaults?.projectId ?? defaultProjectId
                          }
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-6 text-muted-foreground"
                              aria-label={`Adicionar tarefa em ${column.label}`}
                            >
                              <Plus className="size-3.5" />
                            </Button>
                          }
                        />
                      )}
                    </div>
                    {onViewChange && (
                      <ResizeHandle
                        width={width}
                        min={COLUMN_WIDTH.min}
                        max={COLUMN_WIDTH.max}
                        defaultWidth={defaultTasksView.columnWidth}
                        label="Largura das colunas"
                        className="-right-2"
                        onResize={setLiveWidth}
                        onResizeEnd={(next) => {
                          setLiveWidth(undefined);
                          onViewChange({ columnWidth: next });
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {lanes.map((lane) => {
          const laneCollapsed = collapsedLanes.has(lane.key);
          const laneCount = lane.columns.reduce(
            (sum, c) => sum + c.tasks.length,
            0,
          );
          return (
            <section
              key={lane.key}
              aria-label={lane.label || "Quadro"}
              className="flex flex-col"
            >
              {swimlanes && (
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedLanes((current) => {
                      const next = new Set(current);
                      if (next.has(lane.key)) next.delete(lane.key);
                      else next.add(lane.key);
                      return next;
                    })
                  }
                  aria-expanded={!laneCollapsed}
                  className="sticky left-0 z-10 flex h-9 w-fit items-center gap-2 px-4 text-[13px] font-medium outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <ChevronRight
                    aria-hidden
                    className={cn(
                      "size-3.5 text-muted-foreground transition-transform",
                      !laneCollapsed && "rotate-90",
                    )}
                  />
                  <span
                    aria-hidden
                    className={cn("size-2 rounded-full", lane.dotClass)}
                  />
                  {lane.label}
                  <span className="text-xs font-normal text-muted-foreground tabular-nums">
                    {laneCount}
                  </span>
                </button>
              )}
              {!laneCollapsed && (
                <div
                  className={cn(
                    "flex gap-3 px-3 pb-4",
                    swimlanes && "border-b border-border/60",
                  )}
                >
                  {headerColumns.map((header) => {
                    const column = lane.columns.find(
                      (c) => c.key === header.key,
                    ) ?? {
                      ...header,
                      tasks: [],
                    };
                    const key = `${lane.key}|${column.key}`;
                    const isCollapsed = collapsed.has(column.key);
                    const canDrop = Boolean(column.patch);
                    const isOver = overKey === key && draggingId && canDrop;
                    const limit = expanded.has(key) ? Infinity : COLUMN_PAGE;
                    return (
                      <div
                        key={key}
                        data-drop={canDrop ? key : undefined}
                        onDragOver={(event) => {
                          if (!draggingId || !canDrop) return;
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                          if (overKey !== key) setOverKey(key);
                        }}
                        onDragLeave={(event) => {
                          if (
                            !event.currentTarget.contains(
                              event.relatedTarget as Node,
                            )
                          )
                            setOverKey(undefined);
                        }}
                        onDrop={(event) => {
                          if (!draggingId) return;
                          event.preventDefault();
                          drop(key);
                        }}
                        style={{ width: isCollapsed ? 40 : width }}
                        className={cn(
                          "flex shrink-0 flex-col gap-2 rounded-lg transition-colors",
                          isCollapsed ? "items-center" : "min-h-24",
                          isOver &&
                            "bg-primary/[0.06] outline-1 outline-primary/50 outline-dashed",
                        )}
                      >
                        {isCollapsed ? (
                          <button
                            type="button"
                            onClick={() => toggleColumn(column.key)}
                            className="flex flex-col items-center gap-2 rounded-md py-2 text-xs text-muted-foreground outline-none [writing-mode:vertical-rl] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                          >
                            {column.label}
                            <span className="tabular-nums">
                              {column.tasks.length}
                            </span>
                          </button>
                        ) : column.tasks.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-border/70 px-3 py-5 text-center text-xs text-muted-foreground">
                            {draggingId && canDrop ? "Solte aqui" : "Vazia"}
                          </p>
                        ) : (
                          <>
                            {column.tasks.slice(0, limit).map((task) => (
                              <ContextMenu key={task.id}>
                                <ContextMenuTrigger asChild>
                                  <div
                                    draggable
                                    {...touchHandlers(task.id)}
                                    onDragStart={(event) => {
                                      event.stopPropagation();
                                      if (isTouchDragging()) {
                                        event.preventDefault();
                                        return;
                                      }
                                      event.dataTransfer.effectAllowed = "move";
                                      event.dataTransfer.setData(
                                        "text/plain",
                                        task.id,
                                      );
                                      setDraggingId(task.id);
                                    }}
                                    onDragEnd={() => {
                                      setDraggingId(undefined);
                                      setOverKey(undefined);
                                    }}
                                    className={cn(
                                      "cursor-grab select-none [-webkit-touch-callout:none] active:cursor-grabbing",
                                      draggingId === task.id && "opacity-40",
                                    )}
                                  >
                                    {cardFor(task)}
                                  </div>
                                </ContextMenuTrigger>
                                <TaskContextMenu
                                  task={task}
                                  onOpen={onSelectTask}
                                />
                              </ContextMenu>
                            ))}
                            {column.tasks.length > limit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground"
                                onClick={() =>
                                  setExpanded((current) =>
                                    new Set(current).add(key),
                                  )
                                }
                              >
                                Mostrar mais {column.tasks.length - COLUMN_PAGE}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {touchDragging && draggedTask && (
        <div
          ref={ghostRef}
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 z-50 w-64 rotate-2 opacity-90 shadow-xl"
        >
          {cardFor(draggedTask)}
        </div>
      )}
    </div>
  );
}

/** Applies a saved column order, keeping new columns at the end. */
function orderColumns(columns: TaskColumn[], order?: string[]) {
  if (!order?.length) return columns;
  const rank = new Map(order.map((key, index) => [key, index]));
  return [...columns].sort(
    (a, b) => (rank.get(a.key) ?? 999) - (rank.get(b.key) ?? 999),
  );
}

/** Right-click actions on a task card. */
export function TaskContextMenu({
  task,
  onOpen,
}: {
  task: Task;
  onOpen?: (taskId: string) => void;
}) {
  return (
    <ContextMenuContent className="w-56">
      <ContextMenuLabel>{task.title}</ContextMenuLabel>
      {onOpen && (
        <ContextMenuItem onSelect={() => onOpen(task.id)}>
          <ExternalLink /> Abrir detalhes
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuLabel>Status</ContextMenuLabel>
      {taskStatuses.map((status) => (
        <ContextMenuItem
          key={status}
          disabled={task.status === status}
          onSelect={() => workActions.updateTask(task.id, { status })}
        >
          {taskStatusLabels[status]}
        </ContextMenuItem>
      ))}
      <ContextMenuSeparator />
      <ContextMenuLabel>Prioridade</ContextMenuLabel>
      {priorityOrder.map((priority) => (
        <ContextMenuItem
          key={priority}
          disabled={task.priority === priority}
          onSelect={() => workActions.updateTask(task.id, { priority })}
        >
          {priorityText[priority]}
        </ContextMenuItem>
      ))}
      <ContextMenuSeparator />
      <ContextMenuItem
        onSelect={() => {
          duplicateTask(task);
          toast.success("Tarefa duplicada");
        }}
      >
        <Copy /> Duplicar
      </ContextMenuItem>
      <ContextMenuItem
        variant="destructive"
        onSelect={() => {
          workActions.deleteTask(task.id);
          toast.success("Tarefa excluída", { description: task.title });
        }}
      >
        <Trash2 /> Excluir
      </ContextMenuItem>
    </ContextMenuContent>
  );
}

/** A copy back in "A fazer", without completion data. */
export function duplicateTask(task: Task) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, completedAt, ...rest } = task;
  return workActions.addTask({
    ...rest,
    title: `${task.title} (cópia)`,
    status:
      task.status === "done" || task.status === "canceled"
        ? "todo"
        : task.status,
    checklistItems: task.checklistItems?.map((item) => ({
      ...item,
      id: uuidv7(),
      done: false,
    })),
  });
}
