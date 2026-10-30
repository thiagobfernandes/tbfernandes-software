import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

/** Suspense fallback for detail routes while params resolve. */
export function DetailSkeleton() {
  return (
    <PageContainer className="max-w-none">
      <Skeleton className="h-16 w-80" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-96 w-full" />
    </PageContainer>
  );
}
