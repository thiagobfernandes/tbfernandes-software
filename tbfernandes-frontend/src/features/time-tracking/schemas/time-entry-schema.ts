import { z } from "zod";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function timeEntrySchema(endRequired: boolean) {
  return z
    .object({
      description: z
        .string()
        .trim()
        .min(1, "Diga no que você trabalhou")
        .max(200),
      date: z.iso.date("Escolha uma data"),
      startTime: z.string().regex(TIME, "Use o formato HH:mm"),
      endTime: z.string(),
      projectId: z.string(),
      taskId: z.string(),
      note: z.string().trim().max(2000),
    })
    .superRefine((values, context) => {
      if (!values.endTime) {
        if (endRequired)
          context.addIssue({
            code: "custom",
            path: ["endTime"],
            message: "Informe o fim",
          });
        return;
      }
      if (!TIME.test(values.endTime)) {
        context.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "Use o formato HH:mm",
        });
      } else if (values.endTime <= values.startTime) {
        context.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "O fim precisa ser depois do início",
        });
      }
    });
}

export const finishedEntrySchema = timeEntrySchema(true);
export const runningEntrySchema = timeEntrySchema(false);

export type TimeEntryFormValues = z.input<typeof finishedEntrySchema>;
