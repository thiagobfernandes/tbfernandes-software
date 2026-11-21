import { z } from 'zod';

import type { TbfClient } from '../api/tbf-client.ts';
import { MilestoneNotFoundError } from '../errors/milestone-not-found.error.ts';
import { definedFields } from './defined-fields.ts';
import {
  defineTool,
  type ToolContext,
  type ToolRegistration,
} from './define-tool.ts';
import { isoDate, uuid } from './schemas.ts';

const milestoneTitle = z.string().min(1).max(200);

interface Milestone {
  id: string;
  goalId: string;
}

export function milestoneTools(context: ToolContext): ToolRegistration[] {
  return [
    listMilestones(context),
    createMilestone(context),
    updateMilestone(context),
  ];
}

function listMilestones({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'list_milestones',
    description: 'Lista marcos, opcionalmente de uma meta.',
    input: { goalId: uuid.optional() },
    run: async ({ goalId }) =>
      (await api.list('/milestones', { goalId })).items,
  });
}

function createMilestone({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'create_milestone',
    description: 'Cria um marco dentro de uma meta.',
    input: {
      goalId: uuid,
      title: milestoneTitle,
      dueDate: isoDate.optional(),
      done: z.boolean().optional(),
    },
    run: (fields) => api.post('/milestones', definedFields(fields)),
  });
}

function updateMilestone({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'update_milestone',
    description:
      'Edita um marco (ex.: done=true). Campos omitidos são mantidos.',
    input: {
      id: uuid,
      goalId: uuid,
      title: milestoneTitle.optional(),
      dueDate: isoDate.optional(),
      done: z.boolean().optional(),
    },
    run: async ({ id, goalId, ...changes }) => {
      const current = await findMilestone(api, id, goalId);
      return api.put(`/milestones/${id}`, {
        ...current,
        ...definedFields(changes),
      });
    },
  });
}

// The API has no GET /milestones/{id}, so the milestone is looked up in its goal's list.
async function findMilestone(
  api: TbfClient,
  id: string,
  goalId: string,
): Promise<Milestone> {
  const { items } = await api.list<Milestone>('/milestones', { goalId });
  const milestone = items.find((candidate) => candidate.id === id);
  if (!milestone) throw new MilestoneNotFoundError(id, goalId);
  return milestone;
}
