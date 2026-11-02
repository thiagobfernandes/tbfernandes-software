"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  graphKindLabels,
  neighborIds,
  type GraphEdge,
  type GraphKind,
  type Positioned,
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

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 6;
/**
 * Units of the viewBox per screen pixel. A portrait canvas (phones) fills the
 * height and crops the sides ("slice"), so the graph is not shrunk to a strip;
 * otherwise the whole viewBox fits ("meet").
 */
const fitScale = (w: number, h: number, width: number, height: number) =>
  width < height * 0.9
    ? Math.min(w / width, h / height)
    : Math.max(w / width, h / height);

const clampZoom = (zoom: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

type View = { zoom: number; x: number; y: number };
type Point = { x: number; y: number };
type Drag =
  | { type: "pan"; last: Point; moved: boolean }
  | { type: "node"; id: string; last: Point; moved: boolean };

type Props = {
  nodes: Positioned[];
  edges: GraphEdge[];
  focusId?: string;
  onFocus: (id?: string) => void;
  /** Smaller labels and controls for the local graph inside a note. */
  compact?: boolean;
  className?: string;
};

/**
 * SVG network after the Obsidian graph: wheel or pinch to zoom around the
 * pointer, drag the background to pan, drag a node to move it, hover to
 * highlight its links, click to focus and double-click to open the record.
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
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 });
  const [moved, setMoved] = useState<Map<string, Point>>(new Map());
  const [hoverId, setHoverId] = useState<string>();
  const drag = useRef<Drag>(undefined);
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ distance: number } | undefined>(undefined);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const lastClick = useRef<{ id: string; at: number }>(undefined);

  // A new layout (other filters or another local center) starts a fresh view.
  const [layout, setLayout] = useState(nodes);
  if (layout !== nodes) {
    setLayout(nodes);
    setView({ zoom: 1, x: 0, y: 0 });
    setMoved(new Map());
  }

  // Bounds come from the layout, not from dragged positions, so the view stays
  // still while the user moves a node around.
  const bounds = useMemo(() => {
    const pad = compact ? 40 : 60;
    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);
    const left = Math.min(...xs, 0) - pad;
    const top = Math.min(...ys, 0) - pad;
    // A minimum size keeps a small local graph from being blown up.
    const width = Math.max(
      Math.max(...xs, 0) - left + pad,
      compact ? 340 : 640,
    );
    const height = Math.max(
      Math.max(...ys, 0) - top + pad,
      compact ? 190 : 420,
    );
    const centerX = (Math.min(...xs, 0) + Math.max(...xs, 0)) / 2;
    const centerY = (Math.min(...ys, 0) + Math.max(...ys, 0)) / 2;
    return {
      minX: centerX - width / 2,
      minY: centerY - height / 2,
      width,
      height,
    };
  }, [nodes, compact]);

  const viewW = bounds.width / view.zoom;
  const viewH = bounds.height / view.zoom;
  const viewX = bounds.minX + (bounds.width - viewW) / 2 - view.x;
  const viewY = bounds.minY + (bounds.height - viewH) / 2 - view.y;

  /** Zooms by `factor` keeping the point under (clientX, clientY) still. */
  const zoomAt = useCallback(
    (factor: number, client?: Point) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setView((current) => {
        const w = bounds.width / current.zoom;
        const h = bounds.height / current.zoom;
        const x0 = bounds.minX + (bounds.width - w) / 2 - current.x;
        const y0 = bounds.minY + (bounds.height - h) / 2 - current.y;
        const scale = fitScale(w, h, rect.width, rect.height);
        const fx = client ? client.x - rect.left : rect.width / 2;
        const fy = client ? client.y - rect.top : rect.height / 2;
        const px = x0 - (rect.width * scale - w) / 2 + fx * scale;
        const py = y0 - (rect.height * scale - h) / 2 + fy * scale;
        const zoom = clampZoom(current.zoom * factor);
        const ratio = current.zoom / zoom;
        const nextX = px - (px - x0) * ratio;
        const nextY = py - (py - y0) * ratio;
        return {
          zoom,
          x: bounds.minX + (bounds.width - bounds.width / zoom) / 2 - nextX,
          y: bounds.minY + (bounds.height - bounds.height / zoom) / 2 - nextY,
        };
      });
    },
    [bounds],
  );

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

  // React registers wheel listeners as passive, so preventDefault needs this.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomAt(Math.exp(-event.deltaY * 0.0015), {
        x: event.clientX,
        y: event.clientY,
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const positions = new Map(
    nodes.map((node) => [node.id, moved.get(node.id) ?? node]),
  );
  const highlightId = focusId ?? hoverId;
  const highlighted = highlightId ? neighborIds(edges, highlightId) : undefined;
  const isDimmed = (id: string) =>
    highlighted !== undefined && id !== highlightId && !highlighted.has(id);

  function svgScale(svg: SVGSVGElement) {
    const rect = svg.getBoundingClientRect();
    return fitScale(viewW, viewH, rect.width, rect.height);
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current && distance > 0) {
        zoomAt(distance / pinch.current.distance, {
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2,
        });
      }
      pinch.current = { distance };
      return;
    }
    const current = drag.current;
    if (!current) return;
    const scale = svgScale(event.currentTarget);
    const dx = (event.clientX - current.last.x) * scale;
    const dy = (event.clientY - current.last.y) * scale;
    if (Math.abs(dx) + Math.abs(dy) > scale * 2) current.moved = true;
    current.last = { x: event.clientX, y: event.clientY };
    if (current.type === "pan") {
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    } else {
      const from = positions.get(current.id);
      if (!from) return;
      setMoved((map) =>
        new Map(map).set(current.id, { x: from.x + dx, y: from.y + dy }),
      );
    }
  }

  function onPointerUp(event: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = undefined;
    const current = drag.current;
    if (pointers.current.size > 0) return;
    drag.current = undefined;
    if (!current || current.moved) return;
    if (current.type === "pan") return onFocus(undefined);
    // Pointer capture sends clicks to the <svg>, so double-click is tracked here.
    const previous = lastClick.current;
    const now = event.timeStamp;
    if (previous?.id === current.id && now - previous.at < 350) {
      lastClick.current = undefined;
      return open(current.id);
    }
    lastClick.current = { id: current.id, at: now };
    if (current.id !== focusId) onFocus(current.id);
  }

  function open(id: string) {
    const node = nodes.find((item) => item.id === id);
    if (node?.href) router.push(node.href);
  }

  // Labels keep about the same size on screen at any zoom.
  const pxScale = size.width
    ? fitScale(viewW, viewH, size.width, size.height)
    : 1 / view.zoom;
  const labelSize = (compact ? 11 : 11.5) * pxScale;
  const portrait = size.width > 0 && size.width < size.height * 0.9;

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
        viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
        preserveAspectRatio={portrait ? "xMidYMid slice" : "xMidYMid meet"}
        className={cn(
          "w-full cursor-grab touch-none select-none active:cursor-grabbing",
          compact ? "h-64" : "h-[26rem] sm:h-[34rem]",
        )}
        onPointerDown={(event) => {
          pointers.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
          });
          event.currentTarget.setPointerCapture?.(event.pointerId);
          if (pointers.current.size > 1) {
            // A second finger turns the gesture into a pinch, never a click.
            if (drag.current) drag.current.moved = true;
            return;
          }
          const nodeId = (event.target as Element)
            .closest("[data-node-id]")
            ?.getAttribute("data-node-id");
          const last = { x: event.clientX, y: event.clientY };
          drag.current = nodeId
            ? { type: "node", id: nodeId, last, moved: false }
            : { type: "pan", last, moved: false };
        }}
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
          {edges.map((edge) => {
            const a = positions.get(edge.source)!;
            const b = positions.get(edge.target)!;
            const active =
              highlightId !== undefined &&
              (edge.source === highlightId || edge.target === highlightId);
            return (
              <line
                key={`${edge.source}-${edge.target}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={cn(
                  "transition-opacity",
                  active
                    ? "stroke-primary opacity-90"
                    : "stroke-muted-foreground",
                  !active && (highlightId ? "opacity-10" : "opacity-35"),
                )}
                strokeWidth={(active ? 1.6 : 1) * Math.min(pxScale, 1)}
                strokeDasharray={edge.relation === "tag" ? "3 3" : undefined}
              />
            );
          })}
        </g>
        <g>
          {nodes.map((node) => {
            const at = positions.get(node.id)!;
            const radius =
              (node.kind === "tag" ? 3 : 4) + Math.min(node.degree, 10) * 1.1;
            const isFocus = node.id === focusId;
            const isHover = node.id === hoverId;
            const isNear = highlighted?.has(node.id) ?? false;
            const showLabel =
              isFocus ||
              isHover ||
              isNear ||
              (!highlightId && (view.zoom >= 1.6 || node.degree >= 3));
            return (
              <g
                key={node.id}
                data-node-id={node.id}
                role="button"
                tabIndex={0}
                aria-label={`${node.label} (${graphKindLabels[node.kind]})`}
                aria-pressed={isFocus}
                transform={`translate(${at.x} ${at.y})`}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setHoverId(node.id);
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
                  "cursor-pointer transition-opacity outline-none [&:focus-visible>.node-dot]:stroke-ring [&:focus-visible>.node-dot]:stroke-[3]",
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
                  strokeWidth={1.5}
                />
                {showLabel && (
                  <text
                    y={radius + labelSize + 2}
                    textAnchor="middle"
                    style={{
                      fontSize: labelSize,
                      strokeWidth: labelSize / 3.5,
                    }}
                    // The background-colored outline keeps crossing labels and
                    // edges readable.
                    className={cn(
                      "pointer-events-none fill-foreground stroke-background [paint-order:stroke]",
                      (isFocus || isHover) && "font-semibold",
                    )}
                  >
                    {node.label.length > 28
                      ? `${node.label.slice(0, 27)}…`
                      : node.label}
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
            setView({ zoom: 1, x: 0, y: 0 });
            setMoved(new Map());
          }}
        >
          <Maximize2 />
        </Button>
      </div>
    </div>
  );
}
