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
  /** What else happens on delete, e.g. linked records that are kept. */
  consequence?: string;
  /** When set, deleting is not allowed and this explains why. */
  blockedReason?: string;
};

export function ConfirmDelete({
  noun,
  name,
  onConfirm,
  trigger,
  consequence,
  blockedReason,
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
          <AlertDialogTitle>
            {blockedReason
              ? `This ${noun} can't be deleted yet`
              : `Delete this ${noun}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {blockedReason ?? (
              <>
                &ldquo;{name}&rdquo; will be removed. {consequence}
                {consequence && " "}This cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {blockedReason ? "OK" : "Cancel"}
          </AlertDialogCancel>
          {!blockedReason && (
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
