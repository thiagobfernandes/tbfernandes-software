import { KnowledgeLinks } from '../../../domain';
import type { LinkTargetType } from '../link-target';

interface LinkRow {
  targetType: LinkTargetType;
  targetId: string;
}

/** KnowledgeLinks ↔ rows of note_link / snippet_link. */
export const LinkPersistenceMapper = {
  toLinks(rows: readonly LinkRow[] | undefined): KnowledgeLinks {
    const all = rows ?? [];
    return KnowledgeLinks.of(
      all
        .filter((row) => row.targetType === 'PROJECT')
        .map((row) => row.targetId),
      all.filter((row) => row.targetType === 'TASK').map((row) => row.targetId),
    );
  },

  toRows(links: KnowledgeLinks): LinkRow[] {
    return [
      ...links.projectIds.map((targetId) => ({
        targetType: 'PROJECT' as const,
        targetId,
      })),
      ...links.taskIds.map((targetId) => ({
        targetType: 'TASK' as const,
        targetId,
      })),
    ];
  },
};
