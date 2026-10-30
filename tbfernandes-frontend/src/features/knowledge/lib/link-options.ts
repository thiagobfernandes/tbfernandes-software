import type { MultiSelectOption } from "@/components/shared/multi-select-list";
import type { AppData } from "@/lib/sample-data/store";

/** Projects and tasks a note or snippet can be linked to. */
export function linkOptions(data: AppData) {
  const projectName = new Map(data.projects.map((p) => [p.id, p.name]));
  return {
    projects: data.projects.map<MultiSelectOption>((project) => ({
      value: project.id,
      label: project.name,
    })),
    tasks: data.tasks.map<MultiSelectOption>((task) => ({
      value: task.id,
      label: task.title,
      hint: task.projectId ? projectName.get(task.projectId) : undefined,
    })),
  };
}

/** Matches a search query against title, tags, and extra text. */
export function matchesQuery(
  query: string,
  item: { title: string; tags: string[] },
  ...extra: (string | undefined)[]
) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [item.title, ...item.tags, ...extra].some((text) =>
    text?.toLowerCase().includes(needle),
  );
}
