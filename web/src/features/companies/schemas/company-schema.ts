import { z } from "zod";

export const companySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  tradeName: z.string().trim().max(120),
  relationship: z.enum(["contractor", "client", "partner", "own"]),
  status: z.enum(["active", "inactive", "closed"]),
  startDate: z.iso.date("Pick a start date"),
  mainContact: z.string().trim().max(120),
  description: z.string().trim().max(1000),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
