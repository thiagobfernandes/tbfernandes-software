import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

/** The Prospecção screen's own shape while it loads: funnel, list, chat and rail. */
export function ProspectingSkeleton() {
  return (
    <PageContainer
      className="flex max-w-none flex-col gap-6"
      aria-busy="true"
      aria-label="Carregando a prospecção"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid overflow-hidden rounded-xl border bg-card lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="flex flex-col gap-3 border-l p-5 first:border-l-0"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-12" />
              <Skeleton className="h-1 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="hidden flex-col gap-3 border-l p-5 lg:flex">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] xl:h-[clamp(34rem,calc(100vh-9rem),46rem)] xl:items-stretch">
        <div className="flex flex-col overflow-hidden rounded-xl border bg-card xl:h-full">
          <div className="flex flex-col gap-2 border-b p-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="flex gap-3 border-b px-3 py-3 last:border-b-0"
            >
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 xl:h-full xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="flex min-h-[32rem] flex-col gap-4 rounded-xl border bg-card p-5 xl:h-full xl:min-h-0">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="ml-auto h-20 w-2/3 rounded-2xl" />
            <Skeleton className="h-12 w-1/2 rounded-2xl" />
            <Skeleton className="mt-auto h-11 w-full" />
          </div>
          <div className="flex h-fit flex-col gap-3 rounded-xl border bg-card p-5 xl:h-full">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
