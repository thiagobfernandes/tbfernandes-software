import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** The shape of each kind of screen, so loading looks like the page about to appear. */
export type SkeletonVariant =
  | "overview"
  | "list"
  | "metrics-list"
  | "split"
  | "board"
  | "calendar"
  | "chat"
  | "canvas"
  | "form";

function Heading() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-9 w-32" />
    </div>
  );
}

function Metrics({ count = 4 }: { count?: number }) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        count === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3",
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex min-h-36 flex-col justify-between rounded-lg border bg-card p-5"
        >
          <Skeleton className="h-4 w-24" />
          <div className="flex items-end justify-between">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Rows({ count = 7 }: { count?: number }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
        >
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="hidden h-6 w-20 sm:block" />
        </div>
      ))}
    </div>
  );
}

function Toolbar() {
  return (
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-9 w-32" />
    </div>
  );
}

const bodies: Record<SkeletonVariant, () => React.ReactNode> = {
  overview: () => (
    <>
      <Metrics />
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-72 rounded-lg lg:col-span-3" />
        <Skeleton className="h-72 rounded-lg lg:col-span-2" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-lg lg:col-span-2" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </>
  ),
  list: () => (
    <>
      <Toolbar />
      <Rows />
    </>
  ),
  "metrics-list": () => (
    <>
      <Metrics count={3} />
      <Rows count={6} />
    </>
  ),
  split: () => (
    <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-full" />
        <Rows count={6} />
      </div>
      <Skeleton className="h-[28rem] rounded-xl" />
    </div>
  ),
  board: () => (
    <>
      <Toolbar />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, column) => (
          <div
            key={column}
            className="flex flex-col gap-3 rounded-xl border bg-card p-3"
          >
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 3 - (column % 2) }, (_, card) => (
              <Skeleton key={card} className="h-24 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </>
  ),
  calendar: () => (
    <>
      <Toolbar />
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border">
        {Array.from({ length: 35 }, (_, index) => (
          <div key={index} className="flex h-24 flex-col gap-2 bg-card p-2">
            <Skeleton className="h-3 w-5" />
            {index % 3 === 0 && <Skeleton className="h-4 w-full" />}
          </div>
        ))}
      </div>
    </>
  ),
  chat: () => (
    <div className="flex min-h-[32rem] flex-col gap-4 rounded-xl border bg-card p-5">
      <Skeleton className="ml-auto h-12 w-1/2 rounded-lg" />
      <Skeleton className="h-24 w-2/3 rounded-lg" />
      <Skeleton className="ml-auto h-10 w-1/3 rounded-lg" />
      <Skeleton className="mt-auto h-11 w-full" />
    </div>
  ),
  canvas: () => <Skeleton className="h-[32rem] w-full rounded-xl" />,
  form: () => (
    <div className="flex max-w-2xl flex-col gap-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-xl border bg-card p-5"
        >
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
        </div>
      ))}
    </div>
  ),
};

/** Suspense and loading fallback in the shape of the screen it stands for. */
export function PageSkeleton({
  variant = "list",
}: {
  variant?: SkeletonVariant;
}) {
  return (
    <PageContainer
      className="max-w-none"
      aria-busy="true"
      aria-label="Carregando"
    >
      <Heading />
      {bodies[variant]()}
    </PageContainer>
  );
}

/** Which shape each route loads in. */
export function skeletonVariantFor(pathname: string): SkeletonVariant {
  if (pathname === "/") return "overview";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/assistant")) return "chat";
  if (pathname.startsWith("/knowledge/graph")) return "canvas";
  if (pathname.startsWith("/settings")) return "form";
  if (pathname.startsWith("/tasks")) return "board";
  if (pathname.startsWith("/contacts") || pathname === "/knowledge")
    return "split";
  if (
    pathname.startsWith("/finance") ||
    pathname.startsWith("/time-tracking") ||
    pathname.startsWith("/routines") ||
    pathname.startsWith("/goals") ||
    pathname.startsWith("/learning")
  )
    return "metrics-list";
  return "list";
}
