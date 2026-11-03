import { Injectable } from '@nestjs/common';
import {
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import {
  SkillRepository,
  Study,
  StudyDetails,
  StudyRepository,
} from '../domain';

/** Study plan use cases (RF-LRN-01). Linked skills must be the owner's (RN-05). */
@Injectable()
export class StudyService {
  constructor(
    private readonly studies: StudyRepository,
    private readonly skills: SkillRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  async create(details: StudyDetails): Promise<Study> {
    const ownerId = this.owner.currentOwnerId();
    const study = Study.create(this.ids.forNewAggregate(), ownerId, details);
    await this.checkSkills(ownerId, study.details.skillIds);
    return this.uow.run(() => this.studies.create(study));
  }

  update(id: string, details: StudyDetails): Promise<Study> {
    return this.uow.run(async () => {
      const study = await this.get(id);
      study.update(details);
      await this.checkSkills(study.ownerId, study.details.skillIds);
      return this.studies.save(study);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.studies.delete(await this.get(id)));
  }

  async get(id: string): Promise<Study> {
    const study = await this.studies.findById(this.owner.currentOwnerId(), id);
    if (!study) throw new NotFoundError('O estudo', id);
    return study;
  }

  list(): Promise<Study[]> {
    return this.studies.findAll(this.owner.currentOwnerId());
  }

  private async checkSkills(ownerId: string, ids: string[]): Promise<void> {
    if (ids.length && !(await this.skills.allExist(ownerId, ids)))
      throw new NotFoundError('A habilidade', ids[0]);
  }
}
