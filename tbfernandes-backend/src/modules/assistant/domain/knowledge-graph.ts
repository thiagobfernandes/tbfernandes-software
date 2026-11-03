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

export const KnowledgeGraphs = {
  of(data: Workspace): KnowledgeGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const link = (source: string, kind: string, target: string | null) => {
      if (target) edges.push({ source, target: key(kind, target) });
    };
    for (const goal of data.goals) {
      const id = key('goal', goal.id);
      nodes.push({
        id,
        kind: 'goal',
        label: goal.name,
        href: `/goals/view?id=${goal.id}`,
      });
      link(id, 'goal', goal.parentId);
    }
    for (const company of data.companies) {
      nodes.push({
        id: key('company', company.id),
        kind: 'company',
        label: company.name,
        href: `/companies/view?id=${company.id}`,
      });
    }
    for (const project of data.projects) {
      const id = key('project', project.id);
      nodes.push({
        id,
        kind: 'project',
        label: project.name,
        href: `/projects/view?id=${project.id}`,
      });
      link(id, 'company', project.companyId);
      link(id, 'goal', project.goalId);
    }
    for (const task of data.tasks) {
      const id = key('task', task.id);
      nodes.push({
        id,
        kind: 'task',
        label: task.title,
        href: `/tasks?q=${encodeURIComponent(task.title)}`,
      });
      link(id, 'project', task.projectId);
      link(id, 'goal', task.goalId);
    }
    for (const note of data.notes) {
      const id = key('note', note.id);
      nodes.push({
        id,
        kind: 'note',
        label: note.title,
        href: `/knowledge?note=${note.id}`,
      });
      sorted(note.projectIds).forEach((projectId) =>
        link(id, 'project', projectId),
      );
      sorted(note.taskIds).forEach((taskId) => link(id, 'task', taskId));
    }
    for (const snippet of data.snippets) {
      const id = key('snippet', snippet.id);
      nodes.push({
        id,
        kind: 'snippet',
        label: snippet.title,
        href: '/knowledge/snippets',
      });
      sorted(snippet.projectIds).forEach((projectId) =>
        link(id, 'project', projectId),
      );
      sorted(snippet.taskIds).forEach((taskId) => link(id, 'task', taskId));
    }
    for (const contact of data.contacts) {
      const id = key('contact', contact.id);
      nodes.push({
        id,
        kind: 'contact',
        label: contact.name,
        href: `/contacts?contact=${contact.id}`,
      });
      link(id, 'company', contact.companyId);
    }
    // Drop edges whose other end was deleted (references across modules have no FK, ADR-003).
    const ids = new Set(nodes.map((n) => n.id));
    return {
      nodes,
      edges: edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
    };
  },
};
