import { Suspense } from "react";

import { DetailSkeleton } from "@/components/shared/detail-skeleton";
import { GoalDetailPage } from "@/features/goals/components/goal-detail-page";

export default function Page({ params }: PageProps<"/goals/[goalId]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      {params.then(({ goalId }) => (
        <GoalDetailPage goalId={goalId} />
      ))}
    </Suspense>
  );
}
