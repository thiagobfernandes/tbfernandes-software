"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
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
  type NavGroup,
  type NavItem,
} from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

type NavLinksProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

const itemClass =
  "flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring";

export function NavLinks({ collapsed = false, onNavigate }: NavLinksProps) {
  const pathname = usePathname();
  const activeHref = findActiveNav(pathname)?.item.href;

  if (collapsed) {
    return (
      <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
        {mainNavigation.map((entry, index) => {
          const items = (isNavGroup(entry) ? entry.items : [entry]).filter(
            (item) => !item.soon,
          );
          if (items.length === 0) return null;
          return (
            <div key={entry.title} className="flex flex-col gap-1">
              {isNavGroup(entry) && index > 0 && (
                <Separator className="bg-sidebar-border my-1" />
              )}
              {items.map((item) => (
                <RailLink
                  key={item.href}
                  item={item}
                  active={item.href === activeHref}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          );
        })}
        <div className="mt-auto flex flex-col gap-1">
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

  return (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
      {mainNavigation.map((entry) =>
        isNavGroup(entry) ? (
          <NavGroupSection
            key={entry.title}
            group={entry}
            activeHref={activeHref}
            onNavigate={onNavigate}
          />
        ) : (
          <TopLink
            key={entry.href}
            item={entry}
            active={entry.href === activeHref}
            onNavigate={onNavigate}
          />
        ),
      )}
      <div className="mt-auto flex flex-col gap-1 pt-4">
        {secondaryNavigation.map((item) => (
          <TopLink
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

function SoonBadge() {
  return (
    <span className="border-sidebar-border text-muted-foreground ml-auto rounded-full border px-1.5 py-px text-[10px] font-medium tracking-wide uppercase">
      Soon
    </span>
  );
}

function TopLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  if (item.soon) {
    return (
      <span className={cn(itemClass, "pointer-events-none opacity-60")}>
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{item.title}</span>
        <SoonBadge />
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        itemClass,
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
    >
      <Icon
        className={cn("size-4 shrink-0", active && "text-sidebar-primary")}
        aria-hidden
      />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

function NavGroupSection({
  group,
  activeHref,
  onNavigate,
}: {
  group: NavGroup;
  activeHref?: string;
  onNavigate?: () => void;
}) {
  const Icon = group.icon;
  const containsActive = group.items.some((item) => item.href === activeHref);
  const isPlanned = group.items.every((item) => item.soon);

  return (
    <Collapsible
      defaultOpen={!isPlanned || containsActive}
      className="group/nav"
    >
      <CollapsibleTrigger className={cn(itemClass, "mt-3")}>
        <Icon
          className={cn(
            "size-4 shrink-0",
            containsActive && "text-sidebar-primary",
          )}
          aria-hidden
        />
        <span className="truncate">{group.title}</span>
        {isPlanned && <SoonBadge />}
        <ChevronRight
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]/nav:rotate-90",
            !isPlanned && "ml-auto",
          )}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        {/* Tree guide: a vertical rail with a node dot per item, echoing the relationship graph. */}
        <ul className="border-sidebar-border relative mt-1 ml-5 flex flex-col gap-0.5 border-l pl-3">
          {group.items.map((item) => {
            const active = item.href === activeHref;
            return (
              <li key={item.href} className="relative">
                <span
                  aria-hidden
                  className={cn(
                    "bg-sidebar-border absolute top-1/2 -left-[15.5px] size-1.5 -translate-y-1/2 rounded-full",
                    active &&
                      "bg-sidebar-primary shadow-[0_0_8px_var(--sidebar-primary)]",
                  )}
                />
                {item.soon ? (
                  <span
                    className={cn(
                      itemClass,
                      "pointer-events-none h-8 px-2 font-normal opacity-60",
                    )}
                  >
                    <span className="truncate">{item.title}</span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      itemClass,
                      "h-8 px-2 font-normal",
                      active &&
                        "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                    )}
                  >
                    <span className="truncate">{item.title}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
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
            itemClass,
            "justify-center px-0",
            active && "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
        >
          <Icon
            className={cn("size-4 shrink-0", active && "text-sidebar-primary")}
            aria-hidden
          />
          <span className="sr-only">{item.title}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{item.title}</TooltipContent>
    </Tooltip>
  );
}
