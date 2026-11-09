export interface TraceStepData {
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
  model?: string;
  modelParameters?: Record<string, string | number>;
  usage?: { input?: number; output?: number };
  failure?: string;
}

export interface TraceStep {
  update(data: TraceStepData): void;
}

export type TraceStepKind = 'span' | 'generation' | 'embedding' | 'retriever';

export abstract class AssistantTracer {
  abstract trace<T>(
    name: string,
    context: { userId: string; input: unknown },
    work: (trace: TraceStep) => Promise<T>,
  ): Promise<T>;

  abstract step<T>(
    name: string,
    kind: TraceStepKind,
    work: (step: TraceStep) => Promise<T>,
  ): Promise<T>;
}
