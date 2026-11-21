"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";

import {
  sidebarActions,
  useSidebarPrefs,
} from "@/components/layout/sidebar-state";
import { Button } from "@/components/ui/button";
import { findActiveNav } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

/**
 * Star in the header: favorites the current page (path and query, so a
 * project or a saved view can be a favorite) into the sidebar.
 */
export function FavoritePageButton() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const href = search ? `${pathname}?${search}` : pathname;
  const [prefs] = useSidebarPrefs();
  const favorite = prefs.favorites.some((f) => f.href === href);
  // The tab title ("Notas · TBFernandes") names the page, read on click.
  const pageLabel = () =>
    document.title.split("·")[0]?.trim() ||
    findActiveNav(pathname)?.item.title ||
    "Página";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-pressed={favorite}
      aria-label={
        favorite ? "Remover página dos favoritos" : "Favoritar página"
      }
      title={favorite ? "Remover dos favoritos" : "Favoritar página"}
      onClick={() =>
        sidebarActions.toggleFavorite({ href, label: pageLabel() })
      }
      className={cn(
        "hidden text-muted-foreground hover:text-primary md:inline-flex",
        favorite && "text-primary",
      )}
    >
      <Star className={cn(favorite && "fill-current")} />
    </Button>
  );
}
