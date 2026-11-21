import {
  adjacency,
  communities,
  distances,
  shortestPath,
} from "@/features/knowledge/lib/graph-algorithms";
import {
  graphKindLabels,
  subgraph,
  type Graph,
  type GraphEdge,
  type GraphNode,
} from "@/features/knowledge/lib/graph";
import type {
  GraphMode,
  GraphSettings,
} from "@/features/knowledge/lib/graph-settings";

/**
 * What the canvas draws for a mode: a subset of the real graph plus derived
 * annotations (groups, distances, a path). Nothing here invents relations;
 * cluster nodes only stand in for real nodes the user collapsed.
 */
export type GraphView = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Node id → group key, for the grouping force and group labels. */
  groups?: Map<string, string>;
  groupLabels?: Map<string, string>;
  /** Hop distance from the center (local, project, subject modes). */
  distance?: Map<string, number>;
  centerId?: string;
  path?: string[];
  /** Why the view is empty, when it is. */
  empty?: string;
};

export type ViewInput = {
  mode: GraphMode;
  settings: GraphSettings;
  focusId?: string;
  projectNodeId?: string;
  tagNodeId?: string;
  pathFrom?: string;
  pathTo?: string;
  /** Nodes whose neighbors were added by "Expandir conexões". */
  expanded: Set<string>;
  collapsedClusters: Set<number>;
};

export const pairKey = (a: string, b: string) =>
  a < b ? `${a}|${b}` : `${b}|${a}`;

export function buildGraphView(graph: Graph, input: ViewInput): GraphView {
  const { mode, settings, expanded } = input;
  const hidden = new Set(settings.hiddenKinds);
  // The subject mode is about tags, so tags are always on there.
  const base = subgraph(
    graph,
    (node) =>
      !hidden.has(node.kind) || (mode === "subject" && node.kind === "tag"),
  );
  const around = adjacency(base.edges);
  const withExpanded = (ids: Set<string>) => {
    for (const id of expanded) {
      if (!ids.has(id)) continue;
      for (const other of around.get(id) ?? []) ids.add(other);
    }
    return ids;
  };

  let view: GraphView;
  switch (mode) {
    case "local": {
      const center = input.focusId;
      if (!center || !base.nodes.some((n) => n.id === center))
        return {
          nodes: [],
          edges: [],
          empty: "Selecione uma entidade para ver suas conexões.",
        };
      const distance = distances(base.edges, center, settings.depth);
      const ids = withExpanded(new Set(distance.keys()));
      view = {
        ...subgraph(base, (n) => ids.has(n.id)),
        distance,
        centerId: center,
      };
      break;
    }
    case "project": {
      const center = input.projectNodeId;
      if (!center)
        return { nodes: [], edges: [], empty: "Escolha um projeto." };
      // Two hops reach the project's tasks and what links to them; other
      // projects are cut so the view stays about this one.
      const distance = distances(
        subgraph(base, (n) => n.kind !== "project" || n.id === center).edges,
        center,
        Math.max(2, settings.depth),
      );
      const ids = withExpanded(new Set(distance.keys()));
      view = {
        ...subgraph(base, (n) => ids.has(n.id)),
        distance,
        centerId: center,
      };
      break;
    }
    case "subject": {
      const center = input.tagNodeId;
      if (!center)
        return { nodes: [], edges: [], empty: "Escolha um assunto (tag)." };
      const distance = distances(
        base.edges,
        center,
        Math.max(1, settings.depth),
      );
      const ids = withExpanded(new Set(distance.keys()));
      view = {
        ...subgraph(base, (n) => ids.has(n.id)),
        distance,
        centerId: center,
      };
      break;
    }
    case "path": {
      const { pathFrom, pathTo } = input;
      if (!pathFrom || !pathTo)
        return {
          nodes: [],
          edges: [],
          empty: "Escolha a origem e o destino do caminho.",
        };
      const path = shortestPath(base.edges, pathFrom, pathTo);
      if (!path)
        return {
          nodes: [],
          edges: [],
          empty: "Não há caminho entre essas entidades com os tipos visíveis.",
        };
      // The path plus each step's direct neighbors, for context.
      const ids = new Set(path);
      for (const id of path)
        for (const other of around.get(id) ?? []) ids.add(other);
      view = { ...subgraph(base, (n) => ids.has(n.id)), path };
      break;
    }
    default:
      view = { ...base };
  }

  if (!settings.showIsolated) {
    const linked = new Set(view.edges.flatMap((e) => [e.source, e.target]));
    const keep = new Set([view.centerId, ...(view.path ?? [])]);
    view = {
      ...view,
      ...subgraph(view, (n) => linked.has(n.id) || keep.has(n.id)),
    };
  }

  const grouping = mode === "clusters" ? "community" : settings.grouping;
  if (grouping !== "none") view = { ...view, ...groupView(view, grouping) };
  if (mode === "clusters" && input.collapsedClusters.size > 0)
    view = collapseClusters(view, input.collapsedClusters);
  return view;
}

function groupView(view: GraphView, grouping: GraphSettings["grouping"]) {
  const groups = new Map<string, string>();
  const groupLabels = new Map<string, string>();
  if (grouping === "kind") {
    for (const node of view.nodes) {
      groups.set(node.id, node.kind);
      groupLabels.set(node.kind, graphKindLabels[node.kind]);
    }
  } else if (grouping === "community") {
    const cluster = communities(
      view.nodes.map((n) => n.id),
      view.edges,
    );
    const sizes = new Map<number, number>();
    for (const index of cluster.values())
      sizes.set(index, (sizes.get(index) ?? 0) + 1);
    for (const node of view.nodes) {
      // A node alone is not a cluster: it stays ungrouped (isolated).
      if ((sizes.get(cluster.get(node.id) ?? -1) ?? 0) < 2) continue;
      const key = `c${cluster.get(node.id) ?? 0}`;
      groups.set(node.id, key);
      groupLabels.set(key, `Cluster ${(cluster.get(node.id) ?? 0) + 1}`);
    }
  } else {
    // Each node joins the nearest project within two hops, if any.
    const around = adjacency(view.edges);
    const byId = new Map(view.nodes.map((n) => [n.id, n]));
    for (const node of view.nodes) {
      let project = node.kind === "project" ? node : undefined;
      if (!project) {
        const near = [...(around.get(node.id) ?? [])];
        project =
          near.map((id) => byId.get(id)).find((n) => n?.kind === "project") ??
          near
            .flatMap((id) => [...(around.get(id) ?? [])])
            .map((id) => byId.get(id))
            .find((n) => n?.kind === "project");
      }
      if (!project) continue;
      groups.set(node.id, project.id);
      groupLabels.set(project.id, project.label);
    }
  }
  return { groups, groupLabels };
}

/** Replaces each collapsed cluster with one stand-in node, rerouting its edges. */
function collapseClusters(view: GraphView, collapsed: Set<number>): GraphView {
  const groups = view.groups ?? new Map();
  const standIn = (id: string) => {
    const key = groups.get(id);
    const index = key ? Number(key.slice(1)) : NaN;
    return collapsed.has(index) ? `cluster:${index}` : id;
  };
  const counts = new Map<string, number>();
  const nodes: GraphNode[] = [];
  for (const node of view.nodes) {
    const id = standIn(node.id);
    if (id === node.id) nodes.push(node);
    else counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  for (const [id, count] of counts) {
    const index = Number(id.split(":")[1]);
    nodes.push({
      id,
      kind: "tag",
      label: `Cluster ${index + 1} · ${count}`,
      href: "",
      cluster: { index, size: count },
    });
    groups.set(id, `c${index}`);
  }
  const seen = new Set<string>();
  const edges: GraphEdge[] = [];
  for (const edge of view.edges) {
    const source = standIn(edge.source);
    const target = standIn(edge.target);
    if (source === target) continue;
    const key = pairKey(source, target);
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ ...edge, source, target });
  }
  return { ...view, nodes, edges, groups };
}
