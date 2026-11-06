import { Method, MethodDetails } from '../../domain';
import { ValidMethodRequest } from '../method.request';
import { MethodResponse } from '../method.response';
import { tagList } from './links.mapper';

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
    const details = method.details;
    return {
      id: method.id,
      title: details.title,
      summary: details.summary,
      category: details.category.toLowerCase(),
      steps: details.steps,
      examples: details.examples,
      tags: details.tags,
      lastReviewed: details.lastReviewed,
    };
  },
};
