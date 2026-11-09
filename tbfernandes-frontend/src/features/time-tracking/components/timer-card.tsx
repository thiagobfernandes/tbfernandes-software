"use client";

import { useState } from "react";
import { Play, Square, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatClock, entrySeconds } from "@/features/time-tracking/lib/time";
import { timeActions } from "@/features/time-tracking/lib/time-actions";
import type { TimeEntry } from "@/features/time-tracking/types/time-entry";
import { projectColorClasses } from "@/lib/project-colors";
import { selectors, useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

const NONE = "__none";

type TimerCardProps = {
  running?: TimeEntry;
  now: Date;
};

export function TimerCard({ running, now }: TimerCardProps) {
  const data = useAppData();
  const { findProject, findTask } = selectors(data);
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>();
  const [taskId, setTaskId] = useState<string>();

  const openTasks = data.tasks.filter(
    (task) =>
      task.status !== "done" &&
      task.status !== "canceled" &&
      (!projectId || task.projectId === projectId),
  );

  function start(event: React.FormEvent) {
    event.preventDefault();
    const task = findTask(taskId);
    const text = description.trim() || task?.title || "";
    if (!text) return;
    timeActions.start({
      description: text,
      projectId: task?.projectId ?? projectId,
      taskId,
    });
    toast.success(running ? "Atividade trocada" : "Apontamento iniciado", {
      description: text,
    });
    setDescription("");
    setTaskId(undefined);
  }

  function stop() {
    const stopped = timeActions.stop();
    if (stopped)
      toast.success("Apontamento parado", { description: stopped.description });
  }

  const project = findProject(running?.projectId);
  const task = findTask(running?.taskId);

  return (
    <section className="flex flex-col gap-5 rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-full",
                running ? "animate-pulse bg-primary" : "bg-muted-foreground/40",
              )}
            />
            {running ? "Em andamento" : "Nada em andamento"}
          </span>
          <p className="truncate text-lg font-semibold">
            {running?.description ?? "No que você vai trabalhar agora?"}
          </p>
          {running && (project || task) && (
            <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              {project && (
                <span
                  aria-hidden
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    projectColorClasses[project.color].bg,
                  )}
                />
              )}
              <span className="truncate">
                {[project?.name, task?.title].filter(Boolean).join(" · ")}
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span
            className="text-5xl font-light tracking-tight tabular-nums"
            aria-live="off"
          >
            {formatClock(running ? entrySeconds(running, now) : 0)}
          </span>
          {running && (
            <Button
              variant="outline"
              onClick={stop}
              aria-label="Parar apontamento"
            >
              <Square /> Parar
            </Button>
          )}
        </div>
      </div>

      <form
        onSubmit={start}
        className="grid gap-3 border-t pt-4 md:grid-cols-[minmax(0,1fr)_12rem_14rem_auto]"
      >
        <Input
          aria-label={running ? "Próxima atividade" : "O que você está fazendo"}
          placeholder={
            running ? "Trocar para…" : "Ex.: revisando o PR de sincronização"
          }
          value={description}
          maxLength={200}
          onChange={(event) => setDescription(event.target.value)}
        />
        <Select
          value={projectId ?? NONE}
          onValueChange={(value) => {
            setProjectId(value === NONE ? undefined : value);
            setTaskId(undefined);
          }}
        >
          <SelectTrigger aria-label="Projeto" className="w-full">
            <SelectValue placeholder="Projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Sem projeto</SelectItem>
            {data.projects.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={taskId ?? NONE}
          onValueChange={(value) =>
            setTaskId(value === NONE ? undefined : value)
          }
        >
          <SelectTrigger aria-label="Tarefa" className="w-full">
            <SelectValue placeholder="Tarefa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Sem tarefa</SelectItem>
            {openTasks.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={!description.trim() && !taskId}>
          {running ? <ArrowRightLeft /> : <Play />}
          {running ? "Trocar" : "Iniciar"}
        </Button>
      </form>
    </section>
  );
}
