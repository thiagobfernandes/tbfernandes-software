import { KnowledgeLinks } from '../../domain';

export const LinksMapper = {
  toLinks(request: {
    projectIds: string[] | null;
    taskIds: string[] | null;
  }): KnowledgeLinks {
    return KnowledgeLinks.of(request.projectIds, request.taskIds);
  },

  /** Stable order, so equal data gives equal JSON. */
  sorted(ids: readonly string[]): string[] {
    return [...ids].sort();
  },
};

/** Tags as sent, without nulls; the domain normalizes the rest. */
export function tagList(tags: (string | null)[] | null): string[] {
  return (tags ?? []).filter((tag): tag is string => tag != null);
}
