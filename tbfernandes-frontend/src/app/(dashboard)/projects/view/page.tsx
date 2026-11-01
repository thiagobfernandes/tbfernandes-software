"use client";

import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryId } from "@/components/shared/query-id";
import { ProjectDetailPage } from "@/features/projects/components/project-detail-page";

export default function Page() {
  return (
    <Suspense
      fallback={
        <PageContainer className="max-w-none">
          <Skeleton className="h-16 w-80" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-96 w-full" />
        </PageContainer>
      }
    >
      <Detail />
    </Suspense>
  );
}

function Detail() {
  return <ProjectDetailPage projectId={useQueryId()} />;
}
