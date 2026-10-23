import type { Metadata } from "next";

import { TasksPage } from "@/features/tasks/components/tasks-page";

export const metadata: Metadata = { title: "Tasks" };

export default function Page() {
  return <TasksPage />;
}
