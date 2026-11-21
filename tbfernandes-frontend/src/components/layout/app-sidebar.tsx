"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import {
  Check,
  ListCollapse,
  MoreHorizontal,
  PanelLeft,
  PanelLeftDashed,
  RotateCcw,
  Settings2,
} from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { NavLinks } from "@/components/layout/nav-links";
import {
  SIDEBAR_COLLAPSE_AT,
  SIDEBAR_WIDTH,
  sidebarActions,
  useSidebarPrefs,
  useSidebarShortcuts,
} from "@/components/layout/sidebar-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResizeHandle } from "@/components/workspace/resize-handle";
import { useImmersive } from "@/components/workspace/workspace-state";
import { cn } from "@/lib/utils";

/**
 * Global sidebar with three modes: expanded (icons and names, resizable from
 * its right edge), compact (icons with tooltips) and hidden. Every choice
 * persists; Ctrl B, Ctrl \ and Ctrl . drive it from the keyboard.
 */
export function AppSidebar() {
  const [prefs] = useSidebarPrefs();
  const immersive = useImmersive();
  const [customizing, setCustomizing] = useState(false);
  const [dragWidth, setDragWidth] = useState<number>();
  useSidebarShortcuts();

  if (prefs.mode === "hidden" || immersive) return null;
  const compact = prefs.mode === "compact" && !customizing;
  const width = compact ? 56 : (dragWidth ?? prefs.width);

  return (
    <aside
      aria-label="Navegação"
      style={{ width }}
      className={cn(
        "sticky top-0 z-30 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex",
        dragWidth === undefined &&
          "transition-[width] duration-200 ease-out motion-reduce:transition-none",
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center",
          compact ? "justify-center" : "justify-between pr-2 pl-4",
        )}
      >
        <Link
          href="/"
          aria-label="Ir para a visão geral"
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <BrandMark collapsed={compact} />
        </Link>
        {!compact && (
          <SidebarMenu
            customizing={customizing}
            onCustomize={() => setCustomizing(!customizing)}
          />
        )}
      </div>

      {customizing && (
        <div className="mx-2.5 mb-2 flex items-center justify-between gap-2 rounded-md border border-dashed border-sidebar-border px-2.5 py-2 text-xs text-muted-foreground">
          Arraste para reordenar; o olho oculta.
          <Button
            size="sm"
            className="h-7"
            onClick={() => setCustomizing(false)}
          >
            <Check /> Pronto
          </Button>
        </div>
      )}

      <div
        className={cn(
          "flex flex-1 [scrollbar-width:thin] flex-col overflow-y-auto overscroll-contain pb-3",
          compact ? "px-2" : "px-2.5",
        )}
      >
        <Suspense>
          <NavLinks collapsed={compact} customizing={customizing} />
        </Suspense>
      </div>

      {compact && (
        <div className="flex justify-center border-t border-sidebar-border py-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Expandir menu"
            title="Expandir menu (Ctrl B)"
            onClick={() => sidebarActions.setMode("expanded")}
            className="text-muted-foreground"
          >
            <PanelLeft />
          </Button>
        </div>
      )}

      {!compact && (
        <ResizeHandle
          width={width}
          min={SIDEBAR_WIDTH.min}
          max={SIDEBAR_WIDTH.max}
          defaultWidth={SIDEBAR_WIDTH.default}
          label="Redimensionar menu"
          onResize={setDragWidth}
          onResizeEnd={(next) => {
            sidebarActions.setWidth(next);
            setDragWidth(undefined);
          }}
          collapseBelow={SIDEBAR_COLLAPSE_AT}
          onCollapse={() => {
            setDragWidth(undefined);
            sidebarActions.setMode("compact");
          }}
        />
      )}
    </aside>
  );
}

function SidebarMenu({
  customizing,
  onCustomize,
}: {
  customizing: boolean;
  onCustomize: () => void;
}) {
  const [prefs] = useSidebarPrefs();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Opções do menu"
          className="text-muted-foreground hover:text-sidebar-accent-foreground"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Modo do menu
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={prefs.mode}
          onValueChange={(mode) =>
            sidebarActions.setMode(mode as typeof prefs.mode)
          }
        >
          <DropdownMenuRadioItem value="expanded">
            Expandido
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="compact">
            Compacto
            <DropdownMenuShortcut>Ctrl B</DropdownMenuShortcut>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="hidden">
            Oculto
            <DropdownMenuShortcut>Ctrl \</DropdownMenuShortcut>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onCustomize}>
          <Settings2 />
          {customizing ? "Terminar personalização" : "Personalizar menu"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={sidebarActions.collapseGroups}>
          <ListCollapse /> Recolher grupos
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={sidebarActions.resetLayout}>
          <RotateCcw /> Restaurar layout
          <DropdownMenuShortcut>Ctrl .</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Header button: shows the sidebar when hidden, or toggles compact. */
export function SidebarToggleButton() {
  const [prefs] = useSidebarPrefs();
  const hidden = prefs.mode === "hidden";
  const label = hidden
    ? "Mostrar menu"
    : prefs.mode === "compact"
      ? "Expandir menu"
      : "Compactar menu";
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() =>
        hidden
          ? sidebarActions.setMode("expanded")
          : sidebarActions.toggleCompact()
      }
      aria-label={label}
      title={`${label} (${hidden ? "Ctrl \\" : "Ctrl B"})`}
      className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
    >
      {hidden ? <PanelLeftDashed /> : <PanelLeft />}
    </Button>
  );
}
