import { IsoDate } from '../../../../common/domain';
import { AssistantTracer, TraceStep } from '../../application/assistant-tracer';
import { LanguageModel } from '../../application/language.model';
import { Answer, Passage, StructuredQuery } from '../../domain';
import { postJson } from '../http-json';
import {
  ANSWER_DRAFT_SCHEMA,
  QUERY_PLAN_SCHEMA,
  QueryPlans,
} from './query-plan';
import {
  ANSWER_PROMPT,
  PASSAGES_PROMPT,
  Prompts,
  QUERY_PROMPT,
} from './prompts';
import { NO_TRACING } from '../tracing/disabled-tracer';

export interface OpenAiCompatibleSettings {
  baseUrl: string;
  model: string;
  apiKey: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
      refusal?: string | null;
      reasoning?: string | null;
    };
    finish_reason?: string;
  }> | null;
  usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
}

type Choice = NonNullable<ChatCompletionResponse['choices']>[number];

interface Reply {
  answered: boolean;
  content: string;
  finishReason?: string;
  reasoning?: string;
  refusal?: string;
}

function replyOf(response: ChatCompletionResponse | null): Reply {
  const choice: Choice = response?.choices?.[0] ?? {};
  const message = choice.message ?? {};
  return {
    answered: Boolean(choice.message) && !message.refusal,
    content: (message.content ?? '').trim(),
    finishReason: choice.finish_reason,
    reasoning: message.reasoning ?? undefined,
    refusal: message.refusal ?? undefined,
  };
}

function usageOf(response: ChatCompletionResponse | null) {
  const usage = response?.usage ?? {};
  return { input: usage.prompt_tokens, output: usage.completion_tokens };
}

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

const TIMEOUT_MS = 25_000;
const MAX_TOKENS = 4000;

export class OpenAiCompatibleLanguageModel extends LanguageModel {
  constructor(
    private readonly settings: OpenAiCompatibleSettings,
    private readonly http: typeof fetch = fetch,
    private readonly tracer: AssistantTracer = NO_TRACING,
  ) {
    super();
  }

  async toQuery(
    question: string,
    today: IsoDate,
  ): Promise<StructuredQuery | null> {
    const plan = await this.call(
      'plan-query',
      QUERY_PLAN_SCHEMA,
      QUERY_PROMPT,
      Prompts.query(question, today),
    );
    return plan === null ? null : QueryPlans.toQuery(plan);
  }

  answer(question: string, grounded: Answer): Promise<string | null> {
    return this.draft(
      'rewrite-answer',
      ANSWER_PROMPT,
      Prompts.rewrite(question, grounded.text),
    );
  }

  answerFromPassages(
    question: string,
    passages: Passage[],
  ): Promise<string | null> {
    return this.draft(
      'answer-from-passages',
      PASSAGES_PROMPT,
      Prompts.passages(question, passages),
    );
  }

  private async draft(
    name: string,
    system: string,
    user: string,
  ): Promise<string | null> {
    return Prompts.draftText(
      await this.call(name, ANSWER_DRAFT_SCHEMA, system, user),
    );
  }

  private call(
    name: string,
    schema: object,
    system: string,
    user: string,
  ): Promise<unknown> {
    const messages = this.messages(schema, system, user);
    return this.tracer.step(name, 'generation', async (generation) => {
      generation.update({
        model: this.settings.model,
        modelParameters: { temperature: 0, max_tokens: MAX_TOKENS },
        input: messages,
      });
      const response = await postJson<ChatCompletionResponse>(
        this.http,
        'Language model',
        `${this.settings.baseUrl.replace(/\/$/, '')}/chat/completions`,
        this.authorization(),
        this.request(messages),
        TIMEOUT_MS,
      );
      return this.parse(response, generation);
    });
  }

  private parse(
    response: ChatCompletionResponse,
    generation: TraceStep,
  ): unknown {
    const reply = replyOf(response);
    generation.update({
      output: reply.content,
      usage: usageOf(response),
      metadata: {
        finishReason: reply.finishReason,
        reasoning: reply.reasoning,
        refusal: reply.refusal,
      },
    });
    if (!reply.answered) return null;
    if (reply.finishReason === 'length') {
      throw new Error('Language model reply was cut at the token limit');
    }
    return reply.content === '' ? null : (JSON.parse(reply.content) as unknown);
  }

  private authorization(): Record<string, string> {
    return this.settings.apiKey
      ? { Authorization: `Bearer ${this.settings.apiKey}` }
      : {};
  }

  private messages(
    schema: object,
    system: string,
    user: string,
  ): ChatMessage[] {
    return [
      {
        role: 'system',
        content:
          `${system}\n\nReply with one JSON object that follows this JSON schema, and nothing else:\n` +
          JSON.stringify(schema),
      },
      { role: 'user', content: user },
    ];
  }

  private request(messages: ChatMessage[]): object {
    return {
      model: this.settings.model,
      temperature: 0,
      max_tokens: MAX_TOKENS,
      response_format: { type: 'json_object' },
      messages,
    };
  }
}
