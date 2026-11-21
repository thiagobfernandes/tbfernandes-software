/// <reference lib="webworker" />
import { createForceLayout } from "@/features/knowledge/lib/force-layout";
import type { GraphEdge, GraphNode } from "@/features/knowledge/lib/graph";
import type { LayoutForces } from "@/features/knowledge/lib/graph-settings";

type Point = { x: number; y: number };

export type LayoutRequest = {
  id: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  previous: [string, Point][];
  groups?: [string, string][];
  pins?: [string, Point][];
  forces: LayoutForces;
};

export type LayoutResponse = { id: number; positions: [string, Point][] };

/**
 * Runs the expensive warm-up ticks of a big graph off the main thread; the
 * page then starts its live simulation from these positions.
 */
self.onmessage = (event: MessageEvent<LayoutRequest>) => {
  const { id, nodes, edges, previous, groups, pins, forces } = event.data;
  const layout = createForceLayout(nodes, edges, new Map(previous), {
    forces,
    groups: groups ? new Map(groups) : undefined,
    pins: pins ? new Map(pins) : undefined,
  });
  const positions: [string, Point][] = layout.nodes.map((node) => [
    node.id,
    { x: node.x, y: node.y },
  ]);
  (self as unknown as Worker).postMessage({
    id,
    positions,
  } satisfies LayoutResponse);
};
