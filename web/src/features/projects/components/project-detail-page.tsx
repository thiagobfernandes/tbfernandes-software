"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
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
import { selectors, useWorkData } from "@/lib/sample-data/store";
import { SAMPLE_TODAY, isOpenTask } from "@/lib/sample-data/work";
import { cn } from "@/lib/utils";

const TIMELINE_DAYS = 14;

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const data = useWorkData();
  const { findCompany, findProject, tasksOfProject } = selectors(data);
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const project = findProject(projectId);
  if (!project) return <MissingProject />;

  const company = findCompany(project.companyId);
  const tasks = tasksOfProject(project.id);
  const projectsById = new Map([[project.id, project]]);
  const open = tasks.filter(isOpenTask);
  const inProgress = tasks.filter((task) => task.status === "in_progress");
  const done = tasks.filter((task) => task.status === "done");
  const overdue = open.filter(
    (task) => task.dueDate && task.dueDate < SAMPLE_TODAY,
  );
  const color = projectColorClasses[project.color];

  const totalDays = project.dueDate
    ? daysBetween(project.startDate, project.dueDate)
    : 0;
  const elapsed = Math.min(
    Math.max(daysBetween(project.startDate, SAMPLE_TODAY), 0),
    totalDays,
  );
  const daysLeft = project.dueDate
    ? daysBetween(SAMPLE_TODAY, project.dueDate)
    : undefined;

  return (
    <PageContainer className="max-w-none">
      <Link
        href="/projects"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden /> Projects
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
                "Personal initiative"
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
              {project.status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SampleDataBadge />
          <ProjectFormDialog
            project={project}
            trigger={
              <Button variant="outline">
                <Pencil /> Edit
              </Button>
            }
          />
          <TaskFormDialog
            defaultProjectId={project.id}
            trigger={
              <Button>
                <Plus /> Add task
              </Button>
            }
          />
        </div>
      </header>

      <section
        aria-label="Key numbers"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          label="Open tasks"
          value={open.length}
          unit={`${inProgress.length} in progress`}
        />
        <MetricCard
          label="Overdue"
          value={overdue.length}
          unit="tasks"
          visual={<DotRow active={overdue.length} total={6} />}
        />
        <MetricCard
          label="Done"
          value={done.length}
          unit={`/ ${tasks.length}`}
          visual={<ProgressRing value={done.length} total={tasks.length} />}
        />
        <MetricCard
          label="Time left"
          value={daysLeft ?? "—"}
          unit={daysLeft !== undefined ? "days" : "no deadline"}
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
              <GanttChart /> Timeline
            </TabsTrigger>
            <TabsTrigger value="board">
              <Columns3 /> Board
            </TabsTrigger>
            <TabsTrigger value="list">
              <List /> List
            </TabsTrigger>
          </TabsList>
          <TabsContent value="timeline">
            <ProjectTimeline
              tasks={tasks}
              projectsById={projectsById}
              start={addDays(SAMPLE_TODAY, -4)}
              days={TIMELINE_DAYS}
              today={SAMPLE_TODAY}
              onSelectTask={setSelectedTaskId}
            />
          </TabsContent>
          <TabsContent value="board">
            <TasksBoard
              tasks={tasks}
              projectsById={projectsById}
              today={SAMPLE_TODAY}
              onSelectTask={setSelectedTaskId}
              allowCreate
              defaultProjectId={project.id}
            />
          </TabsContent>
          <TabsContent value="list">
            <TasksList
              tasks={tasks}
              projectsById={projectsById}
              today={SAMPLE_TODAY}
              onSelectTask={setSelectedTaskId}
            />
          </TabsContent>
        </Tabs>

        <aside className="flex flex-col gap-4">
          <Card className="gap-3 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">About</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <p className="text-muted-foreground">
                {project.description ?? "No description yet."}
              </p>
              {project.nextDelivery && (
                <div
                  className={cn(
                    "rounded-xl border border-l-4 px-3 py-2",
                    color.border,
                  )}
                >
                  <span className="text-xs text-muted-foreground">
                    Next delivery
                  </span>
                  <p className="font-medium">{project.nextDelivery}</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="gap-3 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Notes &amp; snippets</CardTitle>
              <CardDescription>
                Programming knowledge for this project.
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
        title="Project not found"
        description="It may have been removed, or the link is wrong."
        action={
          <Button asChild size="sm">
            <Link href="/projects">Back to projects</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
