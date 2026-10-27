import {
  isNavGroup,
  mainNavigation,
  secondaryNavigation,
} from "@/lib/constants/navigation";
import type { AppData } from "@/lib/sample-data/store";

export type SearchResult = {
  id: string;
  group: string;
  title: string;
  subtitle?: string;
  href: string;
  /** Extra text that matches but is not shown. */
  keywords?: string;
};

/** Everything the global search can find, built from the local store. */
export function buildSearchIndex(data: AppData): SearchResult[] {
  const projectName = new Map(data.projects.map((p) => [p.id, p.name]));
  const pages = [
    ...mainNavigation.flatMap((entry) =>
      isNavGroup(entry) ? entry.items : [entry],
    ),
    ...secondaryNavigation,
  ].filter((item) => !item.soon);

  return [
    ...pages.map((page) => ({
      id: `page:${page.href}`,
      group: "Páginas",
      title: page.title,
      href: page.href,
    })),
    ...data.tasks.map((task) => ({
      id: `task:${task.id}`,
      group: "Tarefas",
      title: task.title,
      subtitle: task.projectId
        ? projectName.get(task.projectId)
        : "Sem projeto",
      href: `/tasks?q=${encodeURIComponent(task.title)}`,
      keywords: `${task.description ?? ""} ${task.tag ?? ""}`,
    })),
    ...data.projects.map((project) => ({
      id: `project:${project.id}`,
      group: "Projetos",
      title: project.name,
      subtitle: project.description,
      href: `/projects/${project.id}`,
    })),
    ...data.companies.map((company) => ({
      id: `company:${company.id}`,
      group: "Empresas",
      title: company.name,
      subtitle: company.tradeName,
      href: `/companies/${company.id}`,
      keywords: company.description,
    })),
    ...data.goals.map((goal) => ({
      id: `goal:${goal.id}`,
      group: "Metas",
      title: goal.name,
      subtitle: goal.desiredResult,
      href: `/goals/${goal.id}`,
    })),
    ...data.notes.map((note) => ({
      id: `note:${note.id}`,
      group: "Notas",
      title: note.title,
      subtitle: note.tags.map((tag) => `#${tag}`).join(" "),
      href: `/knowledge?note=${note.id}`,
      keywords: note.body,
    })),
    ...data.snippets.map((snippet) => ({
      id: `snippet:${snippet.id}`,
      group: "Snippets",
      title: snippet.title,
      subtitle: snippet.language,
      href: "/knowledge/snippets",
      keywords: `${snippet.explanation ?? ""} ${snippet.tags.join(" ")}`,
    })),
    ...data.methods.map((method) => ({
      id: `method:${method.id}`,
      group: "Métodos",
      title: method.title,
      subtitle: method.summary,
      href: `/methods/${method.id}`,
    })),
    ...data.contacts.map((contact) => ({
      id: `contact:${contact.id}`,
      group: "Contatos",
      title: contact.name,
      subtitle: contact.role,
      href: `/contacts?contact=${contact.id}`,
      keywords: contact.specialties.join(" "),
    })),
    ...data.studies.map((study) => ({
      id: `study:${study.id}`,
      group: "Aprendizado",
      title: study.name,
      subtitle: study.nextActivity,
      href: "/learning",
    })),
    ...data.purchases.map((purchase) => ({
      id: `purchase:${purchase.id}`,
      group: "Compras",
      title: purchase.name,
      href: "/finance/purchases",
    })),
  ];
}

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Every word must match; title matches rank first. */
export function searchIndex(index: SearchResult[], query: string, limit = 30) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return index
    .map((item) => {
      const title = normalize(item.title);
      const all = normalize(
        `${item.title} ${item.subtitle ?? ""} ${item.keywords ?? ""}`,
      );
      if (!words.every((word) => all.includes(word))) return undefined;
      const score =
        (title.startsWith(words[0]) ? 0 : 2) +
        (words.every((word) => title.includes(word)) ? 0 : 1);
      return { item, score };
    })
    .filter((match) => match !== undefined)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((match) => match.item);
}
