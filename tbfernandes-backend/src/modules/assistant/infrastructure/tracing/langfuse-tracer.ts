import { OnApplicationShutdown } from '@nestjs/common';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import {
  LangfuseGenerationAttributes,
  propagateAttributes,
  setLangfuseTracerProvider,
  startActiveObservation,
} from '@langfuse/tracing';
import { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import {
  AssistantTracer,
  TraceStep,
  TraceStepData,
  TraceStepKind,
} from '../../application/assistant-tracer';

export interface LangfuseSettings {
  publicKey: string;
  secretKey: string;
  baseUrl: string;
  environment: string;
  exporter?: SpanExporter;
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const CPF = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;

export function maskPersonalData(data: string): string {
  return data.replace(EMAIL, '[e-mail]').replace(CPF, '[cpf]');
}

interface Observation {
  update(attributes: LangfuseGenerationAttributes): unknown;
}

const startTypedObservation = startActiveObservation as unknown as <T>(
  name: string,
  work: (observation: Observation) => Promise<T>,
  options: { asType: TraceStepKind },
) => Promise<T>;

function stepOf(observation: Observation): TraceStep {
  return {
    update: (data: TraceStepData) => {
      observation.update({
        input: data.input,
        output: data.output,
        metadata: data.metadata,
        model: data.model,
        modelParameters: data.modelParameters,
        usageDetails: data.usage,
        ...(data.failure
          ? { level: 'ERROR' as const, statusMessage: data.failure }
          : {}),
      });
    },
  };
}

async function recorded<T>(
  observation: Observation,
  work: (step: TraceStep) => Promise<T>,
): Promise<T> {
  const step = stepOf(observation);
  try {
    return await work(step);
  } catch (error) {
    step.update({ failure: String(error) });
    throw error;
  }
}

export class LangfuseTracer
  extends AssistantTracer
  implements OnApplicationShutdown
{
  private readonly provider: NodeTracerProvider;

  constructor(settings: LangfuseSettings) {
    super();
    if (!settings.publicKey || !settings.secretKey) {
      throw new Error(
        'TBF_ASSISTANT_TRACING=langfuse needs LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY',
      );
    }
    this.provider = new NodeTracerProvider({
      spanProcessors: [
        new LangfuseSpanProcessor({
          publicKey: settings.publicKey,
          secretKey: settings.secretKey,
          baseUrl: settings.baseUrl,
          environment: settings.environment,
          exporter: settings.exporter,
          mask: ({ data }: { data: unknown }) => maskPersonalData(String(data)),
        }),
      ],
    });
    this.provider.register();
    setLangfuseTracerProvider(this.provider);
  }

  trace<T>(
    name: string,
    context: { userId: string; input: unknown },
    work: (trace: TraceStep) => Promise<T>,
  ): Promise<T> {
    return startActiveObservation(name, (span) => {
      span.update({ input: context.input });
      return propagateAttributes(
        { userId: context.userId, traceName: name },
        () => recorded(span, work),
      );
    });
  }

  step<T>(
    name: string,
    kind: TraceStepKind,
    work: (step: TraceStep) => Promise<T>,
  ): Promise<T> {
    return startTypedObservation(
      name,
      (observation) => recorded(observation, work),
      { asType: kind },
    );
  }

  flush(): Promise<void> {
    return this.provider.forceFlush();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.provider.shutdown();
  }
}
