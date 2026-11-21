"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { TaskDetail } from "@/features/tasks/components/task-detail";
import { useWorkData } from "@/lib/sample-data/store";

type TaskDetailSheetProps = {
  taskId?: string;
  onOpenChange: (open: boolean) => void;
};

/** The task detail as a sheet, for pages without a side panel (and phones). */
export function TaskDetailSheet({
  taskId,
  onOpenChange,
}: TaskDetailSheetProps) {
  const data = useWorkData();
  const task = data.tasks.find((item) => item.id === taskId);

  return (
    <Sheet open={Boolean(task)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md [&>button:last-child]:top-3">
        <SheetTitle className="sr-only">{task?.title ?? "Tarefa"}</SheetTitle>
        <SheetDescription className="sr-only">
          Detalhes da tarefa
        </SheetDescription>
        {task && (
          <TaskDetail
            task={task}
            onClose={() => onOpenChange(false)}
            toolbar={<span className="w-8" aria-hidden />}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
