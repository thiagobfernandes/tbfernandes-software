import { crc32 } from 'node:zlib';

/**
 * The checksum Flyway stores for a SQL script: CRC32 of every line, without line breaks
 * and without a leading BOM, as a signed 32-bit integer. Keeping the same value means a
 * database migrated by the old Java backend is recognized as up to date.
 */
export function flywayChecksum(sql: string): number {
  const text = sql.startsWith('﻿') ? sql.slice(1) : sql;
  const lines = text.split(/\r\n|\n|\r/);
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  let crc = 0;
  for (const line of lines) crc = crc32(Buffer.from(line, 'utf8'), crc);
  return crc | 0;
}
