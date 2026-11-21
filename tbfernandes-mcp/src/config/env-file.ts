import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const ENV_LINE = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/;
const SURROUNDING_QUOTES = /^(['"])(.*)\1$/;

export function defaultEnvFilePath(): string {
  return join(homedir(), '.config', 'tbfernandes-mcp', '.env');
}

export function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    applyEnvLine(line);
  }
}

function applyEnvLine(line: string): void {
  const match = ENV_LINE.exec(line);
  const [, key, value] = match ?? [];
  if (key === undefined || value === undefined) return;
  if (process.env[key] !== undefined) return;
  process.env[key] = value.replace(SURROUNDING_QUOTES, '$2');
}
