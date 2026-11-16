import { BusinessRuleViolationError } from '../../../../common/domain';
import { Lead, LeadSource } from './lead';

const source = (overrides: Partial<LeadSource> = {}): LeadSource => ({
  externalId: 'maringa--clinica-sorriso',
  name: 'Clínica Sorriso',
  city: 'Maringá',
  whatsapp: '5544999990000',
  instagram: null,
  mapsUrl: null,
  classification: 'HOT',
  status: 'NEW',
  ...overrides,
});

const at = (time: string) => new Date(`2026-11-16T${time}Z`);

describe('Lead', () => {
  it('starts without contact dates and trims the worker data', () => {
    const lead = Lead.create('l1', 'o1', source({ name: '  Clínica  ' }));
    expect(lead.details.name).toBe('Clínica');
    expect(lead.contacted).toBe(false);
  });

  it('becomes active on the first message and done after the second follow-up', () => {
    const lead = Lead.create('l1', 'o1', source());
    lead.messageRecorded('OUTBOUND', 'FIRST', at('12:00:00'));
    expect(lead.details.status).toBe('ACTIVE');
    expect(lead.details.firstContactAt).toEqual(at('12:00:00'));

    lead.messageRecorded('OUTBOUND', 'FOLLOW_UP_2', at('13:00:00'));
    expect(lead.details.status).toBe('DONE');
    expect(lead.details.firstContactAt).toEqual(at('12:00:00'));
    expect(lead.details.lastMessageAt).toEqual(at('13:00:00'));
  });

  it('keeps the earliest first contact when messages arrive out of order', () => {
    const lead = Lead.create('l1', 'o1', source());
    lead.messageRecorded('OUTBOUND', 'FOLLOW_UP_1', at('14:00:00'));
    lead.messageRecorded('OUTBOUND', 'FIRST', at('10:00:00'));
    expect(lead.details.firstContactAt).toEqual(at('10:00:00'));
    expect(lead.details.lastMessageAt).toEqual(at('14:00:00'));
  });

  it('marks replies and opt-outs', () => {
    const lead = Lead.create('l1', 'o1', source());
    lead.messageRecorded('OUTBOUND', 'FIRST', at('12:00:00'));
    lead.messageRecorded('INBOUND', 'REPLY', at('12:30:00'));
    expect(lead.details.status).toBe('REPLIED');
    expect(lead.details.lastReplyAt).toEqual(at('12:30:00'));

    lead.messageRecorded('INBOUND', 'OPT_OUT', at('12:40:00'));
    expect(lead.details.status).toBe('OPTED_OUT');
  });

  it('refuses messages to a lead that opted out (RN-35)', () => {
    const lead = Lead.create('l1', 'o1', source());
    lead.messageRecorded('INBOUND', 'OPT_OUT', at('12:00:00'));
    expect(() =>
      lead.messageRecorded('OUTBOUND', 'FOLLOW_UP_1', at('13:00:00')),
    ).toThrow(BusinessRuleViolationError);
  });

  it('keeps an opt-out or a conversion when the worker syncs again (RN-35)', () => {
    const lead = Lead.create('l1', 'o1', source());
    lead.review('CONVERTED', 'Fechou o site');
    lead.syncFrom(source({ status: 'ACTIVE', city: 'Sarandi' }));
    expect(lead.details.status).toBe('CONVERTED');
    expect(lead.details.city).toBe('Sarandi');
    expect(lead.details.notes).toBe('Fechou o site');

    lead.review('OPTED_OUT', null);
    lead.syncFrom(source({ status: 'ACTIVE' }));
    expect(lead.details.status).toBe('OPTED_OUT');
  });
});
