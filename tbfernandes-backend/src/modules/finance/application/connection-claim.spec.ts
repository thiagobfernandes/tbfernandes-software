import { ConnectionClaims } from './connection-claim';

describe('ConnectionClaims', () => {
  const ownerId = '0190d0a2-7c1e-7000-8000-000000000001';

  it('round-trips the owner and the scope', () => {
    const encoded = ConnectionClaims.encode({ ownerId, scope: 'BUSINESS' });
    expect(encoded).toBe(`${ownerId}:BUSINESS`);
    expect(ConnectionClaims.parse(encoded)).toEqual({
      ownerId,
      scope: 'BUSINESS',
    });
  });

  it('ignores anything else', () => {
    for (const value of [
      null,
      '',
      'me',
      `${ownerId}:ALL`,
      `x:PERSONAL`,
      `${ownerId}:PERSONAL:x`,
    ])
      expect(ConnectionClaims.parse(value)).toBeNull();
  });
});
