export class MilestoneNotFoundError extends Error {
  constructor(milestoneId: string, goalId: string) {
    super(`Marco ${milestoneId} não encontrado na meta ${goalId}`);
    this.name = 'MilestoneNotFoundError';
  }
}
