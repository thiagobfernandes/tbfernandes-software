"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  CircleHelp,
  Crosshair,
  Expand,
  ExternalLink,
  Maximize,
  Minimize,
  Network,
  PanelRight,
  PanelRightDashed,
  Pin,
  PinOff,
  Route,
  Search,
  Shrink,
  Waypoints,
  X,
} from "lucide-react";

import {
  DisplayMenu,
  DisplaySection,
  DisplaySelect,
  DisplaySlider,
  DisplayToggle,
} from "@/components/shared/display-menu";
import { FilterGroup, FilterMenu } from "@/components/shared/filter-menu";
import { Kbd } from "@/components/shared/kbd";
import { RelationTree } from "@/components/shared/relation-tree";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { Button } from "@/components/ui/button";
import {
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResizablePanel } from "@/components/workspace/resizable-panel";
import { useFullscreen } from "@/components/workspace/use-fullscreen";
import { usePanel } from "@/components/workspace/use-panel";
import {
  overlayOpen,
  useImmersiveWhile,
} from "@/components/workspace/workspace-state";
import {
  ToolbarDivider,
  WorkspaceFrame,
  WorkspaceToolbar,
} from "@/components/workspace/workspace-toolbar";
import {
  GraphCanvas,
  kindColor,
  type GraphCanvasHandle,
} from "@/features/knowledge/components/graph-canvas";
import {
  buildContextTree,
  buildGraph,
  graphHref,
  graphKindLabels,
  graphKindSingular,
  graphKinds,
  graphNodeId,
  type GraphKind,
  type GraphNode,
} from "@/features/knowledge/lib/graph";
import { adjacency, degrees } from "@/features/knowledge/lib/graph-algorithms";
import { nodeDetails } from "@/features/knowledge/lib/graph-details";
import {
  defaultGraphSettings,
  graphModeLabels,
  groupingLabels,
  type GraphGrouping,
  type GraphMode,
  type GraphSettings,
  type LabelMode,
} from "@/features/knowledge/lib/graph-settings";
import { buildGraphView } from "@/features/knowledge/lib/graph-views";
import { usePreference, writePreference } from "@/lib/preferences";
import { useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

const INSPECTOR = { min: 280, max: 560, default: 340 } as const;
type Point = { x: number; y: number };
const noPins: Record<string, Point> = {};
const defaultMode: GraphMode = "global";

/**
 * Knowledge graph explorer: the canvas fills the workspace; a compact toolbar
 * switches modes (global, local, project, subject, clusters, path, goal tree)
 * and holds search, filters and visual settings; an inspector panel shows the
 * selected entity. Every relation comes from the real records (`buildGraph`).
 */
export function KnowledgeGraphPage() {
  const data = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const graph = useMemo(() => buildGraph(data), [data]);
  const [settings, setSettings] = usePreference(
    "graph:settings",
    defaultGraphSettings,
  );
  const [mode, setMode] = usePreference<GraphMode>("graph:mode", defaultMode);
  const [pinRecord, setPinRecord] = usePreference("graph:pins", noPins);
  const [projectId, setProjectId] = useState<string>();
  const [tagNodeId, setTagNodeId] = useState<string>();
  const [pathFrom, setPathFrom] = useState<string>();
  const [pathTo, setPathTo] = useState<string>();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [collapsedClusters, setCollapsedClusters] = useState<Set<number>>(
    new Set(),
  );
  const [treeGoalId, setTreeGoalId] = useState<string>();
  const [maximized, setMaximized] = useState(false);
  const inspector = usePanel("graph:inspector", {
    defaultWidth: INSPECTOR.default,
  });
  const fullscreen = useFullscreen();
  const canvas = useRef<GraphCanvasHandle>(null);
  const update = (patch: Partial<GraphSettings>) =>
    setSettings({ ...settings, ...patch });

  const focusId = searchParams.get("focus") ?? undefined;
  const byId = useMemo(
    () => new Map(graph.nodes.map((n) => [n.id, n])),
    [graph],
  );
  const focusNode = focusId ? byId.get(focusId) : undefined;
  const pins = useMemo(() => new Map(Object.entries(pinRecord)), [pinRecord]);
  const projects = data.projects;
  const tags = graph.nodes.filter((n) => n.kind === "tag");
  const effectiveProject =
    projectId ??
    projects.find((p) => p.status === "active")?.id ??
    projects[0]?.id;

  const view = useMemo(
    () =>
      buildGraphView(graph, {
        mode,
        settings,
        focusId,
        projectNodeId: effectiveProject
          ? graphNodeId("project", effectiveProject)
          : undefined,
        tagNodeId: tagNodeId ?? tags[0]?.id,
        pathFrom,
        pathTo,
        expanded,
        collapsedClusters,
      }),
    // `tags` follows `graph`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      graph,
      mode,
      settings,
      focusId,
      effectiveProject,
      tagNodeId,
      pathFrom,
      pathTo,
      expanded,
      collapsedClusters,
    ],
  );
  const viewDegrees = useMemo(() => degrees(view.edges), [view.edges]);
  const shown = new Set(view.nodes.map((n) => n.id));
  const selected = focusNode && shown.has(focusNode.id) ? focusNode : undefined;

  useImmersiveWhile(maximized);
  useEffect(() => {
    if (!maximized) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && !overlayOpen())
        setMaximized(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [maximized]);

  function setFocus(id?: string) {
    router.replace(id ? graphHref(id) : "/knowledge/graph", { scroll: false });
    if (id) inspector.setCollapsed(false);
  }

  function exploreLocal(id: string) {
    setMode("local");
    setExpanded(new Set());
    setFocus(id);
  }

  function expand(id: string) {
    if (mode === "global" || mode === "clusters") return exploreLocal(id);
    setExpanded((current) => new Set(current).add(id));
  }

  function togglePin(node: GraphNode) {
    const next = { ...pinRecord };
    if (next[node.id]) delete next[node.id];
    else {
      const at = canvas.current?.positionOf(node.id);
      if (!at) return;
      next[node.id] = at;
    }
    setPinRecord(next);
  }

  const nodeMenu = (node: GraphNode) =>
    node.cluster ? (
      <>
        <ContextMenuLabel>{node.label}</ContextMenuLabel>
        <ContextMenuItem
          onSelect={() =>
            setCollapsedClusters((current) => {
              const next = new Set(current);
              next.delete(node.cluster!.index);
              return next;
            })
          }
        >
          <Expand /> Expandir cluster
        </ContextMenuItem>
      </>
    ) : (
      <>
        <ContextMenuLabel>
          {graphKindSingular[node.kind]} · {node.label}
        </ContextMenuLabel>
        {node.href && (
          <ContextMenuItem onSelect={() => router.push(node.href)}>
            <ExternalLink /> Abrir registro
          </ContextMenuItem>
        )}
        <ContextMenuItem onSelect={() => exploreLocal(node.id)}>
          <Network /> Explorar grafo local
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => expand(node.id)}>
          <Waypoints /> Expandir conexões
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => canvas.current?.centerOn(node.id)}>
          <Crosshair /> Centralizar
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => togglePin(node)}>
          {pins.has(node.id) ? <PinOff /> : <Pin />}
          {pins.has(node.id) ? "Soltar posição" : "Fixar posição"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={() => {
            setPathFrom(node.id);
            setMode("path");
          }}
        >
          <Route /> Caminho a partir daqui
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            setPathTo(node.id);
            setMode("path");
          }}
        >
          <Route /> Caminho até aqui
        </ContextMenuItem>
      </>
    );

  const kindCounts = new Map<GraphKind, number>();
  graph.nodes.forEach((n) =>
    kindCounts.set(n.kind, (kindCounts.get(n.kind) ?? 0) + 1),
  );
  const tree = buildContextTree(data, treeGoalId);
  const treeGoals = data.goals.filter((goal) =>
    data.projects.some((p) => p.goalId === goal.id),
  );

  return (
    <WorkspaceFrame>
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceToolbar
          actions={
            <>
              <NodeSearch
                nodes={graph.nodes.filter(
                  (n) => !settings.hiddenKinds.includes(n.kind),
                )}
                onPick={(id) => {
                  setFocus(id);
                  if (!shown.has(id)) exploreLocal(id);
                  else setTimeout(() => canvas.current?.centerOn(id), 0);
                }}
              />
              <FilterMenu
                activeCount={
                  settings.hiddenKinds.length + (settings.showIsolated ? 0 : 1)
                }
                onClear={() => update({ hiddenKinds: [], showIsolated: true })}
              >
                <section className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                  Nós sem ligação
                  <DisplayToggleInline
                    checked={settings.showIsolated}
                    onChange={(showIsolated) => update({ showIsolated })}
                  />
                </section>
                <FilterGroup<GraphKind>
                  title="Tipos visíveis"
                  selected={graphKinds.filter(
                    (k) =>
                      !settings.hiddenKinds.includes(k) && kindCounts.has(k),
                  )}
                  onChange={(visible) =>
                    update({
                      hiddenKinds: graphKinds.filter(
                        (k) => !visible.includes(k),
                      ),
                    })
                  }
                  options={graphKinds
                    .filter((kind) => kindCounts.has(kind))
                    .map((kind) => ({
                      value: kind,
                      label: graphKindLabels[kind],
                      dotClass: cn("bg-current", kindColor[kind]),
                      count: kindCounts.get(kind),
                    }))}
                />
              </FilterMenu>
              <GraphSettingsMenu settings={settings} onChange={update} />
              <GraphHelp />
              <ToolbarDivider />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-pressed={maximized}
                aria-label={maximized ? "Restaurar" : "Maximizar"}
                title={maximized ? "Restaurar (Esc)" : "Maximizar"}
                onClick={() => setMaximized(!maximized)}
                className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
              >
                {maximized ? <Shrink /> : <Expand />}
              </Button>
              {fullscreen.supported && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-pressed={fullscreen.active}
                  aria-label={
                    fullscreen.active ? "Sair da tela cheia" : "Tela cheia"
                  }
                  title={
                    fullscreen.active ? "Sair da tela cheia" : "Tela cheia"
                  }
                  onClick={fullscreen.toggle}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {fullscreen.active ? <Minimize /> : <Maximize />}
                </Button>
              )}
              {mode !== "tree" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-pressed={!inspector.collapsed}
                  aria-label={
                    inspector.collapsed
                      ? "Mostrar painel de detalhes"
                      : "Recolher painel de detalhes"
                  }
                  title={
                    inspector.collapsed
                      ? "Mostrar detalhes"
                      : "Recolher detalhes"
                  }
                  onClick={inspector.toggle}
                  className="hidden text-muted-foreground hover:text-foreground md:inline-flex"
                >
                  {inspector.collapsed ? <PanelRightDashed /> : <PanelRight />}
                </Button>
              )}
            </>
          }
        >
          <h1 className="hidden text-sm font-semibold sm:block">Grafo</h1>
          <Select
            value={mode}
            onValueChange={(next) => {
              setMode(next as GraphMode);
              setExpanded(new Set());
            }}
          >
            <SelectTrigger
              size="sm"
              className="h-7 w-36 text-xs"
              aria-label="Modo de visualização"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(graphModeLabels) as GraphMode[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {graphModeLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {mode === "project" && (
            <Select value={effectiveProject} onValueChange={setProjectId}>
              <SelectTrigger
                size="sm"
                className="h-7 w-48 text-xs"
                aria-label="Projeto"
              >
                <SelectValue placeholder="Projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {mode === "subject" && (
            <Select
              value={tagNodeId ?? tags[0]?.id}
              onValueChange={setTagNodeId}
            >
              <SelectTrigger
                size="sm"
                className="h-7 w-44 text-xs"
                aria-label="Assunto"
              >
                <SelectValue placeholder="Assunto" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {mode === "path" && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <NodePicker
                label="Origem"
                value={pathFrom}
                nodes={graph.nodes}
                onChange={setPathFrom}
              />
              <span aria-hidden>→</span>
              <NodePicker
                label="Destino"
                value={pathTo}
                nodes={graph.nodes}
                onChange={setPathTo}
              />
            </div>
          )}
          {mode === "tree" && treeGoals.length > 0 && (
            <Select value={tree?.id} onValueChange={setTreeGoalId}>
              <SelectTrigger
                size="sm"
                className="h-7 w-56 text-xs"
                aria-label="Meta"
              >
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
        </WorkspaceToolbar>

        <div className="relative min-h-0 flex-1">
          {mode === "tree" ? (
            <div className="flex h-full items-center overflow-auto bg-dot-grid px-4 py-10">
              {tree ? (
                <RelationTree root={tree} className="w-full" />
              ) : (
                <p className="w-full text-center text-sm text-muted-foreground">
                  Vincule projetos a uma meta para ver a árvore.
                </p>
              )}
            </div>
          ) : view.nodes.length === 0 ? (
            <div className="flex h-full items-center justify-center bg-dot-grid p-6">
              <p className="max-w-sm text-center text-sm text-muted-foreground">
                {view.empty ?? "Nenhum nó com esses filtros."}
              </p>
            </div>
          ) : (
            <GraphCanvas
              ref={canvas}
              fill
              nodes={view.nodes}
              edges={view.edges}
              focusId={selected?.id}
              onFocus={setFocus}
              settings={settings}
              groups={view.groups}
              groupLabels={view.groupLabels}
              path={view.path}
              pins={pins}
              onPin={(id, point) => setPinRecord({ ...pinRecord, [id]: point })}
              describe={(node) =>
                node.cluster ? undefined : nodeDetails(data, node).description
              }
              renderNodeMenu={nodeMenu}
              onOpen={(node) => {
                if (node.cluster) {
                  setCollapsedClusters((current) => {
                    const next = new Set(current);
                    next.delete(node.cluster!.index);
                    return next;
                  });
                } else if (node.href) router.push(node.href);
              }}
            />
          )}
        </div>
      </div>

      {mode !== "tree" && (
        <ResizablePanel
          panel={inspector}
          side="right"
          min={INSPECTOR.min}
          max={INSPECTOR.max}
          defaultWidth={INSPECTOR.default}
          label="Detalhes do grafo"
          className="max-md:hidden"
        >
          {selected && !selected.cluster ? (
            <Inspector
              node={selected}
              degree={viewDegrees.get(selected.id) ?? 0}
              data={data}
              neighbors={[...(adjacency(view.edges).get(selected.id) ?? [])]
                .map((id) => byId.get(id))
                .filter((n): n is GraphNode => Boolean(n))}
              depth={settings.depth}
              onDepth={(depth) => update({ depth })}
              pinned={pins.has(selected.id)}
              onPin={() => togglePin(selected)}
              onFocus={setFocus}
              onLocal={() => exploreLocal(selected.id)}
              onCenter={() => canvas.current?.centerOn(selected.id)}
              onExpand={() => expand(selected.id)}
              onClose={() => setFocus(undefined)}
            />
          ) : (
            <Overview
              mode={mode}
              view={view}
              degreesById={viewDegrees}
              byId={byId}
              collapsedClusters={collapsedClusters}
              onToggleCluster={(index) =>
                setCollapsedClusters((current) => {
                  const next = new Set(current);
                  if (next.has(index)) next.delete(index);
                  else next.add(index);
                  return next;
                })
              }
              onFocus={setFocus}
            />
          )}
        </ResizablePanel>
      )}
    </WorkspaceFrame>
  );
}

function DisplayToggleInline({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <span className="[&_label]:gap-0">
      <DisplayToggle label="" checked={checked} onChange={onChange} />
    </span>
  );
}

function GraphSettingsMenu({
  settings,
  onChange,
}: {
  settings: GraphSettings;
  onChange: (patch: Partial<GraphSettings>) => void;
}) {
  return (
    <DisplayMenu
      label="Configurações"
      onReset={() => writePreference("graph:settings", defaultGraphSettings)}
      className="w-80"
    >
      <DisplaySection title="Forças">
        <DisplaySlider
          label="Repulsão"
          value={settings.repulsion}
          min={30}
          max={400}
          step={10}
          onChange={(repulsion) => onChange({ repulsion })}
        />
        <DisplaySlider
          label="Distância das ligações"
          value={settings.linkDistance}
          min={15}
          max={160}
          step={5}
          onChange={(linkDistance) => onChange({ linkDistance })}
        />
        <DisplaySlider
          label="Atração"
          value={settings.linkStrength}
          min={0.1}
          max={2}
          step={0.1}
          format={(n) => `${n.toFixed(1)}×`}
          onChange={(linkStrength) => onChange({ linkStrength })}
        />
        <DisplaySlider
          label="Gravidade"
          value={settings.gravity}
          min={0}
          max={0.3}
          step={0.01}
          format={(n) => n.toFixed(2)}
          onChange={(gravity) => onChange({ gravity })}
        />
      </DisplaySection>
      <DisplaySection title="Aparência">
        <DisplaySlider
          label="Tamanho dos nós"
          value={settings.nodeSize}
          min={0.5}
          max={2}
          step={0.1}
          format={(n) => `${n.toFixed(1)}×`}
          onChange={(nodeSize) => onChange({ nodeSize })}
        />
        <DisplaySlider
          label="Espessura das arestas"
          value={settings.edgeWidth}
          min={0.5}
          max={3}
          step={0.25}
          format={(n) => `${n.toFixed(2)}×`}
          onChange={(edgeWidth) => onChange({ edgeWidth })}
        />
        <DisplaySlider
          label="Opacidade das arestas"
          value={settings.edgeOpacity}
          min={0.1}
          max={1}
          step={0.05}
          format={(n) => `${Math.round(n * 100)}%`}
          onChange={(edgeOpacity) => onChange({ edgeOpacity })}
        />
        <DisplaySlider
          label="Tamanho dos rótulos"
          value={settings.labelSize}
          min={8}
          max={18}
          step={0.5}
          format={(n) => `${n}px`}
          onChange={(labelSize) => onChange({ labelSize })}
        />
        <DisplaySelect<LabelMode>
          label="Rótulos"
          value={settings.labels}
          onChange={(labels) => onChange({ labels })}
          options={[
            { value: "auto", label: "Por relevância" },
            { value: "all", label: "Todos" },
            { value: "none", label: "Só seleção" },
          ]}
        />
        <DisplaySlider
          label="Animação"
          value={settings.animation}
          min={0}
          max={1}
          step={0.1}
          format={(n) => (n === 0 ? "Parado" : `${Math.round(n * 100)}%`)}
          onChange={(animation) => onChange({ animation })}
        />
      </DisplaySection>
      <DisplaySection title="Estrutura">
        <DisplaySelect<GraphGrouping>
          label="Agrupar por"
          value={settings.grouping}
          onChange={(grouping) => onChange({ grouping })}
          options={(Object.keys(groupingLabels) as GraphGrouping[]).map(
            (value) => ({
              value,
              label: groupingLabels[value],
            }),
          )}
        />
        <DisplaySlider
          label="Profundidade"
          value={settings.depth}
          min={1}
          max={4}
          step={1}
          format={(n) => `${n} ${n === 1 ? "salto" : "saltos"}`}
          onChange={(depth) => onChange({ depth })}
        />
        <DisplayToggle
          label="Mostrar tags"
          checked={!settings.hiddenKinds.includes("tag")}
          onChange={(show) =>
            onChange({
              hiddenKinds: show
                ? settings.hiddenKinds.filter((k) => k !== "tag")
                : [...settings.hiddenKinds, "tag"],
            })
          }
        />
      </DisplaySection>
    </DisplayMenu>
  );
}

function GraphHelp() {
  const rows: [string, string][] = [
    ["Clique", "Seleciona e destaca as conexões"],
    ["Duplo clique", "Abre o registro"],
    ["Botão direito", "Ações do nó"],
    ["Arrastar nó", "Reposiciona (fixe pelo menu)"],
    ["Roda / pinça", "Zoom no ponteiro"],
    ["Arrastar fundo", "Move a câmera"],
    ["Esc", "Limpa a seleção"],
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Ajuda do grafo"
          title="Ajuda"
          className="text-muted-foreground hover:text-foreground"
        >
          <CircleHelp />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
          {rows.map(([key, value]) => (
            <div key={key} className="contents">
              <dt>
                <Kbd>{key}</Kbd>
              </dt>
              <dd className="text-muted-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
          Nós maiores têm mais conexões. Escreva{" "}
          <code className="rounded bg-muted px-1 font-mono">[[Título]]</code>{" "}
          numa nota para ligá-la a outra nota, snippet ou método.
        </p>
      </PopoverContent>
    </Popover>
  );
}

function NodeSearch({
  nodes,
  onPick,
}: {
  nodes: GraphNode[];
  onPick: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const needle = query.trim().toLocaleLowerCase("pt-BR");
  const matches = needle
    ? nodes
        .filter((n) => n.label.toLocaleLowerCase("pt-BR").includes(needle))
        .slice(0, 10)
    : [];
  const pick = (id: string) => {
    onPick(id);
    setQuery("");
    setOpen(false);
  };
  return (
    <Popover open={open && matches.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <label className="relative">
          <span className="sr-only">Encontrar uma entidade</span>
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && matches[0]) pick(matches[0].id);
            }}
            placeholder="Encontrar"
            className="h-8 w-36 border-transparent bg-muted/50 pl-8 text-sm shadow-none focus-visible:bg-background @[48rem]/toolbar:w-52"
          />
        </label>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 p-1"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {matches.map((node) => (
          <button
            key={node.id}
            type="button"
            onClick={() => pick(node.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent"
          >
            <span
              aria-hidden
              className={cn(
                "size-2 shrink-0 rounded-full bg-current",
                kindColor[node.kind],
              )}
            />
            <span className="truncate">{node.label}</span>
            <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
              {graphKindSingular[node.kind]}
            </span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function NodePicker({
  label,
  value,
  nodes,
  onChange,
}: {
  label: string;
  value?: string;
  nodes: GraphNode[];
  onChange: (id: string) => void;
}) {
  const current = nodes.find((n) => n.id === value);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const needle = query.trim().toLocaleLowerCase("pt-BR");
  const matches = nodes
    .filter(
      (n) =>
        n.kind !== "tag" &&
        (!needle || n.label.toLocaleLowerCase("pt-BR").includes(needle)),
    )
    .slice(0, 12);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 max-w-44 justify-start text-xs"
        >
          {current ? (
            <>
              <span
                aria-hidden
                className={cn(
                  "size-2 shrink-0 rounded-full bg-current",
                  kindColor[current.kind],
                )}
              />
              <span className="truncate">{current.label}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{label}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-1">
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`${label}…`}
          className="mb-1 h-8"
        />
        <div className="max-h-64 overflow-y-auto">
          {matches.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => {
                onChange(node.id);
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent"
            >
              <span
                aria-hidden
                className={cn(
                  "size-2 shrink-0 rounded-full bg-current",
                  kindColor[node.kind],
                )}
              />
              <span className="truncate">{node.label}</span>
              <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                {graphKindSingular[node.kind]}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Inspector({
  node,
  degree,
  data,
  neighbors,
  depth,
  onDepth,
  pinned,
  onPin,
  onFocus,
  onLocal,
  onCenter,
  onExpand,
  onClose,
}: {
  node: GraphNode;
  degree: number;
  data: ReturnType<typeof useAppData>;
  neighbors: GraphNode[];
  depth: number;
  onDepth: (depth: number) => void;
  pinned: boolean;
  onPin: () => void;
  onFocus: (id: string) => void;
  onLocal: () => void;
  onCenter: () => void;
  onExpand: () => void;
  onClose: () => void;
}) {
  const details = nodeDetails(data, node);
  const groups = graphKinds
    .map((kind) => ({
      kind,
      nodes: neighbors
        .filter((n) => n.kind === kind)
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    }))
    .filter((group) => group.nodes.length > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b px-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden
            className={cn(
              "size-2 rounded-full bg-current",
              kindColor[node.kind],
            )}
          />
          {graphKindSingular[node.kind]}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Centralizar"
            title="Centralizar"
            onClick={onCenter}
            className="text-muted-foreground hover:text-foreground"
          >
            <Crosshair />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-pressed={pinned}
            aria-label={pinned ? "Soltar posição" : "Fixar posição"}
            title={pinned ? "Soltar posição" : "Fixar posição"}
            onClick={onPin}
            className={cn(
              "text-muted-foreground hover:text-foreground",
              pinned && "text-primary",
            )}
          >
            {pinned ? <PinOff /> : <Pin />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Limpar seleção"
            title="Limpar seleção (Esc)"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4">
          <header className="flex flex-col gap-2">
            <h2 className="text-base leading-snug font-semibold break-words">
              {node.label}
            </h2>
            {details.description && (
              <p className="line-clamp-5 text-sm leading-relaxed text-muted-foreground">
                {details.description}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {node.href && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  asChild
                >
                  <Link href={node.href}>
                    Abrir <ArrowUpRight />
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onLocal}
              >
                <Network /> Grafo local
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={onExpand}
              >
                <Waypoints /> Expandir
              </Button>
            </div>
          </header>

          {details.meta.length > 0 && (
            <dl className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs">
              {details.meta.map((item) => (
                <div key={item.label} className="contents">
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="break-words">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Profundidade da exploração
            </span>
            <SegmentedControl<string>
              label="Profundidade"
              value={String(depth)}
              onChange={(value) => onDepth(Number(value))}
              options={["1", "2", "3"].map((value) => ({
                value,
                label: `${value} ${value === "1" ? "salto" : "saltos"}`,
              }))}
              className="w-full [&>*]:flex-1"
              size="sm"
            />
          </div>

          <section className="flex flex-col gap-2">
            <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {degree} {degree === 1 ? "conexão" : "conexões"}
            </h3>
            {groups.map((group) => (
              <div key={group.kind} className="flex flex-col">
                <span className="flex items-center gap-1.5 px-2 pb-0.5 text-[11px] text-muted-foreground">
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 rounded-full bg-current",
                      kindColor[group.kind],
                    )}
                  />
                  {graphKindLabels[group.kind]} · {group.nodes.length}
                </span>
                {group.nodes.map((other) => (
                  <button
                    key={other.id}
                    type="button"
                    onClick={() => onFocus(other.id)}
                    className="truncate rounded-md px-2 py-1 text-left text-sm outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {other.label}
                  </button>
                ))}
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

function Overview({
  mode,
  view,
  degreesById,
  byId,
  collapsedClusters,
  onToggleCluster,
  onFocus,
}: {
  mode: GraphMode;
  view: ReturnType<typeof buildGraphView>;
  degreesById: Map<string, number>;
  byId: Map<string, GraphNode>;
  collapsedClusters: Set<number>;
  onToggleCluster: (index: number) => void;
  onFocus: (id: string) => void;
}) {
  const hubs = [...degreesById]
    .filter(([id]) => byId.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const clusters = new Map<number, number>();
  const isolated =
    mode === "clusters"
      ? view.nodes.filter((n) => !view.groups?.has(n.id)).length
      : 0;
  if (mode === "clusters")
    for (const key of view.groups?.values() ?? []) {
      const index = Number(key.slice(1));
      clusters.set(index, (clusters.get(index) ?? 0) + 1);
    }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center border-b px-3 text-xs text-muted-foreground">
        {graphModeLabels[mode]}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
        <p className="text-sm">
          <span className="font-semibold tabular-nums">
            {view.nodes.length}
          </span>{" "}
          <span className="text-muted-foreground">nós ·</span>{" "}
          <span className="font-semibold tabular-nums">
            {view.edges.length}
          </span>{" "}
          <span className="text-muted-foreground">ligações</span>
        </p>

        {view.path && (
          <section className="flex flex-col gap-1">
            <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Caminho · {view.path.length - 1}{" "}
              {view.path.length === 2 ? "salto" : "saltos"}
            </h3>
            <ol className="flex flex-col">
              {view.path.map((id, index) => {
                const node = byId.get(id);
                if (!node) return null;
                return (
                  <li key={id} className="flex items-center gap-2">
                    <span className="w-4 text-right text-[11px] text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => onFocus(id)}
                      className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm hover:bg-accent/60"
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
            </ol>
          </section>
        )}

        {clusters.size > 0 && (
          <section className="flex flex-col gap-1">
            <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Clusters
            </h3>
            {[...clusters]
              .filter(([, count]) => count >= 2)
              .sort((a, b) => a[0] - b[0])
              .map(([index, count]) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent/40"
                >
                  <span>
                    Cluster {index + 1}{" "}
                    <span className="text-xs text-muted-foreground tabular-nums">
                      · {count}
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => onToggleCluster(index)}
                  >
                    {collapsedClusters.has(index) ? "Expandir" : "Recolher"}
                  </Button>
                </div>
              ))}
            {isolated > 0 && (
              <p className="px-2 pt-1 text-xs text-muted-foreground">
                {isolated} {isolated === 1 ? "nó isolado" : "nós isolados"} fora
                dos clusters
              </p>
            )}
            {[...collapsedClusters]
              .filter((index) => !clusters.has(index))
              .map((index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm"
                >
                  Cluster {index + 1}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => onToggleCluster(index)}
                  >
                    Expandir
                  </Button>
                </div>
              ))}
          </section>
        )}

        {hubs.length > 0 && (
          <section className="flex flex-col gap-1">
            <h3 className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Mais conectados
            </h3>
            {hubs.map(([id, count]) => {
              const node = byId.get(id)!;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onFocus(id)}
                  className="flex items-center gap-2 rounded-md px-2 py-1 text-left text-sm outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 shrink-0 rounded-full bg-current",
                      kindColor[node.kind],
                    )}
                  />
                  <span className="truncate">{node.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {count}
                  </span>
                </button>
              );
            })}
          </section>
        )}

        <p className="text-xs text-muted-foreground">
          Selecione um nó para ver detalhes e conexões. Botão direito abre as
          ações.
        </p>
      </div>
    </div>
  );
}
