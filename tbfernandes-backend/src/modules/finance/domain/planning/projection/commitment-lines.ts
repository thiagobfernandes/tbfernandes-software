import { YearMonth } from '../../../../../common/domain';
import { Commitment, CommitmentCategory } from '../commitment';
import { dayOfMonth } from '../plan-types';
import { LineGroup, ProjectionLine } from './projection.types';

const GROUP_OF: Record<CommitmentCategory, LineGroup> = {
  SALARY: 'INCOME',
  FREELANCE: 'INCOME',
  OTHER_INCOME: 'INCOME',
  LOAN: 'LOAN',
  FIXED: 'FIXED',
  SUBSCRIPTION: 'SUBSCRIPTION',
  EXTRA: 'EXTRA',
};

/** The commitment's line in a month, or null when it has nothing there. */
export function commitmentLine(
  commitment: Commitment,
  month: YearMonth,
  cardNames: Map<string, string>,
): ProjectionLine | null {
  const occurrence = commitment
    .schedule(month)
    .find((item) => item.month === month);
  if (!occurrence) return null;
  const details = commitment.details;
  const cardName = details.cardId ? cardNames.get(details.cardId) : undefined;
  return {
    key: `commitment:${commitment.id}`,
    source: 'COMMITMENT',
    sourceId: commitment.id,
    name: details.name,
    group: GROUP_OF[details.category],
    category: details.category,
    direction: commitment.direction,
    dueDate: details.dueDay ? dayOfMonth(month, details.dueDay) : null,
    amount: occurrence.effective,
    planned: occurrence.planned,
    certainty: occurrence.certainty,
    note: cardName
      ? joinNotes(`incluída na fatura do ${cardName}`, occurrence.note)
      : occurrence.note,
    paid: occurrence.payment?.amount ?? null,
    paidOn: occurrence.payment?.paidOn ?? null,
    counted: commitment.counted,
    installment: occurrence.installment,
    last: occurrence.last,
    cardId: details.cardId,
    payable: commitment.counted,
    items: [],
  };
}

export function joinNotes(...notes: (string | null)[]): string | null {
  const present = notes.filter((note): note is string => Boolean(note));
  return present.length ? present.join(' · ') : null;
}
