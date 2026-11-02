"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  createForceLayout,
  fitBox,
  nodeRadius,
  placeLabels,
  type Box,
  type SimNode,
} from "@/features/knowledge/lib/force-layout";
import {
  graphKindLabels,
  neighborIds,
  type GraphEdge,
  type GraphKind,
  type GraphNode,
} from "@/features/knowledge/lib/graph";
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

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 8;

type Point = { x: number; y: number };
type Drag =
  | { type: "pan"; last: Point; moved: boolean }
  | { type: "node"; node: SimNode; offset: Point; moved: boolean };

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  focusId?: string;
  onFocus: (id?: string) => void;
  /** Smaller canvas for the local graph inside a note. */
  compact?: boolean;
  className?: string;
};

const shorten = (label: string) =>
  label.length > 28 ? `${label.slice(0, 27)}…` : label;

/**
 * SVG network after the Obsidian graph, on a live force simulation: drag a
 * node and its neighbors follow; wheel or pinch zooms around the pointer;
 * drag the background to pan; hover highlights links; click focuses and
 * double-click opens the record.
 *
 * The simulation moves nodes by writing SVG attributes directly (no React
 * render per frame); React renders only when focus, hover, view or the
 * settled positions change.
 */
export function GraphCanvas({
  nodes,
  edges,
  focusId,
  onFocus,
  compact = false,
  className,
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
  const [hoverId, setHoverId] = useState<string>();
  // Bumped when the simulation rests, so labels are placed on final positions.
  const [settled, setSettled] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const minW = compact ? 320 : 600;
  const minH = compact ? 180 : 400;
  // The layout is rebuilt when the graph changes (filters, another local
  // center); nodes that stay keep their position and the view is refitted.
  const [state, setState] = useState(() => {
    const layout = createForceLayout(nodes, edges);
    return { nodes, edges, layout, home: fitBox(layout.nodes, minW, minH) };
  });
  const [view, setView] = useState<Box>(state.home);
  if (state.nodes !== nodes || state.edges !== edges) {
    const previous = new Map(
      state.layout.nodes.map((node) => [node.id, { x: node.x, y: node.y }]),
    );
    const layout = createForceLayout(nodes, edges, previous);
    // Same records (e.g. a background sync): keep the user's view.
    const sameNodes =
      nodes.length === previous.size &&
      nodes.every((node) => previous.has(node.id));
    const home = sameNodes ? state.home : fitBox(layout.nodes, minW, minH);
    setState({ nodes, edges, layout, home });
    if (!sameNodes) setView(home);
  }
  const { layout, home } = state;

  useEffect(() => {
    const { simulation, nodes: simNodes, links } = layout;
    const paint = () => {
      for (const node of simNodes) {
        nodeEls.current
          .get(node.id)
          ?.setAttribute("transform", `translate(${node.x} ${node.y})`);
      }
      for (const link of links) {
        const line = edgeEls.current.get(
          `${link.edge.source}|${link.edge.target}`,
        );
        if (!line) continue;
        line.setAttribute("x1", String(link.source.x));
        line.setAttribute("y1", String(link.source.y));
        line.setAttribute("x2", String(link.target.x));
        line.setAttribute("y2", String(link.target.y));
      }
    };
    simulation.on("tick", paint).on("end", () => setSettled((n) => n + 1));
    return () => {
      simulation.stop().on("tick", null).on("end", null);
    };
  }, [layout]);

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

  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  const highlightId = focusId ?? hoverId;
  const highlighted = highlightId ? neighborIds(edges, highlightId) : undefined;
  const isDimmed = (id: string) =>
    highlighted !== undefined && id !== highlightId && !highlighted.has(id);

  // Portrait canvases (phones) fill the height and crop the sides.
  const portrait = size.width > 0 && size.width < size.height * 0.9;
  const unitsPerPx = size.width
    ? portrait
      ? Math.min(view.w / size.width, view.h / size.height)
      : Math.max(view.w / size.width, view.h / size.height)
    : view.w / 800;
  const fontSize = (compact ? 11 : 11.5) * unitsPerPx;
  const zoom = home.w / view.w;

  // Which labels to draw: focus and hover first, then their neighbors, then
  // the best-connected nodes; overlapping ones are dropped.
  const labels = useMemo(() => {
    void settled;
    const rank = (node: SimNode) =>
      node.id === focusId || node.id === hoverId
        ? 3
        : highlighted?.has(node.id)
          ? 2
          : !highlightId && (zoom >= 1.8 || node.degree >= 3)
            ? 1
            : 0;
    const candidates = layout.nodes
      .map((node) => ({ node, text: shorten(node.label), rank: rank(node) }))
      .filter((item) => item.rank > 0)
      .sort((a, b) => b.rank - a.rank || b.node.degree - a.node.degree);
    return placeLabels(candidates, fontSize);
    // `highlighted` follows highlightId; `settled` re-runs after movement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, focusId, hoverId, highlightId, zoom, fontSize, settled]);

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
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
    current.node.fx = null;
    current.node.fy = null;
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
      if (pinch.current && distance > 0) {
        zoomAt(distance / pinch.current, {
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2,
        });
      }
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
    if (node?.href) router.push(node.href);
  }

  const lineWidth = Math.min(unitsPerPx, 1.2);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-dot-grid",
        className,
      )}
    >
      <svg
        ref={svgRef}
        role="img"
        aria-label="Grafo de registros relacionados"
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        preserveAspectRatio={portrait ? "xMidYMid slice" : "xMidYMid meet"}
        className={cn(
          "w-full cursor-grab touch-none select-none active:cursor-grabbing",
          compact ? "h-64" : "h-[28rem] sm:h-[36rem]",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(event) => {
          if (event.key === "Escape") onFocus(undefined);
        }}
      >
        <defs>
          <filter id={glowId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <g>
          {layout.links.map((link) => {
            const key = `${link.edge.source}|${link.edge.target}`;
            const active =
              highlightId !== undefined &&
              (link.edge.source === highlightId ||
                link.edge.target === highlightId);
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
                className={cn(
                  "transition-opacity duration-150",
                  active
                    ? "stroke-primary opacity-90"
                    : "stroke-muted-foreground",
                  !active && (highlightId ? "opacity-10" : "opacity-40"),
                )}
                strokeWidth={(active ? 1.6 : 1) * lineWidth}
                strokeDasharray={
                  link.edge.relation === "tag"
                    ? `${3 * lineWidth} ${3 * lineWidth}`
                    : undefined
                }
              />
            );
          })}
        </g>
        <g>
          {layout.nodes.map((node) => {
            const radius = nodeRadius(node);
            const isFocus = node.id === focusId;
            const isHover = node.id === hoverId;
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
                aria-label={`${node.label} (${graphKindLabels[node.kind]})`}
                aria-pressed={isFocus}
                transform={`translate(${node.x} ${node.y})`}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse" && !drag.current)
                    setHoverId(node.id);
                }}
                onPointerLeave={() => setHoverId(undefined)}
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
                  kindColor[node.kind],
                  isDimmed(node.id) && "opacity-15",
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
                  className="node-dot fill-current stroke-background"
                  strokeWidth={1.5 * lineWidth}
                />
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
      <div className="absolute right-3 bottom-3 flex gap-1 rounded-lg border bg-card/90 p-1 shadow-sm backdrop-blur">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Aumentar zoom"
          onClick={() => zoomAt(1.25)}
        >
          <Plus />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Diminuir zoom"
          onClick={() => zoomAt(1 / 1.25)}
        >
          <Minus />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Ajustar à tela"
          onClick={() => {
            const box = fitBox(layout.nodes, minW, minH);
            setState((current) => ({ ...current, home: box }));
            setView(box);
          }}
        >
          <Maximize2 />
        </Button>
      </div>
    </div>
  );
}
