import { z } from 'zod';

import { definedFields } from './defined-fields.ts';
import {
  defineTool,
  type ToolContext,
  type ToolRegistration,
} from './define-tool.ts';
import { materialStatus, materialType, uuid } from './schemas.ts';

const materialTitle = z.string().min(1).max(300);
const materialUrl = z.string().max(2000);
const materialNotes = z.string().max(5000);

export function materialTools(context: ToolContext): ToolRegistration[] {
  return [
    listMaterials(context),
    createMaterial(context),
    updateMaterial(context),
  ];
}

function listMaterials({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'list_materials',
    description:
      'Lista materiais (leituras, vídeos, livros), opcionalmente de um estudo.',
    input: { studyId: uuid.optional() },
    run: async ({ studyId }) =>
      (await api.list('/materials', { studyId })).items,
  });
}

function createMaterial({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'create_material',
    description:
      'Cria um material de estudo (texto, livro, vídeo, artigo) ligado ou não a um estudo.',
    input: {
      title: materialTitle,
      type: materialType,
      studyId: uuid.optional(),
      url: materialUrl.optional(),
      status: materialStatus.optional(),
      notes: materialNotes.optional(),
    },
    run: (fields) => api.post('/materials', definedFields(fields)),
  });
}

function updateMaterial({ api }: ToolContext): ToolRegistration {
  return defineTool({
    name: 'update_material',
    description:
      'Edita um material (ex.: marcar como consumed). Campos omitidos são mantidos.',
    input: {
      id: uuid,
      title: materialTitle.optional(),
      type: materialType.optional(),
      studyId: uuid.nullable().optional(),
      url: materialUrl.optional(),
      status: materialStatus.optional(),
      notes: materialNotes.optional(),
    },
    run: async ({ id, ...changes }) => {
      const current = await api.get(`/materials/${id}`);
      return api.put(`/materials/${id}`, {
        ...current,
        ...definedFields(changes),
      });
    },
  });
}
