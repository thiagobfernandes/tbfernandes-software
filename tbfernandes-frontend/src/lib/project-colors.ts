import type { ProjectColor } from "@/features/projects/types/project";

/** Categorical colors used to tell projects apart in lists, boards, and timelines. */
export const projectColorClasses: Record<
  ProjectColor,
  { bg: string; text: string; border: string }
> = {
  teal: {
    bg: "bg-teal-400",
    text: "text-teal-500 dark:text-teal-300",
    border: "border-l-teal-400",
  },
  violet: {
    bg: "bg-violet-400",
    text: "text-violet-600 dark:text-violet-300",
    border: "border-l-violet-400",
  },
  amber: {
    bg: "bg-amber-400",
    text: "text-amber-600 dark:text-amber-300",
    border: "border-l-amber-400",
  },
  rose: {
    bg: "bg-rose-400",
    text: "text-rose-600 dark:text-rose-300",
    border: "border-l-rose-400",
  },
  sky: {
    bg: "bg-sky-400",
    text: "text-sky-600 dark:text-sky-300",
    border: "border-l-sky-400",
  },
};
