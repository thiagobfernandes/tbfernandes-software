"use client";

import { Flame, Play, Square } from "lucide-react";
import { toast } from "sonner";

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
  activeId?: string;
  onSelect: (routine: Routine) => void;
};

/** The day's execution list: check, time and streak, one dense row each. */
export function RoutineDayList({
  routines,
  day,
  today,
  now,
  running,
  activeId,
  onSelect,
}: RoutineDayListProps) {
  return (
    <ol className="flex flex-col divide-y divide-border/60">
      {routines.map((routine) => (
        <RoutineDayRow
          key={routine.id}
          routine={routine}
          day={day}
          today={today}
          now={now}
          runningHere={running?.routineId === routine.id}
          active={routine.id === activeId}
          onSelect={() => onSelect(routine)}
        />
      ))}
    </ol>
  );
}

function RoutineDayRow({
  routine,
  day,
  today,
  now,
  runningHere,
  active,
  onSelect,
}: {
  routine: Routine;
  day: string;
  today: string;
  now: Date;
  runningHere: boolean;
  active: boolean;
  onSelect: () => void;
}) {
  const data = useAppData();
  const { findProject, findTask, findGoal } = selectors(data);
  const project = findProject(routine.projectId);
  const task = findTask(routine.taskId);
  const goal = findGoal(routine.goalId);
  const done = Boolean(checkOn(data.routineChecks, routine.id, day));
  const seconds = routineSeconds(routine.id, data.timeEntries, day, now);
  const days = streak(routine, data.routineChecks, today);
  const target = routine.targetMinutes ? routine.targetMinutes * 60 : undefined;
  const time = shortTime(routine.startTime);
  const checkboxId = `routine-${routine.id}-${day}`;

  return (
    <li
      className={cn(
        "group relative flex min-h-12 items-center gap-3 px-4 py-2 transition-colors hover:bg-accent/40 pointer-coarse:min-h-14",
        active && "bg-accent/60 hover:bg-accent/60",
      )}
    >
      <Checkbox
        id={checkboxId}
        checked={done}
        disabled={day > today}
        aria-label={`${done ? "Desmarcar" : "Marcar"} ${routine.title}`}
        onCheckedChange={() => {
          const nowDone = routineActions.toggle(routine, day);
          toast.success(nowDone ? "Rotina feita" : "Marcação desfeita", {
            description: routine.title,
          });
        }}
      />
      <span className="w-11 shrink-0 text-xs text-muted-foreground tabular-nums">
        {time ?? "—"}
      </span>
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span
          className={cn(
            "max-w-full truncate text-sm font-medium",
            done &&
              "text-muted-foreground line-through decoration-muted-foreground/60",
          )}
        >
          {routine.title}
        </span>
        {(project || task || goal) && (
          <span className="flex max-w-full items-center gap-1.5 truncate text-xs text-muted-foreground">
            {project && (
              <span
                aria-hidden
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  projectColorClasses[project.color].bg,
                )}
              />
            )}
            <span className="truncate">
              {[project?.name, task?.title, goal?.name]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
        )}
      </button>

      {(target || seconds > 0) && (
        <span
          className="hidden w-32 shrink-0 flex-col items-end gap-1 sm:flex"
          title={target ? "Tempo apontado / meta do dia" : "Tempo apontado"}
        >
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDuration(seconds)}
            {target && ` / ${formatDuration(target)}`}
          </span>
          {target && (
            <span className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, (seconds / target) * 100)}%` }}
              />
            </span>
          )}
        </span>
      )}

      <span
        className={cn(
          "flex w-10 shrink-0 items-center justify-end gap-0.5 text-xs tabular-nums",
          days > 0 ? "text-primary" : "text-transparent",
        )}
        title="Dias planejados seguidos com a rotina feita"
      >
        <Flame className="size-3.5" aria-hidden />
        {days}
      </span>

      <span className="w-8 shrink-0">
        {day === today && (
          <TimerButton routine={routine} running={runningHere} />
        )}
      </span>
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
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`${running ? "Parar" : "Iniciar"} cronômetro de ${routine.title}`}
      title={running ? "Parar cronômetro" : "Iniciar cronômetro"}
      className={cn(
        "text-muted-foreground hover:text-foreground",
        running
          ? "text-primary"
          : "opacity-60 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100",
      )}
      onClick={() => {
        if (running) {
          timeActions.stop();
          toast.success("Apontamento parado", { description: routine.title });
          return;
        }
        routineActions.start(routine);
        toast.success("Cronômetro iniciado", { description: routine.title });
      }}
    >
      {running ? <Square /> : <Play />}
    </Button>
  );
}
