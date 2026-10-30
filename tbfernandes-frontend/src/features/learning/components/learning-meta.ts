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
  planned: "Planejado",
  in_progress: "Em andamento",
  paused: "Pausado",
  completed: "Concluído",
};

export const materialStatusLabels: Record<MaterialStatus, string> = {
  to_consume: "A consumir",
  in_progress: "Em andamento",
  consumed: "Consumido",
  reviewed: "Revisado",
};

export const materialTypeMeta: Record<
  MaterialType,
  { label: string; icon: LucideIcon }
> = {
  video: { label: "Vídeo", icon: MonitorPlay },
  article: { label: "Artigo", icon: Newspaper },
  book: { label: "Livro", icon: BookMarked },
  docs: { label: "Documentação", icon: FileText },
  course: { label: "Curso", icon: MonitorPlay },
  repository: { label: "Repositório", icon: GitBranch },
  paper: { label: "Artigo científico", icon: ScrollText },
  note: { label: "Nota", icon: StickyNote },
};

export const certificationStatusLabels: Record<CertificationStatus, string> = {
  planned: "Planejada",
  studying: "Estudando",
  obtained: "Obtida",
  expired: "Vencida",
};

export const skillLevelLabels = [
  "",
  "Iniciante",
  "Básico",
  "Intermediário",
  "Avançado",
  "Especialista",
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
