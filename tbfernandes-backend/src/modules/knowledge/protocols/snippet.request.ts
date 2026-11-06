import { RequestFields, Joi } from '../../../common/protocols';
import { KnowledgeJoi } from './knowledge.joi';

/** Body of POST and PUT /snippets. The code is kept exactly as sent (RN-11). */
export class SnippetRequest {
  title: string;
  language: string;
  code: string;
  explanation?: string | null;
  sourceUrl?: string | null;
  tags?: string[] | null;
  projectIds?: string[] | null;
  taskIds?: string[] | null;
}

export interface ValidSnippetRequest {
  title: string;
  language: string;
  code: string;
  explanation: string | null;
  sourceUrl: string | null;
  tags: (string | null)[] | null;
  projectIds: string[] | null;
  taskIds: string[] | null;
}

export const snippetRequestSchema = Joi.object<ValidSnippetRequest>({
  title: RequestFields.requiredText(200),
  language: RequestFields.requiredText(30),
  code: Joi.string().required(),
  explanation: RequestFields.optionalText(5000),
  sourceUrl: RequestFields.optionalText(2000),
  tags: KnowledgeJoi.tags(),
  projectIds: KnowledgeJoi.ids(),
  taskIds: KnowledgeJoi.ids(),
});

export interface SnippetListQuery {
  q: string | null;
  language: string | null;
  tag: string | null;
}

export const snippetListQuerySchema = Joi.object<SnippetListQuery>({
  q: Joi.string().allow('').default(null),
  language: Joi.string().allow('').default(null),
  tag: Joi.string().allow('').default(null),
  ...RequestFields.paging(),
});
