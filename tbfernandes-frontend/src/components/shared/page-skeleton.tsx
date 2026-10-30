import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

/** Suspense fallback for pages that read the URL at request time. */
export function PageSkeleton() {
  return (
    <PageContainer className="max-w-none">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-9 w-full max-w-xl" />
      <Skeleton className="h-96 w-full" />
    </PageContainer>
  );
}
