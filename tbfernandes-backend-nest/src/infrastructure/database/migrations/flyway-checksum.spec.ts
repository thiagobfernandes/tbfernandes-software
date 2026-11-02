import { flywayChecksum } from './flyway-checksum';

describe('flywayChecksum', () => {
  it('ignores the kind of line break and the trailing one', () => {
    expect(flywayChecksum('a\nb\n')).toBe(flywayChecksum('a\r\nb'));
  });

  it('ignores a leading BOM', () => {
    expect(flywayChecksum('﻿SELECT 1;')).toBe(flywayChecksum('SELECT 1;'));
  });

  it('changes when the content changes', () => {
    expect(flywayChecksum('SELECT 1;')).not.toBe(flywayChecksum('SELECT 2;'));
  });
});
