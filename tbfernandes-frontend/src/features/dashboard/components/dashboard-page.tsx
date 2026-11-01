"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Check,
  FolderKanban,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { projectHref } from "@/lib/routes";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { RelationTree } from "@/components/shared/relation-tree";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import {
  DotRow,
  ProgressRing,
  Sparkline,
  TickBars,
} from "@/components/shared/metric-visuals";
import { LifeOverview } from "@/features/dashboard/components/life-overview";
import { AgendaPanel } from "@/features/dashboard/components/agenda-panel";
import { sampleTrends } from "@/features/dashboard/data/sample-dashboard";
import { NoteFormDialog } from "@/features/knowledge/components/knowledge-form-dialogs";
import { buildContextTree } from "@/features/knowledge/lib/graph";
import { CompanyFormDialog } from "@/features/companies/components/company-form-dialog";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
import { DueChip } from "@/features/tasks/components/due-chip";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { projectColorClasses } from "@/lib/project-colors";
import { selectors, useWorkData, workActions } from "@/lib/sample-data/store";
import { currentDay } from "@/lib/today";
import { daysBetween } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const data = useWorkData();
  const { findCompany, findProject, tasksOfProject } = selectors(data);
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const sampleTasks = data.tasks;
  const contextTree = buildContextTree(data);

  // Open tasks due within two days, most urgent first.
  const focusTasks = sampleTasks
    .filter(
      (task) =>
        task.status !== "done" &&
        task.status !== "canceled" &&
        task.dueDate &&
        daysBetween(currentDay(), task.dueDate) <= 2,
    )
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));

  const activeProjectRows = data.projects
    .filter((project) => project.status === "active")
    .map((project) => {
      const tasks = tasksOfProject(project.id);
      const done = tasks.filter((task) => task.status === "done").length;
      return {
        ...project,
        company: findCompany(project.companyId),
        progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
      };
    });

  const openTasks = sampleTasks.filter(
    (task) => task.status !== "done" && task.status !== "canceled",
  );
  const overdue = openTasks.filter(
    (task) => task.dueDate && task.dueDate < currentDay(),
  ).length;
  const doneThisWeek = sampleTasks.filter(
    (task) =>
      task.status === "done" &&
      task.dueDate &&
      daysBetween(task.dueDate, currentDay()) < 7,
  ).length;

  return (
    <div className="relative">
      {/* Soft accent glow at the top of the page, after the Luma reference. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_60%_100%_at_15%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent)]"
      />
      <PageContainer className="max-w-none">
        <PageHeading
          title="Visão geral"
          description="O que precisa da sua atenção em empresas, projetos e tarefas."
          actions={
            <>
              <SampleDataBadge />
              <CompanyFormDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <Building2 /> Empresa
                  </Button>
                }
              />
              <ProjectFormDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <FolderKanban /> Projeto
                  </Button>
                }
              />
              <TaskFormDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <ListChecks /> Tarefa
                  </Button>
                }
              />
              <NoteFormDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <BookOpen /> Nota
                  </Button>
                }
              />
            </>
          }
        />

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <section
              aria-label="Indicadores"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <MetricCard
                label="Tarefas abertas"
                value={openTasks.length}
                unit="tarefas"
                visual={<TickBars values={sampleTrends.openTasksPerDay} />}
              />
              <MetricCard
                label="Atrasadas"
                value={overdue}
                unit="tarefas"
                visual={<DotRow active={overdue} total={6} />}
              />
              <MetricCard
                label="Projetos ativos"
                value={activeProjectRows.length}
                unit={`/ ${data.projects.length}`}
                visual={
                  <ProgressRing
                    value={activeProjectRows.length}
                    total={data.projects.length}
                  />
                }
              />
              <MetricCard
                label="Concluídas na semana"
                value={doneThisWeek}
                unit="tarefas"
                visual={<Sparkline values={sampleTrends.doneLastSevenDays} />}
              />
            </section>

            <div className="grid gap-4 lg:grid-cols-5">
              <Card className="gap-2 rounded-2xl lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base">Hoje</CardTitle>
                  <CardDescription>
                    O que precisa ser feito nos próximos dois dias?
                  </CardDescription>
                  <CardAction>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/tasks">
                        Todas as tarefas <ArrowUpRight />
                      </Link>
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="px-3">
                  <ul className="flex flex-col">
                    {focusTasks.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent/60"
                      >
                        <button
                          type="button"
                          aria-label={`Marcar "${task.title}" como concluída`}
                          onClick={() => {
                            workActions.updateTask(task.id, { status: "done" });
                            toast.success("Tarefa concluída", {
                              action: {
                                label: "Desfazer",
                                onClick: () =>
                                  workActions.updateTask(task.id, {
                                    status: task.status,
                                  }),
                              },
                            });
                          }}
                          className="group/check flex size-4 shrink-0 items-center justify-center rounded-full border border-input outline-none hover:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <Check className="size-3 text-primary opacity-0 group-hover/check:opacity-100" />
                        </button>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <button
                            type="button"
                            onClick={() => setSelectedTaskId(task.id)}
                            className="truncate text-left text-sm font-medium outline-none hover:text-primary focus-visible:text-primary"
                          >
                            {task.title}
                          </button>
                          <span className="truncate text-xs text-muted-foreground">
                            {findProject(task.projectId)?.name ?? "Sem projeto"}
                          </span>
                        </div>
                        <PriorityBadge priority={task.priority} />
                        <span className="hidden sm:block">
                          <DueChip
                            dueDate={task.dueDate!}
                            today={currentDay()}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="gap-2 rounded-2xl lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Projetos ativos</CardTitle>
                  <CardDescription>
                    O que está acontecendo nos meus projetos?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-4">
                    {activeProjectRows.map((project) => (
                      <li key={project.id} className="flex flex-col gap-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <Link
                            href={projectHref(project.id)}
                            className="truncate text-sm font-medium hover:text-primary"
                          >
                            {project.name}
                          </Link>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {project.progress}%
                          </span>
                        </div>
                        <div
                          role="progressbar"
                          aria-label={`Progresso de ${project.name}`}
                          aria-valuenow={project.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          className="h-1.5 overflow-hidden rounded-full bg-muted"
                        >
                          <div
                            className={cn(
                              "h-full rounded-full",
                              projectColorClasses[project.color].bg,
                            )}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="truncate text-xs text-muted-foreground">
                          {project.company && `${project.company.name} · `}
                          {project.nextDelivery}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <LifeOverview data={data} />

            <Card className="gap-4 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">
                  Como seu trabalho se conecta
                </CardTitle>
                <CardDescription>
                  Cada tarefa ligada a um projeto, uma empresa e uma meta.
                </CardDescription>
                <CardAction>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/knowledge/graph">
                      Abrir grafo <ArrowUpRight />
                    </Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border bg-dot-grid px-4 py-8">
                  {contextTree ? (
                    <RelationTree root={contextTree} />
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">
                      Vincule um projeto a uma meta para ver como seu trabalho
                      se conecta.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="2xl:sticky 2xl:top-20 2xl:self-start">
            <AgendaPanel tasks={sampleTasks} today={currentDay()} />
          </div>
        </div>
        <TaskDetailSheet
          taskId={selectedTaskId}
          onOpenChange={(open) => !open && setSelectedTaskId(undefined)}
        />
      </PageContainer>
    </div>
  );
}
