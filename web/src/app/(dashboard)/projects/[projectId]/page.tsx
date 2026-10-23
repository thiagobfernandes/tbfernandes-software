import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectDetailPage } from "@/features/projects/components/project-detail-page";

export default function Page({ params }: PageProps<"/projects/[projectId]">) {
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
      {params.then(({ projectId }) => (
        <ProjectDetailPage projectId={projectId} />
      ))}
    </Suspense>
  );
}
