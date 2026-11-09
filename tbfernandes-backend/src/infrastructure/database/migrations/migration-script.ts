import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { flywayChecksum } from './flyway-checksum';

export interface MigrationScript {
  kind: 'versioned' | 'repeatable';
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

function compareVersions(leftVersion: string, rightVersion: string): number {
  const left = leftVersion.split('.').map(Number);
  const right = rightVersion.split('.').map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
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
    .filter((script) => script.kind === 'versioned')
    .sort((left, right) => compareVersions(left.version!, right.version!));
  const repeatable = scripts
    .filter((script) => script.kind === 'repeatable')
    .sort((left, right) => left.description.localeCompare(right.description));
  return [...versioned, ...repeatable];
}
