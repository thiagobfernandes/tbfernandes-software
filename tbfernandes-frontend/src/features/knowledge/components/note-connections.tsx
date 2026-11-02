"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Network } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GraphCanvas } from "@/features/knowledge/components/graph-canvas";
import {
  buildGraph,
  graphHref,
  graphNodeId,
  layoutGraph,
  localNodeIds,
  subgraph,
} from "@/features/knowledge/lib/graph";
import {
  normalizeTitle,
  parseWikiLinks,
} from "@/features/knowledge/lib/wiki-links";
import type { Note } from "@/features/knowledge/types/knowledge";
import { useAppData } from "@/lib/sample-data/store";

/**
 * Obsidian's local graph and backlinks for one note: what it links to, and
 * which notes mention it with `[[Title]]`.
 */
export function NoteConnections({ note }: { note: Note }) {
  const data = useAppData();
  const router = useRouter();
  const centerId = graphNodeId("note", note.id);

  const local = useMemo(() => {
    const graph = subgraph(buildGraph(data), (node) => node.kind !== "tag");
    const ids = localNodeIds(graph.edges, centerId, 1);
    const near = subgraph(graph, (node) => ids.has(node.id));
    return { edges: near.edges, nodes: layoutGraph(near.nodes, near.edges) };
  }, [data, centerId]);

  const title = normalizeTitle(note.title);
  const backlinks = data.notes.filter(
    (other) =>
      other.id !== note.id &&
      parseWikiLinks(other.body).some((link) => normalizeTitle(link) === title),
  );

  return (
    <section
      aria-labelledby="note-connections"
      className="mt-2 flex flex-col gap-3 border-t pt-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 id="note-connections" className="text-sm font-medium">
          Conexões
        </h3>
        <Button variant="ghost" size="sm" asChild>
          <Link href={graphHref(centerId)}>
            <Network /> Abrir no grafo
          </Link>
        </Button>
      </div>
      {local.nodes.length > 1 ? (
        <GraphCanvas
          compact
          nodes={local.nodes}
          edges={local.edges}
          focusId={centerId}
          onFocus={(id) => {
            if (id && id !== centerId) router.push(graphHref(id));
          }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Esta nota ainda não se liga a nada. Vincule um projeto ou escreva{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">
            [[Título de outra nota]]
          </code>{" "}
          no texto.
        </p>
      )}
      {backlinks.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Mencionada em</span>
          <ul className="flex flex-wrap gap-1.5">
            {backlinks.map((other) => (
              <li key={other.id}>
                <Link
                  href={`/knowledge?note=${encodeURIComponent(other.id)}`}
                  className="inline-flex rounded-full border px-2.5 py-0.5 text-xs hover:bg-accent/60"
                >
                  {other.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
