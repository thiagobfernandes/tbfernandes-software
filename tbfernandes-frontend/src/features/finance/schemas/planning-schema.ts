import { z } from "zod";

const month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use o formato AAAA-MM");
const optionalMonth = z.union([month, z.literal("")]);
const money = z.number("Informe um valor").positive("Deve ser maior que zero");
const optionalMoney = z.number().positive("Deve ser maior que zero").optional();
const certainty = z.enum(["confirmed", "estimated", "unknown"]);

export const commitmentSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome").max(120),
  category: z.enum([
    "salary",
    "freelance",
    "other_income",
    "loan",
    "fixed",
    "subscription",
    "extra",
  ]),
  amount: money,
  certainty,
  dueDay: z.number().int().min(1).max(31).optional(),
  startMonth: month,
  endMonth: optionalMonth,
  total: optionalMoney,
  cardId: z.string(),
  notes: z.string().trim().max(500),
});

export const changeSchema = z.object({
  fromMonth: month,
  amount: money,
  active: z.boolean(),
  certainty,
  note: z.string().trim().max(300),
});

export const monthValueSchema = z.object({
  month,
  amount: z.number("Informe um valor").min(0, "Não pode ser negativo"),
  certainty,
  note: z.string().trim().max(300),
});

export const paymentSchema = z.object({
  amount: money,
  paidOn: z.iso.date("Escolha a data"),
});

export const cardSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome").max(120),
  scope: z.enum(["personal", "business"]),
  dueDay: z.number("Informe o dia").int().min(1).max(31),
  monthlyEstimate: optionalMoney,
  estimateFrom: optionalMonth,
});

export const statementSchema = z.object({
  month,
  total: z.number("Informe o total").min(0, "Não pode ser negativo"),
  certainty,
});

export const purchaseSchema = z
  .object({
    description: z.string().trim().min(1, "Descreva a compra").max(200),
    total: money,
    installments: z.number("Informe as parcelas").int().min(1).max(72),
    firstMonth: month,
    withInterest: z.boolean(),
    installmentAmount: optionalMoney,
  })
  .refine((value) => !value.withInterest || value.installmentAmount, {
    path: ["installmentAmount"],
    message: "Com juros, informe o valor da parcela",
  });

export const fundSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome").max(120),
  kind: z.enum(["emergency", "travel", "goal"]),
  protected: z.boolean(),
  target: optionalMoney,
  targetMonth: optionalMonth,
  expectedContribution: z.number().min(0).optional(),
  contributorName: z.string().trim().max(120),
  purchaseId: z.string(),
});

export const movementSchema = z.object({
  date: z.iso.date("Escolha a data"),
  kind: z.enum(["deposit", "withdrawal"]),
  source: z.enum(["account", "external"]),
  status: z.enum(["confirmed", "expected"]),
  amount: money,
  contributor: z.string().trim().max(120),
  note: z.string().trim().max(300),
});

export const settingsSchema = z
  .object({
    safetyMargin: z.number().min(0).optional(),
    accountBalance: z.number().optional(),
    accountBalanceOn: z.union([z.iso.date(), z.literal("")]),
    scenarios: z.string().max(500),
  })
  .refine(
    (value) => (value.accountBalance === undefined) === !value.accountBalanceOn,
    { path: ["accountBalanceOn"], message: "Informe o saldo junto com a data" },
  );

/** "Conservador: 3000" per line → salary bands. */
export function parseScenarios(text: string) {
  return text
    .split("\n")
    .map((line) => line.split(":"))
    .filter(([label, amount]) => label?.trim() && amount?.trim())
    .map(([label, amount]) => ({
      label: label.trim(),
      amount: Number(amount.trim().replace(/\./g, "").replace(",", ".")),
    }))
    .filter((scenario) => scenario.amount > 0);
}

export const certaintyOptions = [
  { value: "confirmed", label: "Confirmado" },
  { value: "estimated", label: "Estimado" },
  { value: "unknown", label: "Desconhecido" },
];
