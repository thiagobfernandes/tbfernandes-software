import type { RelationNode } from "@/components/shared/relation-tree";
import type { AppData } from "@/lib/sample-data/store";
import {
  normalizeTitle,
  parseWikiLinks,
  type WikiTarget,
} from "@/features/knowledge/lib/wiki-links";
import { companyHref, goalHref, methodHref, projectHref } from "@/lib/routes";

export const graphKinds = [
  "goal",
  "company",
  "project",
  "task",
  "note",
  "snippet",
  "method",
  "study",
  "skill",
  "contact",
  "tag",
] as const;
export type GraphKind = (typeof graphKinds)[number];

export const graphKindLabels: Record<GraphKind, string> = {
  goal: "Metas",
  company: "Empresas",
  project: "Projetos",
  task: "Tarefas",
  note: "Notas",
  snippet: "Snippets",
  method: "Métodos",
  study: "Estudos",
  skill: "Habilidades",
  contact: "Contatos",
  tag: "Tags",
};

/** Singular label for one node of the kind. */
export const graphKindSingular: Record<GraphKind, string> = {
  goal: "Meta",
  company: "Empresa",
  project: "Projeto",
  task: "Tarefa",
  note: "Nota",
  snippet: "Snippet",
  method: "Método",
  study: "Estudo",
  skill: "Habilidade",
  contact: "Contato",
  tag: "Tag",
};

/** Kinds hidden until the user turns them on (tags add many hub nodes). */
export const defaultHiddenKinds: GraphKind[] = ["tag"];

export type GraphNode = {
  id: string;
  kind: GraphKind;
  label: string;
  /** Where "Abrir" and double-click go. */
  href: string;
};

/** `link` is a stored relation, `wiki` a `[[…]]` mention, `tag` a shared tag. */
export type GraphRelation = "link" | "wiki" | "tag";

export type GraphEdge = {
  source: string;
  target: string;
  relation: GraphRelation;
};

export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

export const graphNodeId = (kind: GraphKind, id: string) => `${kind}:${id}`;

export const noteHref = (id: string) =>
  `/knowledge?note=${encodeURIComponent(id)}`;

export const graphHref = (nodeId: string) =>
  `/knowledge/graph?focus=${encodeURIComponent(nodeId)}`;

/** Records a `[[Title]]` can point at, keyed by normalized title. */
export function wikiTargets(data: AppData) {
  const targets = new Map<string, WikiTarget & { nodeId: string }>();
  const add = (kind: GraphKind, id: string, title: string, href: string) => {
    const key = normalizeTitle(title);
    // The first record with a title wins, notes before snippets and methods.
    if (!targets.has(key))
      targets.set(key, { id, title, href, nodeId: graphNodeId(kind, id) });
  };
  data.notes.forEach((note) =>
    add("note", note.id, note.title, noteHref(note.id)),
  );
  data.snippets.forEach((snippet) =>
    add("snippet", snippet.id, snippet.title, "/knowledge/snippets"),
  );
  data.methods.forEach((method) =>
    add("method", method.id, method.title, methodHref(method.id)),
  );
  return targets;
}

/** Every record that takes part in a relation, as nodes and undirected edges. */
export function buildGraph(data: AppData): Graph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const key = graphNodeId;
  const link = (a: string, b?: string, relation: GraphRelation = "link") =>
    b && a !== b && edges.push({ source: a, target: b, relation });
  // Tags match case-insensitively; the first spelling seen is the label.
  const tags = new Map<string, string>();
  const tagLinks = (id: string, values: string[]) =>
    values.forEach((tag) => {
      const name = tag.trim().toLocaleLowerCase("pt-BR");
      if (!name) return;
      if (!tags.has(name)) tags.set(name, tag.trim());
      link(id, key("tag", name), "tag");
    });

  for (const goal of data.goals) {
    nodes.push({
      id: key("goal", goal.id),
      kind: "goal",
      label: goal.name,
      href: goalHref(goal.id),
    });
    if (goal.parentId) link(key("goal", goal.id), key("goal", goal.parentId));
  }
  for (const company of data.companies) {
    nodes.push({
      id: key("company", company.id),
      kind: "company",
      label: company.name,
      href: companyHref(company.id),
    });
  }
  for (const project of data.projects) {
    const id = key("project", project.id);
    nodes.push({
      id,
      kind: "project",
      label: project.name,
      href: projectHref(project.id),
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
  const targets = wikiTargets(data);
  for (const note of data.notes) {
    const id = key("note", note.id);
    nodes.push({
      id,
      kind: "note",
      label: note.title,
      href: noteHref(note.id),
    });
    note.projectIds.forEach((projectId) => link(id, key("project", projectId)));
    note.taskIds.forEach((taskId) => link(id, key("task", taskId)));
    parseWikiLinks(note.body).forEach((title) =>
      link(id, targets.get(normalizeTitle(title))?.nodeId, "wiki"),
    );
    tagLinks(id, note.tags);
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
    tagLinks(id, snippet.tags);
  }
  for (const method of data.methods) {
    const id = key("method", method.id);
    nodes.push({
      id,
      kind: "method",
      label: method.title,
      href: methodHref(method.id),
    });
    tagLinks(id, method.tags);
  }
  for (const study of data.studies) {
    const id = key("study", study.id);
    nodes.push({ id, kind: "study", label: study.name, href: "/learning" });
    if (study.goalId) link(id, key("goal", study.goalId));
    study.skillIds.forEach((skillId) => link(id, key("skill", skillId)));
  }
  for (const skill of data.skills) {
    nodes.push({
      id: key("skill", skill.id),
      kind: "skill",
      label: skill.name,
      href: "/learning",
    });
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
  for (const [name, tag] of tags) {
    nodes.push({
      id: key("tag", name),
      kind: "tag",
      label: `#${tag}`,
      href: `/knowledge?tag=${encodeURIComponent(tag)}`,
    });
  }

  // Drop edges whose other end was deleted, and duplicates in either direction.
  const ids = new Set(nodes.map((node) => node.id));
  const seen = new Set<string>();
  return {
    nodes,
    edges: edges.filter((edge) => {
      if (!ids.has(edge.source) || !ids.has(edge.target)) return false;
      const pair = [edge.source, edge.target].sort().join("|");
      if (seen.has(pair)) return false;
      seen.add(pair);
      return true;
    }),
  };
}

/** Ids of every node connected to `id`. */
export function neighborIds(edges: GraphEdge[], id: string) {
  const result = new Set<string>();
  for (const edge of edges) {
    if (edge.source === id) result.add(edge.target);
    else if (edge.target === id) result.add(edge.source);
  }
  return result;
}

/** Nodes within `depth` hops of `centerId` (Obsidian's local graph). */
export function localNodeIds(
  edges: GraphEdge[],
  centerId: string,
  depth: number,
) {
  const reached = new Set([centerId]);
  let frontier = [centerId];
  for (let hop = 0; hop < depth && frontier.length > 0; hop++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const other of neighborIds(edges, id)) {
        if (reached.has(other)) continue;
        reached.add(other);
        next.push(other);
      }
    }
    frontier = next;
  }
  return reached;
}

/** Keeps the nodes in `ids` and the edges between them. */
export function subgraph(
  graph: Graph,
  keep: (node: GraphNode) => boolean,
): Graph {
  const nodes = graph.nodes.filter(keep);
  const ids = new Set(nodes.map((node) => node.id));
  return {
    nodes,
    edges: graph.edges.filter(
      (edge) => ids.has(edge.source) && ids.has(edge.target),
    ),
  };
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
    kind: "Meta",
    label: goal.name,
    href: goalHref(goal.id),
    children: data.projects
      .filter((project) => project.goalId === goal.id)
      .map((project) => ({
        id: project.id,
        kind: "Projeto",
        label: project.name,
        href: projectHref(project.id),
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
