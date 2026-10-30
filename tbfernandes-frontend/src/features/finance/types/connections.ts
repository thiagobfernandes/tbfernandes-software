import type { EntryScope } from "@/features/finance/types/finance";

export type ConnectionStatus = "active" | "needs_reconnect" | "error";

export type BankAccount = {
  externalId: string;
  name: string;
  type: "bank" | "credit";
  balance?: number | null;
  currency?: string | null;
};

export type BankConnection = {
  id: string;
  institution: string;
  scope: EntryScope;
  status: ConnectionStatus;
  lastSyncedAt?: string | null;
  lastError?: string | null;
  accounts: BankAccount[];
};

export type ConnectToken = {
  accessToken: string;
  /** Set when logging in again: the widget updates this item. */
  itemId?: string | null;
};

export type SyncResult = {
  imported: number;
  connection: BankConnection;
};
