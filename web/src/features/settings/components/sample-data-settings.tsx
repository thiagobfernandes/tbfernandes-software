"use client";

import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useWorkData, workActions } from "@/lib/sample-data/store";

export function SampleDataSettings() {
  const data = useWorkData();
  const records = Object.values(data).reduce(
    (sum, items) => sum + items.length,
    0,
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {records} records ({data.tasks.length} tasks, {data.notes.length} notes,{" "}
        {data.goals.length} goals and more) are stored in this browser while the
        API does not exist.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">
            <RotateCcw /> Reset sample data
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset sample data?</AlertDialogTitle>
            <AlertDialogDescription>
              Everything you created or changed in this browser is replaced by
              the original sample data in every module.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                workActions.reset();
                toast.success("Sample data restored");
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
