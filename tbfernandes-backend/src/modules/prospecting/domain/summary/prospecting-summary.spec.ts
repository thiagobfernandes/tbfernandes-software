import { Lead, LeadSource } from '../lead/lead';
import { LeadMessage, MessageDirection } from '../message/lead-message';
import { ProspectingSummaries } from './prospecting-summary';

const lead = (id: string, overrides: Partial<LeadSource> = {}) =>
  Lead.create(id, 'o1', {
    externalId: id,
    name: id,
    city: 'Maringá',
    whatsapp: null,
    instagram: null,
    mapsUrl: null,
    classification: 'HOT',
    status: 'NEW',
    ...overrides,
  });

const message = (leadId: string, direction: MessageDirection, day: string) =>
  LeadMessage.create(`${leadId}-${direction}-${day}`, 'o1', {
    leadId,
    direction,
    stage: direction === 'OUTBOUND' ? 'FIRST' : 'REPLY',
    body: 'Oi',
    sentAt: new Date(`${day}T15:00:00Z`),
  });

describe('ProspectingSummaries', () => {
  it('counts the funnel, cities and messages per day', () => {
    const contacted = lead('a');
    contacted.messageRecorded(
      'OUTBOUND',
      'FIRST',
      new Date('2026-11-15T15:00:00Z'),
    );
    const replied = lead('b', { city: 'Sarandi', classification: 'WARM' });
    replied.messageRecorded(
      'OUTBOUND',
      'FIRST',
      new Date('2026-11-16T15:00:00Z'),
    );
    replied.messageRecorded(
      'INBOUND',
      'REPLY',
      new Date('2026-11-16T16:00:00Z'),
    );
    const fresh = lead('c', { classification: null });

    const summary = ProspectingSummaries.of(
      [contacted, replied, fresh],
      [
        message('a', 'OUTBOUND', '2026-11-15'),
        message('b', 'OUTBOUND', '2026-11-16'),
        message('b', 'INBOUND', '2026-11-16'),
        message('a', 'OUTBOUND', '2026-10-01'),
      ],
      '2026-11-16',
      (instant) => instant.toISOString().slice(0, 10),
      3,
    );

    expect(summary).toMatchObject({
      leads: 3,
      contacted: 2,
      replied: 1,
      replyRate: 0.5,
      messagesSent: 3,
    });
    expect(summary.byStatus.NEW).toBe(1);
    expect(summary.byStatus.REPLIED).toBe(1);
    expect(summary.byClassification).toMatchObject({
      HOT: 1,
      WARM: 1,
      NONE: 1,
    });
    expect(summary.byCity[0]).toEqual({
      city: 'Maringá',
      leads: 2,
      contacted: 1,
      replied: 0,
    });
    expect(summary.daily).toEqual([
      { date: '2026-11-14', sent: 0, replies: 0 },
      { date: '2026-11-15', sent: 1, replies: 0 },
      { date: '2026-11-16', sent: 1, replies: 1 },
    ]);
  });

  it('has a zero reply rate before any contact', () => {
    const summary = ProspectingSummaries.of(
      [],
      [],
      '2026-11-16',
      () => '2026-11-16',
    );
    expect(summary.replyRate).toBe(0);
    expect(summary.daily).toHaveLength(30);
  });
});
