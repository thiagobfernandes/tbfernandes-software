import { Suspense } from "react";
import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { TasksPage } from "@/features/tasks/components/tasks-page";

export const metadata: Metadata = { title: "Tasks" };

export default function Page() {
  return (
    // TasksPage reads ?q= from the URL, which is only known at request time.
    <Suspense
      fallback={
        <PageContainer className="max-w-none">
          <Skeleton className="h-12 w-72" />
          <Skeleton className="h-9 w-full max-w-xl" />
          <Skeleton className="h-96 w-full" />
        </PageContainer>
      }
    >
      <TasksPage />
    </Suspense>
  );
}
