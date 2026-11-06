import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import {
  AssistantTracer,
  TraceStepData,
  TraceStepKind,
} from '../../application/assistant-tracer';
import { OpenAiCompatibleLanguageModel } from '../model/openai-compatible-language.model';
import { OllamaEmbeddingModel } from '../embedding/ollama-embedding.model';
import { LangfuseTracer, maskPersonalData } from './langfuse-tracer';

describe('LangfuseTracer', () => {
  const exporter = new InMemorySpanExporter();
  const tracer = new LangfuseTracer({
    publicKey: 'pk-test',
    secretKey: 'sk-test',
    baseUrl: 'http://langfuse.test',
    environment: 'test',
    exporter,
  });

  afterEach(() => exporter.reset());
  afterAll(() => tracer.onApplicationShutdown());

  async function finishedSpans() {
    await tracer.flush();
    return exporter.getFinishedSpans();
  }

  it('nests the steps under one trace per question, with the user and the environment', async () => {
    await tracer.trace(
      'answer-question',
      { userId: 'owner-1', input: 'O que está atrasado?' },
      async (trace) => {
        await tracer.step('plan-query', 'generation', (generation) => {
          generation.update({
            model: 'openai/gpt-oss-120b',
            usage: { input: 30, output: 12 },
            output: '{}',
          });
          return Promise.resolve();
        });
        trace.update({ output: 'Nada atrasado.' });
      },
    );
    const spans = await finishedSpans();
    const root = spans.find((span) => span.name === 'answer-question')!;
    const generation = spans.find((span) => span.name === 'plan-query')!;
    expect(generation.parentSpanContext?.spanId).toBe(
      root.spanContext().spanId,
    );
    expect(root.attributes).toMatchObject({
      'user.id': 'owner-1',
      'langfuse.environment': 'test',
      'langfuse.observation.input': 'O que está atrasado?',
      'langfuse.observation.output': 'Nada atrasado.',
    });
    expect(generation.attributes).toMatchObject({
      'user.id': 'owner-1',
      'langfuse.observation.type': 'generation',
      'langfuse.observation.model.name': 'openai/gpt-oss-120b',
      'langfuse.observation.usage_details': '{"input":30,"output":12}',
    });
  });

  it('marks a failed step and lets the error through', async () => {
    await expect(
      tracer.step('plan-query', 'generation', () =>
        Promise.reject(new Error('Groq answered 429')),
      ),
    ).rejects.toThrow('429');
    const [span] = await finishedSpans();
    expect(span.attributes).toMatchObject({
      'langfuse.observation.level': 'ERROR',
      'langfuse.observation.status_message': 'Error: Groq answered 429',
    });
  });

  it('masks e-mails and CPFs before they leave', async () => {
    await tracer.trace(
      'answer-question',
      {
        userId: 'owner-1',
        input: 'Contato thiago@exemplo.com, CPF 123.456.789-09',
      },
      () => Promise.resolve(),
    );
    const [span] = await finishedSpans();
    expect(span.attributes['langfuse.observation.input']).toBe(
      'Contato [e-mail], CPF [cpf]',
    );
  });

  it('needs both keys', () => {
    expect(
      () =>
        new LangfuseTracer({
          publicKey: 'pk',
          secretKey: '',
          baseUrl: 'http://langfuse.test',
          environment: 'test',
        }),
    ).toThrow('LANGFUSE_SECRET_KEY');
  });
});

describe('maskPersonalData', () => {
  it('keeps text without personal data', () => {
    expect(maskPersonalData('Deploy com docker compose')).toBe(
      'Deploy com docker compose',
    );
  });
});

class RecordingTracer extends AssistantTracer {
  readonly steps: Array<{
    name: string;
    kind: TraceStepKind;
    data: TraceStepData;
  }> = [];

  trace<T>(
    _name: string,
    _context: unknown,
    work: (trace: { update(data: TraceStepData): void }) => Promise<T>,
  ): Promise<T> {
    return work({ update: () => undefined });
  }

  step<T>(
    name: string,
    kind: TraceStepKind,
    work: (step: { update(data: TraceStepData): void }) => Promise<T>,
  ): Promise<T> {
    const step = { name, kind, data: {} as TraceStepData };
    this.steps.push(step);
    return work({
      update: (data) => (step.data = { ...step.data, ...data }),
    });
  }
}

const replying = (body: unknown): typeof fetch => {
  return () =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
};

describe('adapter instrumentation', () => {
  it('records each language model call as a generation with model, tokens and thinking', async () => {
    const tracer = new RecordingTracer();
    const model = new OpenAiCompatibleLanguageModel(
      {
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'openai/gpt-oss-120b',
        apiKey: 'gsk',
      },
      replying({
        choices: [
          {
            message: {
              content: '{"text": "Você tem 2 tarefas."}',
              reasoning: 'Reescrever sem mudar os números.',
            },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 120, completion_tokens: 15 },
      }),
      tracer,
    );
    await model.answer('Quantas tarefas?', {
      text: 'Você tem 2 tarefas.',
      references: [],
      source: 'query',
      query: null,
    });
    const [step] = tracer.steps;
    expect(step).toMatchObject({ name: 'rewrite-answer', kind: 'generation' });
    expect(step.data).toMatchObject({
      model: 'openai/gpt-oss-120b',
      usage: { input: 120, output: 15 },
      output: '{"text": "Você tem 2 tarefas."}',
      metadata: {
        finishReason: 'stop',
        reasoning: 'Reescrever sem mudar os números.',
      },
    });
    expect((step.data.input as Array<{ role: string }>)[1].role).toBe('user');
  });

  it('records the question embedding and only the size of a batch of passages', async () => {
    const tracer = new RecordingTracer();
    const model = new OllamaEmbeddingModel(
      { baseUrl: 'http://ollama.test', model: 'bge-m3' },
      replying({ embeddings: [[0.1, 0.2]], prompt_eval_count: 4 }),
      tracer,
    );
    await model.embedQuery('como subo o compose?');
    await model.embedDocuments(['nota secreta']);
    expect(tracer.steps.map((step) => [step.name, step.kind])).toEqual([
      ['embed-query', 'embedding'],
      ['embed-documents', 'embedding'],
    ]);
    expect(tracer.steps[0].data).toMatchObject({
      model: 'bge-m3',
      input: 'como subo o compose?',
      usage: { input: 4 },
      output: { vectors: 1, dimensions: 2 },
    });
    expect(tracer.steps[1].data.input).toEqual({ texts: 1, characters: 12 });
  });
});
