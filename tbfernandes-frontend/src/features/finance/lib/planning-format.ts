import type {
  Certainty,
  CommitmentCategory,
  FundKind,
  LineGroup,
  Risk,
} from "@/features/finance/types/planning";

/** The plan keeps the cents: R$ 861,99, not R$ 862. */
const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatMoney(value: number) {
  return brl.format(value);
}

export function formatSigned(value: number) {
  return value > 0 ? `+${brl.format(value)}` : brl.format(value);
}

const monthLong = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-12" → "dezembro de 2026". */
export function formatMonthLong(month: string) {
  const text = monthLong.format(new Date(`${month}-01T00:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const monthShort = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

/** "2026-12" → "dez/26". */
export function formatMonthShort(month: string) {
  return monthShort
    .format(new Date(`${month}-01T00:00:00Z`))
    .replace(". de ", "/")
    .replace(" de ", "/");
}

export const certaintyLabels: Record<Certainty, string> = {
  confirmed: "Confirmado",
  estimated: "Estimado",
  unknown: "Desconhecido",
};

export const groupLabels: Record<LineGroup, string> = {
  income: "Receitas",
  card: "Cartões",
  loan: "Empréstimos e dívidas",
  fixed: "Contas fixas",
  subscription: "Assinaturas",
  extra: "Gastos extras",
};

export const groupOrder: LineGroup[] = [
  "income",
  "card",
  "loan",
  "fixed",
  "subscription",
  "extra",
];

export const categoryLabels: Record<CommitmentCategory, string> = {
  salary: "Salário",
  freelance: "Freelance",
  other_income: "Outra receita",
  loan: "Empréstimo ou dívida",
  fixed: "Conta fixa",
  subscription: "Assinatura",
  extra: "Gasto extra",
};

export const riskLabels: Record<Risk, string> = {
  low: "Baixo",
  medium: "Atenção",
  high: "Alto",
};

export const fundKindLabels: Record<FundKind, string> = {
  emergency: "Reserva de emergência",
  travel: "Viagem",
  goal: "Meta",
};

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Algo deu errado";
}

/** Adds whole months to a "YYYY-MM" key. */
export function plusMonths(month: string, amount: number) {
  const [year, number] = month.split("-").map(Number);
  const index = year * 12 + (number - 1) + amount;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}
