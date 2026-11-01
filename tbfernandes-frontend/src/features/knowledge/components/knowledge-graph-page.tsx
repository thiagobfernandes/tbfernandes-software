"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Search, X } from "lucide-react";

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
  GraphCanvas,
  kindColor,
} from "@/features/knowledge/components/graph-canvas";
import {
  buildContextTree,
  buildGraph,
  defaultHiddenKinds,
  graphHref,
  graphKindLabels,
  graphKindSingular,
  graphKinds,
  layoutGraph,
  localNodeIds,
  neighborIds,
  subgraph,
} from "@/features/knowledge/lib/graph";
import { useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

const depthOptions = [
  { value: 0, label: "Tudo" },
  { value: 1, label: "1 salto" },
  { value: 2, label: "2 saltos" },
] as const;

export function KnowledgeGraphPage() {
  const data = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const graph = useMemo(() => buildGraph(data), [data]);
  const [hidden, setHidden] = useState(() => {
    const focusKind = searchParams.get("focus")?.split(":")[0];
    return new Set(defaultHiddenKinds.filter((kind) => kind !== focusKind));
  });
  const [showOrphans, setShowOrphans] = useState(true);
  const [depth, setDepth] = useState(0);
  const [query, setQuery] = useState("");
  const [treeGoalId, setTreeGoalId] = useState<string>();

  const requestedFocus = searchParams.get("focus") ?? undefined;
  const focusNode = graph.nodes.find(
    (node) => node.id === requestedFocus && !hidden.has(node.kind),
  );
  const focusId = focusNode?.id;

  function setFocus(id?: string) {
    router.replace(id ? graphHref(id) : "/knowledge/graph", { scroll: false });
  }

  // Layout runs only when the data, the filters or the local center change,
  // not on every focus change in the full view.
  const localCenter = depth > 0 ? focusId : undefined;
  const { visible, positioned } = useMemo(() => {
    let next = subgraph(graph, (node) => !hidden.has(node.kind));
    if (localCenter) {
      const ids = localNodeIds(next.edges, localCenter, depth);
      next = subgraph(next, (node) => ids.has(node.id));
    }
    if (!showOrphans) {
      const linked = new Set(next.edges.flatMap((e) => [e.source, e.target]));
      next = subgraph(
        next,
        (node) => linked.has(node.id) || node.id === localCenter,
      );
    }
    return { visible: next, positioned: layoutGraph(next.nodes, next.edges) };
  }, [graph, hidden, showOrphans, depth, localCenter]);
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const shownIds = new Set(positioned.map((node) => node.id));
  const focus =
    focusId && shownIds.has(focusId) ? byId.get(focusId) : undefined;

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? graph.nodes.filter(
        (node) =>
          !hidden.has(node.kind) && node.label.toLowerCase().includes(needle),
      )
    : [];
  const neighbors = focus ? [...neighborIds(visible.edges, focus.id)] : [];
  const neighborGroups = graphKinds
    .map((kind) => ({
      kind,
      nodes: neighbors
        .map((id) => byId.get(id)!)
        .filter((node) => node.kind === kind)
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    }))
    .filter((group) => group.nodes.length > 0);
  const orphanCount = graph.nodes.filter(
    (node) =>
      !hidden.has(node.kind) &&
      !graph.edges.some(
        (edge) =>
          (edge.source === node.id &&
            !hidden.has(byId.get(edge.target)!.kind)) ||
          (edge.target === node.id && !hidden.has(byId.get(edge.source)!.kind)),
      ),
  ).length;

  const tree = buildContextTree(data, treeGoalId);
  const treeGoals = data.goals.filter((goal) =>
    data.projects.some((project) => project.goalId === goal.id),
  );

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Grafo"
        description="Explore como metas, projetos, tarefas e conhecimento se relacionam. Links [[Título]] dentro das notas também viram ligações."
        actions={<SampleDataBadge />}
      />

      <Tabs defaultValue="network">
        <TabsList>
          <TabsTrigger value="network">Rede</TabsTrigger>
          <TabsTrigger value="tree">Árvore de metas</TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div
              role="group"
              aria-label="Mostrar tipos"
              className="flex flex-wrap gap-1.5"
            >
              {graphKinds.map((kind) => {
                const shown = !hidden.has(kind);
                const count = graph.nodes.filter(
                  (node) => node.kind === kind,
                ).length;
                if (count === 0) return null;
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
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      shown ? "bg-card" : "text-muted-foreground opacity-60",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-2 rounded-full",
                        shown ? "bg-current" : "border border-current",
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
              <button
                type="button"
                aria-pressed={showOrphans}
                onClick={() => setShowOrphans(!showOrphans)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  showOrphans ? "bg-card" : "text-muted-foreground opacity-60",
                )}
              >
                Sem ligação
                <span className="text-muted-foreground tabular-nums">
                  {orphanCount}
                </span>
              </button>
            </div>
            <div className="relative shrink-0 lg:w-72">
              <label className="relative block">
                <span className="sr-only">Encontrar um nó</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && matches[0]) {
                      setFocus(matches[0].id);
                      setQuery("");
                    }
                  }}
                  placeholder="Encontrar e focar um nó"
                  className="pl-9"
                />
              </label>
              {needle && (
                <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
                  {matches.length === 0 && (
                    <li className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhum nó encontrado.
                    </li>
                  )}
                  {matches.slice(0, 8).map((node) => (
                    <li key={node.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setFocus(node.id);
                          setQuery("");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
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
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
            <GraphCanvas
              nodes={positioned}
              edges={visible.edges}
              focusId={focus?.id}
              onFocus={setFocus}
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
                        {graphKindSingular[focus.kind]}
                      </span>
                      <h2 className="font-medium break-words">{focus.label}</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Limpar foco"
                      onClick={() => setFocus(undefined)}
                    >
                      <X />
                    </Button>
                  </div>
                  {focus.href && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={focus.href}>
                        Abrir <ArrowUpRight />
                      </Link>
                    </Button>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Grafo local
                    </span>
                    <div
                      role="group"
                      aria-label="Profundidade do grafo local"
                      className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
                    >
                      {depthOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={depth === option.value}
                          onClick={() => setDepth(option.value)}
                          className={cn(
                            "rounded-md px-2 py-1 text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            depth === option.value
                              ? "bg-background font-medium shadow-sm"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <h3 className="mt-1 text-xs font-medium text-muted-foreground">
                    {neighbors.length}{" "}
                    {neighbors.length === 1 ? "conexão" : "conexões"}
                  </h3>
                  <div className="flex max-h-[22rem] flex-col gap-2 overflow-y-auto">
                    {neighborGroups.map((group) => (
                      <div key={group.kind} className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 px-2 text-[11px] text-muted-foreground">
                          <span
                            aria-hidden
                            className={cn(
                              "size-1.5 rounded-full bg-current",
                              kindColor[group.kind],
                            )}
                          />
                          {graphKindLabels[group.kind]} · {group.nodes.length}
                        </span>
                        <ul className="flex flex-col gap-0.5">
                          {group.nodes.map((node) => (
                            <li key={node.id}>
                              <button
                                type="button"
                                onClick={() => setFocus(node.id)}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent/60"
                              >
                                <span className="truncate">{node.label}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {positioned.length} nós · {visible.edges.length} ligações
                  </p>
                  <p>
                    Clique em um nó para focar e ver com o que ele se conecta;
                    clique duas vezes para abrir o registro.
                  </p>
                  <p>
                    Use a roda do mouse ou a pinça para dar zoom, arraste o
                    fundo para mover e arraste um nó para reposicioná-lo.
                  </p>
                  <p>
                    Nós maiores têm mais conexões. Escreva{" "}
                    <code className="rounded bg-muted px-1 font-mono text-xs">
                      [[Título]]
                    </code>{" "}
                    numa nota para ligá-la a outra nota, snippet ou método.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="tree" className="mt-4 flex flex-col gap-4">
          {treeGoals.length > 0 && (
            <Select value={tree?.id} onValueChange={setTreeGoalId}>
              <SelectTrigger className="w-full sm:w-80" aria-label="Meta">
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
                Vincule projetos a uma meta para ver a árvore.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
