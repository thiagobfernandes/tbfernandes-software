import { Injectable } from '@nestjs/common';
import {
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import { Education, EducationDetails, EducationRepository } from '../domain';

/** Formal education use cases (RF-LRN-05). */
@Injectable()
export class EducationService {
  constructor(
    private readonly educations: EducationRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: EducationDetails): Promise<Education> {
    return this.educations.create(
      Education.create(
        this.ids.forNewAggregate(),
        this.owner.currentOwnerId(),
        details,
      ),
    );
  }

  update(id: string, details: EducationDetails): Promise<Education> {
    return this.uow.run(async () => {
      const education = await this.get(id);
      education.update(details);
      return this.educations.save(education);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.educations.delete(await this.get(id)));
  }

  async get(id: string): Promise<Education> {
    const education = await this.educations.findById(
      this.owner.currentOwnerId(),
      id,
    );
    if (!education) throw new NotFoundError('A formação', id);
    return education;
  }

  list(): Promise<Education[]> {
    return this.educations.findAll(this.owner.currentOwnerId());
  }
}
