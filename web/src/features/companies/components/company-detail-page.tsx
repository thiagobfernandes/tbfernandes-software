"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  Pencil,
  Plus,
  SearchX,
  Trash2,
  UserRound,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { MetricCard } from "@/components/shared/metric-card";
import { DotRow, ProgressRing } from "@/components/shared/metric-visuals";
import { EmptyState } from "@/components/shared/empty-state";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { CompanyFormDialog } from "@/features/companies/components/company-form-dialog";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import {
  CompanyStatusLabel,
  RelationshipBadge,
} from "@/features/companies/components/company-badges";
import { ProjectCard } from "@/features/projects/components/project-card";
import { TasksList } from "@/features/tasks/components/tasks-list";
import { formatShort, parseDay } from "@/lib/dates";
import { selectors, useWorkData, workActions } from "@/lib/sample-data/store";
import { isOpenTask } from "@/lib/sample-data/work";
import { currentDay } from "@/lib/today";

export function CompanyDetailPage({ companyId }: { companyId: string }) {
  const data = useWorkData();
  const { findCompany, projectsOfCompany, tasksOfProject } = selectors(data);
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const router = useRouter();
  const company = findCompany(companyId);
  if (!company) return <MissingCompany />;

  const projects = projectsOfCompany(company.id);
  const projectsById = new Map(
    projects.map((project) => [project.id, project]),
  );
  const tasks = data.tasks.filter(
    (task) => task.projectId && projectsById.has(task.projectId),
  );
  const open = tasks.filter(isOpenTask);
  const overdue = open.filter(
    (task) => task.dueDate && task.dueDate < currentDay(),
  );
  const done = tasks.filter((task) => task.status === "done");

  return (
    <PageContainer className="max-w-none">
      <Link
        href="/companies"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden /> Companies
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-primary">
            <Building2 className="size-6" aria-hidden />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {company.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
              <RelationshipBadge relationship={company.relationship} />
              <CompanyStatusLabel status={company.status} />
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" aria-hidden />
                Since {formatShort(company.startDate)}{" "}
                {parseDay(company.startDate).getUTCFullYear()}
              </span>
              {company.mainContact && (
                <span className="flex items-center gap-1">
                  <UserRound className="size-3.5" aria-hidden />
                  {company.mainContact}
                </span>
              )}
            </div>
            {company.description && (
              <p className="max-w-2xl text-sm text-muted-foreground">
                {company.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SampleDataBadge />
          <CompanyFormDialog
            company={company}
            trigger={
              <Button variant="outline">
                <Pencil /> Edit
              </Button>
            }
          />
          <ConfirmDelete
            noun="company"
            name={company.name}
            consequence="Contacts linked to it are kept."
            blockedReason={
              projects.length
                ? `"${company.name}" still has ${projects.length} project${projects.length === 1 ? "" : "s"}. Move them to another company or delete them first.`
                : undefined
            }
            trigger={
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 /> Delete
              </Button>
            }
            onConfirm={() => {
              workActions.deleteCompany(company.id);
              toast.success("Company deleted");
              router.push("/companies");
            }}
          />
          <ProjectFormDialog
            defaultCompanyId={company.id}
            trigger={
              <Button>
                <Plus /> New project
              </Button>
            }
          />
        </div>
      </header>

      <section
        aria-label="Key numbers"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard label="Projects" value={projects.length} unit="linked" />
        <MetricCard label="Open tasks" value={open.length} unit="tasks" />
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
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Projects</h2>
        {projects.length === 0 ? (
          <p className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No projects linked to this company.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                company={company}
                tasks={tasksOfProject(project.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Tasks</h2>
        <TasksList
          tasks={tasks}
          projectsById={projectsById}
          today={currentDay()}
          onSelectTask={setSelectedTaskId}
        />
      </section>
      <TaskDetailSheet
        taskId={selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(undefined)}
      />
    </PageContainer>
  );
}

function MissingCompany() {
  return (
    <PageContainer>
      <EmptyState
        icon={SearchX}
        title="Company not found"
        description="It may have been removed, or the link is wrong."
        action={
          <Button asChild size="sm">
            <Link href="/companies">Back to companies</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
