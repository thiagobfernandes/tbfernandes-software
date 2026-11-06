import { Workspace } from './workspace';

export interface GraphNode {
  id: string;
  kind: string;
  label: string;
  href: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

/**
 * Every record that takes part in a relation, as nodes and undirected edges (KNW-05). Same
 * nodes, ids ("kind:id"), links and edge order as buildGraph in the frontend's
 * features/knowledge/lib/graph.ts; the layout stays in the browser.
 */
export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const key = (kind: string, id: string) => `${kind}:${id}`;

// Ids are lowercase UUIDs, so text order is the order the Java backend used.
const sorted = (ids: string[]) => [...ids].sort();

class GraphBuilder {
  private readonly nodes: GraphNode[] = [];
  private readonly edges: GraphEdge[] = [];

  addNode(kind: string, id: string, label: string, href: string): string {
    const nodeId = key(kind, id);
    this.nodes.push({ id: nodeId, kind, label, href });
    return nodeId;
  }

  link(source: string, kind: string, target: string | null): void {
    if (target) this.edges.push({ source, target: key(kind, target) });
  }

  linkAll(source: string, kind: string, targets: string[]): void {
    sorted(targets).forEach((target) => this.link(source, kind, target));
  }

  build(): KnowledgeGraph {
    // Drop edges whose other end was deleted (references across modules have no FK, ADR-003).
    const ids = new Set(this.nodes.map((node) => node.id));
    return {
      nodes: this.nodes,
      edges: this.edges.filter(
        (edge) => ids.has(edge.source) && ids.has(edge.target),
      ),
    };
  }
}

function addWork(graph: GraphBuilder, data: Workspace): void {
  for (const company of data.companies)
    graph.addNode(
      'company',
      company.id,
      company.name,
      `/companies/view?id=${company.id}`,
    );
  for (const project of data.projects) {
    const id = graph.addNode(
      'project',
      project.id,
      project.name,
      `/projects/view?id=${project.id}`,
    );
    graph.link(id, 'company', project.companyId);
    graph.link(id, 'goal', project.goalId);
  }
  for (const task of data.tasks) {
    const id = graph.addNode(
      'task',
      task.id,
      task.title,
      `/tasks?q=${encodeURIComponent(task.title)}`,
    );
    graph.link(id, 'project', task.projectId);
    graph.link(id, 'goal', task.goalId);
  }
}

function addKnowledge(graph: GraphBuilder, data: Workspace): void {
  for (const note of data.notes) {
    const id = graph.addNode(
      'note',
      note.id,
      note.title,
      `/knowledge?note=${note.id}`,
    );
    graph.linkAll(id, 'project', note.projectIds);
    graph.linkAll(id, 'task', note.taskIds);
  }
  for (const snippet of data.snippets) {
    const id = graph.addNode(
      'snippet',
      snippet.id,
      snippet.title,
      '/knowledge/snippets',
    );
    graph.linkAll(id, 'project', snippet.projectIds);
    graph.linkAll(id, 'task', snippet.taskIds);
  }
}

export const KnowledgeGraphs = {
  of(data: Workspace): KnowledgeGraph {
    const graph = new GraphBuilder();
    for (const goal of data.goals) {
      const id = graph.addNode(
        'goal',
        goal.id,
        goal.name,
        `/goals/view?id=${goal.id}`,
      );
      graph.link(id, 'goal', goal.parentId);
    }
    addWork(graph, data);
    addKnowledge(graph, data);
    for (const contact of data.contacts) {
      const id = graph.addNode(
        'contact',
        contact.id,
        contact.name,
        `/contacts?contact=${contact.id}`,
      );
      graph.link(id, 'company', contact.companyId);
    }
    return graph.build();
  },
};
