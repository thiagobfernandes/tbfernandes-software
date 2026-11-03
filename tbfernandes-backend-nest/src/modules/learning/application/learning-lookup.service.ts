import { Injectable } from '@nestjs/common';
import { CertificationRepository, StudyRepository } from '../domain';
import {
  CertificationView,
  LearningLookup,
  StudyView,
} from '../learning.lookup';

/** Implements the learning module's public API on top of its own repositories. */
@Injectable()
export class LearningLookupService extends LearningLookup {
  constructor(
    private readonly studiesRepo: StudyRepository,
    private readonly certificationsRepo: CertificationRepository,
  ) {
    super();
  }

  async studies(ownerId: string): Promise<StudyView[]> {
    return (await this.studiesRepo.findAll(ownerId)).map((study) => {
      const d = study.details;
      return {
        id: study.id,
        name: d.name,
        status: study.status.toLowerCase(),
        goalId: d.goalId,
        dueDate: d.dueDate,
        nextActivity: d.nextActivity,
      };
    });
  }

  async certifications(ownerId: string): Promise<CertificationView[]> {
    return (await this.certificationsRepo.findAll(ownerId)).map((c) => {
      const d = c.details;
      return {
        id: c.id,
        name: d.name,
        issuer: d.issuer,
        status: c.status.toLowerCase(),
        expiresAt: d.expiresAt,
      };
    });
  }
}
