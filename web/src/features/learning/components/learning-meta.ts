import {
  BookMarked,
  FileText,
  GitBranch,
  MonitorPlay,
  Newspaper,
  ScrollText,
  StickyNote,
  type LucideIcon,
} from "lucide-react";

import type {
  CertificationStatus,
  MaterialStatus,
  MaterialType,
  StudyStatus,
} from "@/features/learning/types/learning";

export const studyStatusLabels: Record<StudyStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  paused: "Paused",
  completed: "Completed",
};

export const materialStatusLabels: Record<MaterialStatus, string> = {
  to_consume: "To consume",
  in_progress: "In progress",
  consumed: "Consumed",
  reviewed: "Reviewed",
};

export const materialTypeMeta: Record<
  MaterialType,
  { label: string; icon: LucideIcon }
> = {
  video: { label: "Video", icon: MonitorPlay },
  article: { label: "Article", icon: Newspaper },
  book: { label: "Book", icon: BookMarked },
  docs: { label: "Docs", icon: FileText },
  course: { label: "Course", icon: MonitorPlay },
  repository: { label: "Repository", icon: GitBranch },
  paper: { label: "Paper", icon: ScrollText },
  note: { label: "Note", icon: StickyNote },
};

export const certificationStatusLabels: Record<CertificationStatus, string> = {
  planned: "Planned",
  studying: "Studying",
  obtained: "Obtained",
  expired: "Expired",
};

export const skillLevelLabels = [
  "",
  "Beginner",
  "Basic",
  "Intermediate",
  "Advanced",
  "Expert",
];

const options = <T extends string>(labels: Record<T, string>) =>
  Object.entries(labels).map(([value, label]) => ({
    value,
    label: label as string,
  }));

export const studyStatusOptions = options(studyStatusLabels);
export const materialStatusOptions = options(materialStatusLabels);
export const certificationStatusOptions = options(certificationStatusLabels);
export const materialTypeOptions = Object.entries(materialTypeMeta).map(
  ([value, meta]) => ({
    value,
    label: meta.label,
  }),
);
