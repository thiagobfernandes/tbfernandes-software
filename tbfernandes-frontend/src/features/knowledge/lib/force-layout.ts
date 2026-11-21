import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";

import type { GraphEdge, GraphNode } from "@/features/knowledge/lib/graph";
import {
  defaultGraphSettings,
  forcesOf,
  type LayoutForces,
} from "@/features/knowledge/lib/graph-settings";

export type SimNode = GraphNode &
  SimulationNodeDatum & { x: number; y: number; degree: number };
export type SimLink = SimulationLinkDatum<SimNode> & {
  source: SimNode;
  target: SimNode;
  edge: GraphEdge;
};

type Point = { x: number; y: number };

export type LayoutOptions = {
  forces?: LayoutForces;
  /** Node id → group key: grouped nodes are pulled toward their group's center. */
  groups?: Map<string, string>;
  /** Pinned positions (fx/fy) the simulation must respect. */
  pins?: Map<string, Point>;
  /** Ticks to pre-run; 0 when positions come from the layout worker. */
  warm?: number;
};

/** Node radius grows with its connections (structural relevance). */
export const nodeRadius = (
  node: Pick<SimNode, "kind" | "degree" | "cluster">,
  scale = 1,
) =>
  ((node.cluster
    ? 6 + Math.sqrt(node.cluster.size) * 2
    : node.kind === "tag"
      ? 3
      : 4) +
    Math.sqrt(Math.min(node.degree, 40)) * 2) *
  scale;

/** Group centers on a circle, sized so groups don't overlap. */
export function groupCenters(groups: Map<string, string>) {
  const keys = [...new Set(groups.values())].sort();
  const radius = 60 + keys.length * 28;
  return new Map(
    keys.map((key, i) => {
      const angle = (i / keys.length) * Math.PI * 2;
      return [
        key,
        { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
      ];
    }),
  );
}

/**
 * Live force simulation, like Obsidian's graph: nodes repel, links pull, a
 * gravity keeps unlinked nodes close, collision stops overlaps, and an
 * optional grouping force gathers clusters. Nodes that existed in `previous`
 * keep their position, so filtering does not shuffle the graph.
 */
export function createForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  previous?: Map<string, Point>,
  options: LayoutOptions = {},
): {
  simulation: Simulation<SimNode, SimLink>;
  nodes: SimNode[];
  links: SimLink[];
} {
  const forces = options.forces ?? forcesOf(defaultGraphSettings);
  const degree = new Map<string, number>();
  edges.forEach((edge) => {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  });
  const centers = options.groups ? groupCenters(options.groups) : undefined;
  const simNodes: SimNode[] = nodes.map((node, i) => {
    const kept = previous?.get(node.id);
    const pin = options.pins?.get(node.id);
    const center = centers?.get(options.groups!.get(node.id) ?? "");
    // Golden-angle spiral for new nodes: stable, no randomness.
    return {
      ...node,
      degree: degree.get(node.id) ?? 0,
      x:
        pin?.x ??
        kept?.x ??
        (center?.x ?? 0) + Math.cos(i * 2.399) * 10 * Math.sqrt(i + 1),
      y:
        pin?.y ??
        kept?.y ??
        (center?.y ?? 0) + Math.sin(i * 2.399) * 10 * Math.sqrt(i + 1),
      fx: pin?.x,
      fy: pin?.y,
    };
  });
  const byId = new Map(simNodes.map((node) => [node.id, node]));
  // Small graphs (a local graph) get longer links so labels have room.
  const spread = nodes.length <= 12 ? 2.2 : nodes.length <= 40 ? 1.4 : 1;
  const links: SimLink[] = edges.map((edge) => ({
    source: byId.get(edge.source)!,
    target: byId.get(edge.target)!,
    edge,
  }));
  const target = (node: SimNode, axis: "x" | "y") =>
    centers?.get(options.groups?.get(node.id) ?? "")?.[axis] ?? 0;

  const simulation = forceSimulation<SimNode, SimLink>(simNodes)
    .force(
      "link",
      forceLink<SimNode, SimLink>(links)
        .distance(
          (link) =>
            (link.edge.relation === "tag"
              ? forces.linkDistance * 1.35
              : forces.linkDistance) * spread,
        )
        .strength(
          (link) =>
            (0.7 * forces.linkStrength) /
            Math.max(1, Math.min(link.source.degree, link.target.degree)),
        ),
    )
    .force(
      "charge",
      forceManyBody<SimNode>()
        .strength(-forces.repulsion * spread)
        .distanceMax(500),
    )
    .force(
      "collide",
      forceCollide<SimNode>((node) => nodeRadius(node, forces.nodeSize) + 4),
    )
    .force(
      "x",
      forceX<SimNode>((node) => target(node, "x")).strength((node) =>
        centers && options.groups?.has(node.id) ? 0.18 : forces.gravity,
      ),
    )
    .force(
      "y",
      forceY<SimNode>((node) => target(node, "y")).strength((node) =>
        centers && options.groups?.has(node.id) ? 0.18 : forces.gravity,
      ),
    )
    .stop();

  const warm = options.warm ?? (previous && previous.size > 0 ? 120 : 300);
  for (let i = 0; i < warm; i++) simulation.tick();
  simulation.alpha(0);

  return { simulation, nodes: simNodes, links };
}

export type Box = { x: number; y: number; w: number; h: number };

/** Bounding box of the nodes with padding and a minimum size. */
export function fitBox(
  nodes: SimNode[],
  minW: number,
  minH: number,
  scale = 1,
): Box {
  if (nodes.length === 0)
    return { x: -minW / 2, y: -minH / 2, w: minW, h: minH };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const r = nodeRadius(node, scale);
    minX = Math.min(minX, node.x - r);
    minY = Math.min(minY, node.y - r);
    maxX = Math.max(maxX, node.x + r);
    maxY = Math.max(maxY, node.y + r + 14);
  }
  const pad = 30;
  const w = Math.max(maxX - minX + pad * 2, minW);
  const h = Math.max(maxY - minY + pad * 2, minH);
  return { x: (minX + maxX) / 2 - w / 2, y: (minY + maxY) / 2 - h / 2, w, h };
}

/**
 * Greedy label placement: labels go in priority order and a label that would
 * overlap one already placed is skipped, so dense areas stay readable.
 */
export function placeLabels(
  candidates: { node: SimNode; text: string }[],
  fontSize: number,
  scale = 1,
): Set<string> {
  const placed: Box[] = [];
  const shown = new Set<string>();
  for (const { node, text } of candidates) {
    const w = text.length * fontSize * 0.56;
    const h = fontSize * 1.25;
    const box = {
      x: node.x - w / 2,
      y: node.y + nodeRadius(node, scale) + 2,
      w,
      h,
    };
    const hits = placed.some(
      (other) =>
        box.x < other.x + other.w &&
        other.x < box.x + box.w &&
        box.y < other.y + other.h &&
        other.y < box.y + box.h,
    );
    if (hits) continue;
    placed.push(box);
    shown.add(node.id);
  }
  return shown;
}
