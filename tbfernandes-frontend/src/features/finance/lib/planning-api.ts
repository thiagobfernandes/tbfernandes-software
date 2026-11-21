import type {
  CardPurchase,
  Certainty,
  Commitment,
  CommitmentCategory,
  CreditCard,
  FundKind,
  MonthProjection,
  MonthReport,
  PlanningSettings,
  PlanOverview,
  ReserveFund,
  ReserveMovement,
  ScenarioOperation,
  Simulation,
} from "@/features/finance/types/planning";
import type { EntryScope } from "@/features/finance/types/finance";
import { apiFetch } from "@/lib/api/client";

// The plan lives on the server: projections, CSV imports and the simulator use the API's
// domain rules, so these screens talk to it directly, like the bank connections.
const PLANNING = "/api/v1/finance/planning";
const COMMITMENTS = "/api/v1/finance/commitments";
const CARDS = "/api/v1/finance/cards";
const RESERVES = "/api/v1/finance/reserves";

export type CommitmentInput = {
  name: string;
  category: CommitmentCategory;
  dueDay: number | null;
  startMonth: string;
  endMonth: string | null;
  total: number | null;
  cardId: string | null;
  notes: string | null;
};

export type CardInput = {
  name: string;
  scope: EntryScope;
  dueDay: number;
  monthlyEstimate: number | null;
  estimateFrom: string | null;
};

export type PurchaseInput = Omit<CardPurchase, "id" | "installmentAmount"> & {
  installmentAmount: number | null;
};

export type FundInput = Omit<
  ReserveFund,
  | "id"
  | "balance"
  | "potentialBalance"
  | "pending"
  | "contributionsReceived"
  | "movements"
>;

export type MovementInput = Omit<ReserveMovement, "id">;

const send = <T>(path: string, method: string, body?: unknown) =>
  apiFetch<T>(path, { method, body });

export const planningApi = {
  projection: (from: string, months: number) =>
    apiFetch<MonthProjection[]>(
      `${PLANNING}/projection?from=${from}&months=${months}`,
    ),
  overview: (month?: string) =>
    apiFetch<PlanOverview>(
      `${PLANNING}/overview${month ? `?month=${month}` : ""}`,
    ),
  report: (month: string) =>
    apiFetch<MonthReport>(`${PLANNING}/report?month=${month}`),
  simulate: (from: string, months: number, operations: ScenarioOperation[]) =>
    send<Simulation>(`${PLANNING}/simulate`, "POST", {
      from,
      months,
      operations,
    }),
  applyScenario: (operations: ScenarioOperation[]) =>
    send<void>(`${PLANNING}/scenario/apply`, "POST", { operations }),
  settings: () => apiFetch<PlanningSettings>(`${PLANNING}/settings`),
  updateSettings: (settings: Omit<PlanningSettings, "closedThrough">) =>
    send<PlanningSettings>(`${PLANNING}/settings`, "PUT", settings),
  closeThrough: (month: string) =>
    send<PlanningSettings>(`${PLANNING}/months/close`, "POST", { month }),
  reopenFrom: (month: string) =>
    send<PlanningSettings>(`${PLANNING}/months/reopen`, "POST", { month }),

  commitments: () => apiFetch<Commitment[]>(COMMITMENTS),
  createCommitment: (
    input: CommitmentInput & {
      amount: number;
      certainty: Certainty;
      note: string | null;
    },
  ) => send<Commitment>(COMMITMENTS, "POST", input),
  updateCommitment: (id: string, input: CommitmentInput) =>
    send<Commitment>(`${COMMITMENTS}/${id}`, "PUT", input),
  deleteCommitment: (id: string) =>
    send<void>(`${COMMITMENTS}/${id}`, "DELETE"),
  changeFrom: (
    id: string,
    change: {
      fromMonth: string;
      amount: number;
      active: boolean;
      certainty: Certainty;
      note: string | null;
    },
  ) => send<Commitment>(`${COMMITMENTS}/${id}/changes`, "POST", change),
  setMonth: (
    id: string,
    month: string,
    value: { amount: number; certainty: Certainty; note: string | null },
  ) => send<Commitment>(`${COMMITMENTS}/${id}/months/${month}`, "PUT", value),
  clearMonth: (id: string, month: string) =>
    send<Commitment>(`${COMMITMENTS}/${id}/months/${month}`, "DELETE"),
  pay: (
    id: string,
    month: string,
    payment: { amount: number; paidOn: string },
  ) =>
    send<Commitment>(`${COMMITMENTS}/${id}/payments/${month}`, "PUT", payment),
  unpay: (id: string, month: string) =>
    send<Commitment>(`${COMMITMENTS}/${id}/payments/${month}`, "DELETE"),

  cards: () => apiFetch<CreditCard[]>(CARDS),
  createCard: (input: CardInput) => send<CreditCard>(CARDS, "POST", input),
  updateCard: (id: string, input: CardInput) =>
    send<CreditCard>(`${CARDS}/${id}`, "PUT", input),
  deleteCard: (id: string) => send<void>(`${CARDS}/${id}`, "DELETE"),
  importStatement: (id: string, dueDate: string, csv: string) =>
    send<{
      month: string;
      imported: number;
      skipped: number;
      total: number;
      card: CreditCard;
    }>(`${CARDS}/${id}/imports`, "POST", { dueDate, csv }),
  setStatement: (
    id: string,
    month: string,
    total: number,
    certainty: Certainty,
  ) =>
    send<CreditCard>(`${CARDS}/${id}/statements/${month}`, "PUT", {
      total,
      certainty,
    }),
  removeStatement: (id: string, month: string) =>
    send<CreditCard>(`${CARDS}/${id}/statements/${month}`, "DELETE"),
  payStatement: (
    id: string,
    month: string,
    payment: { amount: number; paidOn: string },
  ) =>
    send<CreditCard>(
      `${CARDS}/${id}/statements/${month}/payment`,
      "PUT",
      payment,
    ),
  unpayStatement: (id: string, month: string) =>
    send<CreditCard>(`${CARDS}/${id}/statements/${month}/payment`, "DELETE"),
  addPurchase: (id: string, input: PurchaseInput) =>
    send<CreditCard>(`${CARDS}/${id}/purchases`, "POST", input),
  updatePurchase: (id: string, purchaseId: string, input: PurchaseInput) =>
    send<CreditCard>(`${CARDS}/${id}/purchases/${purchaseId}`, "PUT", input),
  removePurchase: (id: string, purchaseId: string) =>
    send<CreditCard>(`${CARDS}/${id}/purchases/${purchaseId}`, "DELETE"),
  classify: (id: string, transactionId: string, commitmentId: string | null) =>
    send<CreditCard>(
      `${CARDS}/${id}/transactions/${transactionId}/classification`,
      "PUT",
      { commitmentId },
    ),

  funds: () => apiFetch<ReserveFund[]>(RESERVES),
  createFund: (input: FundInput) => send<ReserveFund>(RESERVES, "POST", input),
  updateFund: (id: string, input: FundInput) =>
    send<ReserveFund>(`${RESERVES}/${id}`, "PUT", input),
  deleteFund: (id: string) => send<void>(`${RESERVES}/${id}`, "DELETE"),
  addMovement: (id: string, input: MovementInput) =>
    send<ReserveFund>(`${RESERVES}/${id}/movements`, "POST", input),
  updateMovement: (id: string, movementId: string, input: MovementInput) =>
    send<ReserveFund>(
      `${RESERVES}/${id}/movements/${movementId}`,
      "PUT",
      input,
    ),
  removeMovement: (id: string, movementId: string) =>
    send<ReserveFund>(`${RESERVES}/${id}/movements/${movementId}`, "DELETE"),
};

export type { FundKind };
