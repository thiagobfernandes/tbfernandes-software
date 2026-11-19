"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Pencil, Plus, Search } from "lucide-react";
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
import { NoteConnections } from "@/features/knowledge/components/note-connections";
import { wikiTargets } from "@/features/knowledge/lib/graph";
import { matchesQuery } from "@/features/knowledge/lib/link-options";
import {
  noteExcerpt,
  withoutTitleHeading,
} from "@/features/knowledge/lib/note-text";
import { resolveWikiLinks } from "@/features/knowledge/lib/wiki-links";
import { formatShort } from "@/lib/dates";
import { dataActions, useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

/** Rows rendered at a time; "Mostrar mais" adds another page. */
const PAGE_SIZE = 30;

export function KnowledgePage() {
  const data = useAppData();
  const { notes } = data;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState(searchParams.get("tag") ?? undefined);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [editing, setEditing] = useState(false);
  const selectedRow = useRef<HTMLButtonElement>(null);

  const visible = notes
    .filter((note) => (tag ? note.tags.includes(tag) : true))
    .filter((note) => matchesQuery(query, note, note.body))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const shown = visible.slice(0, limit);
  // On a phone the list and the note take turns: a note opens only when the
  // URL names it. On a wide screen the first note opens by default.
  const openedId = searchParams.get("note");
  const selectedId = openedId ?? visible[0]?.id;
  const selected = notes.find((note) => note.id === selectedId);
  const targets = useMemo(() => wikiTargets(data), [data]);
  const tags = useMemo(() => uniqueTags(notes), [notes]);

  // Keep the open note in view inside the list's own scroll area.
  useEffect(() => {
    selectedRow.current?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  function select(id?: string) {
    router.replace(id ? `/knowledge?note=${id}` : "/knowledge", {
      scroll: false,
    });
    window.scrollTo({ top: 0 });
  }

  function filterBy(change: () => void) {
    change();
    setLimit(PAGE_SIZE);
  }

  return (
    <PageContainer className="max-w-7xl">
      <PageHeading
        title="Notas"
        description="Notas em Markdown, vinculadas a projetos e tarefas."
        actions={
          <>
            <SampleDataBadge />
            <NoteFormDialog
              onSaved={(note) => select(note.id)}
              trigger={
                <Button>
                  <Plus /> Nova nota
                </Button>
              }
            />
          </>
        }
      />

      {notes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhuma nota ainda"
          description="Registre como você resolveu um problema e vincule ao projeto ou tarefa."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
          <aside
            aria-label="Lista de notas"
            className={cn(
              "flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card",
              "lg:sticky lg:top-20 lg:max-h-[calc(100svh-6.5rem)]",
              openedId && "hidden lg:flex",
            )}
          >
            <div className="flex flex-col gap-3 border-b p-3">
              <label className="relative">
                <span className="sr-only">Buscar notas</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(event) =>
                    filterBy(() => setQuery(event.target.value))
                  }
                  placeholder="Buscar por título, conteúdo ou tag"
                  className="pl-9"
                />
              </label>
              <TagFilter
                tags={tags}
                active={tag}
                onChange={(next) => filterBy(() => setTag(next))}
              />
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {visible.length === notes.length
                  ? `${notes.length} ${notes.length === 1 ? "nota" : "notas"}`
                  : `${visible.length} de ${notes.length} notas`}
              </p>
            </div>

            <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain p-2">
              {visible.length === 0 && (
                <li className="px-3 py-8 text-center text-xs text-muted-foreground">
                  Nenhuma nota encontrada.
                </li>
              )}
              {shown.map((note) => {
                const active = note.id === selected?.id;
                return (
                  <li key={note.id}>
                    <button
                      ref={active ? selectedRow : undefined}
                      type="button"
                      aria-current={active ? "true" : undefined}
                      onClick={() => select(note.id)}
                      className={cn(
                        "relative flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors outline-none",
                        "hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        active &&
                          "bg-primary/10 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary hover:bg-primary/10",
                      )}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span
                          className={cn(
                            "line-clamp-2 text-sm font-medium",
                            active && "text-primary",
                          )}
                        >
                          {note.title}
                        </span>
                        <span className="mt-0.5 shrink-0 text-[11px] text-muted-foreground tabular-nums">
                          {formatShort(note.updatedAt)}
                        </span>
                      </span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">
                        {noteExcerpt(note.body, note.title) || "Nota vazia"}
                      </span>
                    </button>
                  </li>
                );
              })}
              {visible.length > shown.length && (
                <li className="p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setLimit((value) => value + PAGE_SIZE)}
                  >
                    Mostrar mais ({visible.length - shown.length})
                  </Button>
                </li>
              )}
            </ul>
          </aside>

          {selected ? (
            <article
              className={cn(
                "min-w-0 flex-col rounded-2xl border bg-card",
                openedId ? "flex" : "hidden lg:flex",
              )}
            >
              <header className="flex flex-col gap-3 border-b p-5 md:px-8 md:pt-7">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 self-start lg:hidden"
                  onClick={() => select(undefined)}
                >
                  <ArrowLeft /> Todas as notas
                </Button>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-2xl font-semibold tracking-tight text-balance">
                    {selected.title}
                  </h2>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Editar nota"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil />
                    </Button>
                    <ConfirmDelete
                      noun="nota"
                      name={selected.title}
                      onConfirm={() => {
                        dataActions.remove("notes", selected.id);
                        select(undefined);
                        toast.success("Nota excluída");
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Atualizada em {formatShort(selected.updatedAt)} · criada em{" "}
                  {formatShort(selected.createdAt)}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <TagList tags={selected.tags} />
                  <KnowledgeLinkChips links={selected} />
                </div>
              </header>

              <div className="p-5 md:px-8 md:pb-8">
                <div className="max-w-[72ch] text-[0.95rem]">
                  {selected.body ? (
                    <Markdown>
                      {resolveWikiLinks(
                        withoutTitleHeading(selected.body, selected.title),
                        targets,
                      )}
                    </Markdown>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Esta nota está vazia.
                    </p>
                  )}
                </div>
                <div className="mt-8 max-w-[72ch]">
                  <NoteConnections note={selected} />
                </div>
              </div>

              <NoteFormDialog
                item={selected}
                open={editing}
                onOpenChange={setEditing}
              />
            </article>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Selecione uma nota"
              description="Escolha uma nota na lista para ler."
              className={cn(!openedId && "hidden lg:flex")}
            />
          )}
        </div>
      )}
    </PageContainer>
  );
}
