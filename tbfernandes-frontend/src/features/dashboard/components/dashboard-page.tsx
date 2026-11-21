"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, LayoutGrid, Plus, RotateCcw, Star } from "lucide-react";
import { toast } from "sonner";

import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ToolbarDivider,
  WorkspaceFrame,
  WorkspaceToolbar,
} from "@/components/workspace/workspace-toolbar";
import { AppointmentSheet } from "@/features/calendar/components/appointment-sheet";
import { ContactFormDialog } from "@/features/contacts/components/contact-form-dialog";
import {
  type CreateKind,
  createActions,
  isCreateKind,
} from "@/features/dashboard/lib/create-actions";
import {
  type DashboardPrefs,
  type DashboardProfile,
  type WidgetGroup,
  type WidgetInstance,
  type WidgetType,
  clampSize,
  defaultDashboardPrefs,
  defaultProfiles,
  widgetCatalog,
} from "@/features/dashboard/lib/widgets";
import { GoalFormDialog } from "@/features/goals/components/goal-form-dialog";
import { NoteFormDialog } from "@/features/knowledge/components/knowledge-form-dialogs";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
import { RoutineFormDialog } from "@/features/routines/components/routine-form-dialog";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { TimeEntryFormDialog } from "@/features/time-tracking/components/time-entry-form-dialog";
import { useNow } from "@/features/time-tracking/hooks/use-now";
import { localDay } from "@/features/time-tracking/lib/time";
import { uuidv7 } from "@/lib/api/uuid";
import { usePreference } from "@/lib/preferences";
import { useAppData } from "@/lib/sample-data/store";
import { useToday } from "@/lib/today";
import { cn } from "@/lib/utils";

import { WidgetFrame } from "./widget-frame";
import { widgetComponents } from "./widget-registry";

const groups: WidgetGroup[] = [
  "Dia",
  "Execução",
  "Projetos e metas",
  "Conhecimento",
  "Análises",
  "Outros",
];

/**
 * Personal command center: a grid of widgets the user arranges per profile
 * (Workspace geral, Trabalho, Estudos…). Layout, sizes, collapsed state and
 * profiles persist in `tbf:overview`; the global "Criar" opens any form.
 */
export function DashboardPage() {
  const data = useAppData();
  const today = useToday();
  const now = useNow(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prefs, setPrefs] = usePreference<DashboardPrefs>(
    "overview",
    defaultDashboardPrefs,
  );
  const [activeId, setActiveId] = useState<string>();
  const profile =
    prefs.profiles.find((item) => item.id === (activeId ?? prefs.defaultId)) ??
    prefs.profiles[0];
  const [maximizedId, setMaximizedId] = useState<string>();
  const [draggingId, setDraggingId] = useState<string>();
  const [overId, setOverId] = useState<string>();
  const [openTaskId, setOpenTaskId] = useState<string>();
  const [naming, setNaming] = useState<"new" | "rename">();
  const [creating, setCreating] = useState<CreateKind>();

  // `/?create=task` (from Ctrl K) opens that form; closing it cleans the URL.
  const requested = searchParams.get("create");
  const open = creating ?? (isCreateKind(requested) ? requested : undefined);
  const closeCreate = () => {
    setCreating(undefined);
    if (requested) router.replace("/", { scroll: false });
  };

  useEffect(() => {
    if (!maximizedId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented)
        setMaximizedId(undefined);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maximizedId]);

  const saveProfile = (next: DashboardProfile) =>
    setPrefs({
      ...prefs,
      profiles: prefs.profiles.map((item) =>
        item.id === next.id ? next : item,
      ),
    });
  const setWidgets = (widgets: WidgetInstance[]) =>
    saveProfile({ ...profile, widgets });
  const updateWidget = (id: string, patch: Partial<WidgetInstance>) =>
    setWidgets(
      profile.widgets.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    );
  const move = (from: number, to: number) => {
    if (to < 0 || to >= profile.widgets.length || from === to) return;
    const next = [...profile.widgets];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setWidgets(next);
  };
  const toggleWidget = (type: WidgetType) => {
    const existing = profile.widgets.find((item) => item.type === type);
    if (existing) {
      setWidgets(profile.widgets.filter((item) => item.id !== existing.id));
      return;
    }
    setWidgets([
      ...profile.widgets,
      {
        id: type,
        type,
        size: clampSize(type, widgetCatalog[type].defaultSize),
      },
    ]);
  };
  const restore = () => {
    const original =
      defaultProfiles.find((item) => item.id === profile.id) ??
      defaultProfiles[0];
    setWidgets(original.widgets);
    toast.success("Layout padrão restaurado", { description: profile.name });
  };

  const maximized = profile.widgets.find((item) => item.id === maximizedId);
  const visible = maximized ? [maximized] : profile.widgets;
  const favorites = new Set(prefs.favorites);
  const orderedProfiles = [...prefs.profiles].sort(
    (a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id)),
  );
  const present = new Set(profile.widgets.map((item) => item.type));

  return (
    <WorkspaceFrame>
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceToolbar
          actions={
            <>
              <span className="hidden md:contents">
                <SampleDataBadge />
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <LayoutGrid />
                    <span className="hidden sm:inline">Widgets</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="flex w-80 flex-col gap-0 p-0"
                >
                  <div className="flex max-h-[min(30rem,70svh)] flex-col divide-y overflow-y-auto">
                    {groups.map((group) => (
                      <section
                        key={group}
                        className="flex flex-col gap-0.5 p-1.5"
                      >
                        <h3 className="px-2 pt-1 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                          {group}
                        </h3>
                        {(Object.keys(widgetCatalog) as WidgetType[])
                          .filter((type) => widgetCatalog[type].group === group)
                          .map((type) => (
                            <button
                              key={type}
                              type="button"
                              role="menuitemcheckbox"
                              aria-checked={present.has(type)}
                              onClick={() => toggleWidget(type)}
                              className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left outline-none hover:bg-accent focus-visible:bg-accent"
                            >
                              <span
                                aria-hidden
                                className={cn(
                                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                                  present.has(type) &&
                                    "border-primary bg-primary text-primary-foreground",
                                )}
                              >
                                {present.has(type) && (
                                  <Check className="size-3" />
                                )}
                              </span>
                              <span className="flex min-w-0 flex-col">
                                <span className="text-sm">
                                  {widgetCatalog[type].title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {widgetCatalog[type].description}
                                </span>
                              </span>
                            </button>
                          ))}
                      </section>
                    ))}
                  </div>
                  <div className="flex justify-end border-t px-3 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={restore}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      <RotateCcw /> Restaurar layout padrão
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <ToolbarDivider />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-8">
                    <Plus /> <span className="hidden sm:inline">Criar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {createActions.map((action) => (
                    <DropdownMenuItem
                      key={action.kind}
                      onSelect={() => setCreating(action.kind)}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
                    Também na busca: Ctrl K
                  </DropdownMenuLabel>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        >
          <h1 className="hidden text-sm font-semibold sm:block">Visão geral</h1>
          <span className="hidden sm:contents">
            <ToolbarDivider />
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="max-w-56 gap-1.5 px-2"
              >
                <span className="truncate">{profile.name}</span>
                {profile.id === prefs.defaultId && (
                  <span className="text-[11px] font-normal text-muted-foreground">
                    padrão
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Perfis
              </DropdownMenuLabel>
              {orderedProfiles.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onSelect={() => setActiveId(item.id)}
                  className="group/profile"
                >
                  <Check
                    className={cn(item.id !== profile.id && "opacity-0")}
                  />
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {item.id === prefs.defaultId && (
                    <span className="text-[11px] text-muted-foreground">
                      padrão
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={
                      favorites.has(item.id)
                        ? `Desfavoritar ${item.name}`
                        : `Favoritar ${item.name}`
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setPrefs({
                        ...prefs,
                        favorites: favorites.has(item.id)
                          ? prefs.favorites.filter((id) => id !== item.id)
                          : [...prefs.favorites, item.id],
                      });
                    }}
                    className="rounded p-0.5 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <Star
                      className={cn(
                        "size-3.5",
                        favorites.has(item.id)
                          ? "fill-current text-primary"
                          : "text-muted-foreground/60",
                      )}
                    />
                  </button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setNaming("new")}>
                Salvar como novo perfil…
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setNaming("rename")}>
                Renomear perfil…
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={profile.id === prefs.defaultId}
                onSelect={() => {
                  setPrefs({ ...prefs, defaultId: profile.id });
                  toast.success(`"${profile.name}" agora abre por padrão`);
                }}
              >
                Definir como padrão
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={prefs.profiles.length <= 1}
                onSelect={() => {
                  const rest = prefs.profiles.filter(
                    (item) => item.id !== profile.id,
                  );
                  setPrefs({
                    ...prefs,
                    profiles: rest,
                    defaultId:
                      prefs.defaultId === profile.id
                        ? rest[0].id
                        : prefs.defaultId,
                    favorites: prefs.favorites.filter(
                      (id) => id !== profile.id,
                    ),
                  });
                  setActiveId(undefined);
                  toast.success(`Perfil "${profile.name}" excluído`);
                }}
              >
                Excluir perfil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </WorkspaceToolbar>

        <div className="min-h-0 flex-1 overflow-auto">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="text-sm font-medium">Este perfil está vazio</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Adicione widgets pelo botão “Widgets” na barra, ou restaure o
                layout padrão.
              </p>
              <Button size="sm" variant="outline" onClick={restore}>
                <RotateCcw /> Restaurar layout padrão
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "grid grid-cols-12 items-start gap-3 p-3 sm:p-4",
                maximized && "h-full",
              )}
            >
              {visible.map((widget) => {
                const index = profile.widgets.indexOf(widget);
                const Content = widgetComponents[widget.type];
                return (
                  <WidgetFrame
                    key={widget.id}
                    widget={widget}
                    index={index}
                    count={profile.widgets.length}
                    maximized={widget.id === maximizedId}
                    dragging={widget.id === draggingId}
                    over={widget.id === overId}
                    onChange={(patch) => updateWidget(widget.id, patch)}
                    onMove={(to) => move(index, to)}
                    onRemove={() => {
                      setWidgets(
                        profile.widgets.filter((item) => item.id !== widget.id),
                      );
                      toast.success(
                        `${widgetCatalog[widget.type].title} removido`,
                        {
                          action: {
                            label: "Desfazer",
                            onClick: () => setWidgets(profile.widgets),
                          },
                        },
                      );
                    }}
                    onMaximize={(on) =>
                      setMaximizedId(on ? widget.id : undefined)
                    }
                    onDragStart={() => setDraggingId(widget.id)}
                    onDragOver={() => draggingId && setOverId(widget.id)}
                    onDrop={() => {
                      if (draggingId) {
                        const from = profile.widgets.findIndex(
                          (item) => item.id === draggingId,
                        );
                        move(from, index);
                      }
                      setDraggingId(undefined);
                      setOverId(undefined);
                    }}
                    onDragEnd={() => {
                      setDraggingId(undefined);
                      setOverId(undefined);
                    }}
                  >
                    <Content
                      data={data}
                      today={today}
                      now={now}
                      config={widget.config ?? {}}
                      setConfig={(patch) =>
                        updateWidget(widget.id, {
                          config: { ...widget.config, ...patch },
                        })
                      }
                      onOpenTask={setOpenTaskId}
                      expanded={widget.id === maximizedId}
                    />
                  </WidgetFrame>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ProfileNameDialog
        mode={naming}
        current={profile.name}
        onClose={() => setNaming(undefined)}
        onSave={(name) => {
          if (naming === "rename") {
            saveProfile({ ...profile, name });
          } else {
            const created: DashboardProfile = {
              id: uuidv7(),
              name,
              widgets: profile.widgets,
            };
            setPrefs({ ...prefs, profiles: [...prefs.profiles, created] });
            setActiveId(created.id);
          }
          setNaming(undefined);
        }}
      />

      <TaskDetailSheet
        taskId={openTaskId}
        onOpenChange={(open) => !open && setOpenTaskId(undefined)}
      />

      <TaskFormDialog
        open={open === "task"}
        onOpenChange={(next) => !next && closeCreate()}
      />
      <NoteFormDialog
        open={open === "note"}
        onOpenChange={(next) => !next && closeCreate()}
      />
      <ProjectFormDialog
        open={open === "project"}
        onOpenChange={(next) => !next && closeCreate()}
      />
      <RoutineFormDialog
        today={localDay(now)}
        open={open === "routine"}
        onOpenChange={(next) => !next && closeCreate()}
      />
      <TimeEntryFormDialog
        day={localDay(now)}
        open={open === "time"}
        onOpenChange={(next) => !next && closeCreate()}
      />
      <GoalFormDialog
        open={open === "goal"}
        onOpenChange={(next) => !next && closeCreate()}
      />
      <ContactFormDialog
        open={open === "contact"}
        onOpenChange={(next) => !next && closeCreate()}
      />
      <AppointmentSheet
        open={open === "appointment"}
        onOpenChange={(next) => !next && closeCreate()}
        draft={{ date: today, startTime: "09:00", endTime: "10:00" }}
      />
    </WorkspaceFrame>
  );
}

function ProfileNameDialog({
  mode,
  current,
  onClose,
  onSave,
}: {
  mode?: "new" | "rename";
  current: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  return (
    <Dialog open={Boolean(mode)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {mode && (
          <form
            key={mode}
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const name = String(
                new FormData(event.currentTarget).get("name") ?? "",
              ).trim();
              if (name) onSave(name);
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {mode === "new" ? "Novo perfil" : "Renomear perfil"}
              </DialogTitle>
              <DialogDescription>
                {mode === "new"
                  ? "Começa com os widgets do perfil atual; depois é só ajustar."
                  : "O nome aparece no seletor de perfis."}
              </DialogDescription>
            </DialogHeader>
            <Input
              name="name"
              aria-label="Nome do perfil"
              defaultValue={mode === "rename" ? current : ""}
              placeholder="Ex.: Empresa, Organização pessoal"
              autoFocus
              required
              maxLength={40}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
