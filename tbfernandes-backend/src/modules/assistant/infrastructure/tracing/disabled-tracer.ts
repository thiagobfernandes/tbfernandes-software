import { AssistantTracer, TraceStep } from '../../application/assistant-tracer';

const IGNORED: TraceStep = { update: () => undefined };

export class DisabledTracer extends AssistantTracer {
  trace<T>(
    _name: string,
    _context: unknown,
    work: (trace: TraceStep) => Promise<T>,
  ): Promise<T> {
    return work(IGNORED);
  }

  step<T>(
    _name: string,
    _kind: unknown,
    work: (step: TraceStep) => Promise<T>,
  ): Promise<T> {
    return work(IGNORED);
  }
}

export const NO_TRACING: AssistantTracer = new DisabledTracer();
