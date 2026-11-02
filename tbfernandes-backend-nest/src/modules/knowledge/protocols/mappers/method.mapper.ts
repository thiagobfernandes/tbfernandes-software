import { Method, MethodDetails } from '../../domain';
import { ValidMethodRequest } from '../method.request';
import { MethodResponse } from '../method.response';
import { tagList } from './links.mapper';

/** JSON ↔ Method. */
export const MethodMapper = {
  toDetails(request: ValidMethodRequest): MethodDetails {
    return {
      title: request.title,
      summary: request.summary,
      category: request.category,
      steps: request.steps,
      examples: request.examples ?? [],
      tags: tagList(request.tags),
      lastReviewed: request.lastReviewed,
    };
  },

  toResponse(method: Method): MethodResponse {
    const d = method.details;
    return {
      id: method.id,
      title: d.title,
      summary: d.summary,
      category: d.category.toLowerCase(),
      steps: d.steps,
      examples: d.examples,
      tags: d.tags,
      lastReviewed: d.lastReviewed,
    };
  },
};
