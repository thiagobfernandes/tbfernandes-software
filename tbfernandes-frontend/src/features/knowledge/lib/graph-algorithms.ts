import type { GraphEdge } from "@/features/knowledge/lib/graph";

/** Adjacency list of an undirected graph. */
export function adjacency(edges: GraphEdge[]) {
  const map = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    let set = map.get(a);
    if (!set) map.set(a, (set = new Set()));
    set.add(b);
  };
  for (const edge of edges) {
    add(edge.source, edge.target);
    add(edge.target, edge.source);
  }
  return map;
}

export function degrees(edges: GraphEdge[]) {
  const map = new Map<string, number>();
  for (const edge of edges) {
    map.set(edge.source, (map.get(edge.source) ?? 0) + 1);
    map.set(edge.target, (map.get(edge.target) ?? 0) + 1);
  }
  return map;
}

/**
 * Communities by label propagation: every node repeatedly takes the label most
 * common among its neighbors. Deterministic (fixed order, ties to the smallest
 * label), so the same data always yields the same clusters.
 */
export function communities(
  nodeIds: string[],
  edges: GraphEdge[],
  rounds = 12,
) {
  const neighbors = adjacency(edges);
  const ordered = [...nodeIds].sort();
  const label = new Map(ordered.map((id) => [id, id]));
  for (let round = 0; round < rounds; round++) {
    let changed = false;
    for (const id of ordered) {
      const around = neighbors.get(id);
      if (!around?.size) continue;
      const counts = new Map<string, number>();
      for (const other of around) {
        const value = label.get(other)!;
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
      let best = label.get(id)!;
      let bestCount = counts.get(best) ?? 0;
      for (const [value, count] of counts) {
        if (count > bestCount || (count === bestCount && value < best)) {
          best = value;
          bestCount = count;
        }
      }
      if (best !== label.get(id)) {
        label.set(id, best);
        changed = true;
      }
    }
    if (!changed) break;
  }
  // Renumber by size so "Cluster 1" is the largest.
  const sizes = new Map<string, number>();
  for (const value of label.values())
    sizes.set(value, (sizes.get(value) ?? 0) + 1);
  const rank = new Map(
    [...sizes.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([value], index) => [value, index]),
  );
  return new Map([...label].map(([id, value]) => [id, rank.get(value)!]));
}

/** Shortest path by breadth-first search; undefined when not connected. */
export function shortestPath(edges: GraphEdge[], from: string, to: string) {
  if (from === to) return [from];
  const neighbors = adjacency(edges);
  const previous = new Map<string, string>([[from, from]]);
  const queue = [from];
  while (queue.length) {
    const id = queue.shift()!;
    for (const other of neighbors.get(id) ?? []) {
      if (previous.has(other)) continue;
      previous.set(other, id);
      if (other === to) {
        const path = [to];
        let step = to;
        while (step !== from) {
          step = previous.get(step)!;
          path.unshift(step);
        }
        return path;
      }
      queue.push(other);
    }
  }
  return undefined;
}

/** Hop distance from `center` to every reachable node, up to `max`. */
export function distances(edges: GraphEdge[], center: string, max = Infinity) {
  const neighbors = adjacency(edges);
  const result = new Map<string, number>([[center, 0]]);
  let frontier = [center];
  for (let hop = 1; hop <= max && frontier.length; hop++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const other of neighbors.get(id) ?? []) {
        if (result.has(other)) continue;
        result.set(other, hop);
        next.push(other);
      }
    }
    frontier = next;
  }
  return result;
}
