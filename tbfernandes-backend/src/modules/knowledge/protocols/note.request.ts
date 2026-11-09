import { RequestFields, Joi } from '../../../common/protocols';
import { KnowledgeJoi } from './knowledge.joi';

export class NoteRequest {
  title: string;
  body?: string | null;
  tags?: string[] | null;
  projectIds?: string[] | null;
  taskIds?: string[] | null;
}

export interface ValidNoteRequest {
  title: string;
  body: string | null;
  tags: (string | null)[] | null;
  projectIds: string[] | null;
  taskIds: string[] | null;
}

export const noteRequestSchema = Joi.object<ValidNoteRequest>({
  title: RequestFields.requiredText(200),
  body: Joi.string().allow('', null).default(''),
  tags: KnowledgeJoi.tags(),
  projectIds: KnowledgeJoi.ids(),
  taskIds: KnowledgeJoi.ids(),
});

export interface NoteListQuery {
  q: string | null;
  tag: string | null;
}

export const noteListQuerySchema = Joi.object<NoteListQuery>({
  q: Joi.string().allow('').default(null),
  tag: Joi.string().allow('').default(null),
  ...RequestFields.paging(),
});
