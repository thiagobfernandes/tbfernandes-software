import {
  InvalidArgumentError,
  IsoDate,
  Require,
} from '../../../../common/domain';
import { Tags } from '../tags';

export const METHOD_CATEGORIES = [
  'DEVELOPMENT',
  'QUALITY',
  'COMMUNICATION',
] as const;
export type MethodCategory = (typeof METHOD_CATEGORIES)[number];

export interface MethodStep {
  title: string;
  detail: string | null;
}

export interface MethodExample {
  title: string;
  /** Kept verbatim. */
  content: string;
}

export interface MethodDetails {
  title: string;
  summary: string;
  category: MethodCategory;
  steps: MethodStep[];
  examples: MethodExample[];
  tags: string[];
  lastReviewed: IsoDate;
}

export class Method {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    private _details: MethodDetails,
  ) {}

  static create(id: string, ownerId: string, details: MethodDetails): Method {
    return new Method(
      Require.present(id, 'id'),
      Require.present(ownerId, 'ownerId'),
      Method.validated(details),
    );
  }

  static restore(id: string, ownerId: string, details: MethodDetails): Method {
    return new Method(id, ownerId, details);
  }

  get details(): MethodDetails {
    const details = this._details;
    return {
      ...details,
      steps: details.steps.map((step) => ({ ...step })),
      examples: details.examples.map((example) => ({ ...example })),
      tags: [...details.tags],
    };
  }

  update(details: MethodDetails): void {
    this._details = Method.validated(details);
  }

  private static validated(details: MethodDetails): MethodDetails {
    const steps = (details.steps ?? []).map((step) => ({
      title: Require.text(step.title, 'step title', 200),
      detail: Require.optionalText(step.detail, 'step detail', 2000),
    }));
    if (steps.length === 0) {
      throw new InvalidArgumentError(
        'um método precisa de pelo menos um passo',
      );
    }
    const examples = (details.examples ?? []).map((example) => ({
      title: Require.text(example.title, 'example title', 200),
      content: Require.present(example.content, 'example content'),
    }));
    return {
      title: Require.text(details.title, 'title', 200),
      summary: Require.text(details.summary, 'summary', 1000),
      category: Require.present(details.category, 'category'),
      steps,
      examples,
      tags: Tags.normalize(details.tags),
      lastReviewed: Require.present(details.lastReviewed, 'lastReviewed'),
    };
  }
}
