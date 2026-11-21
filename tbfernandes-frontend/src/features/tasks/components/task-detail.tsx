"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Copy,
  Pencil,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { priorityText } from "@/components/shared/priority-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskKnowledge } from "@/features/knowledge/components/linked-knowledge";
import { DueChip } from "@/features/tasks/components/due-chip";
import { TaskChecklist } from "@/features/tasks/components/task-checklist";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { duplicateTask } from "@/features/tasks/components/tasks-board";
import {
  priorityOrder,
  taskRef,
  timeByTask,
} from "@/features/tasks/lib/task-view";
import {
  taskStatusLabels,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/features/tasks/types/task";
import { formatDuration } from "@/features/time-tracking/lib/time";
import { formatShort } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { projectHref } from "@/lib/routes";
import { selectors, useAppData, workActions } from "@/lib/sample-data/store";
import { currentDay } from "@/lib/today";
import { cn } from "@/lib/utils";

/**
 * Everything about one task: quick-edit properties, description, done
 * criteria, checklist, related knowledge and logged time. Shared by the
 * board's side panel and the sheet used elsewhere, so there is one detail.
 */
export function TaskDetail({
  task,
  onClose,
  toolbar,
  wide = false,
}: {
  task: Task;
  onClose: () => void;
  /** Panel controls (maximize, close) rendered in the header row. */
  toolbar?: React.ReactNode;
  wide?: boolean;
}) {
  const data = useAppData();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { findProject, findCompany } = selectors(data);
  const project = findProject(task.projectId);
  const company = findCompany(project?.companyId);
  const entries = data.timeEntries.filter((entry) => entry.taskId === task.id);
  const seconds = timeByTask(entries).get(task.id) ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b px-3 pointer-coarse:h-12">
        <span className="font-mono text-xs text-muted-foreground">
          {taskRef(task)}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Editar tarefa"
            title="Editar"
            onClick={() => setEditing(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Duplicar tarefa"
            title="Duplicar"
            onClick={() => {
              duplicateTask(task);
              toast.success("Tarefa duplicada");
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Copy />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Excluir tarefa"
            title="Excluir"
            onClick={() => setConfirming(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
          {toolbar}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={cn(
            "flex flex-col gap-6 px-5 py-5",
            wide && "mx-auto max-w-3xl md:px-10 md:py-10",
          )}
        >
          <header className="flex flex-col gap-2">
            <h2
              className={cn(
                "leading-snug font-semibold text-balance",
                wide ? "text-2xl" : "text-lg",
              )}
            >
              {task.title}
            </h2>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span
                aria-hidden
                className={cn(
                  "size-1.5 rounded-full",
                  project
                    ? projectColorClasses[project.color].bg
                    : "bg-muted-foreground/40",
                )}
              />
              {project ? (
                <Link
                  href={projectHref(project.id)}
                  className="hover:text-foreground"
                >
                  {project.name}
                </Link>
              ) : (
                "Sem projeto"
              )}
              {company && <span>· {company.tradeName || company.name}</span>}
              {task.tag && <span>· {task.tag}</span>}
            </p>
          </header>

          <dl className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd>
              <Select
                value={task.status}
                onValueChange={(value) => {
                  workActions.updateTask(task.id, {
                    status: value as TaskStatus,
                  });
                  toast.success(
                    `Movida para ${taskStatusLabels[value as TaskStatus]}`,
                  );
                }}
              >
                <SelectTrigger
                  aria-label="Status"
                  size="sm"
                  className="h-8 w-full max-w-56 border-transparent shadow-none hover:bg-muted/60"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(taskStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </dd>
            <dt className="text-xs text-muted-foreground">Prioridade</dt>
            <dd>
              <Select
                value={task.priority}
                onValueChange={(value) =>
                  workActions.updateTask(task.id, {
                    priority: value as TaskPriority,
                  })
                }
              >
                <SelectTrigger
                  aria-label="Prioridade"
                  size="sm"
                  className="h-8 w-full max-w-56 border-transparent shadow-none hover:bg-muted/60"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOrder.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priorityText[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </dd>
            <dt className="text-xs text-muted-foreground">Início</dt>
            <dd className="px-3">
              {task.startDate ? formatShort(task.startDate) : "—"}
            </dd>
            <dt className="text-xs text-muted-foreground">Prazo</dt>
            <dd className="px-3">
              {task.dueDate ? (
                <DueChip
                  dueDate={task.dueDate}
                  today={currentDay()}
                  done={task.status === "done"}
                  className="border-0 px-0 text-sm"
                />
              ) : (
                "—"
              )}
            </dd>
            <dt className="text-xs text-muted-foreground">Tempo</dt>
            <dd className="flex items-center gap-1.5 px-3">
              <Clock aria-hidden className="size-3.5 text-muted-foreground" />
              {seconds > 0 ? formatDuration(seconds) : "Nenhum apontamento"}
              <Link
                href="/time-tracking"
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Apontamentos
              </Link>
            </dd>
          </dl>

          {task.completedAt && (
            <p className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="size-4" aria-hidden />
              Concluída em {formatShort(task.completedAt)}
            </p>
          )}

          <section className="flex flex-col gap-1.5">
            <h3 className="text-xs font-medium text-muted-foreground">
              Descrição
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {task.description || (
                <span className="text-muted-foreground">Sem descrição.</span>
              )}
            </p>
          </section>

          <section className="flex flex-col gap-1.5">
            <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Target className="size-3.5" aria-hidden /> Critério de pronto
            </h3>
            <p className="text-sm">
              {task.doneCriteria || (
                <span className="text-muted-foreground">
                  Ainda não definido. Descreva o resultado esperado.
                </span>
              )}
            </p>
          </section>

          <TaskChecklist task={task} />
          <TaskKnowledge taskId={task.id} />
        </div>
      </div>

      <TaskFormDialog task={task} open={editing} onOpenChange={setEditing} />
      <ConfirmDelete
        noun="tarefa"
        name={task.title}
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={() => {
          workActions.deleteTask(task.id);
          onClose();
          toast.success("Tarefa excluída");
        }}
      />
    </div>
  );
}
