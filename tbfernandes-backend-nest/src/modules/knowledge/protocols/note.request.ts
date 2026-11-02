import { J, Joi } from '../../../common/protocols';
import { KnowledgeJoi } from './knowledge.joi';

/** Body of POST and PUT /notes. */
export class NoteRequest {
  title: string;
  /** Markdown */
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
  title: J.requiredText(200),
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
  ...J.paging(),
});
