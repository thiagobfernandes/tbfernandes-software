"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronLeft,
  Clock,
  Columns3,
  GanttChart,
  LayoutDashboard,
  List,
  ListTodo,
  Network,
  Pencil,
  Plus,
  SearchX,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import {
  type SegmentedOption,
  SegmentedControl,
} from "@/components/shared/segmented-control";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { ResizablePanel } from "@/components/workspace/resizable-panel";
import { useMediaQuery } from "@/components/workspace/use-media-query";
import { usePanel } from "@/components/workspace/use-panel";
import {
  ToolbarDivider,
  WorkspaceFrame,
  WorkspaceToolbar,
} from "@/components/workspace/workspace-toolbar";
import {
  graphHref,
  graphNodeId,
  noteHref,
} from "@/features/knowledge/lib/graph";
import { LinkedKnowledge } from "@/features/knowledge/components/linked-knowledge";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
import { ProjectTimeline } from "@/features/projects/components/project-timeline";
import {
  type ProjectInsights,
  healthLabels,
  healthTone,
  projectInsights,
} from "@/features/projects/lib/project-insights";
import {
  type Project,
  projectCategoryLabels,
  projectStatusLabels,
} from "@/features/projects/types/project";
import { TaskDetail } from "@/features/tasks/components/task-detail";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { TasksBoard } from "@/features/tasks/components/tasks-board";
import { TasksList } from "@/features/tasks/components/tasks-list";
import type { Task } from "@/features/tasks/types/task";
import { taskStatusLabels } from "@/features/tasks/types/task";
import { useNow } from "@/features/time-tracking/hooks/use-now";
import {
  entrySeconds,
  formatDuration,
  localDay,
} from "@/features/time-tracking/lib/time";
import { addDays, formatShort } from "@/lib/dates";
import { usePreference } from "@/lib/preferences";
import { projectColorClasses } from "@/lib/project-colors";
import { companyHref, goalHref } from "@/lib/routes";
import {
  type AppData,
  selectors,
  useWorkData,
  workActions,
} from "@/lib/sample-data/store";
import { useToday } from "@/lib/today";
import { cn } from "@/lib/utils";

import { dueText } from "./project-card";
import { HealthBadge, Meter, ProjectFavoriteButton } from "./project-bits";

type Section =
  "overview" | "tasks" | "roadmap" | "knowledge" | "time" | "settings";

const sections: SegmentedOption<Section>[] = [
  { value: "overview", label: "Visão geral", icon: LayoutDashboard },
  { value: "tasks", label: "Tarefas", icon: ListTodo },
  { value: "roadmap", label: "Roadmap", icon: GanttChart },
  { value: "knowledge", label: "Conhecimento", icon: BookOpen },
  { value: "time", label: "Apontamentos", icon: Clock },
  { value: "settings", label: "Configurações", icon: Settings2 },
];

const DETAIL = { min: 320, max: 640, default: 400 };

/**
 * Project workspace: the project's own overview plus the global modules
 * (tasks, timeline, knowledge, time entries) filtered by its id.
 */
export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const data = useWorkData();
  const today = useToday();
  const now = useNow(false);
  const router = useRouter();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [section, setSection] = usePreference<Section>(
    "projects:detail:section",
    "overview",
  );
  const [taskLayout, setTaskLayout] = usePreference<"board" | "list">(
    "projects:detail:tasks",
    "board",
  );
  const [openTaskId, setOpenTaskId] = useState<string>();
  const detail = usePanel("projects:task", { defaultWidth: DETAIL.default });
  const { findCompany, findProject, findGoal } = selectors(data);
  const project = findProject(projectId);
  if (!project) return <MissingProject />;

  const insights = projectInsights(project, data, today, now);
  const company = findCompany(project.companyId);
  const goal = findGoal(project.goalId);
  const projectsById = new Map([[project.id, project]]);
  const openTask = data.tasks.find((task) => task.id === openTaskId);
  const color = projectColorClasses[project.color];

  return (
    <WorkspaceFrame>
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceToolbar
          actions={
            <>
              <span className="hidden md:contents">
                <SampleDataBadge />
              </span>
              <Button
                asChild
                variant="ghost"
                size="icon-sm"
                title="Grafo local do projeto"
                className="text-muted-foreground hover:text-foreground"
              >
                <Link
                  href={graphHref(graphNodeId("project", project.id))}
                  aria-label="Abrir grafo local do projeto"
                >
                  <Network />
                </Link>
              </Button>
              <ProjectFavoriteButton
                project={project}
                className="opacity-100"
              />
              <ProjectFormDialog
                project={project}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Editar projeto"
                    title="Editar"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil />
                  </Button>
                }
              />
              <ToolbarDivider />
              <TaskFormDialog
                defaultProjectId={project.id}
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
          <Link
            href="/projects"
            aria-label="Voltar para projetos"
            className="flex shrink-0 items-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <span
            aria-hidden
            className={cn("size-2 shrink-0 rounded-full", color.bg)}
          />
          <h1 className="min-w-0 truncate text-sm font-semibold">
            {project.name}
          </h1>
          <HealthBadge insights={insights} className="hidden sm:inline-flex" />
        </WorkspaceToolbar>

        <nav
          aria-label="Seções do projeto"
          className="flex h-10 shrink-0 items-center gap-2 overflow-x-auto border-b px-3"
        >
          <SegmentedControl<Section>
            label="Seção"
            size="sm"
            value={section}
            onChange={setSection}
            options={sections}
            iconOnly={!desktop}
          />
          {section === "tasks" && (
            <SegmentedControl<"board" | "list">
              label="Visualização das tarefas"
              size="sm"
              value={taskLayout}
              onChange={setTaskLayout}
              options={[
                { value: "board", label: "Quadro", icon: Columns3 },
                { value: "list", label: "Lista", icon: List },
              ]}
              iconOnly
              className="ml-auto"
            />
          )}
        </nav>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            !(section === "tasks" && taskLayout === "board") && "overflow-auto",
          )}
        >
          {section === "overview" && (
            <Overview
              project={project}
              insights={insights}
              data={data}
              today={today}
              now={now}
              companyName={company?.name}
              goal={goal}
              onOpenTask={setOpenTaskId}
              onShowTasks={() => setSection("tasks")}
            />
          )}
          {section === "tasks" &&
            (taskLayout === "board" ? (
              <TasksBoard
                tasks={insights.tasks}
                projectsById={projectsById}
                today={today}
                onSelectTask={setOpenTaskId}
                activeId={openTaskId}
                allowCreate
                defaultProjectId={project.id}
                fill
              />
            ) : (
              <div className="p-3 sm:p-4">
                <TasksList
                  tasks={insights.tasks}
                  projectsById={projectsById}
                  today={today}
                  onSelectTask={setOpenTaskId}
                />
              </div>
            ))}
          {section === "roadmap" && (
            <Roadmap
              project={project}
              insights={insights}
              projectsById={projectsById}
              today={today}
              onOpenTask={setOpenTaskId}
              goalName={goal?.name}
            />
          )}
          {section === "knowledge" && (
            <div className="max-w-3xl p-4 sm:p-6">
              <LinkedKnowledge projectId={project.id} />
            </div>
          )}
          {section === "time" && (
            <TimeEntries project={project} data={data} now={now} />
          )}
          {section === "settings" && (
            <Settings
              project={project}
              onDeleted={() => router.push("/projects")}
            />
          )}
        </div>
      </div>

      {desktop && openTask && (
        <ResizablePanel
          panel={detail}
          side="right"
          min={DETAIL.min}
          max={DETAIL.max}
          defaultWidth={DETAIL.default}
          label="Detalhes da tarefa"
        >
          <TaskDetail
            task={openTask}
            onClose={() => setOpenTaskId(undefined)}
            toolbar={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Fechar detalhes"
                title="Fechar"
                onClick={() => setOpenTaskId(undefined)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X />
              </Button>
            }
          />
        </ResizablePanel>
      )}
      {!desktop && (
        <TaskDetailSheet
          taskId={openTaskId}
          onOpenChange={(open) => !open && setOpenTaskId(undefined)}
        />
      )}
    </WorkspaceFrame>
  );
}

function Overview({
  project,
  insights,
  data,
  today,
  now,
  companyName,
  goal,
  onOpenTask,
  onShowTasks,
}: {
  project: Project;
  insights: ProjectInsights;
  data: AppData;
  today: string;
  now: Date;
  companyName?: string;
  goal?: { id: string; name: string };
  onOpenTask: (id: string) => void;
  onShowTasks: () => void;
}) {
  const statusRank: Record<string, number> = {
    in_progress: 0,
    blocked: 1,
    todo: 2,
    backlog: 3,
  };
  const nextActions = [...insights.open]
    .filter((task) => task.status !== "blocked")
    .sort(
      (a, b) =>
        (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9) ||
        (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9"),
    )
    .slice(0, 6);
  const upcoming = insights.open
    .filter(
      (task) =>
        task.dueDate &&
        task.dueDate >= today &&
        task.dueDate <= addDays(today, 14),
    )
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const routines = data.routines.filter(
    (routine) => routine.projectId === project.id,
  );
  const activity = recentActivity(project, data, now).slice(0, 8);

  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-8 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {[
              companyName ?? "Iniciativa pessoal",
              projectCategoryLabels[project.category],
              projectStatusLabels[project.status],
              `${formatShort(project.startDate)}${project.dueDate ? ` – ${formatShort(project.dueDate)}` : ""}`,
            ].join(" · ")}
          </p>
          {project.description ? (
            <p className="max-w-prose text-sm leading-relaxed">
              {project.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ainda sem descrição. Use Configurações para descrever o objetivo.
            </p>
          )}
        </header>

        <dl className="flex flex-wrap gap-x-10 gap-y-4">
          <Figure label="Abertas" value={insights.open.length} />
          <Figure
            label="Atrasadas"
            value={insights.overdue.length}
            tone={insights.overdue.length ? "text-destructive" : undefined}
          />
          <Figure
            label="Bloqueadas"
            value={insights.blocked.length}
            tone={insights.blocked.length ? "text-warning" : undefined}
          />
          <Figure label="Concluídas" value={insights.done.length} />
          <Figure
            label="Tempo investido"
            value={insights.seconds ? formatDuration(insights.seconds) : "—"}
          />
          <Figure
            label="Prazo"
            value={
              project.dueDate ? dueText(project.dueDate, today) : "sem prazo"
            }
          />
        </dl>

        {insights.reasons.length > 0 && (
          <Block title="Precisa de atenção">
            <ul className="flex flex-col gap-1.5">
              {insights.reasons.map((reason) => (
                <li
                  key={reason.key}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 rounded-full",
                      healthTone[reason.level].dot,
                    )}
                  />
                  {reason.text}
                </li>
              ))}
            </ul>
          </Block>
        )}

        <Block
          title="Próximas ações"
          action={
            <button
              type="button"
              onClick={onShowTasks}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Ver todas
            </button>
          }
        >
          {nextActions.length ? (
            <TaskLines tasks={nextActions} today={today} onOpen={onOpenTask} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma tarefa aberta. Crie a próxima ação para o projeto andar.
            </p>
          )}
        </Block>

        {insights.blocked.length > 0 && (
          <Block title="Bloqueadas">
            <TaskLines
              tasks={insights.blocked}
              today={today}
              onOpen={onOpenTask}
            />
          </Block>
        )}

        <Block title="Atividade recente">
          {activity.length ? (
            <ol className="flex flex-col">
              {activity.map((item) => (
                <li
                  key={item.key}
                  className="flex items-baseline gap-3 py-1 text-sm"
                >
                  <span className="w-14 shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatShort(item.day)}
                  </span>
                  <span className="min-w-0 truncate">
                    <span className="text-muted-foreground">
                      {item.kind} ·{" "}
                    </span>
                    {item.href ? (
                      <Link href={item.href} className="hover:text-primary">
                        {item.title}
                      </Link>
                    ) : (
                      item.title
                    )}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nada registrado ainda.
            </p>
          )}
        </Block>
      </div>

      <aside className="flex flex-col gap-8">
        <Block title="Progresso">
          <div className="flex flex-col gap-3">
            {insights.taskProgress !== undefined ? (
              <Meter
                label="Tarefas concluídas"
                value={insights.taskProgress}
                text={`${insights.done.length}/${insights.tasks.filter((task) => task.status !== "canceled").length}`}
                tone={projectColorClasses[project.color].bg}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                Sem tarefas ainda.
              </p>
            )}
            {insights.milestones.length > 0 && (
              <Meter
                label="Marcos da meta"
                value={insights.milestonesDone / insights.milestones.length}
                text={`${insights.milestonesDone}/${insights.milestones.length}`}
              />
            )}
            {insights.elapsed !== undefined && (
              <Meter
                label="Prazo decorrido"
                value={insights.elapsed}
                text={`${Math.round(insights.elapsed * 100)}%`}
                tone="bg-muted-foreground/60"
              />
            )}
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Tarefas medem execução; os marcos da meta medem o resultado. Uma
              lista de tarefas cheia de concluídas não quer dizer projeto
              entregue.
            </p>
          </div>
        </Block>

        {(project.nextDelivery || upcoming.length > 0) && (
          <Block title="Próximas entregas">
            <ul className="flex flex-col gap-1.5 text-sm">
              {project.nextDelivery && (
                <li className="font-medium">{project.nextDelivery}</li>
              )}
              {upcoming.slice(0, 5).map((task) => (
                <li key={task.id} className="flex items-baseline gap-2">
                  <span className="w-14 shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                    {formatShort(task.dueDate!)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenTask(task.id)}
                    className="min-w-0 truncate text-left hover:text-primary"
                  >
                    {task.title}
                  </button>
                </li>
              ))}
            </ul>
          </Block>
        )}

        <Block title="Relacionamentos">
          <dl className="flex flex-col gap-1 text-sm">
            <Property label="Empresa">
              {project.companyId && companyName ? (
                <Link
                  className="hover:text-primary"
                  href={companyHref(project.companyId)}
                >
                  {companyName}
                </Link>
              ) : (
                "—"
              )}
            </Property>
            <Property label="Meta">
              {goal ? (
                <Link className="hover:text-primary" href={goalHref(goal.id)}>
                  {goal.name}
                </Link>
              ) : (
                "—"
              )}
            </Property>
            <Property label="Rotinas">
              {routines.length
                ? routines.map((routine) => routine.title).join(", ")
                : "—"}
            </Property>
            <Property label="Notas">{insights.notes}</Property>
            <Property label="Snippets">{insights.snippets}</Property>
            <Property label="Atividade">
              {insights.lastActivity ? formatShort(insights.lastActivity) : "—"}
            </Property>
          </dl>
        </Block>
        {insights.health && (
          <p className={cn("text-xs", healthTone[insights.health].text)}>
            Saúde: {healthLabels[insights.health]}
          </p>
        )}
      </aside>
    </div>
  );
}

type ActivityItem = {
  key: string;
  day: string;
  kind: string;
  title: string;
  href?: string;
};

/** Dated events of the project: finished tasks, time entries and edited notes. */
function recentActivity(
  project: Project,
  data: AppData,
  now: Date,
): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const task of data.tasks) {
    if (
      task.projectId === project.id &&
      task.status === "done" &&
      task.completedAt
    )
      items.push({
        key: `t:${task.id}`,
        day: task.completedAt.slice(0, 10),
        kind: "Tarefa concluída",
        title: task.title,
      });
  }
  for (const entry of data.timeEntries) {
    if (entry.projectId === project.id)
      items.push({
        key: `e:${entry.id}`,
        day: localDay(new Date(entry.startedAt)),
        kind: `Apontamento ${formatDuration(entrySeconds(entry, now))}`,
        title: entry.description || "Sem descrição",
      });
  }
  for (const note of data.notes) {
    if (note.projectIds.includes(project.id))
      items.push({
        key: `n:${note.id}`,
        day: note.updatedAt.slice(0, 10),
        kind: "Nota",
        title: note.title,
        href: noteHref(note.id),
      });
  }
  return items.sort((a, b) => b.day.localeCompare(a.day));
}

function Roadmap({
  project,
  insights,
  projectsById,
  today,
  onOpenTask,
  goalName,
}: {
  project: Project;
  insights: ProjectInsights;
  projectsById: Map<string, Project>;
  today: string;
  onOpenTask: (id: string) => void;
  goalName?: string;
}) {
  const [days, setDays] = usePreference<"14" | "30">(
    "projects:detail:roadmap",
    "14",
  );
  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <section className="flex flex-col gap-3">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Tarefas no tempo</h2>
          <SegmentedControl<"14" | "30">
            label="Período"
            size="sm"
            value={days}
            onChange={setDays}
            options={[
              { value: "14", label: "14 dias" },
              { value: "30", label: "30 dias" },
            ]}
          />
        </header>
        <ProjectTimeline
          tasks={insights.tasks}
          projectsById={projectsById}
          start={addDays(today, -4)}
          days={Number(days)}
          today={today}
          onSelectTask={onOpenTask}
        />
      </section>
      <section className="flex max-w-2xl flex-col gap-2">
        <h2 className="text-sm font-semibold">Marcos</h2>
        {insights.milestones.length ? (
          <>
            <p className="text-xs text-muted-foreground">
              Marcos da meta “{goalName}”, à qual o projeto está ligado.
            </p>
            <ol className="flex flex-col divide-y divide-border/60">
              {insights.milestones.map((milestone) => {
                const late =
                  !milestone.done &&
                  milestone.dueDate &&
                  milestone.dueDate < today;
                return (
                  <li
                    key={milestone.id}
                    className="flex items-center gap-3 py-2 text-sm"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-2.5 rotate-45",
                        milestone.done ? "bg-foreground/60" : "bg-primary",
                      )}
                    />
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate",
                        milestone.done && "text-muted-foreground line-through",
                      )}
                    >
                      {milestone.title}
                    </span>
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        late ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {milestone.dueDate
                        ? formatShort(milestone.dueDate)
                        : "sem data"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {project.goalId
              ? "A meta ligada ainda não tem marcos."
              : "Ligue o projeto a uma meta (em Configurações) para acompanhar marcos de entrega."}
          </p>
        )}
      </section>
    </div>
  );
}

function TimeEntries({
  project,
  data,
  now,
}: {
  project: Project;
  data: AppData;
  now: Date;
}) {
  const entries = data.timeEntries
    .filter((entry) => entry.projectId === project.id)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const total = entries.reduce(
    (sum, entry) => sum + entrySeconds(entry, now),
    0,
  );
  const tasks = new Map(data.tasks.map((task) => [task.id, task.title]));
  if (entries.length === 0)
    return (
      <EmptyState
        icon={Clock}
        title="Nenhum apontamento neste projeto"
        description="Inicie o cronômetro em uma tarefa do projeto ou lance um apontamento manual."
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/time-tracking">Abrir apontamentos</Link>
          </Button>
        }
        className="m-4 border-0 sm:m-6"
      />
    );
  return (
    <div className="flex max-w-3xl flex-col gap-3 p-4 sm:p-6">
      <p className="text-sm">
        <span className="font-semibold tabular-nums">
          {formatDuration(total)}
        </span>
        <span className="text-muted-foreground">
          {" "}
          em {entries.length}{" "}
          {entries.length === 1 ? "apontamento" : "apontamentos"}
        </span>
      </p>
      <ol className="flex flex-col divide-y divide-border/60">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-baseline gap-3 py-2 text-sm">
            <span className="w-14 shrink-0 text-xs text-muted-foreground tabular-nums">
              {formatShort(localDay(new Date(entry.startedAt)))}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {entry.description || "Sem descrição"}
              {entry.taskId && tasks.get(entry.taskId) && (
                <span className="text-muted-foreground">
                  {" "}
                  · {tasks.get(entry.taskId)}
                </span>
              )}
            </span>
            <span className="text-xs tabular-nums">
              {entry.endedAt
                ? formatDuration(entrySeconds(entry, now))
                : "em andamento"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Settings({
  project,
  onDeleted,
}: {
  project: Project;
  onDeleted: () => void;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <section className="flex items-center justify-between gap-4 border-b pb-6">
        <div>
          <h2 className="text-sm font-semibold">Dados do projeto</h2>
          <p className="text-xs text-muted-foreground">
            Nome, empresa, categoria, status, cor, datas, próxima entrega e
            meta.
          </p>
        </div>
        <ProjectFormDialog
          project={project}
          trigger={
            <Button size="sm" variant="outline">
              <Pencil /> Editar
            </Button>
          }
        />
      </section>
      <section className="flex items-center justify-between gap-4 border-b pb-6">
        <div>
          <h2 className="text-sm font-semibold">Sidebar</h2>
          <p className="text-xs text-muted-foreground">
            Fixe o projeto nos favoritos para abrir com um clique.
          </p>
        </div>
        <ProjectFavoriteButton project={project} className="opacity-100" />
      </section>
      {project.status !== "completed" && (
        <section className="flex items-center justify-between gap-4 border-b pb-6">
          <div>
            <h2 className="text-sm font-semibold">Concluir</h2>
            <p className="text-xs text-muted-foreground">
              Projetos concluídos saem do portfólio e do roadmap (dá para
              mostrá-los em Exibição).
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              workActions.updateProject(project.id, { status: "completed" });
              toast.success("Projeto concluído");
            }}
          >
            Marcar como concluído
          </Button>
        </section>
      )}
      <section className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-destructive">
            Excluir projeto
          </h2>
          <p className="text-xs text-muted-foreground">
            As tarefas, notas e snippets continuam, sem projeto.
          </p>
        </div>
        <ConfirmDelete
          noun="projeto"
          name={project.name}
          consequence="As tarefas, notas e snippets dele continuam, sem projeto."
          trigger={
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 /> Excluir
            </Button>
          }
          onConfirm={() => {
            workActions.deleteProject(project.id);
            toast.success("Projeto excluído");
            onDeleted();
          }}
        />
      </section>
    </div>
  );
}

function TaskLines({
  tasks,
  today,
  onOpen,
}: {
  tasks: Task[];
  today: string;
  onOpen: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {tasks.map((task) => (
        <li key={task.id}>
          <button
            type="button"
            onClick={() => onOpen(task.id)}
            className="flex w-full items-center gap-3 rounded-sm py-2 text-left text-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span className="w-24 shrink-0 text-xs text-muted-foreground">
              {taskStatusLabels[task.status]}
            </span>
            <span className="min-w-0 flex-1 truncate">{task.title}</span>
            {task.dueDate && (
              <span
                className={cn(
                  "shrink-0 text-xs tabular-nums",
                  task.dueDate < today
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {formatShort(task.dueDate)}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Block({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function Figure({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("text-lg font-semibold tabular-nums", tone)}>
        {value}
      </dd>
    </div>
  );
}

function Property({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-7 items-baseline gap-3">
      <dt className="w-20 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
  );
}

function MissingProject() {
  return (
    <PageContainer>
      <EmptyState
        icon={SearchX}
        title="Projeto não encontrado"
        description="O registro pode ter sido removido ou o link está errado."
        action={
          <Button asChild size="sm">
            <Link href="/projects">Voltar para projetos</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
