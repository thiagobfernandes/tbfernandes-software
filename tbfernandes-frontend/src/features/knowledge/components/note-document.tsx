"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Expand,
  Eye,
  Focus,
  ListTree,
  Maximize,
  Minimize,
  MoreHorizontal,
  MoveHorizontal,
  Network,
  PanelLeft,
  PanelLeftDashed,
  Pencil,
  Shrink,
  Star,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { sidebarActions } from "@/components/layout/sidebar-state";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Kbd } from "@/components/shared/kbd";
import { Markdown } from "@/components/shared/markdown";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useFullscreen } from "@/components/workspace/use-fullscreen";
import { ToolbarDivider } from "@/components/workspace/workspace-toolbar";
import { NoteConnections } from "@/features/knowledge/components/note-connections";
import { NoteFormDialog } from "@/features/knowledge/components/knowledge-form-dialogs";
import {
  graphHref,
  graphNodeId,
  noteHref,
  wikiTargets,
} from "@/features/knowledge/lib/graph";
import { withoutTitleHeading } from "@/features/knowledge/lib/note-text";
import { resolveWikiLinks } from "@/features/knowledge/lib/wiki-links";
import type { Note } from "@/features/knowledge/types/knowledge";
import { formatShort } from "@/lib/dates";
import { extractHeadings, type Heading } from "@/lib/markdown-headings";
import { projectColorClasses } from "@/lib/project-colors";
import { projectHref } from "@/lib/routes";
import { dataActions, useAppData } from "@/lib/sample-data/store";
import { currentDay } from "@/lib/today";
import { cn } from "@/lib/utils";

export type DocumentMode = "normal" | "maximized" | "focus";

/** A table of contents is offered from this many headings on. */
const TOC_MIN = 3;

export function NoteDocument({
  note,
  mode,
  onMode,
  navHidden,
  onNavHidden,
  listCollapsed,
  onToggleList,
  readingWidth,
  onReadingWidth,
  favorite,
  onBack,
  onDeleted,
  scrollRef,
}: {
  note: Note;
  mode: DocumentMode;
  onMode: (mode: DocumentMode) => void;
  navHidden: boolean;
  onNavHidden: (hidden: boolean) => void;
  listCollapsed: boolean;
  onToggleList: () => void;
  readingWidth: "comfortable" | "full";
  onReadingWidth: (width: "comfortable" | "full") => void;
  favorite: boolean;
  onBack: () => void;
  onDeleted: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const data = useAppData();
  const fullscreen = useFullscreen();
  const [editing, setEditing] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const targets = useMemo(() => wikiTargets(data), [data]);
  const body = useMemo(
    () => resolveWikiLinks(withoutTitleHeading(note.body, note.title), targets),
    [note.body, note.title, targets],
  );
  const headings = useMemo(() => extractHeadings(body), [body]);
  const activeHeading = useActiveHeading(scrollRef, headings, note.id);
  const focus = mode === "focus";
  const wide = readingWidth === "full" && !focus;
  const showTocRail = !focus && !editing && headings.length >= TOC_MIN;

  const projects = data.projects.filter((p) => note.projectIds.includes(p.id));
  const tasks = data.tasks.filter((t) => note.taskIds.includes(t.id));

  function scrollToHeading(id: string) {
    const root = scrollRef.current;
    const target = root?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!root || !target) return;
    root.scrollTo({
      top: target.offsetTop - 24,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  return (
    <article
      aria-label={note.title}
      className="group/doc relative flex min-h-0 min-w-0 flex-1 flex-col bg-background"
    >
      <div
        className={cn(
          "flex h-11 shrink-0 items-center gap-1 px-2 transition-opacity duration-300 pointer-coarse:h-12",
          focus
            ? "absolute inset-x-0 top-0 z-20 opacity-0 group-hover/doc:opacity-100 focus-within:opacity-100"
            : "border-b",
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground md:hidden"
          onClick={onBack}
        >
          <ArrowLeft /> Notas
        </Button>
        {mode === "normal" && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={
              listCollapsed
                ? "Mostrar lista de notas"
                : "Recolher lista de notas"
            }
            title={listCollapsed ? "Mostrar lista" : "Recolher lista"}
            aria-pressed={!listCollapsed}
            onClick={onToggleList}
            className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
          >
            {listCollapsed ? <PanelLeftDashed /> : <PanelLeft />}
          </Button>
        )}
        <p className="hidden min-w-0 truncate px-1 text-xs text-muted-foreground md:block">
          {mode !== "normal"
            ? note.title
            : `Atualizada em ${formatShort(note.updatedAt)}`}
        </p>

        <div className="ml-auto flex items-center gap-0.5">
          {editing ? null : (
            <>
              {headings.length >= TOC_MIN && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Sumário"
                      title="Sumário"
                      className={cn(
                        "text-muted-foreground hover:text-foreground",
                        showTocRail && "2xl:hidden",
                      )}
                    >
                      <ListTree />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-2">
                    <TableOfContents
                      headings={headings}
                      active={activeHeading}
                      onSelect={scrollToHeading}
                    />
                  </PopoverContent>
                </Popover>
              )}
              {!focus && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-pressed={readingWidth === "full"}
                  aria-label={wide ? "Largura de leitura" : "Largura total"}
                  title={wide ? "Largura de leitura" : "Largura total"}
                  onClick={() => onReadingWidth(wide ? "comfortable" : "full")}
                  className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
                >
                  <MoveHorizontal />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-pressed={focus}
                aria-label={focus ? "Sair do modo foco" : "Modo foco"}
                title={focus ? "Sair do modo foco (Esc)" : "Modo foco"}
                onClick={() => onMode(focus ? "normal" : "focus")}
                className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
              >
                {focus ? <Eye /> : <Focus />}
              </Button>
            </>
          )}
          {mode === "maximized" && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-pressed={!navHidden}
              aria-label={navHidden ? "Mostrar navegação" : "Ocultar navegação"}
              title={navHidden ? "Mostrar navegação" : "Ocultar navegação"}
              onClick={() => onNavHidden(!navHidden)}
              className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
            >
              {navHidden ? <PanelLeftDashed /> : <PanelLeft />}
            </Button>
          )}
          {fullscreen.supported && mode !== "normal" && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-pressed={fullscreen.active}
              aria-label={
                fullscreen.active ? "Sair da tela cheia" : "Tela cheia"
              }
              title={fullscreen.active ? "Sair da tela cheia" : "Tela cheia"}
              onClick={fullscreen.toggle}
              className="text-muted-foreground hover:text-foreground"
            >
              {fullscreen.active ? <Minimize /> : <Maximize />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-pressed={mode !== "normal"}
            aria-label={mode === "normal" ? "Maximizar nota" : "Restaurar"}
            title={mode === "normal" ? "Maximizar nota" : "Restaurar (Esc)"}
            onClick={() => onMode(mode === "normal" ? "maximized" : "normal")}
            className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
          >
            {mode === "normal" ? <Expand /> : <Shrink />}
          </Button>
          <ToolbarDivider />
          {!editing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil /> <span className="hidden sm:inline">Editar</span>
            </Button>
          )}
          <NoteMenu
            note={note}
            favorite={favorite}
            onEditLinks={() => setLinksOpen(true)}
            onDeleted={onDeleted}
          />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="relative min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto"
      >
        <div
          className={cn(
            "mx-auto flex gap-10 px-5 pb-24 md:px-10",
            focus ? "pt-20" : "pt-8 md:pt-12",
            wide ? "max-w-none" : "max-w-[64rem]",
          )}
        >
          <div
            className={cn(
              "min-w-0 flex-1",
              !wide && "mx-auto max-w-[44rem]",
              focus && "max-w-[40rem] text-[1.05rem]",
            )}
          >
            {editing ? (
              <NoteEditor
                key={note.id}
                note={note}
                onDone={() => setEditing(false)}
              />
            ) : (
              <>
                <header className="mb-8 flex flex-col gap-3">
                  <h1
                    className={cn(
                      "font-semibold tracking-tight text-balance text-foreground",
                      focus
                        ? "text-[2.2rem] leading-tight"
                        : "text-[2rem] leading-tight",
                    )}
                  >
                    {note.title}
                  </h1>
                  {!focus && (
                    <dl className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      <div className="flex gap-1">
                        <dt className="sr-only">Atualizada</dt>
                        <dd>Atualizada {formatShort(note.updatedAt)}</dd>
                      </div>
                      <div className="flex gap-1">
                        <dt className="sr-only">Criada</dt>
                        <dd>Criada {formatShort(note.createdAt)}</dd>
                      </div>
                      {projects.map((project) => (
                        <div key={project.id} className="flex">
                          <dt className="sr-only">Projeto</dt>
                          <dd>
                            <Link
                              href={projectHref(project.id)}
                              className="inline-flex items-center gap-1.5 rounded hover:text-foreground"
                            >
                              <span
                                aria-hidden
                                className={cn(
                                  "size-1.5 rounded-full",
                                  projectColorClasses[project.color].bg,
                                )}
                              />
                              {project.name}
                            </Link>
                          </dd>
                        </div>
                      ))}
                      {tasks.length > 0 && (
                        <div className="flex gap-1">
                          <dt className="sr-only">Tarefas</dt>
                          <dd>
                            {tasks.map((task, index) => (
                              <span key={task.id}>
                                {index > 0 && ", "}
                                <Link
                                  href={`/tasks?q=${encodeURIComponent(task.title)}`}
                                  className="hover:text-foreground"
                                >
                                  {task.title}
                                </Link>
                              </span>
                            ))}
                          </dd>
                        </div>
                      )}
                      {note.tags.length > 0 && (
                        <div className="flex gap-1.5">
                          <dt className="sr-only">Tags</dt>
                          {note.tags.map((tag) => (
                            <dd key={tag}>
                              <Link
                                href={`/knowledge?tag=${encodeURIComponent(tag)}`}
                                className="hover:text-foreground"
                              >
                                #{tag}
                              </Link>
                            </dd>
                          ))}
                        </div>
                      )}
                    </dl>
                  )}
                </header>
                {note.body ? (
                  <Markdown variant="editorial">{body}</Markdown>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Nota vazia. Clique para escrever.
                  </button>
                )}
                {!focus && (
                  <div className="mt-14">
                    <NoteConnections note={note} />
                  </div>
                )}
              </>
            )}
          </div>

          {showTocRail && (
            <nav
              aria-label="Sumário"
              className="sticky top-12 hidden max-h-[calc(100svh-10rem)] w-56 shrink-0 self-start overflow-y-auto 2xl:block"
            >
              <TableOfContents
                headings={headings}
                active={activeHeading}
                onSelect={scrollToHeading}
              />
            </nav>
          )}
        </div>
      </div>

      <NoteFormDialog
        item={note}
        open={linksOpen}
        onOpenChange={setLinksOpen}
      />
    </article>
  );
}

function TableOfContents({
  headings,
  active,
  onSelect,
}: {
  headings: Heading[];
  active?: string;
  onSelect: (id: string) => void;
}) {
  const minLevel = Math.min(...headings.map((h) => h.level));
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Nesta nota
      </p>
      {headings.map((heading) => (
        <button
          key={heading.id}
          type="button"
          onClick={() => onSelect(heading.id)}
          aria-current={active === heading.id ? "location" : undefined}
          style={{
            paddingLeft: `${0.5 + (heading.level - minLevel) * 0.75}rem`,
          }}
          className={cn(
            "rounded py-1 pr-2 text-left text-[13px] leading-snug text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
            active === heading.id && "text-primary",
          )}
        >
          {heading.text}
        </button>
      ))}
    </div>
  );
}

/** The heading closest above the top of the reading area. */
function useActiveHeading(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  headings: Heading[],
  noteId: string,
) {
  const [active, setActive] = useState<string>();
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || headings.length === 0) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let current: string | undefined;
        for (const heading of headings) {
          const el = root.querySelector<HTMLElement>(
            `#${CSS.escape(heading.id)}`,
          );
          if (el && el.offsetTop - root.scrollTop <= 96) current = heading.id;
        }
        setActive(current ?? headings[0]?.id);
      });
    };
    update();
    root.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener("scroll", update);
    };
  }, [scrollRef, headings, noteId]);
  return active;
}

function NoteMenu({
  note,
  favorite,
  onEditLinks,
  onDeleted,
}: {
  note: Note;
  favorite: boolean;
  onEditLinks: () => void;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Mais ações"
            className="text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onSelect={() =>
              sidebarActions.toggleFavorite({
                href: noteHref(note.id),
                label: note.title,
              })
            }
          >
            <Star className={cn(favorite && "fill-primary text-primary")} />
            {favorite ? "Remover dos favoritos" : "Favoritar"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onEditLinks}>
            <Tags /> Tags e vínculos
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={graphHref(graphNodeId("note", note.id))}>
              <Network /> Abrir no grafo
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirming(true)}
          >
            <Trash2 /> Excluir nota
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDelete
        noun="nota"
        name={note.title}
        open={confirming}
        onOpenChange={setConfirming}
        onConfirm={() => {
          dataActions.remove("notes", note.id);
          toast.success("Nota excluída");
          onDeleted();
        }}
      />
    </>
  );
}

/**
 * In-place Markdown editor: title and body, Ctrl/⌘ S saves, Escape cancels.
 * Tags and links stay in the dialog ("Tags e vínculos").
 */
function NoteEditor({ note, onDone }: { note: Note; onDone: () => void }) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const dirty = title !== note.title || body !== note.body;

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  function save() {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error("Dê um título à nota");
      return;
    }
    if (dirty) {
      dataActions.update("notes", note.id, {
        title: trimmed,
        body,
        updatedAt: currentDay(),
      });
      toast.success("Nota salva");
    }
    onDone();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      save();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (!dirty || window.confirm("Descartar as alterações?")) onDone();
    }
  }

  return (
    <div className="flex flex-col gap-4" onKeyDown={onKeyDown}>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        aria-label="Título"
        maxLength={200}
        className="w-full bg-transparent text-[2rem] leading-tight font-semibold tracking-tight outline-none placeholder:text-muted-foreground"
        placeholder="Título"
      />
      <Textarea
        ref={bodyRef}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        aria-label="Conteúdo em Markdown"
        autoFocus
        placeholder="Escreva em Markdown…"
        className="min-h-[50svh] resize-none border-0 bg-transparent p-0 font-mono text-[0.92rem] leading-7 shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <div className="sticky bottom-4 flex items-center justify-end gap-2 rounded-lg border bg-popover/95 p-2 shadow-md">
        <span className="mr-auto pl-1 text-xs text-muted-foreground">
          {dirty ? "Alterações não salvas" : "Sem alterações"} ·{" "}
          <Kbd>Ctrl S</Kbd> salva · <Kbd>Esc</Kbd> cancela
        </span>
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
        <Button size="sm" onClick={save}>
          <Check /> Salvar
        </Button>
      </div>
    </div>
  );
}
