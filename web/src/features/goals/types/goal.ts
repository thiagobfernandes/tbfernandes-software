export type GoalArea =
  "career" | "finance" | "learning" | "health" | "personal";
export type GoalStatus = "planned" | "active" | "paused" | "completed";

/** Measurable indicator, e.g. "Saved for the down payment: 6 000 / 20 000 BRL". */
export type GoalIndicator = {
  label: string;
  current: number;
  target: number;
  unit: string;
};

export type Goal = {
  id: string;
  name: string;
  description?: string;
  area: GoalArea;
  status: GoalStatus;
  priority: "low" | "normal" | "high";
  currentState?: string;
  desiredResult: string;
  doneCriteria?: string;
  dueDate?: string;
  indicator?: GoalIndicator;
  /** Sub-goal of another goal. */
  parentId?: string;
};

export type Milestone = {
  id: string;
  goalId: string;
  title: string;
  dueDate?: string;
  done: boolean;
};

export const goalAreaLabels: Record<GoalArea, string> = {
  career: "Career",
  finance: "Finance",
  learning: "Learning",
  health: "Health",
  personal: "Personal",
};
