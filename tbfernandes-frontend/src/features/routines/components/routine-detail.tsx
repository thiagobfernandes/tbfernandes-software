"use client";

import { useState } from "react";
import { Pause, Pencil, Play, Square, X } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Button } from "@/components/ui/button";
import { WorkspaceToolbar } from "@/components/workspace/workspace-toolbar";
import { RoutineHeatmap } from "@/features/routines/components/routine-heatmap";
import { routineActions } from "@/features/routines/lib/routine-actions";
import {
  type CheckIndex,
  bestStreak,
  checkedOn,
  percent,
  rate,
  scheduledOn,
  secondsBetween,
  tally,
} from "@/features/routines/lib/routine-stats";
import {
  frequencyLabel,
  isDueOn,
  shortTime,
  streak,
} from "@/features/routines/lib/routines";
import type { Routine } from "@/features/routines/types/routine";
import {
  formatDuration,
  runningEntry,
  shiftDay,
} from "@/features/time-tracking/lib/time";
import { timeActions } from "@/features/time-tracking/lib/time-actions";
import { parseDay } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { selectors, useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

import { RoutineFormDialog } from "./routine-form-dialog";

/** Side panel of one routine: schedule, links, consistency and its actions. */
export function RoutineDetail({
  routine,
  today,
  now,
  index,
  onClose,
}: {
  routine: Routine;
  today: string;
  now: Date;
  index: CheckIndex;
  onClose: () => void;
}) {
  const data = useAppData();
  const { findProject, findTask, findGoal } = selectors(data);
  const [editing, setEditing] = useState(false);
  const project = findProject(routine.projectId);
  const task = findTask(routine.taskId);
  const goal = findGoal(routine.goalId);
  const running = runningEntry(data.timeEntries)?.routineId === routine.id;
  const from30 = shiftDay(today, -29);
  const month = tally(routine, index, from30, today, today);
  const current = routine.active
    ? streak(routine, data.routineChecks, today)
    : 0;
  const best = bestStreak(routine, index, today);
  const seconds = secondsBetween(
    routine.id,
    data.timeEntries,
    from30,
    today,
    now,
  );
  const doneToday = checkedOn(routine.id, today, index);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <WorkspaceToolbar
        actions={
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Editar rotina"
              title="Editar"
              onClick={() => setEditing(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={routine.active ? "Pausar rotina" : "Retomar rotina"}
              title={routine.active ? "Pausar" : "Retomar"}
              onClick={() => {
                routineActions.setActive(routine, !routine.active);
                toast.success(
                  routine.active ? "Rotina pausada" : "Rotina retomada",
                  {
                    description: routine.title,
                  },
                );
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              {routine.active ? <Pause /> : <Play />}
            </Button>
            <ConfirmDelete
              noun="rotina"
              name={routine.title}
              consequence="As marcações dos dias vão junto; os apontamentos ficam, sem a rotina."
              onConfirm={() => {
                routineActions.remove(routine.id);
                toast.success("Rotina excluída");
                onClose();
              }}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Fechar detalhes"
              title="Fechar (Esc)"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X />
            </Button>
          </>
        }
      >
        <span className="text-xs font-medium text-muted-foreground">
          Rotina
        </span>
      </WorkspaceToolbar>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
        <header className="flex flex-col gap-1.5">
          <h2 className="text-lg leading-snug font-semibold">
            {routine.title}
          </h2>
          <p className="text-xs text-muted-foreground">
            {[
              routine.active ? null : "Pausada",
              frequencyLabel(routine.weekdays),
              shortTime(routine.startTime),
              routine.targetMinutes && `meta de ${routine.targetMinutes} min`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {routine.description && (
            <p className="pt-1 text-sm whitespace-pre-line text-muted-foreground">
              {routine.description}
            </p>
          )}
        </header>

        {isDueOn(routine, today) && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={doneToday ? "outline" : "default"}
              onClick={() => {
                const nowDone = routineActions.toggle(routine, today);
                toast.success(nowDone ? "Rotina feita" : "Marcação desfeita", {
                  description: routine.title,
                });
              }}
            >
              {doneToday ? "Desfazer hoje" : "Marcar hoje como feita"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (running) {
                  timeActions.stop();
                  toast.success("Apontamento parado", {
                    description: routine.title,
                  });
                } else {
                  routineActions.start(routine);
                  toast.success("Cronômetro iniciado", {
                    description: routine.title,
                  });
                }
              }}
            >
              {running ? <Square /> : <Play />}
              {running ? "Parar" : "Cronômetro"}
            </Button>
          </div>
        )}

        <dl className="grid grid-cols-3 gap-3">
          <Figure
            label="30 dias"
            value={percent(rate(month))}
            hint={`${month.done}/${month.due}`}
          />
          <Figure
            label="Sequência"
            value={`${current} d`}
            hint={`melhor: ${best} d`}
          />
          <Figure
            label="Tempo"
            value={formatDuration(seconds)}
            hint="em 30 dias"
          />
        </dl>

        <section className="flex flex-col gap-2">
          <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Últimas 16 semanas
          </h3>
          <RoutineHeatmap
            today={today}
            weeks={16}
            label={`Histórico de ${routine.title}`}
            cellFor={(day) => {
              const checked = checkedOn(routine.id, day, index);
              if (!scheduledOn(routine, day, index))
                return { kind: "off", extra: checked };
              if (day === today && !checked) return { kind: "off" };
              return {
                kind: "due",
                ratio: checked ? 1 : 0,
                label: checked ? "feita" : "não feita",
              };
            }}
          />
        </section>

        <section className="flex flex-col gap-1 text-sm">
          <h3 className="pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Vínculos
          </h3>
          <Property label="Projeto">
            {project ? (
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full",
                    projectColorClasses[project.color].bg,
                  )}
                />
                {project.name}
              </span>
            ) : (
              "—"
            )}
          </Property>
          <Property label="Tarefa">{task?.title ?? "—"}</Property>
          <Property label="Meta">{goal?.name ?? "—"}</Property>
          <Property label="Desde">
            {parseDay(routine.startDate).toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            })}
          </Property>
        </section>
      </div>

      <RoutineFormDialog
        today={today}
        item={routine}
        open={editing}
        onOpenChange={setEditing}
      />
    </div>
  );
}

function Figure({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-muted/40 px-2.5 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-base font-semibold tabular-nums">{value}</dd>
      <dd className="text-[11px] text-muted-foreground tabular-nums">{hint}</dd>
    </div>
  );
}

function Property({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-8 items-center gap-3">
      <span className="w-16 shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}
