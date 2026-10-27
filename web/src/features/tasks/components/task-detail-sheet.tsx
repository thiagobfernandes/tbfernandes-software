"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Pencil,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DueChip } from "@/features/tasks/components/due-chip";
import { TaskChecklist } from "@/features/tasks/components/task-checklist";
import { TaskKnowledge } from "@/features/knowledge/components/linked-knowledge";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import {
  taskStatusLabels,
  type TaskPriority,
  type TaskStatus,
} from "@/features/tasks/types/task";
import { formatShort } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { selectors, useWorkData, workActions } from "@/lib/sample-data/store";
import { currentDay } from "@/lib/today";
import { cn } from "@/lib/utils";

type TaskDetailSheetProps = {
  taskId?: string;
  onOpenChange: (open: boolean) => void;
};

export function TaskDetailSheet({
  taskId,
  onOpenChange,
}: TaskDetailSheetProps) {
  const data = useWorkData();
  const [editing, setEditing] = useState(false);
  const task = data.tasks.find((item) => item.id === taskId);
  const { findProject, findCompany } = selectors(data);
  const project = findProject(task?.projectId);
  const company = findCompany(project?.companyId);

  return (
    <>
      <Sheet open={Boolean(task)} onOpenChange={onOpenChange}>
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
          {task && (
            <>
              <SheetHeader className="gap-3 border-b p-6 pr-12">
                <div className="flex flex-wrap items-center gap-1.5">
                  {task.tag && (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {task.tag}
                    </span>
                  )}
                  {task.dueDate && (
                    <DueChip
                      dueDate={task.dueDate}
                      today={currentDay()}
                      done={task.status === "done"}
                    />
                  )}
                </div>
                <SheetTitle className="text-lg leading-snug">
                  {task.title}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 rounded-full",
                      project
                        ? projectColorClasses[project.color].bg
                        : "bg-muted-foreground/40",
                    )}
                  />
                  {project ? (
                    <Link
                      href={`/projects/${project.id}`}
                      className="hover:text-foreground"
                      onClick={() => onOpenChange(false)}
                    >
                      {project.name}
                    </Link>
                  ) : (
                    "Sem projeto"
                  )}
                  {company && <span>· {company.name}</span>}
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-6 p-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      Status
                    </span>
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
                      <SelectTrigger aria-label="Status" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(taskStatusLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      Prioridade
                    </span>
                    <Select
                      value={task.priority}
                      onValueChange={(value) =>
                        workActions.updateTask(task.id, {
                          priority: value as TaskPriority,
                        })
                      }
                    >
                      <SelectTrigger aria-label="Prioridade" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col gap-1 rounded-xl border p-3">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" aria-hidden /> Início
                    </dt>
                    <dd>
                      {task.startDate ? formatShort(task.startDate) : "—"}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 rounded-xl border p-3">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" aria-hidden /> Prazo
                    </dt>
                    <dd>{task.dueDate ? formatShort(task.dueDate) : "—"}</dd>
                  </div>
                  {task.completedAt && (
                    <div className="col-span-2 flex items-center gap-2 rounded-xl border border-success/40 p-3 text-success">
                      <CheckCircle2 className="size-4" aria-hidden />
                      Concluída em {formatShort(task.completedAt)}
                    </div>
                  )}
                </dl>

                <section className="flex flex-col gap-1.5">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    Descrição
                  </h3>
                  <p className="text-sm whitespace-pre-wrap">
                    {task.description || (
                      <span className="text-muted-foreground">
                        Sem descrição.
                      </span>
                    )}
                  </p>
                </section>

                <section className="flex flex-col gap-1.5">
                  <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Target className="size-3.5" aria-hidden /> Critério de
                    pronto
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

              <div className="mt-auto flex gap-2 border-t p-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditing(true)}
                >
                  <Pencil /> Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir esta tarefa?</AlertDialogTitle>
                      <AlertDialogDescription>
                        &ldquo;{task.title}&rdquo; será removida. Essa ação não
                        pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          workActions.deleteTask(task.id);
                          onOpenChange(false);
                          toast.success("Tarefa excluída");
                        }}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      {task && (
        <TaskFormDialog task={task} open={editing} onOpenChange={setEditing} />
      )}
    </>
  );
}
