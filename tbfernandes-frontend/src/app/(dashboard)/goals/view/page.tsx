"use client";

import { Suspense } from "react";

import { DetailSkeleton } from "@/components/shared/detail-skeleton";
import { useQueryId } from "@/components/shared/query-id";
import { GoalDetailPage } from "@/features/goals/components/goal-detail-page";

export default function Page() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <Detail />
    </Suspense>
  );
}

function Detail() {
  return <GoalDetailPage goalId={useQueryId()} />;
}
