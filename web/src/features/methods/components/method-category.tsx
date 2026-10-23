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
  development: { label: "Development", icon: GitCommitHorizontal },
  quality: { label: "Quality", icon: Bug },
  communication: { label: "Communication", icon: MessagesSquare },
};
