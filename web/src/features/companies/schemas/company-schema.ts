import { z } from "zod";

export const companySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120),
  tradeName: z.string().trim().max(120),
  relationship: z.enum(["contractor", "client", "partner", "own"]),
  status: z.enum(["active", "inactive", "closed"]),
  startDate: z.iso.date("Escolha a data de início"),
  mainContact: z.string().trim().max(120),
  description: z.string().trim().max(1000),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
