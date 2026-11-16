import { Notification } from './notification';

const NOW = new Date('2026-11-16T12:00:00Z');

describe('Notification', () => {
  it('starts unread, trims a long body and is read once', () => {
    const notification = Notification.create(
      'n1',
      'o1',
      {
        kind: 'PROSPECTING_REPLY',
        title: 'Clínica respondeu',
        body: 'x'.repeat(1200),
        href: '/prospecting?lead=l1',
        key: 'reply:l1:1',
      },
      NOW,
    );
    expect(notification.unread).toBe(true);
    expect(notification.details.body).toHaveLength(1000);
    notification.markRead(NOW);
    const later = new Date('2026-11-17T12:00:00Z');
    notification.markRead(later);
    expect(notification.details.readAt).toEqual(NOW);
  });
});
