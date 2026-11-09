import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const SRC = __dirname;

const ALLOWED_MODULE_DEPENDENCIES: Record<string, string[]> = {
  identity: [],
  work: [],
  knowledge: ['work'],
  contacts: ['work'],
  finance: [],
  goals: ['work', 'learning', 'finance'],
  learning: [],
  assistant: ['work', 'knowledge', 'goals', 'learning', 'finance', 'contacts'],
};

interface SourceImport {
  file: string;
  specifier: string;
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

function violations(
  predicate: (sourceImport: SourceImport) => boolean,
): string[] {
  return imports
    .filter(predicate)
    .map((sourceImport) => `${sourceImport.file} -> ${sourceImport.specifier}`);
}

describe('architecture', () => {
  it('a module uses another only through its public API and in the allowed direction', () => {
    expect(
      violations((sourceImport) => {
        const from = moduleOf(sourceImport.file);
        const to = sourceImport.target && moduleOf(sourceImport.target);
        if (!from || !to || from === to) return false;
        const publicApi =
          parts(sourceImport.target!).length === 2 ||
          parts(sourceImport.target!)[2] === 'index';
        return !publicApi || !ALLOWED_MODULE_DEPENDENCIES[from]?.includes(to);
      }),
    ).toEqual([]);
  });

  it('domain is plain TypeScript and depends on no other layer', () => {
    expect(
      violations((sourceImport) => {
        const inDomain =
          layerOf(sourceImport.file) === 'domain' ||
          sourceImport.file.startsWith(join('common', 'domain'));
        if (!inDomain) return false;
        if (!sourceImport.target)
          return !sourceImport.specifier.startsWith('node:');
        return !(
          layerOf(sourceImport.target) === 'domain' ||
          sourceImport.target.startsWith(join('common', 'domain'))
        );
      }),
    ).toEqual([]);
  });

  it('application talks to interfaces, never to persistence, HTTP or DTOs', () => {
    expect(
      violations((sourceImport) => {
        if (layerOf(sourceImport.file) !== 'application') return false;
        if (!sourceImport.target)
          return /^(typeorm|express|pg|@nestjs\/(typeorm|platform-express|swagger))/.test(
            sourceImport.specifier,
          );
        const layer = layerOf(sourceImport.target);
        return (
          ['infrastructure', 'protocols', 'web'].includes(layer ?? '') ||
          sourceImport.target.startsWith('infrastructure')
        );
      }),
    ).toEqual([]);
  });

  it('protocols never reach persistence or controllers', () => {
    expect(
      violations((sourceImport) => {
        if (layerOf(sourceImport.file) !== 'protocols') return false;
        if (!sourceImport.target)
          return /^(typeorm|pg|express)/.test(sourceImport.specifier);
        return (
          ['infrastructure', 'web', 'application'].includes(
            layerOf(sourceImport.target) ?? '',
          ) || sourceImport.target.startsWith('infrastructure')
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
