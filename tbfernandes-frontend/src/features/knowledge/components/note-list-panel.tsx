"use client";

import { useEffect, useRef, useState } from "react";
import { PanelLeftClose, Plus, Search, Star } from "lucide-react";

import {
  DisplayMenu,
  DisplaySection,
  DisplaySelect,
  DisplayToggle,
} from "@/components/shared/display-menu";
import {
  ActiveFilters,
  FilterGroup,
  FilterMenu,
} from "@/components/shared/filter-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { WorkspaceToolbar } from "@/components/workspace/workspace-toolbar";
import { NoteFormDialog } from "@/features/knowledge/components/knowledge-form-dialogs";
import { noteExcerpt } from "@/features/knowledge/lib/note-text";
import {
  isFavoriteNote,
  noteGroupLabels,
  noteSortLabels,
  type NoteFilters,
  type NoteGrouping,
  type NoteSection,
  type NoteSort,
  type NotesView,
} from "@/features/knowledge/lib/note-view";
import type { Note } from "@/features/knowledge/types/knowledge";
import type { Project } from "@/features/projects/types/project";
import { formatShort } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

/** Rows rendered at a time; "Mostrar mais" adds another page. */
const PAGE_SIZE = 40;

export function NoteListPanel({
  sections,
  total,
  shownCount,
  selectedId,
  query,
  onQuery,
  filters,
  onFilters,
  tags,
  projects,
  favorites,
  view,
  onView,
  onResetView,
  onSelect,
  onCollapse,
  onCreated,
}: {
  sections: NoteSection[];
  total: number;
  shownCount: number;
  selectedId?: string;
  query: string;
  onQuery: (query: string) => void;
  filters: NoteFilters;
  onFilters: (filters: NoteFilters) => void;
  tags: string[];
  projects: Project[];
  favorites: Set<string>;
  view: NotesView;
  onView: (view: NotesView) => void;
  onResetView: () => void;
  onSelect: (id: string) => void;
  onCollapse: () => void;
  onCreated: (note: Note) => void;
}) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const selectedRow = useRef<HTMLButtonElement>(null);
  const activeCount =
    filters.tags.length +
    filters.projectIds.length +
    (filters.onlyFavorites ? 1 : 0);
  const projectName = new Map(projects.map((p) => [p.id, p]));

  // Keep the open note in view inside the list's own scroll area.
  useEffect(() => {
    selectedRow.current?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  const pages = paginate(sections, limit);
  return (
    <>
      <WorkspaceToolbar
        actions={
          <>
            <NoteFormDialog
              onSaved={onCreated}
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Nova nota"
                  title="Nova nota"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Plus />
                </Button>
              }
            />
            <DisplayMenu iconOnly onReset={onResetView}>
              <DisplaySection title="Organização">
                <DisplaySelect<NoteSort>
                  label="Ordenar por"
                  value={view.sort}
                  onChange={(sort) => onView({ ...view, sort })}
                  options={(Object.keys(noteSortLabels) as NoteSort[]).map(
                    (value) => ({
                      value,
                      label: noteSortLabels[value],
                    }),
                  )}
                />
                <DisplaySelect<NoteGrouping>
                  label="Agrupar por"
                  value={view.group}
                  onChange={(group) => onView({ ...view, group })}
                  options={(Object.keys(noteGroupLabels) as NoteGrouping[]).map(
                    (value) => ({ value, label: noteGroupLabels[value] }),
                  )}
                />
              </DisplaySection>
              <DisplaySection title="Na lista">
                <DisplayToggle
                  label="Trecho do conteúdo"
                  checked={view.showExcerpt}
                  onChange={(showExcerpt) => onView({ ...view, showExcerpt })}
                />
                <DisplayToggle
                  label="Data"
                  checked={view.showDate}
                  onChange={(showDate) => onView({ ...view, showDate })}
                />
              </DisplaySection>
            </DisplayMenu>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Recolher lista de notas"
              title="Recolher lista"
              onClick={onCollapse}
              className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
            >
              <PanelLeftClose />
            </Button>
          </>
        }
      >
        <h1 className="text-sm font-semibold">Notas</h1>
        <span
          className="text-xs text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          {shownCount === total ? total : `${shownCount} de ${total}`}
        </span>
      </WorkspaceToolbar>

      <div className="flex flex-col gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-1">
          <label className="relative flex-1">
            <span className="sr-only">Buscar notas</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(event) => {
                onQuery(event.target.value);
                setLimit(PAGE_SIZE);
              }}
              placeholder="Buscar"
              className="h-8 border-transparent bg-muted/50 pl-8 text-sm shadow-none focus-visible:bg-background"
            />
          </label>
          <FilterMenu
            activeCount={activeCount}
            onClear={() =>
              onFilters({ tags: [], projectIds: [], onlyFavorites: false })
            }
          >
            <section className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
              <span className="flex items-center gap-2">
                <Star className="size-3.5 text-muted-foreground" /> Só favoritas
              </span>
              <Switch
                checked={filters.onlyFavorites}
                onCheckedChange={(onlyFavorites) =>
                  onFilters({ ...filters, onlyFavorites })
                }
              />
            </section>
            <FilterGroup
              title="Projetos"
              selected={filters.projectIds}
              onChange={(projectIds) => onFilters({ ...filters, projectIds })}
              options={projects.map((project) => ({
                value: project.id,
                label: project.name,
                dotClass: projectColorClasses[project.color].bg,
              }))}
            />
            <FilterGroup
              title="Tags"
              selected={filters.tags}
              onChange={(next) => onFilters({ ...filters, tags: next })}
              options={tags.map((tag) => ({ value: tag, label: `#${tag}` }))}
            />
          </FilterMenu>
        </div>
        <ActiveFilters
          onClear={() =>
            onFilters({ tags: [], projectIds: [], onlyFavorites: false })
          }
          filters={[
            ...(filters.onlyFavorites
              ? [
                  {
                    key: "fav",
                    label: "Favoritas",
                    onRemove: () =>
                      onFilters({ ...filters, onlyFavorites: false }),
                  },
                ]
              : []),
            ...filters.projectIds.map((id) => ({
              key: `p:${id}`,
              label: projectName.get(id)?.name ?? "Projeto",
              onRemove: () =>
                onFilters({
                  ...filters,
                  projectIds: filters.projectIds.filter(
                    (value) => value !== id,
                  ),
                }),
            })),
            ...filters.tags.map((tag) => ({
              key: `t:${tag}`,
              label: `#${tag}`,
              onRemove: () =>
                onFilters({
                  ...filters,
                  tags: filters.tags.filter((value) => value !== tag),
                }),
            })),
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 [scrollbar-width:thin] overflow-y-auto overscroll-contain px-1.5 py-1.5">
        {shownCount === 0 && (
          <p className="px-3 py-10 text-center text-xs text-muted-foreground">
            Nenhuma nota encontrada.
          </p>
        )}
        {pages.map(({ section, rows }) => {
          return (
            <section key={section.key} aria-label={section.label || "Notas"}>
              {section.label && (
                <h2 className="sticky top-0 z-10 flex items-center justify-between bg-background/95 px-2.5 pt-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {section.label}
                  <span className="font-normal tabular-nums">
                    {section.notes.length}
                  </span>
                </h2>
              )}
              <ul className="flex flex-col">
                {rows.map((note) => {
                  const active = note.id === selectedId;
                  const favorite = isFavoriteNote(favorites, note);
                  const project = note.projectIds
                    .map((id) => projectName.get(id))
                    .find(Boolean);
                  return (
                    <li key={`${section.key}:${note.id}`}>
                      <button
                        ref={active ? selectedRow : undefined}
                        type="button"
                        aria-current={active ? "true" : undefined}
                        onClick={() => onSelect(note.id)}
                        className={cn(
                          "relative flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left transition-colors outline-none",
                          "hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50",
                          active &&
                            "bg-accent before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary hover:bg-accent",
                        )}
                      >
                        <span className="flex items-baseline gap-2">
                          {favorite && (
                            <Star
                              aria-label="Favorita"
                              className="size-3 shrink-0 translate-y-px fill-primary text-primary"
                            />
                          )}
                          <span className="line-clamp-2 flex-1 text-[13px] leading-snug font-medium">
                            {note.title}
                          </span>
                          {view.showDate && (
                            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                              {formatShort(
                                view.sort === "created"
                                  ? note.createdAt
                                  : note.updatedAt,
                              )}
                            </span>
                          )}
                        </span>
                        {view.showExcerpt && (
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {noteExcerpt(note.body, note.title) || "Nota vazia"}
                          </span>
                        )}
                        {project && view.group !== "project" && (
                          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span
                              aria-hidden
                              className={cn(
                                "size-1.5 rounded-full",
                                projectColorClasses[project.color].bg,
                              )}
                            />
                            <span className="truncate">{project.name}</span>
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        {shownCount > limit && (
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setLimit((value) => value + PAGE_SIZE)}
            >
              Mostrar mais ({shownCount - limit})
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

/** The first `limit` rows across sections, keeping each section's label. */
function paginate(sections: NoteSection[], limit: number) {
  const pages: { section: NoteSection; rows: Note[] }[] = [];
  let left = limit;
  for (const section of sections) {
    if (left <= 0) break;
    const rows = section.notes.slice(0, left);
    left -= rows.length;
    pages.push({ section, rows });
  }
  return pages;
}
