"use client";

import { useState } from "react";
import { GanttChart, LayoutGrid, Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
import { ProjectTimeline } from "@/features/projects/components/project-timeline";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { addDays, formatShort } from "@/lib/dates";
import { selectors, useWorkData } from "@/lib/sample-data/store";
import { useToday } from "@/lib/today";

const TIMELINE_DAYS = 14;

export function ProjectsPage() {
  const data = useWorkData();
  const { findCompany, tasksOfProject, projectsById } = selectors(data);
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const today = useToday();
  const timelineStart = addDays(today, -4);

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Projetos"
        description="Projetos profissionais, pessoais e de estudo agrupados por resultado."
        actions={
          <>
            <SampleDataBadge />
            <ProjectFormDialog
              trigger={
                <Button>
                  <Plus /> Novo projeto
                </Button>
              }
            />
          </>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutGrid /> Visão geral
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <GanttChart /> Linha do tempo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {data.projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                company={findCompany(project.companyId)}
                tasks={tasksOfProject(project.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {formatShort(timelineStart)} –{" "}
            {formatShort(addDays(timelineStart, TIMELINE_DAYS - 1))}
          </p>
          <ProjectTimeline
            tasks={data.tasks}
            projectsById={projectsById}
            start={timelineStart}
            days={TIMELINE_DAYS}
            today={today}
            onSelectTask={setSelectedTaskId}
          />
        </TabsContent>
      </Tabs>
      <TaskDetailSheet
        taskId={selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(undefined)}
      />
    </PageContainer>
  );
}
