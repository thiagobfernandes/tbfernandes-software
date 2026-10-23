"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Minus, Plus, RotateCcw, Search, X } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import { RelationTree } from "@/components/shared/relation-tree";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildContextTree,
  buildGraph,
  graphKindLabels,
  graphKinds,
  layoutGraph,
  type GraphKind,
} from "@/features/knowledge/lib/graph";
import { useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

/** Node colors per type; fill uses currentColor so classes drive both themes. */
const kindColor: Record<GraphKind, string> = {
  goal: "text-primary",
  company: "text-sky-400",
  project: "text-violet-400",
  task: "text-muted-foreground",
  note: "text-amber-400",
  snippet: "text-rose-400",
  contact: "text-emerald-400",
};

export function KnowledgeGraphPage() {
  const data = useAppData();
  const graph = useMemo(() => buildGraph(data), [data]);
  const [hidden, setHidden] = useState<Set<GraphKind>>(new Set());
  const [focusId, setFocusId] = useState<string>();
  const [query, setQuery] = useState("");
  const [treeGoalId, setTreeGoalId] = useState<string>();

  // Layout runs only when the data or the visible types change, not on focus.
  const { visibleEdges, positioned } = useMemo(() => {
    const nodes = graph.nodes.filter((node) => !hidden.has(node.kind));
    const ids = new Set(nodes.map((node) => node.id));
    const edges = graph.edges.filter(
      (edge) => ids.has(edge.source) && ids.has(edge.target),
    );
    return { visibleEdges: edges, positioned: layoutGraph(nodes, edges) };
  }, [graph, hidden]);
  const byId = new Map(positioned.map((node) => [node.id, node]));

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? positioned.filter((node) => node.label.toLowerCase().includes(needle))
    : [];
  const focus = focusId ? byId.get(focusId) : undefined;
  const neighbors = new Set(
    focus
      ? visibleEdges.flatMap((edge) =>
          edge.source === focus.id
            ? [edge.target]
            : edge.target === focus.id
              ? [edge.source]
              : [],
        )
      : [],
  );

  const tree = buildContextTree(data, treeGoalId);
  const treeGoals = data.goals.filter((goal) =>
    data.projects.some((project) => project.goalId === goal.id),
  );

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Graph"
        description="Explore how goals, companies, projects, tasks, and knowledge relate. Lists and search stay the primary way to navigate."
        actions={<SampleDataBadge />}
      />

      <Tabs defaultValue="network">
        <TabsList>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="tree">Goal tree</TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label="Show types"
              className="flex flex-wrap gap-1.5"
            >
              {graphKinds.map((kind) => {
                const shown = !hidden.has(kind);
                const count = graph.nodes.filter(
                  (node) => node.kind === kind,
                ).length;
                return (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={shown}
                    onClick={() => {
                      const next = new Set(hidden);
                      if (shown) next.add(kind);
                      else next.delete(kind);
                      setHidden(next);
                      if (focus?.kind === kind) setFocusId(undefined);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      shown ? "bg-card" : "text-muted-foreground opacity-60",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-2 rounded-full bg-current",
                        kindColor[kind],
                      )}
                    />
                    {graphKindLabels[kind]}
                    <span className="text-muted-foreground tabular-nums">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="relative lg:w-72">
              <label className="relative block">
                <span className="sr-only">Find a node</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find and focus a node"
                  className="pl-9"
                />
              </label>
              {matches.length > 0 && (
                <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
                  {matches.slice(0, 8).map((node) => (
                    <li key={node.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setFocusId(node.id);
                          setQuery("");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "size-2 rounded-full bg-current",
                            kindColor[node.kind],
                          )}
                        />
                        <span className="truncate">{node.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <GraphCanvas
              nodes={positioned}
              edges={visibleEdges}
              focusId={focus?.id}
              neighbors={neighbors}
              onFocus={setFocusId}
            />
            <aside className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
              {focus ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        <span
                          aria-hidden
                          className={cn(
                            "size-2 rounded-full bg-current",
                            kindColor[focus.kind],
                          )}
                        />
                        {graphKindLabels[focus.kind].replace(/s$/, "")}
                      </span>
                      <h2 className="font-medium">{focus.label}</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Clear focus"
                      onClick={() => setFocusId(undefined)}
                    >
                      <X />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={focus.href}>
                      Open <ArrowUpRight />
                    </Link>
                  </Button>
                  <h3 className="mt-2 text-xs font-medium text-muted-foreground">
                    {neighbors.size} connection{neighbors.size === 1 ? "" : "s"}
                  </h3>
                  <ul className="flex flex-col gap-0.5">
                    {[...neighbors].map((id) => {
                      const node = byId.get(id)!;
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => setFocusId(id)}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent/60"
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "size-2 shrink-0 rounded-full bg-current",
                                kindColor[node.kind],
                              )}
                            />
                            <span className="truncate">{node.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {positioned.length} nodes · {visibleEdges.length} links
                  </p>
                  <p>
                    Click a node to focus it and see what it connects to. Drag
                    the background to pan; use the buttons to zoom.
                  </p>
                  <p>Bigger nodes have more connections.</p>
                </div>
              )}
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="tree" className="mt-4 flex flex-col gap-4">
          {treeGoals.length > 0 && (
            <Select value={tree?.id} onValueChange={setTreeGoalId}>
              <SelectTrigger className="w-full sm:w-80" aria-label="Goal">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {treeGoals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex min-h-[24rem] items-center rounded-2xl border bg-dot-grid px-4 py-10">
            {tree ? (
              <RelationTree root={tree} className="w-full" />
            ) : (
              <p className="w-full text-center text-sm text-muted-foreground">
                Link projects to a goal to see the tree.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

type CanvasProps = {
  nodes: ReturnType<typeof layoutGraph>;
  edges: { source: string; target: string }[];
  focusId?: string;
  neighbors: Set<string>;
  onFocus: (id?: string) => void;
};

function GraphCanvas({
  nodes,
  edges,
  focusId,
  neighbors,
  onFocus,
}: CanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; moved: boolean }>(undefined);
  const byId = new Map(nodes.map((node) => [node.id, node]));

  const pad = 60;
  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const minX = Math.min(...xs, 0) - pad;
  const minY = Math.min(...ys, 0) - pad;
  const width = Math.max(...xs, 0) - minX + pad;
  const height = Math.max(...ys, 0) - minY + pad;
  const viewW = width / zoom;
  const viewH = height / zoom;
  const viewX = minX + (width - viewW) / 2 - pan.x;
  const viewY = minY + (height - viewH) / 2 - pan.y;
  const dimmed = (id: string) =>
    focusId !== undefined && id !== focusId && !neighbors.has(id);

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-dot-grid">
      <svg
        role="img"
        aria-label="Graph of related records"
        viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
        className="h-[32rem] w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, y: event.clientY, moved: false };
          (event.target as Element).setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const scale = viewW / rect.width;
          const dx = (event.clientX - drag.current.x) * scale;
          const dy = (event.clientY - drag.current.y) * scale;
          if (Math.abs(dx) + Math.abs(dy) > 1) drag.current.moved = true;
          drag.current.x = event.clientX;
          drag.current.y = event.clientY;
          setPan((current) => ({ x: current.x + dx, y: current.y + dy }));
        }}
        onPointerUp={(event) => {
          const wasClick = drag.current && !drag.current.moved;
          drag.current = undefined;
          if (wasClick && event.target === event.currentTarget)
            onFocus(undefined);
        }}
      >
        <g>
          {edges.map((edge) => {
            const a = byId.get(edge.source)!;
            const b = byId.get(edge.target)!;
            const active =
              focusId && (edge.source === focusId || edge.target === focusId);
            return (
              <line
                key={`${edge.source}-${edge.target}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={cn(
                  "stroke-muted-foreground transition-opacity",
                  active
                    ? "stroke-primary opacity-90"
                    : focusId
                      ? "opacity-10"
                      : "opacity-30",
                )}
                strokeWidth={active ? 1.4 : 0.8}
              />
            );
          })}
        </g>
        <g>
          {nodes.map((node) => {
            const radius = 4 + Math.min(node.degree, 8) * 1.1;
            const isFocus = node.id === focusId;
            const showLabel =
              isFocus ||
              neighbors.has(node.id) ||
              (!focusId && node.degree >= 3);
            return (
              <g
                key={node.id}
                role="button"
                tabIndex={0}
                aria-label={`${node.label} (${node.kind})`}
                aria-pressed={isFocus}
                transform={`translate(${node.x} ${node.y})`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onFocus(isFocus ? undefined : node.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onFocus(isFocus ? undefined : node.id);
                  }
                }}
                className={cn(
                  "cursor-pointer transition-opacity outline-none [&:focus-visible>circle]:stroke-ring [&:focus-visible>circle]:stroke-[3]",
                  kindColor[node.kind],
                  dimmed(node.id) && "opacity-20",
                )}
              >
                {isFocus && (
                  <circle r={radius + 6} className="fill-current opacity-20" />
                )}
                <circle
                  r={radius}
                  className="fill-current stroke-background"
                  strokeWidth={1.5}
                />
                {showLabel && (
                  <text
                    y={radius + 11}
                    textAnchor="middle"
                    className={cn(
                      "pointer-events-none fill-foreground text-[9px]",
                      isFocus && "font-semibold",
                    )}
                  >
                    {node.label.length > 26
                      ? `${node.label.slice(0, 25)}…`
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
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(z * 1.25, 4))}
        >
          <Plus />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(z / 1.25, 0.5))}
        >
          <Minus />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Reset view"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          <RotateCcw />
        </Button>
      </div>
    </div>
  );
}
