"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  Flag,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { goalHref, projectHref } from "@/lib/routes";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { ProgressRing } from "@/components/shared/metric-visuals";
import { MissingRecord } from "@/components/shared/missing-record";
import { ProgressBar } from "@/components/shared/progress-bar";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { GoalFormDialog } from "@/features/goals/components/goal-form-dialog";
import {
  goalAreaIcons,
  GoalStatusBadge,
} from "@/features/goals/components/goal-meta";
import {
  formatIndicator,
  goalProgress,
  tasksOfGoal,
} from "@/features/goals/lib/goal-progress";
import { goalAreaLabels } from "@/features/goals/types/goal";
import { priorityLabels } from "@/features/tasks/types/task";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { TasksList } from "@/features/tasks/components/tasks-list";
import { describeDue, formatShort } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { dataActions, selectors, useAppData } from "@/lib/sample-data/store";
import { currentDay } from "@/lib/today";
import { cn } from "@/lib/utils";

export function GoalDetailPage({ goalId }: { goalId: string }) {
  const data = useAppData();
  const router = useRouter();
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDate, setMilestoneDate] = useState("");
  const [indicatorDraft, setIndicatorDraft] = useState<string>();

  const goal = data.goals.find((item) => item.id === goalId);
  if (!goal) {
    return (
      <MissingRecord
        noun="esta meta"
        backHref="/goals"
        backLabel="Voltar para metas"
      />
    );
  }

  const { projectsById } = selectors(data);
  const progress = goalProgress(data, goal);
  const parent = data.goals.find((item) => item.id === goal.parentId);
  const children = data.goals.filter((item) => item.parentId === goal.id);
  const milestones = data.milestones
    .filter((item) => item.goalId === goal.id)
    .sort((a, b) => (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9"));
  const projects = data.projects.filter(
    (project) => project.goalId === goal.id,
  );
  const tasks = tasksOfGoal(data, goal.id);
  const studies = data.studies.filter((study) => study.goalId === goal.id);
  const purchases = data.purchases.filter(
    (purchase) => purchase.goalId === goal.id,
  );
  const AreaIcon = goalAreaIcons[goal.area];

  function addMilestone(event: React.FormEvent) {
    event.preventDefault();
    if (!milestoneTitle.trim() || !goal) return;
    dataActions.create("milestones", {
      goalId: goal.id,
      title: milestoneTitle.trim(),
      dueDate: milestoneDate || undefined,
      done: false,
    });
    setMilestoneTitle("");
    setMilestoneDate("");
  }

  return (
    <PageContainer className="max-w-none">
      <Link
        href="/goals"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden /> Metas
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <AreaIcon className="size-6" aria-hidden />
          </span>
          <div className="flex flex-col gap-1.5">
            {parent && (
              <Link
                href={goalHref(parent.id)}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Parte de {parent.name}
              </Link>
            )}
            <h1 className="text-2xl font-semibold tracking-tight">
              {goal.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <GoalStatusBadge status={goal.status} />
              <span>{goalAreaLabels[goal.area]}</span>
              <span>· prioridade {priorityLabels[goal.priority]}</span>
              {goal.dueDate && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" aria-hidden />
                  {describeDue(goal.dueDate, currentDay()).label}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SampleDataBadge />
          <GoalFormDialog
            goal={goal}
            trigger={
              <Button variant="outline">
                <Pencil /> Editar
              </Button>
            }
          />
          <ConfirmDelete
            noun="meta"
            name={goal.name}
            onConfirm={() => {
              data.milestones
                .filter((item) => item.goalId === goal.id)
                .forEach((item) => dataActions.remove("milestones", item.id));
              dataActions.remove("goals", goal.id);
              toast.success("Meta excluída");
              router.push("/goals");
            }}
          />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section
            aria-label="De onde para onde"
            className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]"
          >
            <div className="flex flex-col gap-1 rounded-2xl border bg-card p-4">
              <span className="text-xs text-muted-foreground">
                Onde estou agora
              </span>
              <p className="text-sm">
                {goal.currentState || (
                  <span className="text-muted-foreground">Não descrito.</span>
                )}
              </p>
            </div>
            <ArrowRight
              className="mx-auto hidden size-5 self-center text-muted-foreground md:block"
              aria-hidden
            />
            <div className="flex flex-col gap-1 rounded-2xl border border-primary/40 bg-primary/5 p-4">
              <span className="text-xs text-primary">Resultado desejado</span>
              <p className="text-sm">{goal.desiredResult}</p>
              {goal.doneCriteria && (
                <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
                  Pronto quando: {goal.doneCriteria}
                </p>
              )}
            </div>
          </section>

          <Card className="gap-3 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Marcos</CardTitle>
              <CardDescription>
                Pontos de controle no caminho até o resultado.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {milestones.length > 0 && (
                <ol className="relative flex flex-col gap-1 before:absolute before:top-3 before:bottom-3 before:left-[11px] before:w-px before:bg-border">
                  {milestones.map((milestone) => (
                    <li
                      key={milestone.id}
                      className="group/m relative flex items-center gap-3 rounded-lg py-1.5 pr-1"
                    >
                      <span
                        className={cn(
                          "relative z-10 flex size-6 items-center justify-center rounded-full border bg-card",
                          milestone.done &&
                            "border-primary bg-primary text-primary-foreground",
                        )}
                      >
                        <Flag className="size-3" aria-hidden />
                      </span>
                      <Checkbox
                        id={`ms-${milestone.id}`}
                        checked={milestone.done}
                        onCheckedChange={(next) =>
                          dataActions.update("milestones", milestone.id, {
                            done: next === true,
                          })
                        }
                      />
                      <label
                        htmlFor={`ms-${milestone.id}`}
                        className={cn(
                          "flex-1 cursor-pointer text-sm",
                          milestone.done &&
                            "text-muted-foreground line-through",
                        )}
                      >
                        {milestone.title}
                      </label>
                      {milestone.dueDate && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatShort(milestone.dueDate)}
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label={`Remover marco "${milestone.title}"`}
                        onClick={() =>
                          dataActions.remove("milestones", milestone.id)
                        }
                        className="rounded p-0.5 text-muted-foreground opacity-0 outline-none group-hover/m:opacity-100 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ol>
              )}
              <form
                onSubmit={addMilestone}
                className="flex flex-col gap-2 sm:flex-row"
              >
                <Input
                  value={milestoneTitle}
                  onChange={(event) => setMilestoneTitle(event.target.value)}
                  placeholder="Novo marco"
                  aria-label="Título do marco"
                />
                <Input
                  type="date"
                  value={milestoneDate}
                  onChange={(event) => setMilestoneDate(event.target.value)}
                  aria-label="Data do marco"
                  className="sm:w-44"
                />
                <Button type="submit" variant="outline">
                  <Plus /> Adicionar
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="gap-3 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Tarefas</CardTitle>
              <CardDescription>
                Vinculadas à meta diretamente ou pelos projetos dela.
              </CardDescription>
              <CardAction>
                <TaskFormDialog
                  defaultGoalId={goal.id}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Plus /> Tarefa
                    </Button>
                  }
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              <TasksList
                tasks={tasks}
                projectsById={projectsById}
                today={currentDay()}
                onSelectTask={setSelectedTaskId}
              />
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="gap-4 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Progresso</CardTitle>
              <CardDescription>{progress.basis}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <ProgressRing
                  value={progress.percent}
                  total={100}
                  className="size-16"
                />
                <span className="text-4xl font-light tabular-nums">
                  {progress.percent}%
                </span>
              </div>
              {goal.indicator && (
                <form
                  className="flex flex-col gap-2 border-t pt-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const value = Number(indicatorDraft);
                    if (indicatorDraft === undefined || Number.isNaN(value))
                      return;
                    dataActions.update("goals", goal.id, {
                      indicator: { ...goal.indicator!, current: value },
                    });
                    setIndicatorDraft(undefined);
                    toast.success("Indicador atualizado");
                  }}
                >
                  <span className="text-xs text-muted-foreground">
                    {goal.indicator.label}:{" "}
                    {formatIndicator(
                      goal.indicator.current,
                      goal.indicator.unit,
                    )}{" "}
                    de{" "}
                    {formatIndicator(
                      goal.indicator.target,
                      goal.indicator.unit,
                    )}
                  </span>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      aria-label={`${goal.indicator.label} atual`}
                      value={indicatorDraft ?? goal.indicator.current}
                      onChange={(event) =>
                        setIndicatorDraft(event.target.value)
                      }
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={indicatorDraft === undefined}
                    >
                      Update
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="gap-3 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Projetos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum projeto vinculado. Escolha esta meta ao editar um
                  projeto.
                </p>
              )}
              {projects.map((project) => {
                const projectTasks = data.tasks.filter(
                  (task) => task.projectId === project.id,
                );
                const done = projectTasks.filter(
                  (task) => task.status === "done",
                ).length;
                const percent = projectTasks.length
                  ? Math.round((done / projectTasks.length) * 100)
                  : 0;
                return (
                  <Link
                    key={project.id}
                    href={projectHref(project.id)}
                    className="flex flex-col gap-1.5 rounded-lg hover:text-primary"
                  >
                    <span className="flex items-center justify-between gap-2 text-sm font-medium">
                      <span className="truncate">{project.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {percent}%
                      </span>
                    </span>
                    <ProgressBar
                      value={percent}
                      label={`Progresso de ${project.name}`}
                      barClassName={projectColorClasses[project.color].bg}
                    />
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {(children.length > 0 ||
            studies.length > 0 ||
            purchases.length > 0) && (
            <Card className="gap-3 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Relacionados</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1 text-sm">
                  {children.map((child) => (
                    <RelatedLink
                      key={child.id}
                      href={goalHref(child.id)}
                      kind="Submeta"
                      label={child.name}
                    />
                  ))}
                  {studies.map((study) => (
                    <RelatedLink
                      key={study.id}
                      href="/learning"
                      kind="Estudo"
                      label={study.name}
                    />
                  ))}
                  {purchases.map((purchase) => (
                    <RelatedLink
                      key={purchase.id}
                      href="/finance/purchases"
                      kind="Compra"
                      label={purchase.name}
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          <GoalFormDialog
            defaultParentId={goal.id}
            trigger={
              <Button variant="outline">
                <Plus /> Submeta
              </Button>
            }
          />
        </aside>
      </div>
      <TaskDetailSheet
        taskId={selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(undefined)}
      />
    </PageContainer>
  );
}

function RelatedLink({
  href,
  kind,
  label,
}: {
  href: string;
  kind: string;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/60"
      >
        <span className="w-16 shrink-0 text-[11px] text-muted-foreground uppercase">
          {kind}
        </span>
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}
