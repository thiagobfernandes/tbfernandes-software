import { YearMonth } from '../../../../common/domain';
import { Commitment } from './commitment';
import { CreditCard } from './credit-card';
import { MonthSnapshot } from './month-report';
import { PlanningSettings } from './planning-settings';
import { ReserveFund } from './reserve-fund';

export abstract class CommitmentRepository {
  abstract save(commitment: Commitment): Promise<Commitment>;
  abstract findById(ownerId: string, id: string): Promise<Commitment | null>;
  /** By start month, then name. */
  abstract findAll(ownerId: string): Promise<Commitment[]>;
  abstract delete(commitment: Commitment): Promise<void>;
}

export abstract class CreditCardRepository {
  abstract save(card: CreditCard): Promise<CreditCard>;
  abstract findById(ownerId: string, id: string): Promise<CreditCard | null>;
  abstract findAll(ownerId: string): Promise<CreditCard[]>;
  abstract delete(card: CreditCard): Promise<void>;
}

export abstract class ReserveFundRepository {
  abstract save(fund: ReserveFund): Promise<ReserveFund>;
  abstract findById(ownerId: string, id: string): Promise<ReserveFund | null>;
  abstract findAll(ownerId: string): Promise<ReserveFund[]>;
  abstract delete(fund: ReserveFund): Promise<void>;
}

export abstract class PlanningSettingsRepository {
  abstract save(settings: PlanningSettings): Promise<PlanningSettings>;
  abstract find(ownerId: string): Promise<PlanningSettings | null>;
}

export abstract class MonthSnapshotRepository {
  /** Keeps the first snapshot of a month: a second one is ignored. */
  abstract saveIfAbsent(snapshot: MonthSnapshot): Promise<void>;
  abstract find(
    ownerId: string,
    month: YearMonth,
  ): Promise<MonthSnapshot | null>;
}
