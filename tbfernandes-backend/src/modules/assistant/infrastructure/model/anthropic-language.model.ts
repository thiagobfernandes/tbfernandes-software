import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '../../../../infrastructure/logger';
import { IsoDate } from '../../../../common/domain';
import { AssistantTracer } from '../../application/assistant-tracer';
import { LanguageModel } from '../../application/language.model';
import { Answer, Passage, StructuredQuery } from '../../domain';
import {
  ANSWER_PROMPT,
  PASSAGES_PROMPT,
  Prompts,
  QUERY_PROMPT,
} from './prompts';
import { NO_TRACING } from '../tracing/disabled-tracer';
import {
  ANSWER_DRAFT_SCHEMA,
  QUERY_PLAN_SCHEMA,
  QueryPlans,
} from './query-plan';

export interface AnthropicSettings {
  model: string;
  apiKey: string;
}

const MAX_TOKENS = 8000;

/**
 * Anthropic adapter (AST-03), on with TBF_ASSISTANT_MODEL=anthropic. Both calls use structured
 * outputs, so the response always follows the JSON schema it is parsed with. Only the question
 * and the text built from the owner's records leave the application.
 */
export class AnthropicLanguageModel extends LanguageModel {
  private readonly client: Anthropic;

  constructor(
    private readonly settings: AnthropicSettings,
    client?: Anthropic,
    private readonly tracer: AssistantTracer = NO_TRACING,
  ) {
    super();
    if (!client && !settings.apiKey) {
      throw new Error('TBF_ASSISTANT_MODEL=anthropic needs ANTHROPIC_API_KEY');
    }
    // At most about 100 s for a question, inside the 120 s nginx waits: two calls, one retry each.
    this.client =
      client ??
      new Anthropic({
        apiKey: settings.apiKey,
        timeout: 25_000,
        maxRetries: 1,
      });
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
    return this.tracer.step(name, 'generation', async (generation) => {
      generation.update({
        model: this.settings.model,
        modelParameters: { max_tokens: MAX_TOKENS, effort: 'low' },
        input: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      const message = await this.create(schema, system, user);
      const block = message.content.find(
        (contentBlock) => contentBlock.type === 'text',
      );
      const text = block && block.type === 'text' ? block.text : '';
      generation.update({
        model: message.model,
        output: text,
        usage: {
          input: message.usage.input_tokens,
          output: message.usage.output_tokens,
        },
        metadata: { stopReason: message.stop_reason },
      });
      if (message.stop_reason === 'refusal') {
        Logger.warn('Model refused the request');
        return null;
      }
      return text ? (JSON.parse(text) as unknown) : null;
    });
  }

  private create(schema: object, system: string, user: string) {
    // Haiku has no server-side fallback for a safety classifier refusal.
    const fallback = !this.settings.model.startsWith('claude-haiku');
    return this.client.beta.messages.create({
      model: this.settings.model,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: 'user', content: user }],
      output_config: {
        effort: 'low',
        format: {
          type: 'json_schema',
          schema: schema as Record<string, unknown>,
        },
      },
      ...(fallback
        ? {
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default' as const,
          }
        : {}),
    });
  }
}
