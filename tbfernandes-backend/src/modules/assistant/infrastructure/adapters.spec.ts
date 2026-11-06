import Anthropic from '@anthropic-ai/sdk';
import { answerOf } from '../domain';
import { OllamaEmbeddingModel } from './embedding/ollama-embedding.model';
import { VoyageEmbeddingModel } from './embedding/voyage-embedding.model';
import { AnthropicLanguageModel } from './model/anthropic-language.model';
import { OpenAiCompatibleLanguageModel } from './model/openai-compatible-language.model';

interface Captured {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

function fakeFetch(responses: unknown[], requests: Captured[]): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((value, key) => (headers[key] = value));
    requests.push({
      url: String(input instanceof Request ? input.url : input),
      headers,
      body: JSON.parse(init?.body as string) as Record<string, unknown>,
    });
    return Promise.resolve(
      new Response(JSON.stringify(responses.shift()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  };
}

describe('VoyageEmbeddingModel', () => {
  const settings = {
    baseUrl: 'http://voyage.test',
    model: 'voyage-3.5-lite',
    apiKey: 'test-key',
  };

  it('embeds documents in the order of their index', async () => {
    const requests: Captured[] = [];
    const model = new VoyageEmbeddingModel(
      settings,
      fakeFetch(
        [
          {
            data: [
              { index: 1, embedding: [0.3, 0.4] },
              { index: 0, embedding: [0.1, 0.2] },
            ],
          },
        ],
        requests,
      ),
    );
    expect(await model.embedDocuments(['primeiro', 'segundo'])).toEqual([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
    expect(requests[0].url).toBe('http://voyage.test/v1/embeddings');
    expect(requests[0].body).toEqual({
      input: ['primeiro', 'segundo'],
      model: 'voyage-3.5-lite',
      input_type: 'document',
    });
    expect(requests[0].headers.authorization).toBe('Bearer test-key');
    expect(model.name()).toBe('voyage:voyage-3.5-lite');
  });

  it('embeds the question as a query', async () => {
    const requests: Captured[] = [];
    const model = new VoyageEmbeddingModel(
      settings,
      fakeFetch([{ data: [{ index: 0, embedding: [1, 0] }] }], requests),
    );
    expect(await model.embedQuery('como instalei o docker?')).toEqual([1, 0]);
    expect(requests[0].body.input_type).toBe('query');
  });

  it('fails when vectors are missing', async () => {
    const model = new VoyageEmbeddingModel(
      settings,
      fakeFetch([{ data: [] }], []),
    );
    await expect(model.embedDocuments(['texto'])).rejects.toThrow();
  });

  it('needs an API key', () => {
    expect(() => new VoyageEmbeddingModel({ ...settings, apiKey: '' })).toThrow(
      'VOYAGE_API_KEY',
    );
  });
});

describe('AnthropicLanguageModel', () => {
  const TODAY = '2026-10-30';
  const message = (text: string, stopReason: string) => ({
    id: 'msg_1',
    type: 'message',
    role: 'assistant',
    model: 'claude-opus-5-5',
    content: [{ type: 'text', text }],
    stop_reason: stopReason,
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  });
  const plan = (answerable: boolean, dueTo: string) =>
    JSON.stringify({
      answerable,
      subject: 'TASKS',
      aggregate: 'LIST',
      text: '',
      statuses: ['todo'],
      priorities: [],
      openOnly: true,
      project: '',
      company: 'Zasso',
      dueFrom: '',
      dueTo,
      month: '',
      sort: 'DUE_DATE',
      limit: 10,
    });

  let requests: Captured[];
  let responses: unknown[];
  let model: AnthropicLanguageModel;

  beforeEach(() => {
    requests = [];
    responses = [];
    const client = new Anthropic({
      apiKey: 'test-key',
      maxRetries: 0,
      fetch: fakeFetch(responses, requests),
    });
    model = new AnthropicLanguageModel(
      { model: 'claude-opus-5-5', apiKey: 'test-key' },
      client,
    );
  });

  it('asks for the query as structured output and maps it', async () => {
    responses.push(message(plan(true, '2026-10-29'), 'end_turn'));
    const query = await model.toQuery('O que está atrasado na Zasso?', TODAY);
    expect(query).toMatchObject({
      subject: 'TASKS',
      statuses: ['todo'],
      company: 'Zasso',
      dueFrom: null,
      dueTo: '2026-10-29',
      limit: 10,
    });
    const body = requests[0].body as {
      model: string;
      output_config: {
        effort: string;
        format: {
          type: string;
          schema: { properties: { subject: { enum: string[] } } };
        };
      };
      fallbacks: string;
      messages: Array<{ content: string }>;
    };
    expect(body.model).toBe('claude-opus-5-5');
    expect(body.output_config.format.type).toBe('json_schema');
    expect(body.output_config.effort).toBe('low');
    expect(body.fallbacks).toBe('default');
    expect(requests[0].headers['anthropic-beta']).toContain(
      'server-side-fallback-2026-07-01',
    );
    expect(body.output_config.format.schema.properties.subject.enum).toEqual(
      expect.arrayContaining(['TASKS', 'CASH_FLOW']),
    );
    expect(body.messages[0].content).toContain('2026-10-30');
    expect(body.messages[0].content).toContain('atrasado na Zasso');
  });

  it('has no query for a question no lookup answers', async () => {
    responses.push(message(plan(false, ''), 'end_turn'));
    expect(await model.toQuery('Bom dia!', TODAY)).toBeNull();
  });

  it('has no answer when the model refuses', async () => {
    responses.push(message('{"text": ""}', 'refusal'));
    expect(
      await model.answer('Pergunta', answerOf('Texto', [], 'rules')),
    ).toBeNull();
  });

  it('fails on an invalid date, so the service falls back to the rules', async () => {
    responses.push(message(plan(true, 'ontem'), 'end_turn'));
    await expect(
      model.toQuery('O que está atrasado?', TODAY),
    ).rejects.toThrow();
  });

  it('sends only the question and the answer text for the rewrite', async () => {
    responses.push(message('{"text": "Você tem 2 tarefas."}', 'end_turn'));
    const text = await model.answer(
      'Quantas tarefas?',
      answerOf('Você tem 2 tarefas com esses critérios.', [], 'query'),
    );
    expect(text).toBe('Você tem 2 tarefas.');
    expect(
      (requests[0].body.messages as Array<{ content: string }>)[0].content,
    ).toBe(
      'Question: Quantas tarefas?\n\nAnswer to rewrite:\nVocê tem 2 tarefas com esses critérios.',
    );
  });

  it('sends the numbered passages for a retrieval answer', async () => {
    responses.push(message('{"text": "Use o compose [1]."}', 'end_turn'));
    const text = await model.answerFromPassages('Como subo?', [
      {
        source: { kind: 'NOTE', id: 'x' },
        title: 'Docker',
        text: 'docker compose up -d',
        score: 1,
      },
    ]);
    expect(text).toBe('Use o compose [1].');
    expect(
      (requests[0].body.messages as Array<{ content: string }>)[0].content,
    ).toBe(
      'Question: Como subo?\n\nPassages:\n\n[1] Nota: Docker\ndocker compose up -d',
    );
    expect(requests[0].body.system).toContain('only the');
  });

  it('sends no fallback for Haiku', async () => {
    const client = new Anthropic({
      apiKey: 'k',
      maxRetries: 0,
      fetch: fakeFetch([message('{"text": "ok"}', 'end_turn')], requests),
    });
    await new AnthropicLanguageModel(
      { model: 'claude-haiku-5-5', apiKey: 'k' },
      client,
    ).answer('q', answerOf('t', [], 'rules'));
    expect(requests[0].body.fallbacks).toBeUndefined();
  });

  it('needs an API key', () => {
    expect(
      () =>
        new AnthropicLanguageModel({ model: 'claude-opus-5-5', apiKey: '' }),
    ).toThrow('ANTHROPIC_API_KEY');
  });
});

describe('OllamaEmbeddingModel', () => {
  const settings = { baseUrl: 'http://ollama.test/', model: 'bge-m3' };

  it('embeds documents and questions the same way, without a key', async () => {
    const requests: Captured[] = [];
    const model = new OllamaEmbeddingModel(
      settings,
      fakeFetch(
        [{ embeddings: [[0.1], [0.2]] }, { embeddings: [[0.3]] }],
        requests,
      ),
    );
    expect(await model.embedDocuments(['primeiro', 'segundo'])).toEqual([
      [0.1],
      [0.2],
    ]);
    expect(await model.embedQuery('como instalei o docker?')).toEqual([0.3]);
    expect(requests[0].url).toBe('http://ollama.test/api/embed');
    expect(requests[0].body).toEqual({
      model: 'bge-m3',
      input: ['primeiro', 'segundo'],
    });
    expect(requests[0].headers.authorization).toBeUndefined();
    expect(model.name()).toBe('ollama:bge-m3');
  });

  it('fails when vectors are missing', async () => {
    const model = new OllamaEmbeddingModel(
      settings,
      fakeFetch([{ embeddings: [] }], []),
    );
    await expect(model.embedDocuments(['texto'])).rejects.toThrow();
  });
});

describe('OpenAiCompatibleLanguageModel', () => {
  const TODAY = '2026-10-30';
  const settings = {
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'openai/gpt-oss-120b',
    apiKey: 'gsk-test',
  };
  const completion = (content: string, finishReason = 'stop') => ({
    choices: [
      { message: { role: 'assistant', content }, finish_reason: finishReason },
    ],
  });
  const plan = {
    answerable: true,
    subject: 'tasks',
    aggregate: 'LIST',
    text: '',
    statuses: [],
    priorities: ['high'],
    openOnly: true,
    project: '',
    company: '',
    dueFrom: '',
    dueTo: '2026-10-29',
    month: '',
    sort: 'DUE_DATE',
    limit: 5,
  };

  it('asks for the query in JSON mode with the schema and maps it', async () => {
    const requests: Captured[] = [];
    const model = new OpenAiCompatibleLanguageModel(
      settings,
      fakeFetch([completion(JSON.stringify(plan))], requests),
    );
    const query = await model.toQuery('Tarefas urgentes atrasadas?', TODAY);
    expect(query).toMatchObject({
      subject: 'TASKS',
      priorities: ['high'],
      dueTo: '2026-10-29',
      limit: 5,
    });
    expect(requests[0].url).toBe(
      'https://api.groq.com/openai/v1/chat/completions',
    );
    expect(requests[0].headers.authorization).toBe('Bearer gsk-test');
    const body = requests[0].body as {
      model: string;
      response_format: { type: string };
      messages: Array<{ role: string; content: string }>;
    };
    expect(body.model).toBe('openai/gpt-oss-120b');
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages[0].content).toContain('"CASH_FLOW"');
    expect(body.messages[1].content).toBe(
      'Today is 2026-10-30.\n\nQuestion: Tarefas urgentes atrasadas?',
    );
  });

  it('writes an answer from the passages and sends no key to a local server', async () => {
    const requests: Captured[] = [];
    const model = new OpenAiCompatibleLanguageModel(
      { ...settings, baseUrl: 'http://ollama:11434/v1', apiKey: '' },
      fakeFetch([completion('{"text": " Use o compose [1]. "}')], requests),
    );
    const text = await model.answerFromPassages('Como subo?', [
      {
        source: { kind: 'NOTE', id: 'x' },
        title: 'Docker',
        text: 'docker compose up -d',
        score: 1,
      },
    ]);
    expect(text).toBe('Use o compose [1].');
    expect(requests[0].headers.authorization).toBeUndefined();
  });

  it('has no answer for a refusal or an empty reply', async () => {
    const model = new OpenAiCompatibleLanguageModel(
      settings,
      fakeFetch(
        [
          { choices: [{ message: { content: null, refusal: 'não' } }] },
          completion('{"text": ""}'),
        ],
        [],
      ),
    );
    const grounded = answerOf('Texto', [], 'rules');
    expect(await model.answer('Pergunta', grounded)).toBeNull();
    expect(await model.answer('Pergunta', grounded)).toBeNull();
  });

  it('fails on a reply cut at the token limit or not in JSON', async () => {
    const model = new OpenAiCompatibleLanguageModel(
      settings,
      fakeFetch(
        [completion('{"text": "Voc', 'length'), completion('Você tem 2.')],
        [],
      ),
    );
    const grounded = answerOf('Texto', [], 'rules');
    await expect(model.answer('Pergunta', grounded)).rejects.toThrow(
      'token limit',
    );
    await expect(model.answer('Pergunta', grounded)).rejects.toThrow();
  });
});
