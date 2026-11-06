import { Injectable } from '@nestjs/common';
import { CertificationRepository, StudyRepository } from '../domain';
import {
  CertificationView,
  LearningLookup,
  StudyView,
} from '../learning.lookup';

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
      const details = study.details;
      return {
        id: study.id,
        name: details.name,
        status: study.status.toLowerCase(),
        goalId: details.goalId,
        dueDate: details.dueDate,
        nextActivity: details.nextActivity,
      };
    });
  }

  async certifications(ownerId: string): Promise<CertificationView[]> {
    return (await this.certificationsRepo.findAll(ownerId)).map(
      (certification) => {
        const details = certification.details;
        return {
          id: certification.id,
          name: details.name,
          issuer: details.issuer,
          status: certification.status.toLowerCase(),
          expiresAt: details.expiresAt,
        };
      },
    );
  }
}
