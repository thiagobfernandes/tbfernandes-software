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

/** The editable fields of a working method. */
export interface MethodDetails {
  title: string;
  summary: string;
  category: MethodCategory;
  steps: MethodStep[];
  examples: MethodExample[];
  tags: string[];
  lastReviewed: IsoDate;
}

/** A working method: ordered steps plus verbatim examples (RF-KNW-06). */
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

  /** Rebuilds a method already stored; no rules run. */
  static restore(id: string, ownerId: string, details: MethodDetails): Method {
    return new Method(id, ownerId, details);
  }

  get details(): MethodDetails {
    const d = this._details;
    return {
      ...d,
      steps: d.steps.map((step) => ({ ...step })),
      examples: d.examples.map((example) => ({ ...example })),
      tags: [...d.tags],
    };
  }

  update(details: MethodDetails): void {
    this._details = Method.validated(details);
  }

  private static validated(d: MethodDetails): MethodDetails {
    const steps = (d.steps ?? []).map((step) => ({
      title: Require.text(step.title, 'step title', 200),
      detail: Require.optionalText(step.detail, 'step detail', 2000),
    }));
    if (steps.length === 0) {
      throw new InvalidArgumentError(
        'um método precisa de pelo menos um passo',
      );
    }
    const examples = (d.examples ?? []).map((example) => ({
      title: Require.text(example.title, 'example title', 200),
      content: Require.present(example.content, 'example content'),
    }));
    return {
      title: Require.text(d.title, 'title', 200),
      summary: Require.text(d.summary, 'summary', 1000),
      category: Require.present(d.category, 'category'),
      steps,
      examples,
      tags: Tags.normalize(d.tags),
      lastReviewed: Require.present(d.lastReviewed, 'lastReviewed'),
    };
  }
}
