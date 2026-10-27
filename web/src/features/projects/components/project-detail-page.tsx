"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  Columns3,
  GanttChart,
  List,
  Pencil,
  Plus,
  SearchX,
  Tag,
  Trash2,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { DotRow, ProgressRing } from "@/components/shared/metric-visuals";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LinkedKnowledge } from "@/features/knowledge/components/linked-knowledge";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
import { ProjectTimeline } from "@/features/projects/components/project-timeline";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { TasksBoard } from "@/features/tasks/components/tasks-board";
import { TasksList } from "@/features/tasks/components/tasks-list";
import { addDays, daysBetween, formatShort } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { selectors, useWorkData, workActions } from "@/lib/sample-data/store";
import { isOpenTask } from "@/lib/sample-data/work";
import { currentDay } from "@/lib/today";
import { projectStatusLabels } from "@/features/projects/types/project";
import { cn } from "@/lib/utils";

const TIMELINE_DAYS = 14;

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const data = useWorkData();
  const { findCompany, findProject, tasksOfProject } = selectors(data);
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const router = useRouter();
  const project = findProject(projectId);
  if (!project) return <MissingProject />;

  const company = findCompany(project.companyId);
  const tasks = tasksOfProject(project.id);
  const projectsById = new Map([[project.id, project]]);
  const open = tasks.filter(isOpenTask);
  const inProgress = tasks.filter((task) => task.status === "in_progress");
  const done = tasks.filter((task) => task.status === "done");
  const overdue = open.filter(
    (task) => task.dueDate && task.dueDate < currentDay(),
  );
  const color = projectColorClasses[project.color];

  const totalDays = project.dueDate
    ? daysBetween(project.startDate, project.dueDate)
    : 0;
  const elapsed = Math.min(
    Math.max(daysBetween(project.startDate, currentDay()), 0),
    totalDays,
  );
  const daysLeft = project.dueDate
    ? daysBetween(currentDay(), project.dueDate)
    : undefined;

  return (
    <PageContainer className="max-w-none">
      <Link
        href="/projects"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden /> Projetos
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <span aria-hidden className={color.text}>
              #
            </span>
            {project.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-3.5" aria-hidden />
              {company ? (
                <Link
                  href={`/companies/${company.id}`}
                  className="hover:text-foreground"
                >
                  {company.name}
                </Link>
              ) : (
                "Iniciativa pessoal"
              )}
            </span>
            <span className="flex items-center gap-1.5 capitalize">
              <Tag className="size-3.5" aria-hidden />
              {project.category}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden />
              {formatShort(project.startDate)}
              {project.dueDate && ` – ${formatShort(project.dueDate)}`}
            </span>
            <span className="text-xs font-medium text-success capitalize">
              {projectStatusLabels[project.status]}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SampleDataBadge />
          <ProjectFormDialog
            project={project}
            trigger={
              <Button variant="outline">
                <Pencil /> Editar
              </Button>
            }
          />
          <ConfirmDelete
            noun="projeto"
            name={project.name}
            consequence="As tarefas, notas e snippets dele continuam, sem projeto."
            trigger={
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 /> Excluir
              </Button>
            }
            onConfirm={() => {
              workActions.deleteProject(project.id);
              toast.success("Projeto excluído");
              router.push("/projects");
            }}
          />
          <TaskFormDialog
            defaultProjectId={project.id}
            trigger={
              <Button>
                <Plus /> Nova tarefa
              </Button>
            }
          />
        </div>
      </header>

      <section
        aria-label="Indicadores"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Tarefas abertas"
          value={open.length}
          unit={`${inProgress.length} em andamento`}
        />
        <MetricCard
          label="Atrasadas"
          value={overdue.length}
          unit="tarefas"
          visual={<DotRow active={overdue.length} total={6} />}
        />
        <MetricCard
          label="Concluídas"
          value={done.length}
          unit={`/ ${tasks.length}`}
          visual={<ProgressRing value={done.length} total={tasks.length} />}
        />
        <MetricCard
          label="Tempo restante"
          value={daysLeft ?? "—"}
          unit={daysLeft !== undefined ? "days" : "sem prazo"}
          visual={
            totalDays > 0 ? (
              <ProgressRing value={elapsed} total={totalDays} />
            ) : undefined
          }
        />
      </section>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Tabs defaultValue="timeline" className="min-w-0">
          <TabsList>
            <TabsTrigger value="timeline">
              <GanttChart /> Linha do tempo
            </TabsTrigger>
            <TabsTrigger value="board">
              <Columns3 /> Quadro
            </TabsTrigger>
            <TabsTrigger value="list">
              <List /> Lista
            </TabsTrigger>
          </TabsList>
          <TabsContent value="timeline">
            <ProjectTimeline
              tasks={tasks}
              projectsById={projectsById}
              start={addDays(currentDay(), -4)}
              days={TIMELINE_DAYS}
              today={currentDay()}
              onSelectTask={setSelectedTaskId}
            />
          </TabsContent>
          <TabsContent value="board">
            <TasksBoard
              tasks={tasks}
              projectsById={projectsById}
              today={currentDay()}
              onSelectTask={setSelectedTaskId}
              allowCreate
              defaultProjectId={project.id}
            />
          </TabsContent>
          <TabsContent value="list">
            <TasksList
              tasks={tasks}
              projectsById={projectsById}
              today={currentDay()}
              onSelectTask={setSelectedTaskId}
            />
          </TabsContent>
        </Tabs>

        <aside className="flex flex-col gap-4">
          <Card className="gap-3 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Sobre</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <p className="text-muted-foreground">
                {project.description ?? "Ainda sem descrição."}
              </p>
              {project.nextDelivery && (
                <div
                  className={cn(
                    "rounded-xl border border-l-4 px-3 py-2",
                    color.border,
                  )}
                >
                  <span className="text-xs text-muted-foreground">
                    Próxima entrega
                  </span>
                  <p className="font-medium">{project.nextDelivery}</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="gap-3 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Notas e snippets</CardTitle>
              <CardDescription>
                Conhecimento de programação deste projeto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LinkedKnowledge projectId={project.id} />
            </CardContent>
          </Card>
        </aside>
      </div>
      <TaskDetailSheet
        taskId={selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(undefined)}
      />
    </PageContainer>
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
