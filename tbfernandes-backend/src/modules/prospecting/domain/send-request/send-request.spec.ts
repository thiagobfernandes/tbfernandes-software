import { BusinessRuleViolationError } from '../../../../common/domain';
import { AUTO_SEND_AFTER_MS, SendRequest } from './send-request';

const NOW = new Date('2026-11-16T12:00:00Z');
const later = (ms: number) => new Date(NOW.getTime() + ms);
const request = () =>
  SendRequest.create(
    'r1',
    'o1',
    { leadId: 'l1', stage: 'FIRST', body: 'Oi' },
    NOW,
  );

describe('SendRequest', () => {
  it('goes out on its own an hour after it was asked (RN-37)', () => {
    const pending = request();
    expect(pending.details.autoSendAt).toEqual(later(AUTO_SEND_AFTER_MS));
    expect(pending.isReady(later(AUTO_SEND_AFTER_MS - 1))).toBe(false);
    expect(pending.isReady(later(AUTO_SEND_AFTER_MS))).toBe(true);
  });

  it('is ready at once when approved, and is claimed only once', () => {
    const approved = request();
    approved.approve();
    expect(approved.isReady(NOW)).toBe(true);
    approved.claim(NOW);
    expect(approved.details.status).toBe('SENDING');
    expect(() => approved.claim(NOW)).toThrow(BusinessRuleViolationError);
    approved.finish(true, null, later(1000));
    expect(approved.details).toMatchObject({ status: 'SENT', error: null });
  });

  it('refuses to be claimed before the hour or after a cancel', () => {
    const pending = request();
    expect(() => pending.claim(NOW)).toThrow(BusinessRuleViolationError);
    pending.cancel(NOW);
    expect(pending.open).toBe(false);
    expect(() => pending.claim(later(AUTO_SEND_AFTER_MS))).toThrow(
      BusinessRuleViolationError,
    );
    expect(() => pending.approve()).toThrow(BusinessRuleViolationError);
  });

  it('keeps the error of a failed send', () => {
    const approved = request();
    approved.approve();
    approved.claim(NOW);
    approved.finish(false, 'sem WhatsApp', NOW);
    expect(approved.details).toMatchObject({
      status: 'FAILED',
      error: 'sem WhatsApp',
    });
  });
});
