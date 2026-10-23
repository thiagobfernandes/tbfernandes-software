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

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="text-muted-foreground flex items-center gap-1.5 truncate text-sm">
        {match.group && (
          <>
            <li>{match.group.title}</li>
            <ChevronRight className="size-3.5 shrink-0" aria-hidden />
          </>
        )}
        <li className={isDetail ? undefined : "text-foreground font-medium"}>
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
