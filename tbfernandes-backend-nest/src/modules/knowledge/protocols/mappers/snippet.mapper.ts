import { toInstant } from '../../../../common/protocols';
import { KnowledgeLinks, Snippet, SnippetDetails } from '../../domain';
import { ValidSnippetRequest } from '../snippet.request';
import { SnippetResponse } from '../snippet.response';
import { LinksMapper, tagList } from './links.mapper';

/** JSON ↔ Snippet. */
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
    const d = snippet.details;
    return {
      id: snippet.id,
      title: d.title,
      language: d.language,
      code: d.code,
      explanation: d.explanation,
      sourceUrl: d.sourceUrl,
      tags: d.tags,
      projectIds: LinksMapper.sorted(snippet.links.projectIds),
      taskIds: LinksMapper.sorted(snippet.links.taskIds),
      createdAt: toInstant(snippet.createdAt),
      updatedAt: toInstant(snippet.updatedAt),
    };
  },
};
