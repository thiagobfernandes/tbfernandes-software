import type { GraphKind } from "@/features/knowledge/lib/graph";

export type GraphMode =
  "global" | "local" | "project" | "subject" | "clusters" | "path" | "tree";

export type GraphGrouping = "none" | "kind" | "project" | "community";
export type LabelMode = "auto" | "all" | "none";

/** Visual and physics settings of the explorer, persisted as `tbf:graph:settings`. */
export type GraphSettings = {
  repulsion: number;
  linkDistance: number;
  /** Multiplier on the link pull. */
  linkStrength: number;
  gravity: number;
  nodeSize: number;
  edgeWidth: number;
  edgeOpacity: number;
  labelSize: number;
  labels: LabelMode;
  depth: number;
  showIsolated: boolean;
  hiddenKinds: GraphKind[];
  grouping: GraphGrouping;
  /** 0 = still, 1 = full idle drift. */
  animation: number;
};

export const defaultGraphSettings: GraphSettings = {
  repulsion: 140,
  linkDistance: 45,
  linkStrength: 1,
  gravity: 0.07,
  nodeSize: 1,
  edgeWidth: 1,
  edgeOpacity: 0.4,
  labelSize: 11.5,
  labels: "auto",
  depth: 1,
  showIsolated: true,
  hiddenKinds: ["tag"],
  grouping: "none",
  animation: 0.6,
};

export const graphModeLabels: Record<GraphMode, string> = {
  global: "Global",
  local: "Local",
  project: "Por projeto",
  subject: "Por assunto",
  clusters: "Clusters",
  path: "Caminho",
  tree: "Árvore de metas",
};

export const groupingLabels: Record<GraphGrouping, string> = {
  none: "Nenhum",
  kind: "Tipo",
  project: "Projeto",
  community: "Comunidade",
};

/** Forces the layout reads; a change here re-runs the simulation. */
export type LayoutForces = Pick<
  GraphSettings,
  "repulsion" | "linkDistance" | "linkStrength" | "gravity" | "nodeSize"
>;

export const forcesOf = (settings: GraphSettings): LayoutForces => ({
  repulsion: settings.repulsion,
  linkDistance: settings.linkDistance,
  linkStrength: settings.linkStrength,
  gravity: settings.gravity,
  nodeSize: settings.nodeSize,
});
