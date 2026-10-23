import type { RelationNode } from "@/components/shared/relation-tree";
import type { AppData } from "@/lib/sample-data/store";

export const graphKinds = [
  "goal",
  "company",
  "project",
  "task",
  "note",
  "snippet",
  "contact",
] as const;
export type GraphKind = (typeof graphKinds)[number];

export const graphKindLabels: Record<GraphKind, string> = {
  goal: "Goals",
  company: "Companies",
  project: "Projects",
  task: "Tasks",
  note: "Notes",
  snippet: "Snippets",
  contact: "Contacts",
};

export type GraphNode = {
  id: string;
  kind: GraphKind;
  label: string;
  href: string;
};

export type GraphEdge = { source: string; target: string };

/** Every record that takes part in a relation, as nodes and undirected edges. */
export function buildGraph(data: AppData) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const key = (kind: GraphKind, id: string) => `${kind}:${id}`;
  const link = (a: string, b?: string) =>
    b && edges.push({ source: a, target: b });

  for (const goal of data.goals) {
    nodes.push({
      id: key("goal", goal.id),
      kind: "goal",
      label: goal.name,
      href: `/goals/${goal.id}`,
    });
    if (goal.parentId) link(key("goal", goal.id), key("goal", goal.parentId));
  }
  for (const company of data.companies) {
    nodes.push({
      id: key("company", company.id),
      kind: "company",
      label: company.name,
      href: `/companies/${company.id}`,
    });
  }
  for (const project of data.projects) {
    const id = key("project", project.id);
    nodes.push({
      id,
      kind: "project",
      label: project.name,
      href: `/projects/${project.id}`,
    });
    if (project.companyId) link(id, key("company", project.companyId));
    if (project.goalId) link(id, key("goal", project.goalId));
  }
  for (const task of data.tasks) {
    const id = key("task", task.id);
    nodes.push({
      id,
      kind: "task",
      label: task.title,
      href: `/tasks?q=${encodeURIComponent(task.title)}`,
    });
    if (task.projectId) link(id, key("project", task.projectId));
    if (task.goalId) link(id, key("goal", task.goalId));
  }
  for (const note of data.notes) {
    const id = key("note", note.id);
    nodes.push({
      id,
      kind: "note",
      label: note.title,
      href: `/knowledge?note=${note.id}`,
    });
    note.projectIds.forEach((projectId) => link(id, key("project", projectId)));
    note.taskIds.forEach((taskId) => link(id, key("task", taskId)));
  }
  for (const snippet of data.snippets) {
    const id = key("snippet", snippet.id);
    nodes.push({
      id,
      kind: "snippet",
      label: snippet.title,
      href: "/knowledge/snippets",
    });
    snippet.projectIds.forEach((projectId) =>
      link(id, key("project", projectId)),
    );
    snippet.taskIds.forEach((taskId) => link(id, key("task", taskId)));
  }
  for (const contact of data.contacts) {
    const id = key("contact", contact.id);
    nodes.push({
      id,
      kind: "contact",
      label: contact.name,
      href: `/contacts?contact=${contact.id}`,
    });
    if (contact.companyId) link(id, key("company", contact.companyId));
  }

  // Drop edges whose other end was deleted.
  const ids = new Set(nodes.map((node) => node.id));
  return {
    nodes,
    edges: edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
  };
}

export type Positioned = GraphNode & { x: number; y: number; degree: number };

/**
 * Small deterministic force layout (repulsion, springs, gravity). Runs once per
 * data change; fine for the few hundred records a personal workspace has.
 */
export function layoutGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  iterations = 320,
) {
  const index = new Map(nodes.map((node, i) => [node.id, i]));
  const degree = new Array(nodes.length).fill(0);
  edges.forEach((edge) => {
    degree[index.get(edge.source)!]++;
    degree[index.get(edge.target)!]++;
  });
  // Golden-angle spiral: stable starting points without randomness.
  const x = nodes.map((_, i) => Math.cos(i * 2.399) * 12 * Math.sqrt(i + 1));
  const y = nodes.map((_, i) => Math.sin(i * 2.399) * 12 * Math.sqrt(i + 1));

  for (let step = 0; step < iterations; step++) {
    const cooling = 1 - step / iterations;
    const fx = new Array(nodes.length).fill(0);
    const fy = new Array(nodes.length).fill(0);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = x[i] - x[j];
        const dy = y[i] - y[j];
        const distSq = Math.max(dx * dx + dy * dy, 1);
        const force = 2600 / distSq;
        const dist = Math.sqrt(distSq);
        fx[i] += (dx / dist) * force;
        fy[i] += (dy / dist) * force;
        fx[j] -= (dx / dist) * force;
        fy[j] -= (dy / dist) * force;
      }
    }
    for (const edge of edges) {
      const a = index.get(edge.source)!;
      const b = index.get(edge.target)!;
      const dx = x[b] - x[a];
      const dy = y[b] - y[a];
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = (dist - 60) * 0.05;
      fx[a] += (dx / dist) * force;
      fy[a] += (dy / dist) * force;
      fx[b] -= (dx / dist) * force;
      fy[b] -= (dy / dist) * force;
    }
    for (let i = 0; i < nodes.length; i++) {
      fx[i] -= x[i] * 0.012;
      fy[i] -= y[i] * 0.012;
      const limit = 12 * cooling + 0.5;
      x[i] += Math.max(-limit, Math.min(limit, fx[i]));
      y[i] += Math.max(-limit, Math.min(limit, fy[i]));
    }
  }

  return nodes.map<Positioned>((node, i) => ({
    ...node,
    x: x[i],
    y: y[i],
    degree: degree[i],
  }));
}

/** Goal → project → task hierarchy for the dashboard tree, from real data. */
export function buildContextTree(
  data: AppData,
  goalId?: string,
): RelationNode | undefined {
  const goal =
    data.goals.find((item) => item.id === goalId) ??
    data.goals.find(
      (item) =>
        item.status === "active" &&
        data.projects.some((p) => p.goalId === item.id),
    );
  if (!goal) return undefined;
  const openTask = (status: string) =>
    status !== "done" && status !== "canceled";

  return {
    id: goal.id,
    kind: "Goal",
    label: goal.name,
    href: `/goals/${goal.id}`,
    children: data.projects
      .filter((project) => project.goalId === goal.id)
      .map((project) => ({
        id: project.id,
        kind: "Project",
        label: project.name,
        href: `/projects/${project.id}`,
        children: data.tasks
          .filter(
            (task) => task.projectId === project.id && openTask(task.status),
          )
          .slice(0, 3)
          .map((task) => ({
            id: task.id,
            label:
              task.title.length > 28
                ? `${task.title.slice(0, 27)}…`
                : task.title,
          })),
      })),
  };
}
