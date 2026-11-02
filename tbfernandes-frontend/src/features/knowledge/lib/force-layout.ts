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

export type SimNode = GraphNode &
  SimulationNodeDatum & { x: number; y: number; degree: number };
export type SimLink = SimulationLinkDatum<SimNode> & {
  source: SimNode;
  target: SimNode;
  edge: GraphEdge;
};

export const nodeRadius = (node: Pick<SimNode, "kind" | "degree">) =>
  (node.kind === "tag" ? 3 : 4) + Math.sqrt(Math.min(node.degree, 40)) * 2;

/**
 * Live force simulation, like Obsidian's graph: nodes repel, links pull, a weak
 * center force keeps unlinked nodes close, and collision stops overlaps.
 * Nodes that existed in `previous` keep their position, so filtering does not
 * shuffle the graph. It is pre-run so the first paint is already settled.
 */
export function createForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  previous?: Map<string, { x: number; y: number }>,
): {
  simulation: Simulation<SimNode, SimLink>;
  nodes: SimNode[];
  links: SimLink[];
} {
  const degree = new Map<string, number>();
  edges.forEach((edge) => {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  });
  const simNodes: SimNode[] = nodes.map((node, i) => {
    const kept = previous?.get(node.id);
    // Golden-angle spiral for new nodes: stable, no randomness.
    return {
      ...node,
      degree: degree.get(node.id) ?? 0,
      x: kept?.x ?? Math.cos(i * 2.399) * 10 * Math.sqrt(i + 1),
      y: kept?.y ?? Math.sin(i * 2.399) * 10 * Math.sqrt(i + 1),
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

  const simulation = forceSimulation<SimNode, SimLink>(simNodes)
    .force(
      "link",
      forceLink<SimNode, SimLink>(links)
        .distance((link) => (link.edge.relation === "tag" ? 60 : 45) * spread)
        .strength(
          (link) =>
            0.7 / Math.max(1, Math.min(link.source.degree, link.target.degree)),
        ),
    )
    .force(
      "charge",
      forceManyBody<SimNode>()
        .strength(-140 * spread)
        .distanceMax(500),
    )
    .force(
      "collide",
      forceCollide<SimNode>((node) => nodeRadius(node) + 4),
    )
    .force("x", forceX<SimNode>(0).strength(0.07))
    .force("y", forceY<SimNode>(0).strength(0.07))
    .stop();

  const warm = previous && previous.size > 0 ? 120 : 300;
  for (let i = 0; i < warm; i++) simulation.tick();
  simulation.alpha(0);

  return { simulation, nodes: simNodes, links };
}

export type Box = { x: number; y: number; w: number; h: number };

/** Bounding box of the nodes with padding and a minimum size. */
export function fitBox(nodes: SimNode[], minW: number, minH: number): Box {
  if (nodes.length === 0)
    return { x: -minW / 2, y: -minH / 2, w: minW, h: minH };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const r = nodeRadius(node);
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
): Set<string> {
  const placed: Box[] = [];
  const shown = new Set<string>();
  for (const { node, text } of candidates) {
    const w = text.length * fontSize * 0.56;
    const h = fontSize * 1.25;
    const box = {
      x: node.x - w / 2,
      y: node.y + nodeRadius(node) + 2,
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
