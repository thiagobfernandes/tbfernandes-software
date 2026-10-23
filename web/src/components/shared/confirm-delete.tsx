"use client";

import { Trash2 } from "lucide-react";

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

type ConfirmDeleteProps = {
  /** What is being deleted, e.g. "note". */
  noun: string;
  name: string;
  onConfirm: () => void;
  trigger?: React.ReactNode;
};

export function ConfirmDelete({
  noun,
  name,
  onConfirm,
  trigger,
}: ConfirmDeleteProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${noun}`}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this {noun}?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{name}&rdquo; will be removed. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
