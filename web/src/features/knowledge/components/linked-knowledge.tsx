"use client";

import Link from "next/link";
import { BookOpen, Code2, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  NoteFormDialog,
  SnippetFormDialog,
} from "@/features/knowledge/components/knowledge-form-dialogs";
import { useAppData } from "@/lib/sample-data/store";

/** Notes and snippets linked to a project, with shortcuts to add more. */
export function LinkedKnowledge({ projectId }: { projectId: string }) {
  const { notes, snippets } = useAppData();
  const linkedNotes = notes.filter((note) =>
    note.projectIds.includes(projectId),
  );
  const linkedSnippets = snippets.filter((snippet) =>
    snippet.projectIds.includes(projectId),
  );

  return (
    <div className="flex flex-col gap-3">
      {linkedNotes.length + linkedSnippets.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing linked yet"
          description="Notes and code snippets linked to this project will show here."
          className="py-6"
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {linkedNotes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/knowledge?note=${note.id}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent/60"
              >
                <BookOpen
                  className="size-4 shrink-0 text-primary"
                  aria-hidden
                />
                <span className="truncate">{note.title}</span>
              </Link>
            </li>
          ))}
          {linkedSnippets.map((snippet) => (
            <li key={snippet.id}>
              <Link
                href="/knowledge/snippets"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent/60"
              >
                <Code2
                  className="size-4 shrink-0 text-violet-400"
                  aria-hidden
                />
                <span className="truncate">{snippet.title}</span>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                  {snippet.language}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <NoteFormDialog
          defaultProjectId={projectId}
          trigger={
            <Button variant="outline" size="sm" className="flex-1">
              <Plus /> Note
            </Button>
          }
        />
        <SnippetFormDialog
          defaultProjectId={projectId}
          trigger={
            <Button variant="outline" size="sm" className="flex-1">
              <Plus /> Snippet
            </Button>
          }
        />
      </div>
    </div>
  );
}

/** Compact list of notes and snippets linked to a task, for the task sheet. */
export function TaskKnowledge({ taskId }: { taskId: string }) {
  const { notes, snippets } = useAppData();
  const linked = [
    ...notes
      .filter((note) => note.taskIds.includes(taskId))
      .map((note) => ({
        id: note.id,
        title: note.title,
        href: `/knowledge?note=${note.id}`,
        icon: BookOpen,
      })),
    ...snippets
      .filter((snippet) => snippet.taskIds.includes(taskId))
      .map((snippet) => ({
        id: snippet.id,
        title: snippet.title,
        href: "/knowledge/snippets",
        icon: Code2,
      })),
  ];
  if (!linked.length) return null;

  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-medium text-muted-foreground">Knowledge</h3>
      <ul className="flex flex-col">
        {linked.map(({ id, title, href, icon: Icon }) => (
          <li key={id}>
            <Link
              href={href}
              className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm hover:text-primary"
            >
              <Icon
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="truncate">{title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
