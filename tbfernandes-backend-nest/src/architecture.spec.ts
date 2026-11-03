import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

/**
 * Architecture rules (docs/backend/arquitetura.md), checked on the import statements of
 * every source file, like ArchitectureTests did with ArchUnit.
 */
const SRC = __dirname;

/** Which modules each module may use, through their public API (index.ts) only. */
const ALLOWED_MODULE_DEPENDENCIES: Record<string, string[]> = {
  identity: [],
  work: [],
  knowledge: ['work'],
  contacts: ['work'],
  finance: [],
  goals: ['work', 'learning', 'finance'],
  learning: [],
};

interface SourceImport {
  file: string;
  specifier: string;
  /** Resolved path inside src/, or undefined for packages. */
  target?: string;
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });
}

const IMPORT =
  /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)/g;

const imports: SourceImport[] = sourceFiles(SRC).flatMap((file) => {
  const code = readFileSync(file, 'utf8');
  return [...code.matchAll(IMPORT)].map((match) => {
    const specifier = match[1] ?? match[2] ?? match[3];
    const target = specifier.startsWith('.')
      ? relative(SRC, resolve(dirname(file), specifier))
      : undefined;
    return { file: relative(SRC, file), specifier, target };
  });
});

const parts = (path: string) => path.split(sep);
const moduleOf = (path: string) =>
  parts(path)[0] === 'modules' ? parts(path)[1] : undefined;
const layerOf = (path: string) =>
  parts(path)[0] === 'modules' ? parts(path)[2] : undefined;

function violations(predicate: (i: SourceImport) => boolean): string[] {
  return imports.filter(predicate).map((i) => `${i.file} -> ${i.specifier}`);
}

describe('architecture', () => {
  it('a module uses another only through its public API and in the allowed direction', () => {
    expect(
      violations((i) => {
        const from = moduleOf(i.file);
        const to = i.target && moduleOf(i.target);
        if (!from || !to || from === to) return false;
        const publicApi =
          parts(i.target!).length === 2 || parts(i.target!)[2] === 'index';
        return !publicApi || !ALLOWED_MODULE_DEPENDENCIES[from]?.includes(to);
      }),
    ).toEqual([]);
  });

  it('domain is plain TypeScript and depends on no other layer', () => {
    expect(
      violations((i) => {
        const inDomain =
          layerOf(i.file) === 'domain' ||
          i.file.startsWith(join('common', 'domain'));
        if (!inDomain) return false;
        if (!i.target) return !i.specifier.startsWith('node:'); // Node built-ins only, no packages
        return !(
          layerOf(i.target) === 'domain' ||
          i.target.startsWith(join('common', 'domain'))
        );
      }),
    ).toEqual([]);
  });

  it('application talks to interfaces, never to persistence, HTTP or DTOs', () => {
    expect(
      violations((i) => {
        if (layerOf(i.file) !== 'application') return false;
        if (!i.target)
          return /^(typeorm|express|pg|@nestjs\/(typeorm|platform-express|swagger))/.test(
            i.specifier,
          );
        const layer = layerOf(i.target);
        return (
          ['infrastructure', 'protocols', 'web'].includes(layer ?? '') ||
          i.target.startsWith('infrastructure')
        );
      }),
    ).toEqual([]);
  });

  it('protocols never reach persistence or controllers', () => {
    expect(
      violations((i) => {
        if (layerOf(i.file) !== 'protocols') return false;
        if (!i.target) return /^(typeorm|pg|express)/.test(i.specifier);
        return (
          ['infrastructure', 'web', 'application'].includes(
            layerOf(i.target) ?? '',
          ) || i.target.startsWith('infrastructure')
        );
      }),
    ).toEqual([]);
  });

  it('has no ports and adapters packages (ADR-008)', () => {
    const files = sourceFiles(SRC).map((file) => relative(SRC, file));
    expect(
      files.filter((file) => /(^|\/)(adapters?|ports?)(\/|$)/.test(file)),
    ).toEqual([]);
  });
});
