"use client";

import { useState } from "react";
import { ListPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Method } from "@/features/methods/types/method";
import { isOpenTask } from "@/lib/sample-data/work";
import { dataActions, useAppData, workActions } from "@/lib/sample-data/store";

const NEW_TASK = "__new";

/**
 * Applies a method to a task: each step becomes a checklist item, so the
 * method is followed (and tracked) inside the task itself.
 */
export function UseMethodDialog({ method }: { method: Method }) {
  const { tasks } = useAppData();
  const openTasks = tasks.filter(isOpenTask);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(NEW_TASK);
  const [title, setTitle] = useState("");

  function apply() {
    const steps = method.steps.map((step) => ({
      id: crypto.randomUUID().slice(0, 8),
      title: step.title,
      done: false,
    }));
    if (target === NEW_TASK) {
      const created = workActions.addTask({
        title: title.trim() || method.title,
        status: "todo",
        priority: "normal",
        description: `Following the "${method.title}" method.`,
        checklistItems: steps,
      });
      toast.success(
        `Task "${created.title}" created with ${steps.length} steps`,
      );
    } else {
      const task = dataActions.get("tasks", target)!;
      workActions.updateTask(task.id, {
        checklistItems: [...(task.checklistItems ?? []), ...steps],
        checklist: undefined,
      });
      toast.success(`${steps.length} steps added to "${task.title}"`);
    }
    setOpen(false);
    setTitle("");
    setTarget(NEW_TASK);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ListPlus /> Use on a task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Use &ldquo;{method.title}&rdquo;</DialogTitle>
          <DialogDescription>
            Its {method.steps.length} steps become checklist items on the task.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="use-method-target">Task</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger id="use-method-target" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NEW_TASK}>Create a new task</SelectItem>
                {openTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {target === NEW_TASK && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="use-method-title">New task title</Label>
              <Input
                id="use-method-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={method.title}
              />
            </div>
          )}
          <ol className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-3 text-sm">
            {method.steps.map((step, index) => (
              <li key={index} className="flex gap-2">
                <span className="w-4 shrink-0 text-right text-muted-foreground tabular-nums">
                  {index + 1}.
                </span>
                {step.title}
              </li>
            ))}
          </ol>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={apply}>Add steps</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
