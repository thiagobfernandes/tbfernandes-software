import { Suspense } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { MethodDetailPage } from "@/features/methods/components/method-detail-page";

export default function Page({ params }: PageProps<"/methods/[methodId]">) {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <Skeleton className="h-16 w-80" />
          <Skeleton className="h-96 w-full" />
        </PageContainer>
      }
    >
      {params.then(({ methodId }) => (
        <MethodDetailPage methodId={methodId} />
      ))}
    </Suspense>
  );
}
