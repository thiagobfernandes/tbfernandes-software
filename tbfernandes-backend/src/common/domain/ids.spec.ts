import { isUuid, uuidv7 } from './ids';

describe('uuidv7', () => {
  it('is a version 7, RFC 9562 variant UUID', () => {
    const id = uuidv7();
    expect(isUuid(id)).toBe(true);
    expect(id[14]).toBe('7');
    expect(['8', '9', 'a', 'b']).toContain(id[19]);
  });

  it('orders by creation time', () => {
    const first = uuidv7(1_700_000_000_000);
    const second = uuidv7(1_700_000_000_001);
    expect(first < second).toBe(true);
  });
});
