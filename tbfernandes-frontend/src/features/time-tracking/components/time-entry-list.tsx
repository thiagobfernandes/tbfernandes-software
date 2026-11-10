"use client";

import { useState } from "react";
import { Pencil, Play, Timer, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  entrySeconds,
  formatDuration,
  localTime,
} from "@/features/time-tracking/lib/time";
import { timeActions } from "@/features/time-tracking/lib/time-actions";
import type { TimeEntry } from "@/features/time-tracking/types/time-entry";
import { projectColorClasses } from "@/lib/project-colors";
import { selectors, useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

import { TimeEntryFormDialog } from "./time-entry-form-dialog";

type TimeEntryListProps = {
  entries: TimeEntry[];
  day: string;
  now: Date;
};

export function TimeEntryList({ entries, day, now }: TimeEntryListProps) {
  const [editing, setEditing] = useState<TimeEntry>();

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Timer}
        title="Nenhum apontamento neste dia"
        description="Inicie o cronômetro acima ou lance um período manualmente."
      />
    );
  }

  return (
    <>
      <ol className="flex flex-col gap-2">
        {entries.map((entry) => (
          <TimeEntryRow
            key={entry.id}
            entry={entry}
            now={now}
            onEdit={() => setEditing(entry)}
          />
        ))}
      </ol>
      <TimeEntryFormDialog
        day={day}
        item={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
    </>
  );
}

type TimeEntryRowProps = {
  entry: TimeEntry;
  now: Date;
  onEdit: () => void;
};

function TimeEntryRow({ entry, now, onEdit }: TimeEntryRowProps) {
  const data = useAppData();
  const { findProject, findTask } = selectors(data);
  const project = findProject(entry.projectId);
  const task = findTask(entry.taskId);
  const running = !entry.endedAt;
  const range = `${localTime(new Date(entry.startedAt))} – ${
    entry.endedAt ? localTime(new Date(entry.endedAt)) : "agora"
  }`;

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-l-4 bg-card px-4 py-3 sm:flex-row sm:items-center",
        project ? projectColorClasses[project.color].border : "border-l-border",
        running && "ring-1 ring-primary/40",
      )}
    >
      <div className="flex w-32 shrink-0 flex-col">
        <span className="text-sm tabular-nums">{range}</span>
        <span
          className={cn(
            "text-xs tabular-nums",
            running ? "text-primary" : "text-muted-foreground",
          )}
        >
          {formatDuration(entrySeconds(entry, now))}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{entry.description}</span>
        {(project || task || entry.note) && (
          <span className="truncate text-sm text-muted-foreground">
            {[project?.name, task?.title, entry.note]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
        {!running && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Continuar ${entry.description}`}
            title="Continuar"
            onClick={() => {
              timeActions.resume(entry);
              toast.success("Apontamento retomado", {
                description: entry.description,
              });
            }}
          >
            <Play />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Editar ${entry.description}`}
          title="Editar"
          onClick={onEdit}
        >
          <Pencil />
        </Button>
        <ConfirmDelete
          noun="apontamento"
          name={entry.description}
          onConfirm={() => {
            timeActions.remove(entry.id);
            toast.success("Apontamento excluído");
          }}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Excluir ${entry.description}`}
              title="Excluir"
            >
              <Trash2 />
            </Button>
          }
        />
      </div>
    </li>
  );
}
