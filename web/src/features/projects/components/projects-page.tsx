import { GanttChart, LayoutGrid, Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectTimeline } from "@/features/projects/components/project-timeline";
import { addDays, formatShort } from "@/lib/dates";
import {
  SAMPLE_TODAY,
  findCompany,
  sampleProjects,
  sampleTasks,
} from "@/lib/sample-data/work";

const TIMELINE_START = addDays(SAMPLE_TODAY, -4);
const TIMELINE_DAYS = 14;

const projectsById = new Map(
  sampleProjects.map((project) => [project.id, project]),
);

export function ProjectsPage() {
  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Projects"
        description="Professional, personal, and study projects grouped by outcome."
        actions={
          <>
            <SampleDataBadge />
            <Button disabled>
              <Plus /> New project
            </Button>
          </>
        }
      />

      <Tabs defaultValue="overview">
        <div className="flex flex-wrap items-center gap-3">
          <TabsList>
            <TabsTrigger value="overview">
              <LayoutGrid /> Overview
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <GanttChart /> Timeline
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {sampleProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                company={findCompany(project.companyId)}
                tasks={sampleTasks.filter(
                  (task) => task.projectId === project.id,
                )}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {formatShort(TIMELINE_START)} –{" "}
            {formatShort(addDays(TIMELINE_START, TIMELINE_DAYS - 1))}
          </p>
          <ProjectTimeline
            tasks={sampleTasks}
            projectsById={projectsById}
            start={TIMELINE_START}
            days={TIMELINE_DAYS}
            today={SAMPLE_TODAY}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
