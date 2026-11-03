/** Work items a note or snippet relates to (RF-KNW-03). Ids point to the work module. */
export class KnowledgeLinks {
  readonly projectIds: readonly string[];
  readonly taskIds: readonly string[];

  private constructor(projectIds: Iterable<string>, taskIds: Iterable<string>) {
    this.projectIds = [...new Set(projectIds)];
    this.taskIds = [...new Set(taskIds)];
  }

  static of(
    projectIds: Iterable<string> | null | undefined,
    taskIds: Iterable<string> | null | undefined,
  ): KnowledgeLinks {
    return new KnowledgeLinks(projectIds ?? [], taskIds ?? []);
  }

  static none(): KnowledgeLinks {
    return new KnowledgeLinks([], []);
  }

  /** The same links without a deleted work item (KNW-06). */
  without(workItemId: string): KnowledgeLinks {
    return new KnowledgeLinks(
      this.projectIds.filter((id) => id !== workItemId),
      this.taskIds.filter((id) => id !== workItemId),
    );
  }

  has(workItemId: string): boolean {
    return (
      this.projectIds.includes(workItemId) || this.taskIds.includes(workItemId)
    );
  }
}
