import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { flywayChecksum } from './flyway-checksum';

/** One SQL file: versioned (`V<n>__<description>.sql`) or repeatable (`R__<description>.sql`). */
export interface MigrationScript {
  kind: 'versioned' | 'repeatable';
  /** "12" for V12__x.sql; null for repeatable scripts. */
  version: string | null;
  description: string;
  script: string;
  sql: string;
  checksum: number;
}

const VERSIONED = /^V(\d+(?:[._]\d+)*)__(.+)\.sql$/;
const REPEATABLE = /^R__(.+)\.sql$/;

function parse(path: string): MigrationScript | undefined {
  const name = basename(path);
  const versioned = VERSIONED.exec(name);
  const repeatable = REPEATABLE.exec(name);
  if (!versioned && !repeatable) return undefined;
  const sql = readFileSync(path, 'utf8');
  return {
    kind: versioned ? 'versioned' : 'repeatable',
    version: versioned ? versioned[1].replace(/_/g, '.') : null,
    description: (versioned ? versioned[2] : repeatable![1]).replace(/_/g, ' '),
    script: name,
    sql,
    checksum: flywayChecksum(sql),
  };
}

function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Versioned scripts in version order, then repeatable ones by name (Flyway's order). */
export function loadScripts(locations: string[]): MigrationScript[] {
  const scripts = locations
    .flatMap((folder) => readdirSync(folder).map((file) => join(folder, file)))
    .map(parse)
    .filter((script): script is MigrationScript => !!script);
  const versioned = scripts
    .filter((s) => s.kind === 'versioned')
    .sort((a, b) => compareVersions(a.version!, b.version!));
  const repeatable = scripts
    .filter((s) => s.kind === 'repeatable')
    .sort((a, b) => a.description.localeCompare(b.description));
  return [...versioned, ...repeatable];
}
