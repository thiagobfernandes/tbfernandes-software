"use client";

import { useState } from "react";
import { Pause, Pencil, Play } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routineActions } from "@/features/routines/lib/routine-actions";
import { frequencyLabel, shortTime } from "@/features/routines/lib/routines";
import type { Routine } from "@/features/routines/types/routine";
import { selectors, useAppData } from "@/lib/sample-data/store";

import { RoutineFormDialog } from "./routine-form-dialog";

export function RoutineManageList({ today }: { today: string }) {
  const data = useAppData();
  const { findProject, findTask } = selectors(data);
  const [editing, setEditing] = useState<Routine>();
  const routines = [...data.routines].sort(
    (first, second) =>
      Number(second.active) - Number(first.active) ||
      first.title.localeCompare(second.title),
  );

  if (routines.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">Todas as rotinas</h2>
      <ul className="divide-y rounded-xl border bg-card">
        {routines.map((routine) => {
          const linked = [
            findProject(routine.projectId)?.name,
            findTask(routine.taskId)?.title,
          ].filter(Boolean);
          return (
            <li
              key={routine.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium">{routine.title}</span>
                  {!routine.active && <Badge variant="outline">Pausada</Badge>}
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {[
                    frequencyLabel(routine.weekdays),
                    shortTime(routine.startTime),
                    routine.targetMinutes && `${routine.targetMinutes} min`,
                    ...linked,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={
                    routine.active
                      ? `Pausar ${routine.title}`
                      : `Retomar ${routine.title}`
                  }
                  title={routine.active ? "Pausar" : "Retomar"}
                  onClick={() => {
                    routineActions.setActive(routine, !routine.active);
                    toast.success(
                      routine.active ? "Rotina pausada" : "Rotina retomada",
                    );
                  }}
                >
                  {routine.active ? <Pause /> : <Play />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Editar ${routine.title}`}
                  title="Editar"
                  onClick={() => setEditing(routine)}
                >
                  <Pencil />
                </Button>
                <ConfirmDelete
                  noun="rotina"
                  name={routine.title}
                  consequence="As marcações dos dias vão junto; os apontamentos ficam, sem a rotina."
                  onConfirm={() => {
                    routineActions.remove(routine.id);
                    toast.success("Rotina excluída");
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <RoutineFormDialog
        today={today}
        item={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
    </section>
  );
}
