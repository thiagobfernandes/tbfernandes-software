import { Method } from '../../../domain';
import {
  MethodEntity,
  MethodExampleEntity,
  MethodStepEntity,
} from '../method.entity';

const byPosition = (a: { position: number }, b: { position: number }) =>
  a.position - b.position;

/** Method ↔ knowledge.method row and its method_step / method_example rows. */
export const MethodPersistenceMapper = {
  toDomain(e: MethodEntity): Method {
    return Method.restore(e.id, e.ownerId, {
      title: e.title,
      summary: e.summary,
      category: e.category,
      steps: [...(e.steps ?? [])]
        .sort(byPosition)
        .map((step) => ({ title: step.title, detail: step.detail })),
      examples: [...(e.examples ?? [])]
        .sort(byPosition)
        .map((example) => ({ title: example.title, content: example.content })),
      tags: e.tags ?? [],
      lastReviewed: e.lastReviewed,
    });
  },

  /** The method row only; steps and examples come from their own functions. */
  toEntity(method: Method, e: MethodEntity = new MethodEntity()): MethodEntity {
    const d = method.details;
    e.id = method.id;
    e.ownerId = method.ownerId;
    e.title = d.title;
    e.summary = d.summary;
    e.category = d.category;
    e.tags = d.tags;
    e.lastReviewed = d.lastReviewed;
    delete e.steps;
    delete e.examples;
    return e;
  },

  toStepEntities(method: Method): MethodStepEntity[] {
    return method.details.steps.map((step, position) =>
      Object.assign(new MethodStepEntity(), {
        methodId: method.id,
        position,
        ...step,
      }),
    );
  },

  toExampleEntities(method: Method): MethodExampleEntity[] {
    return method.details.examples.map((example, position) =>
      Object.assign(new MethodExampleEntity(), {
        methodId: method.id,
        position,
        ...example,
      }),
    );
  },
};
