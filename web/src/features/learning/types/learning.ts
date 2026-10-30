import type { ProjectColor } from "@/features/projects/types/project";

export type LearningStatus = "not_started" | "in_progress" | "done";
export type ResourceKind = "video" | "course" | "book" | "exercises";
export type ResourceRole = "primary" | "support";

export type LearningResource = {
  id: string;
  title: string;
  provider: string;
  kind: ResourceKind;
  role: ResourceRole;
  /** What this resource is used for inside the track. */
  use: string;
  url?: string;
};

export type LearningTopic = {
  id: string;
  title: string;
  done: boolean;
};

export type LearningModule = {
  id: string;
  title: string;
  status: LearningStatus;
  targetDate: string;
  topics: LearningTopic[];
  resourceIds: string[];
};

export type LearningTrack = {
  id: string;
  title: string;
  description?: string;
  goalId?: string;
  status: LearningStatus;
  color: ProjectColor;
  startDate: string;
  targetDate: string;
  /** Repeatable study loop, one step per line. */
  method: string[];
  modules: LearningModule[];
  resources: LearningResource[];
};
