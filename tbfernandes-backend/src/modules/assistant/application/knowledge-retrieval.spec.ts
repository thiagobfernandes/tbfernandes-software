import { randomUUID } from 'node:crypto';
import { UnitOfWork } from '../../../common/application';
import { DocumentKey, IndexedChunk, KnowledgeDocument, keyOf } from '../domain';
import { EmbeddingModel } from './embedding.model';
import { KnowledgeIndex } from './knowledge.index';
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';
import { AssistantTracer, TraceStep } from './assistant-tracer';

const NO_TRACING = {
  trace: (
    _name: string,
    _context: unknown,
    work: (step: TraceStep) => unknown,
  ) => work({ update: () => undefined }),
  step: (_name: string, _kind: unknown, work: (step: TraceStep) => unknown) =>
    work({ update: () => undefined }),
} as unknown as AssistantTracer;

const OWNER = randomUUID();

class FakeEmbeddings extends EmbeddingModel {
  on = true;
  failing = false;
  documentCalls = 0;
  name = () => 'fake:test';
  enabled = () => this.on;
  embedDocuments(texts: string[]): Promise<number[][]> {
    this.documentCalls++;
    if (this.failing) return Promise.reject(new Error('Provider down'));
    return Promise.resolve(texts.map((text) => [1, text.length]));
  }
  embedQuery(): Promise<number[]> {
    if (this.failing) return Promise.reject(new Error('Provider down'));
    // Far from every passage, so only words decide in these tests.
    return Promise.resolve([-1, 0]);
  }
}

class MemoryIndex extends KnowledgeIndex {
  readonly entries = new Map<
    string,
    {
      key: DocumentKey;
      fingerprint: string;
      model: string;
      chunks: IndexedChunk[];
    }
  >();
  fingerprints() {
    return Promise.resolve(
      new Map(
        [...this.entries].map(([key, entry]) => [
          key,
          { key: entry.key, fingerprint: entry.fingerprint },
        ]),
      ),
    );
  }
  replace(
    _owner: string,
    key: DocumentKey,
    fingerprint: string,
    model: string,
    chunks: IndexedChunk[],
  ) {
    this.entries.set(keyOf(key), { key, fingerprint, model, chunks });
    return Promise.resolve();
  }
  remove(_owner: string, keys: DocumentKey[]) {
    keys.forEach((key) => this.entries.delete(keyOf(key)));
    return Promise.resolve();
  }
  chunks() {
    return Promise.resolve(
      [...this.entries.values()].flatMap((entry) => entry.chunks),
    );
  }
  models() {
    return new Set([...this.entries.values()].map((entry) => entry.model));
  }
}

const noTransactions: UnitOfWork = { run: (work) => work() };

const document = (title: string, text: string): KnowledgeDocument => ({
  key: { kind: 'NOTE', id: randomUUID() },
  title,
  text,
});

describe('KnowledgeRetrievalService (AST-04)', () => {
  let index: MemoryIndex;
  let embeddings: FakeEmbeddings;
  let retrieval: KnowledgeRetrievalService;
  const docker = document(
    'Docker no WSL',
    'Instale o Docker Engine no Ubuntu.',
  );
  const kafka = document('Kafka', 'Tópicos e partições.');

  beforeEach(() => {
    index = new MemoryIndex();
    embeddings = new FakeEmbeddings();
    retrieval = new KnowledgeRetrievalService(
      index,
      embeddings,
      noTransactions,
      NO_TRACING,
    );
  });

  it('indexes new documents once and finds them', async () => {
    const found = await retrieval.search(OWNER, 'docker', [docker, kafka]);
    await retrieval.search(OWNER, 'docker', [docker, kafka]);
    expect(found.map((passage) => passage.source)).toEqual([docker.key]);
    expect(embeddings.documentCalls).toBe(1);
    for (const chunk of await index.chunks())
      expect(chunk.vector).not.toBeNull();
    expect(index.models()).toEqual(new Set(['fake:test']));
  });

  it('indexes an edited document again and removes a deleted one', async () => {
    await retrieval.search(OWNER, 'docker', [docker, kafka]);
    const edited = { ...docker, text: 'Agora com Podman.' };
    const found = await retrieval.search(OWNER, 'podman', [edited]);
    expect(found.map((passage) => passage.text)).toEqual(['Agora com Podman.']);
    expect([...index.entries.keys()]).toEqual([keyOf(docker.key)]);
    expect(embeddings.documentCalls).toBe(2);
  });

  it('indexes by words when the provider fails and tries again later', async () => {
    embeddings.failing = true;
    expect(await retrieval.search(OWNER, 'docker', [docker])).toHaveLength(1);
    expect(index.models()).toEqual(new Set(['none']));
    expect((await index.chunks())[0].vector).toBeNull();
    embeddings.failing = false;
    await retrieval.search(OWNER, 'docker', [docker]);
    expect(index.models()).toEqual(new Set(['fake:test']));
  });

  it('finds everything by words without a provider', async () => {
    embeddings.on = false;
    const found = await retrieval.search(OWNER, 'kafka', [docker, kafka]);
    expect(found.map((passage) => passage.source)).toEqual([kafka.key]);
    expect(embeddings.documentCalls).toBe(0);
  });

  it('never fails: a broken index gives no passages', async () => {
    jest.spyOn(index, 'fingerprints').mockRejectedValue(new Error('db down'));
    expect(await retrieval.search(OWNER, 'docker', [docker])).toEqual([]);
  });

  it('indexes the same owner one question at a time', async () => {
    await Promise.all([
      retrieval.search(OWNER, 'docker', [docker]),
      retrieval.search(OWNER, 'docker', [docker]),
    ]);
    expect(embeddings.documentCalls).toBe(1);
  });
});
