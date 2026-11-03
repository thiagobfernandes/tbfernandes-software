import { Injectable } from '@nestjs/common';
import {
  Clock,
  IdGenerator,
  OwnerContext,
  UnitOfWork,
} from '../../../common/application';
import { IsoDates, NotFoundError } from '../../../common/domain';
import {
  Certification,
  CertificationDetails,
  CertificationRepository,
  StudyRepository,
} from '../domain';

/** Certification use cases (RF-LRN-04, LRN-06). */
@Injectable()
export class CertificationService {
  constructor(
    private readonly certifications: CertificationRepository,
    private readonly studies: StudyRepository,
    private readonly owner: OwnerContext,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly uow: UnitOfWork,
  ) {}

  async create(details: CertificationDetails): Promise<Certification> {
    const ownerId = this.owner.currentOwnerId();
    const certification = Certification.create(
      this.ids.forNewAggregate(),
      ownerId,
      details,
    );
    await this.checkStudies(ownerId, certification.details.studyIds);
    return this.uow.run(() => this.certifications.create(certification));
  }

  update(id: string, details: CertificationDetails): Promise<Certification> {
    return this.uow.run(async () => {
      const certification = await this.get(id);
      certification.update(details);
      await this.checkStudies(
        certification.ownerId,
        certification.details.studyIds,
      );
      return this.certifications.save(certification);
    });
  }

  delete(id: string): Promise<void> {
    return this.uow.run(async () =>
      this.certifications.delete(await this.get(id)),
    );
  }

  async get(id: string): Promise<Certification> {
    const certification = await this.certifications.findById(
      this.owner.currentOwnerId(),
      id,
    );
    if (!certification) throw new NotFoundError('A certificação', id);
    return certification;
  }

  /** LRN-06: with expiringWithinDays, only obtained certifications expiring in that window. */
  async list(
    expiringWithinDays: number | null = null,
  ): Promise<Certification[]> {
    const all = await this.certifications.findAll(this.owner.currentOwnerId());
    if (expiringWithinDays == null) return all;
    const today = this.clock.today();
    const limit = IsoDates.plusDays(today, expiringWithinDays);
    return all.filter((c) => c.expiresBetween(today, limit));
  }

  private async checkStudies(ownerId: string, ids: string[]): Promise<void> {
    if (ids.length && !(await this.studies.allExist(ownerId, ids)))
      throw new NotFoundError('O estudo', ids[0]);
  }
}
