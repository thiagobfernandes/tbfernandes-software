"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { findActiveNav } from "@/lib/constants/navigation";

export function NavigationBreadcrumbs() {
  const pathname = usePathname();
  const match = findActiveNav(pathname);

  if (!match) return null;

  const isDetail = pathname !== match.item.href;
  const Icon = match.group?.icon ?? match.item.icon;

  return (
    <nav aria-label="Navegação estrutural" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        <li
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
        >
          <Icon className="size-4" />
        </li>
        {match.group && (
          <>
            <li className="hidden shrink-0 sm:block">{match.group.title}</li>
            <ChevronRight
              className="hidden size-3.5 shrink-0 opacity-60 sm:block"
              aria-hidden
            />
          </>
        )}
        <li
          className={
            isDetail ? "truncate" : "truncate font-medium text-foreground"
          }
        >
          {isDetail ? (
            <Link href={match.item.href} className="hover:text-foreground">
              {match.item.title}
            </Link>
          ) : (
            match.item.title
          )}
        </li>
      </ol>
    </nav>
  );
}
