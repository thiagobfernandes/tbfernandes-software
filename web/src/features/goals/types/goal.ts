import type { ProjectColor } from "@/features/projects/types/project";

export type GoalStatus = "planned" | "active" | "achieved" | "dropped";
export type GoalCategory = "education" | "career" | "personal" | "financial";

export type GoalMilestone = {
  id: string;
  title: string;
  dueDate?: string;
  done: boolean;
};

export type Goal = {
  id: string;
  title: string;
  description?: string;
  /** Why this goal matters; shown so the reason is never lost. */
  motivation?: string;
  category: GoalCategory;
  status: GoalStatus;
  color: ProjectColor;
  targetDate: string;
  milestones: GoalMilestone[];
  /** Learning tracks that prepare for this goal. */
  learningTrackIds: string[];
};
