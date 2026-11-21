"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";

import { useSidebarPrefs } from "@/components/layout/sidebar-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ResizablePanel } from "@/components/workspace/resizable-panel";
import { usePanel } from "@/components/workspace/use-panel";
import {
  overlayOpen,
  useImmersiveWhile,
} from "@/components/workspace/workspace-state";
import { WorkspaceFrame } from "@/components/workspace/workspace-toolbar";
import { NoteFormDialog } from "@/features/knowledge/components/knowledge-form-dialogs";
import { uniqueTags } from "@/features/knowledge/components/knowledge-links";
import {
  NoteDocument,
  type DocumentMode,
} from "@/features/knowledge/components/note-document";
import { NoteListPanel } from "@/features/knowledge/components/note-list-panel";
import { matchesQuery } from "@/features/knowledge/lib/link-options";
import {
  defaultNotesView,
  emptyNoteFilters,
  groupNotes,
  isFavoriteNote,
  sortNotes,
  type NoteFilters,
} from "@/features/knowledge/lib/note-view";
import { usePreference, writePreference } from "@/lib/preferences";
import { useAppData } from "@/lib/sample-data/store";
import { useToday } from "@/lib/today";
import { cn } from "@/lib/utils";

const LIST = { min: 240, max: 520, default: 320 } as const;

/**
 * Notes as a three-pane workspace: global navigation, a resizable list and the
 * document. The document can be maximized (list and, optionally, the global
 * navigation hidden) or put in focus mode; Escape restores.
 */
export function KnowledgePage() {
  const data = useAppData();
  const { notes } = data;
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = useToday();
  const [view, setView] = usePreference("notes:view", defaultNotesView);
  const list = usePanel("notes:list", { defaultWidth: LIST.default });
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<NoteFilters>(() => {
    const tag = searchParams.get("tag");
    return tag ? { ...emptyNoteFilters, tags: [tag] } : emptyNoteFilters;
  });
  const [mode, setMode] = useState<DocumentMode>("normal");
  const [navHidden, setNavHidden] = useState(true);
  const [sidebarPrefs] = useSidebarPrefs();
  const favorites = useMemo(
    () => new Set(sidebarPrefs.favorites.map((f) => f.href)),
    [sidebarPrefs.favorites],
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () =>
      sortNotes(
        notes.filter(
          (note) =>
            (filters.tags.length === 0 ||
              filters.tags.some((tag) => note.tags.includes(tag))) &&
            (filters.projectIds.length === 0 ||
              filters.projectIds.some((id) => note.projectIds.includes(id))) &&
            (!filters.onlyFavorites || isFavoriteNote(favorites, note)) &&
            matchesQuery(query, note, note.body),
        ),
        view.sort,
      ),
    [notes, filters, favorites, query, view.sort],
  );
  const sections = useMemo(
    () =>
      groupNotes(visible, view.group, {
        today,
        projects: data.projects,
        favorites,
        sort: view.sort,
      }),
    [visible, view.group, view.sort, today, data.projects, favorites],
  );
  const tags = useMemo(() => uniqueTags(notes), [notes]);

  // On a phone the list and the note take turns: a note opens only when the
  // URL names it. On a wide screen the first note opens by default.
  const openedId = searchParams.get("note");
  const selected =
    notes.find((note) => note.id === openedId) ??
    (openedId ? undefined : visible[0]);

  // Maximized hides the global navigation unless the user brings it back;
  // focus always does.
  useImmersiveWhile(mode === "focus" || (mode === "maximized" && navHidden));
  usePreservedScroll(scrollRef, [
    mode,
    navHidden,
    list.collapsed,
    view.readingWidth,
  ]);

  useEffect(() => {
    if (mode === "normal") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented || overlayOpen())
        return;
      setMode("normal");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode]);

  function select(id?: string) {
    router.replace(id ? `/knowledge?note=${id}` : "/knowledge", {
      scroll: false,
    });
    scrollRef.current?.scrollTo({ top: 0 });
  }

  function changeMode(next: DocumentMode) {
    if (next === "maximized") setNavHidden(true);
    setMode(next);
  }

  if (notes.length === 0) {
    return (
      <div className="flex min-h-[calc(100svh-var(--header-h))] items-center justify-center p-6">
        <EmptyState
          icon={BookOpen}
          title="Nenhuma nota ainda"
          description="Registre como você resolveu um problema e vincule ao projeto ou tarefa."
          action={
            <NoteFormDialog
              onSaved={(note) => select(note.id)}
              trigger={
                <Button>
                  <Plus /> Nova nota
                </Button>
              }
            />
          }
        />
      </div>
    );
  }

  const listHidden = list.collapsed || mode !== "normal";

  return (
    <WorkspaceFrame>
      <ResizablePanel
        panel={{ ...list, collapsed: listHidden }}
        min={LIST.min}
        max={LIST.max}
        defaultWidth={LIST.default}
        label="Lista de notas"
        className={cn(
          "max-md:!w-full max-md:border-0",
          openedId && "max-md:hidden",
        )}
      >
        <NoteListPanel
          sections={sections}
          total={notes.length}
          shownCount={visible.length}
          selectedId={selected?.id}
          query={query}
          onQuery={setQuery}
          filters={filters}
          onFilters={setFilters}
          tags={tags}
          projects={data.projects}
          favorites={favorites}
          view={view}
          onView={setView}
          onResetView={() => {
            writePreference("notes:view", defaultNotesView);
            list.commitWidth(LIST.default);
          }}
          onSelect={select}
          onCollapse={() => list.setCollapsed(true)}
          onCreated={(note) => select(note.id)}
        />
      </ResizablePanel>

      <div className={cn("flex min-w-0 flex-1", !openedId && "max-md:hidden")}>
        {selected ? (
          <NoteDocument
            note={selected}
            mode={mode}
            onMode={changeMode}
            navHidden={navHidden}
            onNavHidden={setNavHidden}
            listCollapsed={list.collapsed}
            onToggleList={list.toggle}
            readingWidth={view.readingWidth}
            onReadingWidth={(readingWidth) =>
              setView({ ...view, readingWidth })
            }
            favorite={isFavoriteNote(favorites, selected)}
            onBack={() => select(undefined)}
            onDeleted={() => select(undefined)}
            scrollRef={scrollRef}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={BookOpen}
              title={
                openedId ? "Nota não encontrada" : "Nenhuma nota na seleção"
              }
              description="Ajuste a busca ou os filtros, ou escolha outra nota."
            />
          </div>
        )}
      </div>
    </WorkspaceFrame>
  );
}

/**
 * Layout changes (maximize, focus, width) reflow the text; this keeps the
 * reader at the same relative position instead of jumping.
 */
function usePreservedScroll(
  ref: React.RefObject<HTMLDivElement | null>,
  deps: unknown[],
) {
  const ratio = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const range = el.scrollHeight - el.clientHeight;
      ratio.current = range > 0 ? el.scrollTop / range : 0;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // After the width transition ends the text settles; restore then too.
    const restore = () => {
      const range = el.scrollHeight - el.clientHeight;
      el.scrollTop = ratio.current * range;
    };
    restore();
    const timer = window.setTimeout(restore, 220);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
