import { Injectable } from '@nestjs/common';
import {
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { NotFoundError } from '../../../common/domain';
import { Material, MaterialDetails, MaterialRepository } from '../domain';
import { StudyService } from './study.service';

/** Material use cases (RF-LRN-02). */
@Injectable()
export class MaterialService {
  constructor(
    private readonly materials: MaterialRepository,
    private readonly studies: StudyService,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly uow: UnitOfWork,
  ) {}

  async create(details: MaterialDetails): Promise<Material> {
    if (details.studyId) await this.studies.get(details.studyId);
    return this.materials.create(
      Material.create(
        this.ids.forNewAggregate(),
        this.owner.currentOwnerId(),
        details,
      ),
    );
  }

  update(id: string, details: MaterialDetails): Promise<Material> {
    return this.uow.run(async () => {
      const material = await this.get(id);
      if (details.studyId) await this.studies.get(details.studyId);
      material.update(details);
      return this.materials.save(material);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () => this.materials.delete(await this.get(id)));
  }

  async get(id: string): Promise<Material> {
    const material = await this.materials.findById(
      this.owner.currentOwnerId(),
      id,
    );
    if (!material) throw new NotFoundError('O material', id);
    return material;
  }

  list(studyId: string | null = null): Promise<Material[]> {
    return this.materials.findAll(this.owner.currentOwnerId(), studyId);
  }
}
