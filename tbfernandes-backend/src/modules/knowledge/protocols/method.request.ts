import { RequestFields, Joi } from '../../../common/protocols';
import { METHOD_CATEGORIES, MethodCategory } from '../domain';
import { KnowledgeJoi } from './knowledge.joi';

export class MethodStepRequest {
  title: string;
  detail?: string | null;
}

export class MethodExampleRequest {
  title: string;
  content: string;
}

export class MethodRequest {
  title: string;
  summary: string;
  /** development, quality or communication */
  category: string;
  /** At least one, in order. */
  steps: MethodStepRequest[];
  examples?: MethodExampleRequest[] | null;
  tags?: string[] | null;
  lastReviewed: string;
}

export interface ValidMethodRequest {
  title: string;
  summary: string;
  category: MethodCategory;
  steps: { title: string; detail: string | null }[];
  examples: { title: string; content: string }[] | null;
  tags: (string | null)[] | null;
  lastReviewed: string;
}

export const methodRequestSchema = Joi.object<ValidMethodRequest>({
  title: RequestFields.requiredText(200),
  summary: RequestFields.requiredText(1000),
  category: RequestFields.enumOf(METHOD_CATEGORIES).required(),
  steps: Joi.array()
    .items(
      Joi.object({
        title: RequestFields.requiredText(200),
        detail: RequestFields.optionalText(2000),
      }),
    )
    .min(1)
    .required(),
  examples: Joi.array()
    .items(
      Joi.object({
        title: RequestFields.requiredText(200),
        content: Joi.string().required(),
      }),
    )
    .allow(null)
    .default([]),
  tags: KnowledgeJoi.tags(),
  lastReviewed: RequestFields.isoDate().required(),
});
