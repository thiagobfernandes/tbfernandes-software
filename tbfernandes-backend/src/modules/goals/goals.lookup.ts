/**
 * A goal with its progress, safe to hold outside the module. Status in lower case; basis says
 * what the percent was measured on: the indicator label, milestones or linked tasks.
 */
export interface GoalView {
  id: string;
  name: string;
  status: string;
  parentId: string | null;
  percent: number;
  basis: string;
}

export abstract class GoalsLookup {
  abstract goals(ownerId: string): Promise<GoalView[]>;
}
