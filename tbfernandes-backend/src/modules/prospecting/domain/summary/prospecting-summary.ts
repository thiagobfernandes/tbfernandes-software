import { IsoDate, IsoDates } from '../../../../common/domain';
import type { Lead, LeadClassification, LeadStatus } from '../lead/lead';
import type { LeadMessage } from '../message/lead-message';

export interface CitySummary {
  city: string;
  leads: number;
  contacted: number;
  replied: number;
}

export interface DaySummary {
  date: IsoDate;
  sent: number;
  replies: number;
}

/** RF-PRS-04: the funnel shown on the screen and on the dashboard. */
export interface ProspectingSummary {
  leads: number;
  contacted: number;
  replied: number;
  optedOut: number;
  converted: number;
  /** Replied leads over contacted leads, 0..1 (0 when nobody was contacted). */
  replyRate: number;
  messagesSent: number;
  byStatus: Record<LeadStatus, number>;
  byClassification: Record<LeadClassification | 'NONE', number>;
  byCity: CitySummary[];
  /** The last `days` days, oldest first, including days without messages. */
  daily: DaySummary[];
}

const zero = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;

export const ProspectingSummaries = {
  of(
    leads: Lead[],
    messages: LeadMessage[],
    today: IsoDate,
    dayOf: (instant: Date) => IsoDate,
    days = 30,
  ): ProspectingSummary {
    const byStatus = zero<LeadStatus>([
      'NEW',
      'ACTIVE',
      'REPLIED',
      'OPTED_OUT',
      'NO_WHATSAPP',
      'DONE',
      'ERROR',
      'CONVERTED',
    ]);
    const byClassification = zero<LeadClassification | 'NONE'>([
      'HOT',
      'WARM',
      'COLD',
      'SKIP',
      'NONE',
    ]);
    for (const lead of leads) {
      byStatus[lead.details.status] += 1;
      byClassification[lead.details.classification ?? 'NONE'] += 1;
    }
    const contacted = leads.filter((lead) => lead.contacted).length;
    const replied = leads.filter(
      (lead) => lead.details.lastReplyAt != null,
    ).length;
    return {
      leads: leads.length,
      contacted,
      replied,
      optedOut: byStatus.OPTED_OUT,
      converted: byStatus.CONVERTED,
      replyRate: contacted === 0 ? 0 : replied / contacted,
      messagesSent: messages.filter(
        (message) => message.details.direction === 'OUTBOUND',
      ).length,
      byStatus,
      byClassification,
      byCity: cities(leads),
      daily: daily(messages, today, dayOf, days),
    };
  },
};

function cities(leads: Lead[]): CitySummary[] {
  const map = new Map<string, CitySummary>();
  for (const lead of leads) {
    const city = lead.details.city ?? 'Sem cidade';
    const row = map.get(city) ?? { city, leads: 0, contacted: 0, replied: 0 };
    row.leads += 1;
    if (lead.contacted) row.contacted += 1;
    if (lead.details.lastReplyAt != null) row.replied += 1;
    map.set(city, row);
  }
  return [...map.values()].sort(
    (left, right) =>
      right.contacted - left.contacted || left.city.localeCompare(right.city),
  );
}

function daily(
  messages: LeadMessage[],
  today: IsoDate,
  dayOf: (instant: Date) => IsoDate,
  days: number,
): DaySummary[] {
  const first = IsoDates.plusDays(today, -(days - 1));
  const rows = new Map<IsoDate, DaySummary>();
  for (let offset = 0; offset < days; offset += 1) {
    const date = IsoDates.plusDays(first, offset);
    rows.set(date, { date, sent: 0, replies: 0 });
  }
  for (const message of messages) {
    const row = rows.get(dayOf(message.details.sentAt));
    if (!row) continue;
    if (message.details.direction === 'OUTBOUND') row.sent += 1;
    else row.replies += 1;
  }
  return [...rows.values()];
}
