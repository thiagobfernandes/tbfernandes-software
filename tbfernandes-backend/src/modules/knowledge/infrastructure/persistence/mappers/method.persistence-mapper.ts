import { Method } from '../../../domain';
import {
  MethodEntity,
  MethodExampleEntity,
  MethodStepEntity,
} from '../method.entity';

const byPosition = (left: { position: number }, right: { position: number }) =>
  left.position - right.position;

export const MethodPersistenceMapper = {
  toDomain(entity: MethodEntity): Method {
    return Method.restore(entity.id, entity.ownerId, {
      title: entity.title,
      summary: entity.summary,
      category: entity.category,
      steps: [...(entity.steps ?? [])]
        .sort(byPosition)
        .map((step) => ({ title: step.title, detail: step.detail })),
      examples: [...(entity.examples ?? [])]
        .sort(byPosition)
        .map((example) => ({ title: example.title, content: example.content })),
      tags: entity.tags ?? [],
      lastReviewed: entity.lastReviewed,
    });
  },

  /** The method row only; steps and examples come from their own functions. */
  toEntity(
    method: Method,
    entity: MethodEntity = new MethodEntity(),
  ): MethodEntity {
    const details = method.details;
    entity.id = method.id;
    entity.ownerId = method.ownerId;
    entity.title = details.title;
    entity.summary = details.summary;
    entity.category = details.category;
    entity.tags = details.tags;
    entity.lastReviewed = details.lastReviewed;
    delete entity.steps;
    delete entity.examples;
    return entity;
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
