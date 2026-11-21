"use client";

import {
  useEffect,
  useSyncExternalStore,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  createForceLayout,
  fitBox,
  nodeRadius,
  placeLabels,
  type Box,
  type SimNode,
} from "@/features/knowledge/lib/force-layout";
import {
  graphKindSingular,
  type GraphEdge,
  type GraphKind,
  type GraphNode,
} from "@/features/knowledge/lib/graph";
import { adjacency } from "@/features/knowledge/lib/graph-algorithms";
import {
  defaultGraphSettings,
  forcesOf,
  type GraphSettings,
} from "@/features/knowledge/lib/graph-settings";
import { pairKey } from "@/features/knowledge/lib/graph-views";
import type {
  LayoutRequest,
  LayoutResponse,
} from "@/features/knowledge/lib/layout.worker";
import { cn } from "@/lib/utils";

/** Node colors per type; fill uses currentColor so classes drive both themes. */
export const kindColor: Record<GraphKind, string> = {
  goal: "text-primary",
  company: "text-sky-400",
  project: "text-violet-400",
  task: "text-muted-foreground",
  note: "text-amber-400",
  snippet: "text-rose-400",
  method: "text-indigo-300",
  study: "text-lime-400",
  skill: "text-orange-400",
  contact: "text-emerald-400",
  tag: "text-fuchsia-400",
};

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 8;
/** How far, in graph units, a node drifts around its resting place at full animation. */
const DRIFT = 5;
/** Above this many nodes the warm-up runs in a Web Worker. */
const WORKER_THRESHOLD = 300;

/** Stable phase in radians for a node id, so each node drifts on its own. */
function seed(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((hash >>> 0) % 6283) / 1000;
}

type Point = { x: number; y: number };
type Drag =
  | { type: "pan"; last: Point; moved: boolean }
  | { type: "node"; node: SimNode; offset: Point; moved: boolean };

export type GraphCanvasHandle = {
  fit: () => void;
  centerOn: (id: string) => void;
  zoom: (factor: number) => void;
  /** Current simulated position of a node (to pin it where it is). */
  positionOf: (id: string) => Point | undefined;
};

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  focusId?: string;
  onFocus: (id?: string) => void;
  /** Smaller canvas for the local graph inside a note. */
  compact?: boolean;
  /** Fill the parent's height (the explorer page). */
  fill?: boolean;
  className?: string;
  settings?: GraphSettings;
  groups?: Map<string, string>;
  groupLabels?: Map<string, string>;
  /** Highlighted path, in order. */
  path?: string[];
  pins?: Map<string, Point>;
  onPin?: (id: string, point: Point) => void;
  /** Short description shown in the hover tooltip. */
  describe?: (node: GraphNode) => string | undefined;
  /** Context menu items for a node (right-click or long-press). */
  renderNodeMenu?: (node: GraphNode) => React.ReactNode;
  onOpen?: (node: GraphNode) => void;
  ref?: React.Ref<GraphCanvasHandle>;
};

const shorten = (label: string) =>
  label.length > 28 ? `${label.slice(0, 27)}…` : label;

/**
 * SVG network after the Obsidian graph, on a live force simulation: drag a
 * node and its neighbors follow; wheel or pinch zooms around the pointer;
 * drag the background to pan; hover shows a summary; click selects (direct
 * links highlighted, two-hop links softer, the rest dimmed); double-click
 * opens the record.
 *
 * The simulation moves nodes by writing SVG attributes directly (no React
 * render per frame); React renders only when selection, hover, view or the
 * settled positions change.
 */
const noSubscribe = () => () => {};

/**
 * The simulation's coordinates are not worth server-rendering (and floats
 * drift between runtimes), so the canvas mounts on the client only.
 */
export function GraphCanvas(props: Props) {
  const client = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  if (!client) {
    return (
      <div
        aria-hidden
        className={cn(
          "bg-dot-grid",
          props.fill
            ? "h-full"
            : props.compact
              ? "h-64 rounded-2xl border"
              : "h-[28rem] rounded-2xl border sm:h-[36rem]",
          props.className,
        )}
      />
    );
  }
  return <GraphCanvasInner {...props} />;
}

function GraphCanvasInner({
  nodes,
  edges,
  focusId,
  onFocus,
  compact = false,
  fill = false,
  className,
  settings = defaultGraphSettings,
  groups,
  groupLabels,
  path,
  pins,
  onPin,
  describe,
  renderNodeMenu,
  onOpen,
  ref,
}: Props) {
  const router = useRouter();
  const glowId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeEls = useRef(new Map<string, SVGGElement>());
  const edgeEls = useRef(new Map<string, SVGLineElement>());
  const drag = useRef<Drag>(undefined);
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<number>(undefined);
  const lastClick = useRef<{ id: string; at: number }>(undefined);
  const [hover, setHover] = useState<{ id: string; x: number; y: number }>();
  const [menuNodeId, setMenuNodeId] = useState<string>();
  // Bumped when the simulation rests, so labels are placed on final positions.
  const [settled, setSettled] = useState(0);
  // The layout object the worker finished warming (big graphs only).
  const [warmed, setWarmed] = useState<object>();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const forces = useMemo(
    () => forcesOf(settings),
    // Rebuild the layout only when a force value changes, not the object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      settings.repulsion,
      settings.linkDistance,
      settings.linkStrength,
      settings.gravity,
      settings.nodeSize,
    ],
  );
  const scale = settings.nodeSize;

  const minW = compact ? 320 : 600;
  const minH = compact ? 180 : 400;
  // The layout is rebuilt when the graph, the forces or the grouping change;
  // nodes that stay keep their position and the view is refitted.
  const build = (previous?: Map<string, Point>) => {
    const big = nodes.length > WORKER_THRESHOLD;
    const layout = createForceLayout(nodes, edges, previous, {
      forces,
      groups,
      pins,
      warm: big ? 0 : undefined,
    });
    return {
      nodes,
      edges,
      forces,
      groups,
      layout,
      big,
      home: fitBox(layout.nodes, minW, minH, scale),
    };
  };
  const [state, setState] = useState(() => build());
  const [view, setView] = useState<Box>(state.home);
  if (
    state.nodes !== nodes ||
    state.edges !== edges ||
    state.forces !== forces ||
    state.groups !== groups
  ) {
    const previous = new Map(
      state.layout.nodes.map((node) => [node.id, { x: node.x, y: node.y }]),
    );
    const next = build(previous);
    // Same records with the same forces (e.g. a background sync): keep the view.
    const sameNodes =
      state.forces === forces &&
      state.groups === groups &&
      nodes.length === previous.size &&
      nodes.every((node) => previous.has(node.id));
    setState(sameNodes ? { ...next, home: state.home } : next);
    if (!sameNodes) setView(next.home);
  }
  const { layout, home } = state;
  const computing = state.big && warmed !== layout;
  // Effects and handlers move simulation nodes through this ref; the layout
  // object itself is state and is never reassigned.
  const layoutRef = useRef(layout);
  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  // Big graphs: warm the layout in a worker, then start from its positions.
  useEffect(() => {
    if (!state.big) return;
    const worker = new Worker(
      new URL("../lib/layout.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = (event: MessageEvent<LayoutResponse>) => {
      const positions = new Map(event.data.positions);
      const current = layoutRef.current;
      for (const node of current.nodes) {
        const at = positions.get(node.id);
        if (at) Object.assign(node, at);
      }
      const box = fitBox(current.nodes, minW, minH, scale);
      setState((value) => ({ ...value, home: box }));
      setView(box);
      setSettled((n) => n + 1);
      setWarmed(current);
      worker.terminate();
    };
    const request: LayoutRequest = {
      id: 1,
      nodes: state.nodes,
      edges: state.edges,
      previous: layout.nodes.map((node) => [node.id, { x: node.x, y: node.y }]),
      groups: state.groups ? [...state.groups] : undefined,
      pins: pins ? [...pins] : undefined,
      forces,
    };
    worker.postMessage(request);
    return () => worker.terminate();
    // The request is built from the layout it belongs to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  useEffect(() => {
    const { simulation, nodes: simNodes, links } = layout;
    const svg = svgRef.current;
    // Idle drift: every node bobs gently on its own phase and pace so the
    // graph never reads as a still picture. It is drawn on top of the
    // simulated position only; the simulation and saved layout never see it.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const amplitude = DRIFT * settings.animation;
    const phases = new Map(simNodes.map((node) => [node.id, seed(node.id)]));
    let seconds = 0;
    let onScreen = true;
    let frame = 0;

    const drift = (node: SimNode): Point => {
      const current = drag.current;
      if (
        amplitude === 0 ||
        reducedMotion.matches ||
        node.fx != null ||
        (current?.type === "node" && current.node === node)
      ) {
        return { x: 0, y: 0 };
      }
      const phase = phases.get(node.id) ?? 0;
      const pace = 0.8 + (phase % 1) * 0.5;
      return {
        x: Math.sin(seconds * 0.55 * pace + phase) * amplitude,
        y: Math.cos(seconds * 0.42 * pace + phase * 1.7) * amplitude,
      };
    };

    const paint = () => {
      const offsets = new Map<string, Point>();
      for (const node of simNodes) {
        const d = drift(node);
        offsets.set(node.id, d);
        nodeEls.current
          .get(node.id)
          ?.setAttribute(
            "transform",
            `translate(${node.x + d.x} ${node.y + d.y})`,
          );
      }
      for (const link of links) {
        const line = edgeEls.current.get(
          pairKey(link.edge.source, link.edge.target),
        );
        if (!line) continue;
        const a = offsets.get(link.source.id) ?? { x: 0, y: 0 };
        const b = offsets.get(link.target.id) ?? { x: 0, y: 0 };
        line.setAttribute("x1", String(link.source.x + a.x));
        line.setAttribute("y1", String(link.source.y + a.y));
        line.setAttribute("x2", String(link.target.x + b.x));
        line.setAttribute("y2", String(link.target.y + b.y));
      }
    };

    const loop = (now: number) => {
      seconds = now / 1000;
      if (onScreen && !reducedMotion.matches && amplitude > 0) paint();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });
    if (svg) visibility.observe(svg);

    simulation.on("tick", paint).on("end", () => setSettled((n) => n + 1));
    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      simulation.stop().on("tick", null).on("end", null);
    };
  }, [layout, settings.animation]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  /** Screen point to graph coordinates, honoring preserveAspectRatio. */
  function toGraph(client: Point): Point {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return client;
    const point = new DOMPoint(client.x, client.y).matrixTransform(
      matrix.inverse(),
    );
    return { x: point.x, y: point.y };
  }

  /** Zooms by `factor` keeping the graph point under `client` still. */
  function zoomAt(factor: number, client?: Point) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const anchor = toGraph(
      client ?? {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      },
    );
    setView((v) => {
      const zoom = home.w / v.w;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));
      const ratio = zoom / next;
      return {
        x: anchor.x - (anchor.x - v.x) * ratio,
        y: anchor.y - (anchor.y - v.y) * ratio,
        w: v.w * ratio,
        h: v.h * ratio,
      };
    });
  }

  function fit() {
    const box = fitBox(layout.nodes, minW, minH, scale);
    setState((current) => ({ ...current, home: box }));
    setView(box);
  }

  function centerOn(id: string) {
    const node = layout.nodes.find((n) => n.id === id);
    if (!node) return;
    setView((v) => {
      // Zoom in to at least 1.6× so the neighborhood reads.
      const ratio = Math.min(1, home.w / 1.6 / v.w);
      const w = v.w * ratio;
      const h = v.h * ratio;
      return { x: node.x - w / 2, y: node.y - h / 2, w, h };
    });
  }

  useImperativeHandle(ref, () => ({
    fit,
    centerOn,
    zoom: (factor) => zoomAt(factor),
    positionOf: (id) => {
      const node = layout.nodes.find((n) => n.id === id);
      return node ? { x: node.x, y: node.y } : undefined;
    },
  }));

  // Pinning or unpinning applies to the running simulation right away.
  useEffect(() => {
    const current = layoutRef.current;
    const dragged =
      drag.current?.type === "node" ? drag.current.node : undefined;
    applyPins(current.nodes, pins, dragged);
    current.simulation.alpha(0.15).restart();
  }, [pins, layout]);

  // React registers wheel listeners as passive, so preventDefault needs this.
  const wheel = useRef(zoomAt);
  useEffect(() => {
    wheel.current = zoomAt;
  });
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      wheel.current(Math.exp(-event.deltaY * 0.0015), {
        x: event.clientX,
        y: event.clientY,
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const byId = useMemo(
    () => new Map(layout.nodes.map((node) => [node.id, node])),
    [layout],
  );
  const neighbors = useMemo(() => adjacency(edges), [edges]);
  const highlightId = focusId ?? hover?.id;
  const direct = useMemo(
    () =>
      highlightId
        ? (neighbors.get(highlightId) ?? new Set<string>())
        : undefined,
    [highlightId, neighbors],
  );
  // Two hops away: indirect relations, shown softer than direct ones.
  const indirect = useMemo(() => {
    if (!highlightId || !direct) return undefined;
    const set = new Set<string>();
    for (const id of direct)
      for (const other of neighbors.get(id) ?? [])
        if (other !== highlightId && !direct.has(other)) set.add(other);
    return set;
  }, [highlightId, direct, neighbors]);
  const pathSet = useMemo(() => new Set(path ?? []), [path]);
  const pathEdges = useMemo(() => {
    const set = new Set<string>();
    path?.forEach((id, i) => i > 0 && set.add(pairKey(path[i - 1], id)));
    return set;
  }, [path]);
  const nodeTone = (id: string) => {
    if (path?.length) return pathSet.has(id) ? "full" : "dim";
    if (!highlightId) return "full";
    if (id === highlightId || direct?.has(id)) return "full";
    if (indirect?.has(id)) return "soft";
    return "dim";
  };

  // Portrait canvases (phones) fill the height and crop the sides.
  const portrait = size.width > 0 && size.width < size.height * 0.9;
  const unitsPerPx = size.width
    ? portrait
      ? Math.min(view.w / size.width, view.h / size.height)
      : Math.max(view.w / size.width, view.h / size.height)
    : view.w / 800;
  const fontSize = (compact ? 11 : settings.labelSize) * unitsPerPx;
  const zoom = home.w / view.w;

  // Which labels to draw: selection and hover first, then their neighbors,
  // then hubs; the bar for "hub" drops as you zoom in (level of detail).
  const labels = useMemo(() => {
    void settled;
    if (settings.labels === "none") {
      return new Set([focusId, hover?.id].filter(Boolean) as string[]);
    }
    const hubBar = zoom < 0.8 ? 5 : zoom < 1.6 ? 3 : zoom < 2.6 ? 1 : 0;
    const rank = (node: SimNode) =>
      node.id === focusId || node.id === hover?.id || pathSet.has(node.id)
        ? 3
        : direct?.has(node.id)
          ? 2
          : settings.labels === "all" || (!highlightId && node.degree >= hubBar)
            ? 1
            : 0;
    const candidates = layout.nodes
      .map((node) => ({ node, text: shorten(node.label), rank: rank(node) }))
      .filter((item) => item.rank > 0)
      .sort((a, b) => b.rank - a.rank || b.node.degree - a.node.degree);
    if (settings.labels === "all")
      return new Set(candidates.map((c) => c.node.id));
    return placeLabels(candidates, fontSize, scale);
    // `direct` follows highlightId; `settled` re-runs after movement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    layout,
    focusId,
    hover?.id,
    highlightId,
    zoom,
    fontSize,
    settled,
    settings.labels,
    pathSet,
    scale,
  ]);

  // Group labels sit at each group's centroid once the layout rests.
  const groupMarks = useMemo(() => {
    void settled;
    if (!groups || !groupLabels) return [];
    const sums = new Map<string, { x: number; top: number; n: number }>();
    for (const node of layout.nodes) {
      const key = groups.get(node.id);
      if (!key) continue;
      const sum = sums.get(key) ?? { x: 0, top: Infinity, n: 0 };
      sum.x += node.x;
      sum.top = Math.min(sum.top, node.y - nodeRadius(node, scale));
      sum.n += 1;
      sums.set(key, sum);
    }
    // The label sits just above the group, so it never covers its nodes.
    return [...sums]
      .filter(([, sum]) => sum.n >= 2)
      .map(([key, sum]) => ({
        key,
        label: groupLabels.get(key) ?? key,
        x: sum.x / sum.n,
        y: sum.top - fontSize * 1.2,
      }));
    // fontSize follows the zoom, so labels keep their distance on screen.
  }, [layout, groups, groupLabels, settled, fontSize, scale]);

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.button === 2) return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (pointers.current.size > 1) {
      // A second finger turns the gesture into a pinch, never a click.
      if (drag.current) drag.current.moved = true;
      releaseNode();
      return;
    }
    const nodeId = (event.target as Element)
      .closest("[data-node-id]")
      ?.getAttribute("data-node-id");
    const node = nodeId ? byId.get(nodeId) : undefined;
    if (node) {
      const at = toGraph({ x: event.clientX, y: event.clientY });
      drag.current = {
        type: "node",
        node,
        offset: { x: node.x - at.x, y: node.y - at.y },
        moved: false,
      };
    } else {
      drag.current = {
        type: "pan",
        last: { x: event.clientX, y: event.clientY },
        moved: false,
      };
    }
  }

  function releaseNode() {
    const current = drag.current;
    if (current?.type !== "node") return;
    const pinned = pins?.has(current.node.id);
    if (pinned && current.moved) {
      // A pinned node stays where it was dropped.
      onPin?.(current.node.id, { x: current.node.x, y: current.node.y });
    } else if (!pinned) {
      current.node.fx = null;
      current.node.fy = null;
    }
    layout.simulation.alphaTarget(0);
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    const previous = pointers.current.get(event.pointerId)!;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current && distance > 0)
        zoomAt(distance / pinch.current, {
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2,
        });
      pinch.current = distance;
      return;
    }
    const current = drag.current;
    if (!current) return;
    const screenMove =
      Math.abs(event.clientX - previous.x) +
      Math.abs(event.clientY - previous.y);
    if (current.type === "pan") {
      if (screenMove > 0) current.moved = true;
      const dx = (event.clientX - current.last.x) * unitsPerPx;
      const dy = (event.clientY - current.last.y) * unitsPerPx;
      current.last = { x: event.clientX, y: event.clientY };
      setView((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
      return;
    }
    if (!current.moved && screenMove < 3) return;
    if (!current.moved) {
      current.moved = true;
      setHover(undefined);
      layout.simulation.alphaTarget(0.3).restart();
    }
    const at = toGraph({ x: event.clientX, y: event.clientY });
    current.node.fx = at.x + current.offset.x;
    current.node.fy = at.y + current.offset.y;
  }

  function onPointerUp(event: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = undefined;
    if (pointers.current.size > 0) return;
    const current = drag.current;
    releaseNode();
    drag.current = undefined;
    if (!current || current.moved) return;
    if (current.type === "pan") return onFocus(undefined);
    // Pointer capture sends clicks to the <svg>, so double-click is tracked here.
    const id = current.node.id;
    const previous = lastClick.current;
    if (previous?.id === id && event.timeStamp - previous.at < 350) {
      lastClick.current = undefined;
      return open(id);
    }
    lastClick.current = { id, at: event.timeStamp };
    if (id !== focusId) onFocus(id);
  }

  function open(id: string) {
    const node = byId.get(id);
    if (!node) return;
    if (onOpen) return onOpen(node);
    if (node.href) router.push(node.href);
  }

  const lineWidth = Math.min(unitsPerPx, 1.2) * settings.edgeWidth;
  const hoverNode = hover ? byId.get(hover.id) : undefined;
  const menuNode = menuNodeId ? byId.get(menuNodeId) : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-dot-grid",
        !fill && "rounded-2xl border",
        fill && "h-full",
        className,
      )}
    >
      <ContextMenu onOpenChange={(open) => !open && setMenuNodeId(undefined)}>
        <ContextMenuTrigger asChild disabled={!renderNodeMenu}>
          <svg
            ref={svgRef}
            role="img"
            aria-label="Grafo de registros relacionados"
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            preserveAspectRatio={portrait ? "xMidYMid slice" : "xMidYMid meet"}
            className={cn(
              "block w-full cursor-grab touch-none select-none active:cursor-grabbing",
              fill ? "h-full" : compact ? "h-64" : "h-[28rem] sm:h-[36rem]",
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onContextMenu={(event) => {
              const id = (event.target as Element)
                .closest("[data-node-id]")
                ?.getAttribute("data-node-id");
              if (!id) {
                event.preventDefault();
                return;
              }
              setMenuNodeId(id);
              setHover(undefined);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") onFocus(undefined);
            }}
          >
            <defs>
              <filter
                id={glowId}
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
              >
                <feGaussianBlur stdDeviation="5" />
              </filter>
            </defs>
            {groupMarks.length > 0 && (
              <g aria-hidden className="pointer-events-none">
                {groupMarks.map((mark) => (
                  <text
                    key={mark.key}
                    x={mark.x}
                    y={mark.y}
                    textAnchor="middle"
                    style={{ fontSize: fontSize * 1.1 }}
                    className="fill-muted-foreground/70 font-medium"
                  >
                    {mark.label}
                  </text>
                ))}
              </g>
            )}
            <g>
              {layout.links.map((link) => {
                const key = pairKey(link.edge.source, link.edge.target);
                const onPath = pathEdges.has(key);
                const touches =
                  highlightId !== undefined &&
                  (link.edge.source === highlightId ||
                    link.edge.target === highlightId);
                const secondHop =
                  !touches &&
                  highlightId !== undefined &&
                  (direct?.has(link.edge.source) ||
                    direct?.has(link.edge.target)) &&
                  (indirect?.has(link.edge.source) ||
                    indirect?.has(link.edge.target));
                const opacity = onPath
                  ? 1
                  : path?.length
                    ? 0.08
                    : touches
                      ? 0.9
                      : secondHop
                        ? Math.max(0.25, settings.edgeOpacity * 0.8)
                        : highlightId
                          ? 0.06
                          : settings.edgeOpacity;
                return (
                  <line
                    key={key}
                    ref={(el) => {
                      if (el) edgeEls.current.set(key, el);
                      else edgeEls.current.delete(key);
                    }}
                    x1={link.source.x}
                    y1={link.source.y}
                    x2={link.target.x}
                    y2={link.target.y}
                    opacity={opacity}
                    className={cn(
                      "transition-opacity duration-150",
                      onPath || touches
                        ? "stroke-primary"
                        : "stroke-muted-foreground",
                    )}
                    strokeWidth={(onPath ? 2.4 : touches ? 1.6 : 1) * lineWidth}
                    strokeDasharray={
                      link.edge.relation === "tag" || secondHop
                        ? `${3 * lineWidth} ${3 * lineWidth}`
                        : undefined
                    }
                  />
                );
              })}
            </g>
            <g>
              {layout.nodes.map((node) => {
                const radius = nodeRadius(node, scale);
                const isFocus = node.id === focusId;
                const isHover = node.id === hover?.id;
                const tone = nodeTone(node.id);
                return (
                  <g
                    key={node.id}
                    ref={(el) => {
                      if (el) nodeEls.current.set(node.id, el);
                      else nodeEls.current.delete(node.id);
                    }}
                    data-node-id={node.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${node.label} (${node.cluster ? "Cluster" : graphKindSingular[node.kind]})`}
                    aria-pressed={isFocus}
                    transform={`translate(${node.x} ${node.y})`}
                    onPointerEnter={(event) => {
                      if (event.pointerType === "mouse" && !drag.current)
                        setHover({
                          id: node.id,
                          x: event.clientX,
                          y: event.clientY,
                        });
                    }}
                    onPointerLeave={() => setHover(undefined)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        if (isFocus) open(node.id);
                        else onFocus(node.id);
                      } else if (event.key === " ") {
                        event.preventDefault();
                        onFocus(isFocus ? undefined : node.id);
                      }
                    }}
                    className={cn(
                      "cursor-pointer transition-opacity duration-150 outline-none [&:focus-visible>.node-dot]:stroke-ring [&:focus-visible>.node-dot]:stroke-[3]",
                      node.cluster
                        ? "text-muted-foreground"
                        : kindColor[node.kind],
                      tone === "dim" && "opacity-15",
                      tone === "soft" && "opacity-55",
                    )}
                  >
                    {(isFocus || isHover) && (
                      <circle
                        r={radius + 7}
                        filter={`url(#${glowId})`}
                        className="fill-current opacity-60"
                      />
                    )}
                    <circle
                      r={radius}
                      className={cn(
                        "node-dot fill-current stroke-background",
                        node.cluster && "fill-muted stroke-muted-foreground",
                      )}
                      strokeWidth={1.5 * Math.min(unitsPerPx, 1.2)}
                      strokeDasharray={
                        node.cluster
                          ? `${2 * unitsPerPx} ${2 * unitsPerPx}`
                          : undefined
                      }
                    />
                    {pins?.has(node.id) && (
                      <circle
                        r={radius + 3 * Math.min(unitsPerPx, 1.2)}
                        className="fill-none stroke-current"
                        strokeWidth={Math.min(unitsPerPx, 1.2)}
                        strokeDasharray={`${1.5 * unitsPerPx} ${1.5 * unitsPerPx}`}
                      />
                    )}
                    {labels.has(node.id) && (
                      <text
                        y={radius + fontSize + 2 * unitsPerPx}
                        textAnchor="middle"
                        style={{ fontSize, strokeWidth: fontSize / 3.5 }}
                        // The background-colored outline keeps crossing labels
                        // and edges readable.
                        className={cn(
                          "pointer-events-none fill-foreground stroke-background [paint-order:stroke]",
                          (isFocus || isHover) && "font-semibold",
                        )}
                      >
                        {shorten(node.label)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </ContextMenuTrigger>
        {renderNodeMenu && menuNode && (
          <ContextMenuContent className="w-60">
            {renderNodeMenu(menuNode)}
          </ContextMenuContent>
        )}
      </ContextMenu>

      {hoverNode && hover && (
        <HoverCard
          node={hoverNode}
          degree={hoverNode.degree}
          description={describe?.(hoverNode)}
          x={hover.x}
          y={hover.y}
          width={size.width}
          height={size.height}
        />
      )}

      {computing && (
        <p className="absolute inset-x-0 top-3 mx-auto w-fit rounded-md border bg-popover px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          Calculando o layout de {nodes.length} nós…
        </p>
      )}

      <div
        className={cn(
          "absolute right-3 bottom-3 flex gap-1 rounded-lg border bg-popover p-1 shadow-sm",
          fill && "flex-col",
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Aumentar zoom"
          title="Aumentar zoom"
          onClick={() => zoomAt(1.25)}
        >
          <Plus />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Diminuir zoom"
          title="Diminuir zoom"
          onClick={() => zoomAt(1 / 1.25)}
        >
          <Minus />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Ajustar à tela"
          title="Ajustar à tela"
          onClick={fit}
        >
          <Maximize2 />
        </Button>
      </div>
    </div>
  );
}

/** Fixes pinned nodes (fx/fy) and frees the rest, except the one being dragged. */
function applyPins(
  nodes: SimNode[],
  pins: Map<string, Point> | undefined,
  dragged?: SimNode,
) {
  for (const node of nodes) {
    const pin = pins?.get(node.id);
    if (pin) {
      node.fx = pin.x;
      node.fy = pin.y;
    } else if (node !== dragged) {
      node.fx = null;
      node.fy = null;
    }
  }
}

function HoverCard({
  node,
  degree,
  description,
  x,
  y,
  width,
  height,
}: {
  node: GraphNode;
  degree: number;
  description?: string;
  /** Pointer position relative to the canvas. */
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const left = Math.max(8, Math.min(x + 14, width - 260));
  const top = Math.max(8, Math.min(y + 14, height - 110));
  return (
    <div
      role="tooltip"
      style={{ left, top }}
      className="pointer-events-none absolute z-10 flex w-60 flex-col gap-1 rounded-md border bg-popover px-3 py-2 text-xs shadow-md"
    >
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full bg-current",
            node.cluster ? "text-muted-foreground" : kindColor[node.kind],
          )}
        />
        {node.cluster ? "Cluster recolhido" : graphKindSingular[node.kind]} ·{" "}
        {degree} {degree === 1 ? "conexão" : "conexões"}
      </span>
      <span className="font-medium text-foreground">{node.label}</span>
      {description && (
        <span className="line-clamp-2 text-muted-foreground">
          {description}
        </span>
      )}
    </div>
  );
}
