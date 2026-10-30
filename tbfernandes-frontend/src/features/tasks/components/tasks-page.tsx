"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Columns3, List, Plus, Search } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { TasksBoard } from "@/features/tasks/components/tasks-board";
import { TasksList } from "@/features/tasks/components/tasks-list";
import type { TaskPriority } from "@/features/tasks/types/task";
import { projectColorClasses } from "@/lib/project-colors";
import { selectors, useWorkData } from "@/lib/sample-data/store";
import { currentDay } from "@/lib/today";
import { cn } from "@/lib/utils";

const priorities: TaskPriority[] = ["urgent", "high", "normal", "low"];

export function TasksPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [projectId, setProjectId] = useState<string>();
  const [priority, setPriority] = useState<TaskPriority>();
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const data = useWorkData();
  const { projectsById } = selectors(data);

  const tasks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.tasks.filter(
      (task) =>
        (!needle ||
          task.title.toLowerCase().includes(needle) ||
          task.description?.toLowerCase().includes(needle) ||
          task.tag?.toLowerCase().includes(needle)) &&
        (!projectId || task.projectId === projectId) &&
        (!priority || task.priority === priority),
    );
  }, [data.tasks, query, projectId, priority]);

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Tarefas"
        description="Trabalho acionável com status, prioridade e um critério de pronto claro."
        actions={
          <>
            <SampleDataBadge />
            <TaskFormDialog
              defaultProjectId={projectId}
              trigger={
                <Button>
                  <Plus /> Nova tarefa
                </Button>
              }
            />
          </>
        }
      />

      <Tabs defaultValue="board">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <TabsList>
            <TabsTrigger value="list">
              <List /> Lista
            </TabsTrigger>
            <TabsTrigger value="board">
              <Columns3 /> Quadro
            </TabsTrigger>
          </TabsList>

          <div className="relative lg:ml-2 lg:w-64">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar tarefas…"
              aria-label="Buscar tarefas"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
            <FilterChip
              active={!projectId}
              onClick={() => setProjectId(undefined)}
            >
              Todos os projetos
            </FilterChip>
            {data.projects
              .filter((project) => project.status === "active")
              .map((project) => (
                <FilterChip
                  key={project.id}
                  active={projectId === project.id}
                  onClick={() =>
                    setProjectId(
                      projectId === project.id ? undefined : project.id,
                    )
                  }
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 rounded-full",
                      projectColorClasses[project.color].bg,
                    )}
                  />
                  {project.name}
                </FilterChip>
              ))}
            <span aria-hidden className="mx-1 h-5 w-px bg-border" />
            {priorities.map((value) => (
              <FilterChip
                key={value}
                active={priority === value}
                onClick={() =>
                  setPriority(priority === value ? undefined : value)
                }
              >
                <span className="capitalize">{value}</span>
              </FilterChip>
            ))}
          </div>
        </div>

        <TabsContent value="list">
          <TasksList
            tasks={tasks}
            projectsById={projectsById}
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
            defaultProjectId={projectId}
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

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
        active && "border-primary/60 bg-primary/10 text-foreground",
      )}
    >
      {children}
    </button>
  );
}
