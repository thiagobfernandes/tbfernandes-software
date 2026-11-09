import { toInstant } from '../../../../common/protocols';
import { KnowledgeLinks, Snippet, SnippetDetails } from '../../domain';
import { ValidSnippetRequest } from '../snippet.request';
import { SnippetResponse } from '../snippet.response';
import { LinksMapper, tagList } from './links.mapper';

export const SnippetMapper = {
  toDetails(request: ValidSnippetRequest): SnippetDetails {
    return {
      title: request.title,
      language: request.language,
      code: request.code,
      explanation: request.explanation,
      sourceUrl: request.sourceUrl,
      tags: tagList(request.tags),
    };
  },

  toLinks(request: ValidSnippetRequest): KnowledgeLinks {
    return LinksMapper.toLinks(request);
  },

  toResponse(snippet: Snippet): SnippetResponse {
    const details = snippet.details;
    return {
      id: snippet.id,
      title: details.title,
      language: details.language,
      code: details.code,
      explanation: details.explanation,
      sourceUrl: details.sourceUrl,
      tags: details.tags,
      projectIds: LinksMapper.sorted(snippet.links.projectIds),
      taskIds: LinksMapper.sorted(snippet.links.taskIds),
      createdAt: toInstant(snippet.createdAt),
      updatedAt: toInstant(snippet.updatedAt),
    };
  },
};
