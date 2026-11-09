import { Clock, OwnerContext } from '../../../common/application';
import { Passage, StructuredQuery, Workspace } from '../domain';
import { AssistantService } from './assistant.service';
import { KnowledgeRetrievalService } from './knowledge-retrieval.service';
import { LanguageModel } from './language.model';
import { WorkspaceReader } from './workspace-reader';
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

const TODAY = '2026-11-04';

const EMPTY_WORKSPACE: Workspace = {
  today: TODAY,
  companies: [],
  projects: [],
  tasks: [],
  notes: [],
  snippets: [],
  goals: [],
  studies: [],
  purchases: [],
  month: {
    month: '2026-11',
    personalIncome: 0,
    personalExpense: 0,
    businessIncome: 0,
    businessExpense: 0,
  },
  contacts: [],
};

const PASSAGE = {
  source: { kind: 'NOTE', id: 'note-1' },
  title: 'Deploy',
  text: 'O deploy roda pelo compose.',
} as unknown as Passage;

class FakeModel extends LanguageModel {
  query: StructuredQuery | null = null;
  rewritten: string | null = null;
  fromPassages: string | null = null;
  failing = false;

  toQuery(): Promise<StructuredQuery | null> {
    return this.reply(this.query);
  }
  answer(): Promise<string | null> {
    return this.reply(this.rewritten);
  }
  answerFromPassages(): Promise<string | null> {
    return this.reply(this.fromPassages);
  }
  private reply<T>(value: T): Promise<T> {
    return this.failing
      ? Promise.reject(new Error('Provider down'))
      : Promise.resolve(value);
  }
}

function assistantWith(model: FakeModel, passages: Passage[]) {
  const workspaces = {
    read: () => Promise.resolve(EMPTY_WORKSPACE),
  } as unknown as WorkspaceReader;
  const retrieval = {
    search: () => Promise.resolve(passages),
  } as unknown as KnowledgeRetrievalService;
  const owner: OwnerContext = { currentOwnerId: () => 'owner-1' };
  const clock = { today: () => TODAY } as unknown as Clock;
  return new AssistantService(
    workspaces,
    model,
    retrieval,
    owner,
    clock,
    NO_TRACING,
  );
}

describe('AssistantService routing', () => {
  it('answers by the rules when the question names an intent', async () => {
    const answer = await assistantWith(new FakeModel(), []).ask(
      'O que fazer hoje?',
    );
    expect(answer.source).toBe('rules');
  });

  it('lets the model rewrite the text of a grounded answer', async () => {
    const model = new FakeModel();
    model.rewritten = 'Texto reescrito';
    const answer = await assistantWith(model, []).ask('O que fazer hoje?');
    expect(answer).toMatchObject({ text: 'Texto reescrito', source: 'model' });
  });

  it('answers from passages when the rules do not understand', async () => {
    const model = new FakeModel();
    model.fromPassages = 'Pelo compose [1].';
    const answer = await assistantWith(model, [PASSAGE]).ask(
      'Como funciona o deploy?',
    );
    expect(answer.source).toBe('rag');
  });

  it('shows the excerpts when the model fails on the passages', async () => {
    const model = new FakeModel();
    model.failing = true;
    const answer = await assistantWith(model, [PASSAGE]).ask(
      'Como funciona o deploy?',
    );
    expect(answer.source).toBe('search');
  });

  it('falls back to the rules when no passage is relevant', async () => {
    const model = new FakeModel();
    model.failing = true;
    const answer = await assistantWith(model, []).ask(
      'Como funciona o deploy?',
    );
    expect(answer.source).toBe('rules');
  });
});
