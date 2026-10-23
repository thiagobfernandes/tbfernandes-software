"use client";

import { toast } from "sonner";

import { EntityFormDialog } from "@/components/shared/entity-form-dialog";
import { goalSchema } from "@/features/goals/schemas/goal-schema";
import { goalAreaLabels, type Goal } from "@/features/goals/types/goal";
import { dataActions, useAppData } from "@/lib/sample-data/store";

type GoalFormDialogProps = {
  trigger: React.ReactNode;
  goal?: Goal;
  defaultParentId?: string;
};

export function GoalFormDialog({
  trigger,
  goal,
  defaultParentId,
}: GoalFormDialogProps) {
  const { goals } = useAppData();
  const parents = goals.filter((item) => item.id !== goal?.id);

  return (
    <EntityFormDialog
      trigger={trigger}
      className="sm:max-w-2xl"
      title={goal ? "Edit goal" : "New goal"}
      description="A goal turns into milestones, projects and tasks you can track."
      schema={goalSchema}
      submitLabel={goal ? "Save changes" : "Create goal"}
      defaults={{
        name: goal?.name ?? "",
        area: goal?.area ?? "career",
        status: goal?.status ?? "active",
        priority: goal?.priority ?? "normal",
        dueDate: goal?.dueDate ?? "",
        parentId: goal?.parentId ?? defaultParentId ?? "",
        description: goal?.description ?? "",
        currentState: goal?.currentState ?? "",
        desiredResult: goal?.desiredResult ?? "",
        doneCriteria: goal?.doneCriteria ?? "",
        indicatorLabel: goal?.indicator?.label ?? "",
        indicatorCurrent: goal?.indicator?.current,
        indicatorTarget: goal?.indicator?.target,
        indicatorUnit: goal?.indicator?.unit ?? "",
      }}
      fields={[
        {
          name: "name",
          label: "Name",
          type: "text",
          required: true,
          full: true,
        },
        {
          name: "area",
          label: "Area",
          type: "select",
          options: Object.entries(goalAreaLabels).map(([value, label]) => ({
            value,
            label,
          })),
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { value: "planned", label: "Planned" },
            { value: "active", label: "Active" },
            { value: "paused", label: "Paused" },
            { value: "completed", label: "Completed" },
          ],
        },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          options: [
            { value: "low", label: "Low" },
            { value: "normal", label: "Normal" },
            { value: "high", label: "High" },
          ],
        },
        { name: "dueDate", label: "Due date", type: "date" },
        {
          name: "parentId",
          label: "Part of goal",
          type: "select",
          optional: true,
          options: parents.map((item) => ({
            value: item.id,
            label: item.name,
          })),
          full: true,
        },
        {
          name: "currentState",
          label: "Where I am now",
          type: "textarea",
          rows: 2,
        },
        {
          name: "desiredResult",
          label: "Desired result",
          type: "textarea",
          rows: 2,
          required: true,
        },
        {
          name: "doneCriteria",
          label: "How I know it is done",
          type: "textarea",
          rows: 2,
        },
        {
          name: "indicatorLabel",
          label: "Indicator",
          type: "text",
          placeholder: "e.g. Study hours",
          hint: "Optional measurable number.",
        },
        {
          name: "indicatorUnit",
          label: "Unit",
          type: "text",
          placeholder: "h, BRL, features",
        },
        {
          name: "indicatorCurrent",
          label: "Current value",
          type: "number",
          min: 0,
        },
        {
          name: "indicatorTarget",
          label: "Target value",
          type: "number",
          min: 0,
        },
      ]}
      onSubmit={({
        indicatorLabel,
        indicatorCurrent,
        indicatorTarget,
        indicatorUnit,
        ...values
      }) => {
        const data = {
          ...values,
          indicator:
            indicatorLabel && indicatorTarget
              ? {
                  label: indicatorLabel,
                  current: indicatorCurrent ?? 0,
                  target: indicatorTarget,
                  unit: indicatorUnit ?? "",
                }
              : undefined,
        } as Omit<Goal, "id">;
        if (goal) {
          dataActions.update("goals", goal.id, data);
          toast.success("Goal updated");
        } else {
          const created = dataActions.create("goals", data);
          toast.success(`Goal "${created.name}" created`);
        }
      }}
    />
  );
}
