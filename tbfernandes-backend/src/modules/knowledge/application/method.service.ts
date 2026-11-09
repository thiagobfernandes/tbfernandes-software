import { Injectable } from '@nestjs/common';
import {
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import { Method, MethodDetails, MethodRepository } from '../domain';

@Injectable()
export class MethodService {
  constructor(
    private readonly methods: MethodRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: MethodDetails): Promise<Method> {
    const method = Method.create(
      this.ids.forNewAggregate(),
      this.owner.currentOwnerId(),
      details,
    );
    return this.uow.run(() => this.methods.create(method));
  }

  update(id: string, details: MethodDetails): Promise<Method> {
    return this.uow.run(async () => {
      const method = await this.get(id);
      method.update(details);
      return this.methods.save(method);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.methods.delete(await this.get(id)));
  }

  async get(id: string): Promise<Method> {
    const method = await this.methods.findById(this.owner.currentOwnerId(), id);
    if (!method) throw new NotFoundError('O método', id);
    return method;
  }

  list(): Promise<Method[]> {
    return this.methods.findAll(this.owner.currentOwnerId());
  }
}
