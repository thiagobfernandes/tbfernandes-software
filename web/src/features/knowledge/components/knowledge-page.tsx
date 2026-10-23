"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { PageContainer } from "@/components/layout/page-container";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { EmptyState } from "@/components/shared/empty-state";
import { Markdown } from "@/components/shared/markdown";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteFormDialog } from "@/features/knowledge/components/knowledge-form-dialogs";
import {
  KnowledgeLinkChips,
  TagFilter,
  TagList,
  uniqueTags,
} from "@/features/knowledge/components/knowledge-links";
import { matchesQuery } from "@/features/knowledge/lib/link-options";
import { formatShort } from "@/lib/dates";
import { dataActions, useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

/** Plain-text preview of a Markdown body for list rows. */
function excerpt(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`|\[\]-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function KnowledgePage() {
  const { notes } = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string>();
  const [editing, setEditing] = useState(false);

  const visible = notes
    .filter((note) => (tag ? note.tags.includes(tag) : true))
    .filter((note) => matchesQuery(query, note, note.body))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const selectedId = searchParams.get("note") ?? visible[0]?.id;
  const selected = notes.find((note) => note.id === selectedId);

  function select(id?: string) {
    router.replace(id ? `/knowledge?note=${id}` : "/knowledge", {
      scroll: false,
    });
  }

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Notes"
        description="Programming notes in Markdown, linked to projects and tasks."
        actions={
          <>
            <SampleDataBadge />
            <NoteFormDialog
              onSaved={(note) => select(note.id)}
              trigger={
                <Button>
                  <Plus /> New note
                </Button>
              }
            />
          </>
        }
      />

      {notes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No notes yet"
          description="Capture how you solved a problem, then link it to the project or task."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="flex flex-col gap-3">
            <label className="relative">
              <span className="sr-only">Search notes</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, content or tag"
                className="pl-9"
              />
            </label>
            <TagFilter
              tags={uniqueTags(notes)}
              active={tag}
              onChange={setTag}
            />
            <ul className="flex flex-col gap-2">
              {visible.length === 0 && (
                <li className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  No notes match.
                </li>
              )}
              {visible.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    aria-current={note.id === selected?.id ? "true" : undefined}
                    onClick={() => select(note.id)}
                    className={cn(
                      "flex w-full flex-col gap-1.5 rounded-xl border bg-card p-3 text-left outline-none hover:border-input focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      note.id === selected?.id &&
                        "border-primary/60 bg-primary/5",
                    )}
                  >
                    <span className="text-sm font-medium">{note.title}</span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {excerpt(note.body) || "Empty note"}
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <TagList tags={note.tags.slice(0, 3)} />
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatShort(note.updatedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {selected ? (
            <article className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-card p-5 md:p-7">
              <header className="flex flex-col gap-3 border-b pb-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {selected.title}
                  </h2>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit note"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil />
                    </Button>
                    <ConfirmDelete
                      noun="note"
                      name={selected.title}
                      onConfirm={() => {
                        dataActions.remove("notes", selected.id);
                        select(undefined);
                        toast.success("Note deleted");
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Updated {formatShort(selected.updatedAt)} · created{" "}
                  {formatShort(selected.createdAt)}
                </p>
                <TagList tags={selected.tags} />
                <KnowledgeLinkChips links={selected} />
              </header>
              {selected.body ? (
                <Markdown>{selected.body}</Markdown>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This note is empty.
                </p>
              )}
              <NoteFormDialog
                item={selected}
                open={editing}
                onOpenChange={setEditing}
              />
            </article>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Select a note"
              description="Pick a note on the left to read it."
            />
          )}
        </div>
      )}
    </PageContainer>
  );
}
