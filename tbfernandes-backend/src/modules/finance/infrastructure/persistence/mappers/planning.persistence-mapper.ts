import {
  Commitment,
  CreditCard,
  MonthSnapshot,
  normalizeTitle,
  PlanningSettings,
  ReserveFund,
} from '../../../domain';
import {
  CardPurchaseEntity,
  CardStatementEntity,
  CardTransactionEntity,
  CommitmentChangeEntity,
  CommitmentEntity,
  CommitmentMonthEntity,
  CommitmentPaymentEntity,
  CreditCardEntity,
  MonthSnapshotEntity,
  PlanningSettingsEntity,
  ReserveFundEntity,
  ReserveMovementEntity,
} from '../planning.entities';

const row = <T extends object>(type: new () => T, values: T): T =>
  Object.assign(new type(), values);

export interface CommitmentRows {
  changes: CommitmentChangeEntity[];
  months: CommitmentMonthEntity[];
  payments: CommitmentPaymentEntity[];
}

export const CommitmentPersistenceMapper = {
  toDomain(entity: CommitmentEntity, rows: CommitmentRows): Commitment {
    return Commitment.restore(
      entity.id,
      entity.ownerId,
      {
        name: entity.name,
        category: entity.category,
        dueDay: entity.dueDay,
        startMonth: entity.startMonth,
        endMonth: entity.endMonth,
        total: entity.total,
        cardId: entity.cardId,
        notes: entity.notes,
      },
      rows.changes.map(({ fromMonth, amount, active, certainty, note }) => ({
        fromMonth,
        amount,
        active,
        certainty,
        note,
      })),
      rows.months.map(({ month, amount, certainty, note }) => ({
        month,
        amount,
        certainty,
        note,
      })),
      rows.payments.map(({ month, amount, paidOn }) => ({
        month,
        amount,
        paidOn,
      })),
    );
  },

  toEntity(
    commitment: Commitment,
    entity: CommitmentEntity = new CommitmentEntity(),
  ): CommitmentEntity {
    return Object.assign(entity, {
      id: commitment.id,
      ownerId: commitment.ownerId,
      ...commitment.details,
    });
  },

  toRows(commitment: Commitment): CommitmentRows {
    const commitmentId = commitment.id;
    return {
      changes: commitment.changes.map((change) =>
        row(CommitmentChangeEntity, { commitmentId, ...change }),
      ),
      months: commitment.overrides.map((override) =>
        row(CommitmentMonthEntity, { commitmentId, ...override }),
      ),
      payments: commitment.payments.map((payment) =>
        row(CommitmentPaymentEntity, { commitmentId, ...payment }),
      ),
    };
  },
};

export interface CardRows {
  statements: CardStatementEntity[];
  transactions: CardTransactionEntity[];
  purchases: CardPurchaseEntity[];
}

export const CreditCardPersistenceMapper = {
  toDomain(entity: CreditCardEntity, rows: CardRows): CreditCard {
    return CreditCard.restore(
      entity.id,
      entity.ownerId,
      {
        name: entity.name,
        scope: entity.scope,
        dueDay: entity.dueDay,
        monthlyEstimate: entity.monthlyEstimate,
        estimateFrom: entity.estimateFrom,
      },
      rows.statements.map((statement) => ({
        month: statement.month,
        dueDate: statement.dueDate,
        total: statement.total,
        source: statement.source,
        certainty: statement.certainty,
        paidAmount: statement.paidAmount,
        paidOn: statement.paidOn,
      })),
      rows.transactions.map((transaction) => ({
        id: transaction.id,
        statementMonth: transaction.statementMonth,
        date: transaction.date,
        title: transaction.title,
        amount: transaction.amount,
        installmentNumber: transaction.installmentNumber,
        installmentTotal: transaction.installmentTotal,
        occurrence: transaction.occurrence,
        commitmentId: transaction.commitmentId,
      })),
      rows.purchases.map((purchase) => ({
        id: purchase.id,
        description: purchase.description,
        total: purchase.total,
        installments: purchase.installments,
        installmentAmount: purchase.installmentAmount,
        firstMonth: purchase.firstMonth,
        withInterest: purchase.withInterest,
      })),
    );
  },

  toEntity(
    card: CreditCard,
    entity: CreditCardEntity = new CreditCardEntity(),
  ): CreditCardEntity {
    return Object.assign(entity, {
      id: card.id,
      ownerId: card.ownerId,
      ...card.details,
    });
  },

  toRows(card: CreditCard): CardRows {
    const cardId = card.id;
    return {
      statements: card.statements.map((statement) =>
        row(CardStatementEntity, { cardId, ...statement }),
      ),
      transactions: card.transactions.map((transaction) =>
        row(CardTransactionEntity, {
          cardId,
          ...transaction,
          titleKey: normalizeTitle(transaction.title),
        }),
      ),
      purchases: card.purchases.map((purchase) =>
        row(CardPurchaseEntity, { cardId, ...purchase }),
      ),
    };
  },
};

export const ReserveFundPersistenceMapper = {
  toDomain(
    entity: ReserveFundEntity,
    movements: ReserveMovementEntity[],
  ): ReserveFund {
    return ReserveFund.restore(
      entity.id,
      entity.ownerId,
      {
        name: entity.name,
        kind: entity.kind,
        protected: entity.protected,
        target: entity.target,
        targetMonth: entity.targetMonth,
        expectedContribution: entity.expectedContribution,
        contributorName: entity.contributorName,
        purchaseId: entity.purchaseId,
      },
      movements.map((movement) => ({
        id: movement.id,
        date: movement.date,
        kind: movement.kind,
        source: movement.source,
        status: movement.status,
        amount: movement.amount,
        contributor: movement.contributor,
        note: movement.note,
      })),
    );
  },

  toEntity(
    fund: ReserveFund,
    entity: ReserveFundEntity = new ReserveFundEntity(),
  ): ReserveFundEntity {
    return Object.assign(entity, {
      id: fund.id,
      ownerId: fund.ownerId,
      ...fund.details,
    });
  },

  toMovementRows(fund: ReserveFund): ReserveMovementEntity[] {
    return fund.movements.map((movement) =>
      row(ReserveMovementEntity, { fundId: fund.id, ...movement }),
    );
  },
};

export const PlanningSettingsPersistenceMapper = {
  toDomain(entity: PlanningSettingsEntity): PlanningSettings {
    return PlanningSettings.restore(
      entity.id,
      entity.ownerId,
      {
        safetyMargin: entity.safetyMargin,
        accountBalance: entity.accountBalance,
        accountBalanceOn: entity.accountBalanceOn,
        salaryScenarios: entity.salaryScenarios,
      },
      entity.closedThrough,
    );
  },

  toEntity(
    settings: PlanningSettings,
    entity: PlanningSettingsEntity = new PlanningSettingsEntity(),
  ): PlanningSettingsEntity {
    return Object.assign(entity, {
      id: settings.id,
      ownerId: settings.ownerId,
      ...settings.details,
      closedThrough: settings.closedThrough,
    });
  },
};

export const MonthSnapshotPersistenceMapper = {
  toDomain(entity: MonthSnapshotEntity): MonthSnapshot {
    return MonthSnapshot.restore(
      entity.id,
      entity.ownerId,
      entity.month,
      entity.takenOn,
      entity.lines,
    );
  },
};
