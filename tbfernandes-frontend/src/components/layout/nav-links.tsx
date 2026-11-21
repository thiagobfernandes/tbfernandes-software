"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Star,
  type LucideIcon,
} from "lucide-react";

import {
  arrangeNavigation,
  sidebarActions,
  useSidebarPrefs,
  type ArrangedEntry,
  type Favorite,
} from "@/components/layout/sidebar-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  findActiveNav,
  isNavGroup,
  mainNavigation,
  secondaryNavigation,
  type NavItem,
} from "@/lib/constants/navigation";
import { projectColorClasses } from "@/lib/project-colors";
import { projectHref } from "@/lib/routes";
import { useWorkData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

type NavLinksProps = {
  collapsed?: boolean;
  /** Reorder and hide entries instead of navigating. */
  customizing?: boolean;
  onNavigate?: () => void;
};

/** Active projects listed before "Ver todos". */
const PROJECT_LIMIT = 6;

const rowClass =
  "group/row relative flex h-8 w-full min-w-0 items-center gap-2.5 rounded-md px-2 text-[13px] text-sidebar-foreground/85 transition-colors outline-none hover:bg-sidebar-accent/60 hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring pointer-coarse:h-10";
const activeRowClass =
  "bg-sidebar-accent font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent";
const sectionLabelClass =
  "flex h-7 w-full items-center gap-1 rounded-md px-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase outline-none hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring";

const navByHref = new Map<string, NavItem>(
  [
    ...mainNavigation.flatMap((entry) =>
      isNavGroup(entry) ? entry.items : [entry],
    ),
    ...secondaryNavigation,
  ].map((item) => [item.href, item]),
);

/**
 * One href is "the" current page, so a single row is highlighted: an exact
 * favorite or project match wins over the section's navigation item.
 */
function useActiveHref(favorites: Favorite[], projectHrefs: string[]) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const full = search ? `${pathname}?${search}` : pathname;
  const exact = [...favorites.map((f) => f.href), ...projectHrefs].find(
    (href) => href === full,
  );
  return exact ?? findActiveNav(pathname)?.item.href;
}

export function NavLinks({
  collapsed = false,
  customizing = false,
  onNavigate,
}: NavLinksProps) {
  const [prefs] = useSidebarPrefs();
  const data = useWorkData();
  const activeProjects = data.projects.filter(
    (project) => project.status === "active",
  );
  const openTasks = (projectId?: string) =>
    data.tasks.filter(
      (task) =>
        (projectId === undefined || task.projectId === projectId) &&
        task.status !== "done" &&
        task.status !== "canceled",
    ).length;
  const counts: Record<string, number> = { "/tasks": openTasks() };
  const activeHref = useActiveHref(
    prefs.favorites,
    activeProjects.map((project) => projectHref(project.id)),
  );
  const { visible, hiddenItems } = arrangeNavigation(prefs, customizing);
  const favoriteHrefs = new Set(prefs.favorites.map((f) => f.href));
  // The first section that shows the active page claims the highlight.
  const favoriteClaims =
    activeHref !== undefined && favoriteHrefs.has(activeHref);
  const navActive = favoriteClaims ? undefined : activeHref;

  if (collapsed) {
    return (
      <Rail
        favorites={prefs.favorites}
        entries={visible}
        activeHref={activeHref}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <nav className="flex flex-1 flex-col gap-4" aria-label="Principal">
      {prefs.favorites.length > 0 && !customizing && (
        <FavoritesSection
          favorites={prefs.favorites}
          activeHref={activeHref}
          projects={data.projects}
          onNavigate={onNavigate}
        />
      )}

      <EntryList
        entries={visible}
        activeHref={navActive}
        counts={counts}
        favoriteHrefs={favoriteHrefs}
        customizing={customizing}
        hidden={new Set(prefs.hidden)}
        openGroups={prefs.openGroups}
        onNavigate={onNavigate}
      />

      {!customizing && activeProjects.length > 0 && (
        <Collapsible
          open={prefs.projectsOpen}
          onOpenChange={sidebarActions.setProjectsOpen}
          className="group/section flex flex-col gap-px"
        >
          <CollapsibleTrigger className={sectionLabelClass}>
            Projetos ativos
            <ChevronRight
              aria-hidden
              className="size-3 transition-transform group-data-[state=open]/section:rotate-90"
            />
            <span className="ml-auto font-normal normal-case tabular-nums">
              {activeProjects.length}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-px overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            {activeProjects.slice(0, PROJECT_LIMIT).map((project) => {
              const href = projectHref(project.id);
              return (
                <NavRow
                  key={project.id}
                  href={href}
                  label={project.name}
                  active={!favoriteClaims && activeHref === href}
                  favorite={favoriteHrefs.has(href)}
                  count={openTasks(project.id) || undefined}
                  marker={
                    <span
                      aria-hidden
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        projectColorClasses[project.color].bg,
                      )}
                    />
                  }
                  onNavigate={onNavigate}
                />
              );
            })}
            {activeProjects.length > PROJECT_LIMIT && (
              <Link
                href="/projects"
                onClick={onNavigate}
                className={cn(rowClass, "text-muted-foreground")}
              >
                <span className="w-4" aria-hidden />
                Ver todos
              </Link>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {!customizing && hiddenItems.length > 0 && (
        <HiddenSection
          items={hiddenItems}
          activeHref={navActive}
          onNavigate={onNavigate}
        />
      )}

      <div className="mt-auto flex flex-col gap-px">
        {secondaryNavigation.map((item) => (
          <NavRow
            key={item.href}
            href={item.href}
            label={item.title}
            icon={item.icon}
            active={navActive === item.href}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}

function FavoritesSection({
  favorites,
  activeHref,
  projects,
  onNavigate,
}: {
  favorites: Favorite[];
  activeHref?: string;
  projects: ReturnType<typeof useWorkData>["projects"];
  onNavigate?: () => void;
}) {
  const [dragging, setDragging] = useState<string>();
  return (
    <section className="flex flex-col gap-px" aria-label="Favoritos">
      <span className={cn(sectionLabelClass, "pointer-events-none")}>
        Favoritos
      </span>
      {favorites.map((favorite, index) => {
        const item = navByHref.get(favorite.href);
        const project = projects.find(
          (p) => projectHref(p.id) === favorite.href,
        );
        return (
          <div
            key={favorite.href}
            draggable
            onDragStart={(event) => {
              setDragging(favorite.href);
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(event) => dragging && event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (dragging) sidebarActions.moveFavorite(dragging, index);
              setDragging(undefined);
            }}
            onDragEnd={() => setDragging(undefined)}
            className={cn(dragging === favorite.href && "opacity-40")}
          >
            <NavRow
              href={favorite.href}
              label={project?.name ?? item?.title ?? favorite.label}
              icon={item?.icon ?? (project ? undefined : Star)}
              marker={
                project ? (
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      projectColorClasses[project.color].bg,
                    )}
                  />
                ) : undefined
              }
              active={activeHref === favorite.href}
              favorite
              onNavigate={onNavigate}
            />
          </div>
        );
      })}
    </section>
  );
}

function EntryList({
  entries,
  activeHref,
  counts,
  favoriteHrefs,
  customizing,
  hidden,
  openGroups,
  onNavigate,
}: {
  entries: ArrangedEntry[];
  activeHref?: string;
  counts: Record<string, number>;
  favoriteHrefs: Set<string>;
  customizing: boolean;
  hidden: Set<string>;
  openGroups: Record<string, boolean>;
  onNavigate?: () => void;
}) {
  const [dragging, setDragging] = useState<string>();
  const [over, setOver] = useState<string>();

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry, index) => {
        const dragProps = customizing
          ? {
              draggable: true,
              onDragStart: (event: React.DragEvent) => {
                event.stopPropagation();
                setDragging(entry.key);
                event.dataTransfer.effectAllowed = "move";
              },
              onDragOver: (event: React.DragEvent) => {
                if (!dragging || dragging.startsWith("item:")) return;
                event.preventDefault();
                setOver(entry.key);
              },
              onDrop: (event: React.DragEvent) => {
                event.preventDefault();
                if (dragging && !dragging.startsWith("item:"))
                  sidebarActions.moveEntry(dragging, index);
                setDragging(undefined);
                setOver(undefined);
              },
              onDragEnd: () => {
                setDragging(undefined);
                setOver(undefined);
              },
            }
          : {};
        const dropMark = over === entry.key && dragging !== entry.key;

        if (entry.type === "item") {
          return (
            <div
              key={entry.key}
              {...dragProps}
              className={cn(
                "-mb-2.5 rounded-md",
                dropMark && "ring-1 ring-primary/60",
                dragging === entry.key && "opacity-40",
              )}
            >
              {customizing ? (
                <CustomizeRow
                  label={entry.item.title}
                  icon={entry.item.icon}
                  hidden={hidden.has(entry.key)}
                  onToggleHidden={() =>
                    sidebarActions.toggleHiddenEntry(entry.key)
                  }
                />
              ) : (
                <NavRow
                  href={entry.item.href}
                  label={entry.item.title}
                  icon={entry.item.icon}
                  active={activeHref === entry.item.href}
                  favorite={favoriteHrefs.has(entry.item.href)}
                  onNavigate={onNavigate}
                />
              )}
            </div>
          );
        }

        const { group, items } = entry;
        const containsActive = items.some((item) => item.href === activeHref);
        const open = customizing || (openGroups[group.title] ?? containsActive);
        return (
          <div
            key={entry.key}
            {...dragProps}
            className={cn(
              "rounded-md",
              dropMark && "ring-1 ring-primary/60",
              dragging === entry.key && "opacity-40",
            )}
          >
            <Collapsible
              open={open}
              onOpenChange={(next) =>
                sidebarActions.setGroupOpen(group.title, next)
              }
              className="group/section flex flex-col gap-px"
            >
              <div className="flex items-center">
                {customizing && (
                  <GripVertical
                    aria-hidden
                    className="size-3.5 shrink-0 cursor-grab text-muted-foreground"
                  />
                )}
                <CollapsibleTrigger
                  className={sectionLabelClass}
                  disabled={customizing}
                >
                  {group.title}
                  {!customizing && (
                    <ChevronRight
                      aria-hidden
                      className="size-3 transition-transform group-data-[state=open]/section:rotate-90"
                    />
                  )}
                </CollapsibleTrigger>
                {customizing && (
                  <HideToggle
                    hidden={hidden.has(entry.key)}
                    label={group.title}
                    onToggle={() => sidebarActions.toggleHiddenEntry(entry.key)}
                  />
                )}
              </div>
              <CollapsibleContent className="flex flex-col gap-px overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                {customizing ? (
                  <GroupItemsCustomizer
                    groupTitle={group.title}
                    items={items}
                    hidden={hidden}
                    groupHidden={hidden.has(entry.key)}
                  />
                ) : (
                  items.map((item) =>
                    item.soon ? (
                      <span
                        key={item.href}
                        className={cn(
                          rowClass,
                          "pointer-events-none opacity-50",
                        )}
                      >
                        <item.icon className="size-4 shrink-0" aria-hidden />
                        <span className="truncate">{item.title}</span>
                        <span className="ml-auto text-[10px] uppercase">
                          Em breve
                        </span>
                      </span>
                    ) : (
                      <NavRow
                        key={item.href}
                        href={item.href}
                        label={item.title}
                        icon={item.icon}
                        active={activeHref === item.href}
                        favorite={favoriteHrefs.has(item.href)}
                        count={counts[item.href]}
                        onNavigate={onNavigate}
                      />
                    ),
                  )
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
}

function GroupItemsCustomizer({
  groupTitle,
  items,
  hidden,
  groupHidden,
}: {
  groupTitle: string;
  items: NavItem[];
  hidden: Set<string>;
  groupHidden: boolean;
}) {
  const [dragging, setDragging] = useState<string>();
  return items.map((item, index) => (
    <div
      key={item.href}
      draggable
      onDragStart={(event) => {
        event.stopPropagation();
        setDragging(item.href);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        if (!dragging) return;
        event.preventDefault();
        event.stopPropagation();
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (dragging) sidebarActions.moveItem(groupTitle, dragging, index);
        setDragging(undefined);
      }}
      onDragEnd={() => setDragging(undefined)}
      className={cn(
        dragging === item.href && "opacity-40",
        groupHidden && "opacity-50",
      )}
    >
      <CustomizeRow
        label={item.title}
        icon={item.icon}
        hidden={hidden.has(item.href)}
        onToggleHidden={() => sidebarActions.toggleHiddenEntry(item.href)}
      />
    </div>
  ));
}

function CustomizeRow({
  label,
  icon: Icon,
  hidden,
  onToggleHidden,
}: {
  label: string;
  icon: LucideIcon;
  hidden: boolean;
  onToggleHidden: () => void;
}) {
  return (
    <div
      className={cn(
        rowClass,
        "cursor-grab hover:bg-sidebar-accent/40",
        hidden && "text-muted-foreground line-through",
      )}
    >
      <GripVertical
        aria-hidden
        className="size-3.5 shrink-0 text-muted-foreground"
      />
      <Icon aria-hidden className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
      <HideToggle hidden={hidden} label={label} onToggle={onToggleHidden} />
    </div>
  );
}

function HideToggle({
  hidden,
  label,
  onToggle,
}: {
  hidden: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={hidden}
      aria-label={hidden ? `Mostrar ${label}` : `Ocultar ${label}`}
      title={hidden ? "Mostrar" : "Ocultar"}
      className="ml-auto flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
    </button>
  );
}

function HiddenSection({
  items,
  activeHref,
  onNavigate,
}: {
  items: NavItem[];
  activeHref?: string;
  onNavigate?: () => void;
}) {
  const containsActive = items.some((item) => item.href === activeHref);
  const [open, setOpen] = useState(containsActive);
  return (
    <Collapsible
      open={open || containsActive}
      onOpenChange={setOpen}
      className="group/section flex flex-col gap-px"
    >
      <CollapsibleTrigger className={sectionLabelClass}>
        Ocultos
        <ChevronRight
          aria-hidden
          className="size-3 transition-transform group-data-[state=open]/section:rotate-90"
        />
        <span className="ml-auto font-normal normal-case tabular-nums">
          {items.length}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-px overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {items.map((item) => (
          <NavRow
            key={item.href}
            href={item.href}
            label={item.title}
            icon={item.icon}
            active={activeHref === item.href}
            onNavigate={onNavigate}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** A navigation row; hovering shows a star to favorite or unfavorite it. */
function NavRow({
  href,
  label,
  icon: Icon,
  marker,
  active,
  favorite,
  count,
  onNavigate,
}: {
  href: string;
  label: string;
  icon?: LucideIcon;
  marker?: React.ReactNode;
  active: boolean;
  favorite?: boolean;
  count?: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="group/row relative">
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(rowClass, "pr-8", active && activeRowClass)}
      >
        {marker ??
          (Icon && (
            <Icon
              aria-hidden
              className={cn(
                "size-4 shrink-0 text-muted-foreground",
                active && "text-sidebar-primary",
              )}
            />
          ))}
        <span className="truncate">{label}</span>
        {count !== undefined && (
          <span className="ml-auto text-[11px] text-muted-foreground tabular-nums group-hover/row:invisible">
            {count}
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={() => sidebarActions.toggleFavorite({ href, label })}
        aria-pressed={favorite}
        aria-label={
          favorite ? `Remover ${label} dos favoritos` : `Favoritar ${label}`
        }
        title={favorite ? "Remover dos favoritos" : "Favoritar"}
        className={cn(
          "absolute top-1/2 right-1 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground opacity-0 outline-none group-hover/row:opacity-100 hover:text-sidebar-primary focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-sidebar-ring pointer-coarse:hidden",
        )}
      >
        <Star
          className={cn(
            "size-3.5",
            favorite && "fill-current text-sidebar-primary",
          )}
        />
      </button>
    </div>
  );
}

/** Compact mode: one icon per page, a tooltip for the name. */
function Rail({
  favorites,
  entries,
  activeHref,
  onNavigate,
}: {
  favorites: Favorite[];
  entries: ArrangedEntry[];
  activeHref?: string;
  onNavigate?: () => void;
}) {
  const favoriteItems = favorites
    .map((favorite) => ({ favorite, item: navByHref.get(favorite.href) }))
    .filter(({ item }) => item);
  const claimed = favoriteItems.some(({ item }) => item!.href === activeHref);
  return (
    <nav className="flex flex-1 flex-col gap-3" aria-label="Principal">
      {favoriteItems.length > 0 && (
        <div className="flex flex-col gap-px border-b border-sidebar-border pb-3">
          {favoriteItems.map(({ item }) => (
            <RailLink
              key={item!.href}
              item={item!}
              active={item!.href === activeHref}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
      {entries.map((entry) => {
        const items = (
          entry.type === "group" ? entry.items : [entry.item]
        ).filter((item) => !item.soon);
        if (items.length === 0) return null;
        return (
          <div key={entry.key} className="flex flex-col gap-px">
            {items.map((item) => (
              <RailLink
                key={item.href}
                item={item}
                active={!claimed && item.href === activeHref}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        );
      })}
      <div className="mt-auto flex flex-col gap-px">
        {secondaryNavigation.map((item) => (
          <RailLink
            key={item.href}
            item={item}
            active={item.href === activeHref}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}

function RailLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            rowClass,
            "justify-center px-0",
            active && activeRowClass,
          )}
        >
          <Icon
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-muted-foreground",
              active && "text-sidebar-primary",
            )}
          />
          <span className="sr-only">{item.title}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}
