export type StudyStatus = "planned" | "in_progress" | "paused" | "completed";

export type Study = {
  id: string;
  name: string;
  description?: string;
  status: StudyStatus;
  goalId?: string;
  skillIds: string[];
  startDate?: string;
  dueDate?: string;
  nextActivity?: string;
};

export type MaterialType =
  | "video"
  | "article"
  | "book"
  | "docs"
  | "course"
  | "repository"
  | "paper"
  | "note";

/** Consuming a material is not the same as mastering the topic. */
export type MaterialStatus =
  "to_consume" | "in_progress" | "consumed" | "reviewed";

export type LearningMaterial = {
  id: string;
  studyId?: string;
  title: string;
  type: MaterialType;
  url?: string;
  status: MaterialStatus;
  notes?: string;
};

export type Skill = {
  id: string;
  name: string;
  /** Self-declared 1–5; not an objective proficiency measure. */
  level: number;
  evidence?: string;
};

export type CertificationStatus =
  "planned" | "studying" | "obtained" | "expired";

export type Certification = {
  id: string;
  name: string;
  issuer: string;
  status: CertificationStatus;
  obtainedAt?: string;
  expiresAt?: string;
  validationUrl?: string;
  studyIds: string[];
};

export type Education = {
  id: string;
  institution: string;
  course: string;
  degree: string;
  status: "in_progress" | "completed" | "paused";
  startDate: string;
  endDate?: string;
};
