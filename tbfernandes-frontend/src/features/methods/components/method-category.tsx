import {
  Bug,
  GitCommitHorizontal,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";

import type { MethodCategory } from "@/features/methods/types/method";

export const methodCategoryMeta: Record<
  MethodCategory,
  { label: string; icon: LucideIcon }
> = {
  development: { label: "Desenvolvimento", icon: GitCommitHorizontal },
  quality: { label: "Qualidade", icon: Bug },
  communication: { label: "Comunicação", icon: MessagesSquare },
};
