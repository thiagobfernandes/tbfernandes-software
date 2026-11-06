import { Injectable } from '@nestjs/common';
import {
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import { Skill, SkillDetails, SkillRepository } from '../domain';

@Injectable()
export class SkillService {
  constructor(
    private readonly skills: SkillRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  create(details: SkillDetails): Promise<Skill> {
    return this.skills.create(
      Skill.create(
        this.ids.forNewAggregate(),
        this.owner.currentOwnerId(),
        details,
      ),
    );
  }

  update(id: string, details: SkillDetails): Promise<Skill> {
    return this.uow.run(async () => {
      const skill = await this.get(id);
      skill.update(details);
      return this.skills.save(skill);
    });
  }

  /** Studies drop the link (ON DELETE CASCADE on study_skill). */
  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.skills.delete(await this.get(id)));
  }

  async get(id: string): Promise<Skill> {
    const skill = await this.skills.findById(this.owner.currentOwnerId(), id);
    if (!skill) throw new NotFoundError('A habilidade', id);
    return skill;
  }

  list(): Promise<Skill[]> {
    return this.skills.findAll(this.owner.currentOwnerId());
  }
}
