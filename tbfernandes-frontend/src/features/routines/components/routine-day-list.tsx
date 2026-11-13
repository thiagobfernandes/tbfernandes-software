"use client";

import { Flame, Play, Repeat, Square } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { ProgressBar } from "@/components/shared/progress-bar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { routineActions } from "@/features/routines/lib/routine-actions";
import {
  checkOn,
  routineSeconds,
  shortTime,
  streak,
} from "@/features/routines/lib/routines";
import type { Routine } from "@/features/routines/types/routine";
import { formatDuration } from "@/features/time-tracking/lib/time";
import { timeActions } from "@/features/time-tracking/lib/time-actions";
import type { TimeEntry } from "@/features/time-tracking/types/time-entry";
import { projectColorClasses } from "@/lib/project-colors";
import { selectors, useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

type RoutineDayListProps = {
  routines: Routine[];
  day: string;
  today: string;
  now: Date;
  running?: TimeEntry;
};

export function RoutineDayList({
  routines,
  day,
  today,
  now,
  running,
}: RoutineDayListProps) {
  if (routines.length === 0) {
    return (
      <EmptyState
        icon={Repeat}
        title="Nenhuma rotina para este dia"
        description="Crie uma rotina ou ajuste os dias da semana das que já existem."
      />
    );
  }
  return (
    <ol className="flex flex-col gap-2">
      {routines.map((routine) => (
        <RoutineDayRow
          key={routine.id}
          routine={routine}
          day={day}
          today={today}
          now={now}
          runningHere={running?.routineId === routine.id}
        />
      ))}
    </ol>
  );
}

type RoutineDayRowProps = {
  routine: Routine;
  day: string;
  today: string;
  now: Date;
  runningHere: boolean;
};

function RoutineDayRow({
  routine,
  day,
  today,
  now,
  runningHere,
}: RoutineDayRowProps) {
  const data = useAppData();
  const { findProject, findTask } = selectors(data);
  const project = findProject(routine.projectId);
  const task = findTask(routine.taskId);
  const done = Boolean(checkOn(data.routineChecks, routine.id, day));
  const seconds = routineSeconds(routine.id, data.timeEntries, day, now);
  const days = streak(routine, data.routineChecks, today);
  const target = routine.targetMinutes ? routine.targetMinutes * 60 : undefined;
  const checkboxId = `routine-${routine.id}-${day}`;

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-l-4 bg-card px-4 py-3 sm:flex-row sm:items-center",
        project ? projectColorClasses[project.color].border : "border-l-border",
        runningHere && "ring-1 ring-primary/40",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Checkbox
          id={checkboxId}
          className="mt-0.5"
          checked={done}
          disabled={day > today}
          onCheckedChange={() => {
            const nowDone = routineActions.toggle(routine, day);
            toast.success(nowDone ? "Rotina feita" : "Marcação desfeita", {
              description: routine.title,
            });
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label
            htmlFor={checkboxId}
            className={cn(
              "truncate font-medium",
              done && "text-muted-foreground line-through",
            )}
          >
            {routine.title}
          </label>
          <span className="truncate text-sm text-muted-foreground">
            {[shortTime(routine.startTime), project?.name, task?.title]
              .filter(Boolean)
              .join(" · ") || "Sem horário"}
          </span>
          {target && (
            <div className="flex items-center gap-2">
              <ProgressBar
                className="flex-1"
                value={(seconds / target) * 100}
                label={`Tempo apontado em ${routine.title}`}
              />
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDuration(seconds)} / {formatDuration(target)}
              </span>
            </div>
          )}
          {!target && seconds > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatDuration(seconds)} apontados
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
        {days > 0 && (
          <span
            className="flex items-center gap-1 px-2 text-sm text-primary tabular-nums"
            title="Dias seguidos"
          >
            <Flame className="size-4" aria-hidden />
            {days}
          </span>
        )}
        {day === today && (
          <TimerButton routine={routine} running={runningHere} />
        )}
      </div>
    </li>
  );
}

function TimerButton({
  routine,
  running,
}: {
  routine: Routine;
  running: boolean;
}) {
  if (running) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Parar ${routine.title}`}
        title="Parar cronômetro"
        onClick={() => {
          timeActions.stop();
          toast.success("Apontamento parado", { description: routine.title });
        }}
      >
        <Square />
      </Button>
    );
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Iniciar ${routine.title}`}
      title="Iniciar cronômetro"
      onClick={() => {
        routineActions.start(routine);
        toast.success("Cronômetro iniciado", { description: routine.title });
      }}
    >
      <Play />
    </Button>
  );
}
