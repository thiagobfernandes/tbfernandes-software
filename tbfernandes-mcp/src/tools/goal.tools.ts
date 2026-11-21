import { z } from 'zod';

import { definedFields } from './defined-fields.ts';
import {
  defineTool,
  type ToolContext,
  type ToolRegistration,
} from './define-tool.ts';
import {
  goalArea,
  goalPriority,
  goalStatus,
  isoDate,
  uuid,
} from './schemas.ts';

const longText = z.string().max(2000);

const indicator = z.object({
  label: z.string(),
  current: z.number().optional(),
  target: z.number(),
  unit: z.string(),
});

export function goalTools(context: ToolContext): ToolRegistration[] {
  return [listGoals(context), createGoal(context)];
}

function listGoals({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'list_goals',
    description: 'Lista metas.',
    input: {},
    run: async () => (await api.list('/goals')).items,
  });
}

function createGoal({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'create_goal',
    description: 'Cria uma meta.',
    input: {
      name: z.string().min(1).max(200),
      area: goalArea,
      desiredResult: longText.min(1),
      description: longText.optional(),
      status: goalStatus.optional(),
      priority: goalPriority.optional(),
      currentState: longText.optional(),
      doneCriteria: z.string().max(1000).optional(),
      dueDate: isoDate.optional(),
      parentId: uuid.optional(),
      indicator: indicator.optional(),
    },
    run: (fields) => api.post('/goals', definedFields(fields)),
  });
}
