import { Injectable } from '@nestjs/common';
import { IdGenerator, UnitOfWork } from '../../../common/application';
import { IsoDate, NotFoundError, YearMonth } from '../../../common/domain';
import {
  CardDetails,
  Cents,
  Certainty,
  CreditCard,
  CreditCardRepository,
  ImportResult,
  MonthLock,
  parseStatementCsv,
  PurchaseInput,
} from '../domain';
import { PlanLoader } from './plan-loader';

/** Cards, their statements (CSV or typed) and installment purchases (RF-PLN-03). */
@Injectable()
export class CreditCardService {
  constructor(
    private readonly cards: CreditCardRepository,
    private readonly plan: PlanLoader,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: CardDetails): Promise<CreditCard> {
    return this.cards.save(
      CreditCard.create(
        this.ids.forNewAggregate(),
        this.plan.ownerId(),
        details,
      ),
    );
  }

  update(id: string, details: CardDetails): Promise<CreditCard> {
    return this.change(id, (card) => card.update(details));
  }

  importStatement(id: string, dueDate: IsoDate, csv: string) {
    return this.uow.run(async () => {
      const card = await this.get(id);
      const result: ImportResult = card.importStatement(
        dueDate,
        parseStatementCsv(csv),
        () => this.ids.newId(),
        await this.plan.lock(),
      );
      return { result, card: await this.cards.save(card) };
    });
  }

  setStatement(
    id: string,
    month: YearMonth,
    total: Cents,
    certainty: Certainty,
  ) {
    return this.change(id, (card, lock) =>
      card.setStatement(month, total, certainty, lock),
    );
  }

  removeStatement(id: string, month: YearMonth) {
    return this.change(id, (card, lock) => card.removeStatement(month, lock));
  }

  payStatement(
    id: string,
    month: YearMonth,
    payment: { amount: Cents; paidOn: IsoDate } | null,
  ) {
    return this.change(id, (card, lock) =>
      card.payStatement(month, payment, lock),
    );
  }

  addPurchase(id: string, input: PurchaseInput) {
    return this.change(id, (card, lock) =>
      card.addPurchase(this.ids.newId(), input, lock),
    );
  }

  updatePurchase(id: string, purchaseId: string, input: PurchaseInput) {
    return this.change(id, (card, lock) =>
      card.updatePurchase(purchaseId, input, lock),
    );
  }

  removePurchase(id: string, purchaseId: string) {
    return this.change(id, (card, lock) =>
      card.removePurchase(purchaseId, lock),
    );
  }

  classify(id: string, transactionId: string, commitmentId: string | null) {
    return this.change(id, (card) =>
      card.classify(transactionId, commitmentId),
    );
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => {
      const card = await this.get(id);
      const lock = await this.plan.lock();
      for (const statement of card.statements) lock.assertOpen(statement.month);
      await this.cards.delete(card);
    });
  }

  async get(id: string): Promise<CreditCard> {
    const card = await this.cards.findById(this.plan.ownerId(), id);
    if (!card) throw new NotFoundError('O cartão', id);
    return card;
  }

  list(): Promise<CreditCard[]> {
    return this.cards.findAll(this.plan.ownerId());
  }

  private change(
    id: string,
    apply: (card: CreditCard, lock: MonthLock) => unknown,
  ): Promise<CreditCard> {
    return this.uow.run(async () => {
      const card = await this.get(id);
      apply(card, await this.plan.lock());
      return this.cards.save(card);
    });
  }
}
