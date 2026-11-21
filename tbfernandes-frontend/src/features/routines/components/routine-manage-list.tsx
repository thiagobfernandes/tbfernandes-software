"use client";

import { useState } from "react";
import { MoreHorizontal, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { routineActions } from "@/features/routines/lib/routine-actions";
import {
  type CheckIndex,
  percent,
  rate,
  tally,
} from "@/features/routines/lib/routine-stats";
import {
  frequencyLabel,
  shortTime,
  streak,
} from "@/features/routines/lib/routines";
import type { Routine } from "@/features/routines/types/routine";
import { shiftDay } from "@/features/time-tracking/lib/time";
import { projectColorClasses } from "@/lib/project-colors";
import { selectors, useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

import { RoutineFormDialog } from "./routine-form-dialog";

/** Every routine, active first, with its schedule, links and recent consistency. */
export function RoutineManageList({
  routines,
  today,
  index,
  activeId,
  onSelect,
}: {
  routines: Routine[];
  today: string;
  index: CheckIndex;
  activeId?: string;
  onSelect: (routine: Routine) => void;
}) {
  const [editing, setEditing] = useState<Routine>();
  const [deleting, setDeleting] = useState<Routine>();
  const active = routines.filter((routine) => routine.active);
  const paused = routines.filter((routine) => !routine.active);

  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th scope="col" className="h-9 border-b px-4 font-medium">
              Rotina
            </th>
            <th scope="col" className="h-9 border-b px-2 font-medium">
              Quando
            </th>
            <th scope="col" className="h-9 border-b px-2 font-medium">
              Vínculos
            </th>
            <th
              scope="col"
              className="h-9 border-b px-2 text-right font-medium"
              title="Feitas / planejadas nos últimos 30 dias"
            >
              30 dias
            </th>
            <th
              scope="col"
              className="h-9 border-b px-2 text-right font-medium"
              title="Dias planejados seguidos"
            >
              Sequência
            </th>
            <th scope="col" className="h-9 w-12 border-b" aria-label="Ações" />
          </tr>
        </thead>
        <Section
          title="Ativas"
          routines={active}
          today={today}
          index={index}
          activeId={activeId}
          onSelect={onSelect}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
        <Section
          title="Pausadas"
          routines={paused}
          today={today}
          index={index}
          activeId={activeId}
          onSelect={onSelect}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      </table>
      <RoutineFormDialog
        today={today}
        item={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
      <ConfirmDelete
        noun="rotina"
        name={deleting?.title ?? ""}
        consequence="As marcações dos dias vão junto; os apontamentos ficam, sem a rotina."
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        onConfirm={() => {
          if (!deleting) return;
          routineActions.remove(deleting.id);
          toast.success("Rotina excluída");
          setDeleting(undefined);
        }}
      />
    </div>
  );
}

function Section({
  title,
  routines,
  today,
  index,
  activeId,
  onSelect,
  onEdit,
  onDelete,
}: {
  title: string;
  routines: Routine[];
  today: string;
  index: CheckIndex;
  activeId?: string;
  onSelect: (routine: Routine) => void;
  onEdit: (routine: Routine) => void;
  onDelete: (routine: Routine) => void;
}) {
  const data = useAppData();
  const { findProject, findTask, findGoal } = selectors(data);
  if (routines.length === 0) return null;
  const from = shiftDay(today, -29);

  return (
    <tbody>
      <tr>
        <th
          colSpan={6}
          scope="colgroup"
          className="h-8 bg-muted/30 px-4 text-left text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
        >
          {title}
          <span className="ml-1.5 tabular-nums">{routines.length}</span>
        </th>
      </tr>
      {routines.map((routine) => {
        const project = findProject(routine.projectId);
        const links = [
          findTask(routine.taskId)?.title,
          findGoal(routine.goalId)?.name,
        ].filter(Boolean);
        const month = tally(routine, index, from, today, today);
        const days = routine.active
          ? streak(routine, data.routineChecks, today)
          : 0;
        return (
          <tr
            key={routine.id}
            className={cn(
              "group",
              routine.id === activeId
                ? "[&>td]:bg-accent/60"
                : "hover:[&>td]:bg-accent/40",
              !routine.active && "text-muted-foreground",
            )}
          >
            <td className="h-11 max-w-64 border-b border-border/60 px-4">
              <button
                type="button"
                onClick={() => onSelect(routine)}
                className="block max-w-full truncate rounded-sm text-left font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {routine.title}
              </button>
            </td>
            <td className="h-11 border-b border-border/60 px-2 text-xs whitespace-nowrap text-muted-foreground">
              {[
                frequencyLabel(routine.weekdays),
                shortTime(routine.startTime),
                routine.targetMinutes && `${routine.targetMinutes} min`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </td>
            <td className="h-11 max-w-56 border-b border-border/60 px-2 text-xs text-muted-foreground">
              <span className="flex min-w-0 items-center gap-1.5">
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
                  {[project?.name, ...links].join(" · ") || "—"}
                </span>
              </span>
            </td>
            <td
              className="h-11 border-b border-border/60 px-2 text-right text-xs tabular-nums"
              title={`${month.done} de ${month.due} dias planejados`}
            >
              {percent(rate(month))}
            </td>
            <td className="h-11 border-b border-border/60 px-2 text-right text-xs tabular-nums">
              {days > 0 ? `${days} d` : "—"}
            </td>
            <td className="h-11 border-b border-border/60 pr-2 text-right">
              <RowMenu routine={routine} onEdit={onEdit} onDelete={onDelete} />
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}

export function RowMenu({
  routine,
  onEdit,
  onDelete,
}: {
  routine: Routine;
  onEdit: (routine: Routine) => void;
  onDelete: (routine: Routine) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Ações de ${routine.title}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => onEdit(routine)}>
          <Pencil /> Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            routineActions.setActive(routine, !routine.active);
            toast.success(
              routine.active ? "Rotina pausada" : "Rotina retomada",
              {
                description: routine.title,
              },
            );
          }}
        >
          {routine.active ? <Pause /> : <Play />}
          {routine.active ? "Pausar" : "Retomar"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onDelete(routine)}
        >
          <Trash2 /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
