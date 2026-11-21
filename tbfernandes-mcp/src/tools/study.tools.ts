import { z } from 'zod';

import { definedFields } from './defined-fields.ts';
import {
  defineTool,
  type ToolContext,
  type ToolRegistration,
} from './define-tool.ts';
import { isoDate, studyStatus, uuid } from './schemas.ts';

const studyName = z.string().min(1).max(200);
const studyDescription = z.string().max(2000);
const nextActivity = z.string().max(300);

export function studyTools(context: ToolContext): ToolRegistration[] {
  return [listStudies(context), createStudy(context), updateStudy(context)];
}

function listStudies({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'list_studies',
    description: 'Lista estudos (trilhas de aprendizado).',
    input: {},
    run: async () => (await api.list('/studies')).items,
  });
}

function createStudy({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'create_study',
    description: 'Cria um estudo (ex.: "Filosofia — jornada de 8 semanas").',
    input: {
      name: studyName,
      description: studyDescription.optional(),
      status: studyStatus.optional(),
      goalId: uuid.optional(),
      startDate: isoDate.optional(),
      dueDate: isoDate.optional(),
      nextActivity: nextActivity.optional(),
    },
    run: (fields) => api.post('/studies', definedFields(fields)),
  });
}

function updateStudy({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'update_study',
    description: 'Edita um estudo. Campos omitidos são mantidos.',
    input: {
      id: uuid,
      name: studyName.optional(),
      description: studyDescription.optional(),
      status: studyStatus.optional(),
      goalId: uuid.nullable().optional(),
      startDate: isoDate.optional(),
      dueDate: isoDate.optional(),
      nextActivity: nextActivity.optional(),
    },
    run: async ({ id, ...changes }) => {
      const current = await api.get(`/studies/${id}`);
      return api.put(`/studies/${id}`, {
        ...current,
        ...definedFields(changes),
      });
    },
  });
}
