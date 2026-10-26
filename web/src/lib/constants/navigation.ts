import {
  BookOpen,
  CalendarDays,
  Briefcase,
  Building2,
  Code2,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Medal,
  Network,
  Settings,
  ShoppingCart,
  Sparkles,
  Target,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Planned module that is not built yet: shown, but not navigable. */
  soon?: boolean;
};

export type NavGroup = {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
};

export type NavEntry = NavItem | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

// One group per product area from the vision doc. Mark a planned module
// with `soon` to show it in the map before it is built.
export const mainNavigation: NavEntry[] = [
  { title: "Overview", href: "/", icon: LayoutDashboard },
  { title: "Calendar", href: "/calendar", icon: CalendarDays },
  { title: "Assistant", href: "/assistant", icon: Sparkles },
  {
    title: "Work",
    icon: Briefcase,
    items: [
      { title: "Companies", href: "/companies", icon: Building2 },
      { title: "Projects", href: "/projects", icon: FolderKanban },
      { title: "Tasks", href: "/tasks", icon: ListChecks },
    ],
  },
  {
    title: "Knowledge",
    icon: BookOpen,
    items: [
      { title: "Notes", href: "/knowledge", icon: FileText },
      { title: "Snippets", href: "/knowledge/snippets", icon: Code2 },
      { title: "Graph", href: "/knowledge/graph", icon: Network },
      { title: "Methods", href: "/methods", icon: Workflow },
    ],
  },
  {
    title: "Growth",
    icon: Target,
    items: [
      { title: "Goals", href: "/goals", icon: Target },
      { title: "Learning", href: "/learning", icon: GraduationCap },
      {
        title: "Certifications",
        href: "/certifications",
        icon: Medal,
      },
    ],
  },
  {
    title: "Finance",
    icon: Wallet,
    items: [
      { title: "Cash flow", href: "/finance", icon: Wallet },
      {
        title: "Planned purchases",
        href: "/finance/purchases",
        icon: ShoppingCart,
      },
    ],
  },
  {
    title: "Network",
    icon: Users,
    items: [{ title: "Contacts", href: "/contacts", icon: Users }],
  },
];

export const secondaryNavigation: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
];

type NavMatch = { item: NavItem; group?: NavGroup };

const allNavMatches: NavMatch[] = [
  ...mainNavigation.flatMap((entry) =>
    isNavGroup(entry)
      ? entry.items.map((item) => ({ item, group: entry }))
      : [{ item: entry }],
  ),
  ...secondaryNavigation.map((item) => ({ item })),
].filter(({ item }) => !item.soon);

function matches(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The most specific navigation item for a path ("/knowledge/graph" beats "/knowledge"). */
export function findActiveNav(pathname: string): NavMatch | undefined {
  return allNavMatches
    .filter(({ item }) => matches(pathname, item.href))
    .sort((a, b) => b.item.href.length - a.item.href.length)[0];
}
