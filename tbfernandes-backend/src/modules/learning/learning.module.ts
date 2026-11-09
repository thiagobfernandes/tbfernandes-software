import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CertificationService } from './application/certification.service';
import { EducationService } from './application/education.service';
import { LearningLookupService } from './application/learning-lookup.service';
import { MaterialService } from './application/material.service';
import { SkillService } from './application/skill.service';
import { StudyService } from './application/study.service';
import {
  CertificationRepository,
  EducationRepository,
  MaterialRepository,
  SkillRepository,
  StudyRepository,
} from './domain';
import {
  CertificationEntity,
  CertificationStudyEntity,
} from './infrastructure/persistence/certification.entity';
import { EducationEntity } from './infrastructure/persistence/education.entity';
import { MaterialEntity } from './infrastructure/persistence/material.entity';
import { SkillEntity } from './infrastructure/persistence/skill.entity';
import {
  StudyEntity,
  StudySkillEntity,
} from './infrastructure/persistence/study.entity';
import { TypeOrmCertificationRepository } from './infrastructure/persistence/typeorm-certification.repository';
import { TypeOrmEducationRepository } from './infrastructure/persistence/typeorm-education.repository';
import { TypeOrmMaterialRepository } from './infrastructure/persistence/typeorm-material.repository';
import { TypeOrmSkillRepository } from './infrastructure/persistence/typeorm-skill.repository';
import { TypeOrmStudyRepository } from './infrastructure/persistence/typeorm-study.repository';
import { LearningLookup } from './learning.lookup';
import { CertificationController } from './web/certification.controller';
import { EducationController } from './web/education.controller';
import { MaterialController } from './web/material.controller';
import { SkillController } from './web/skill.controller';
import { StudyController } from './web/study.controller';

@Module({
  imports: [
    DatabaseModule.forFeature([
      StudyEntity,
      StudySkillEntity,
      MaterialEntity,
      SkillEntity,
      CertificationEntity,
      CertificationStudyEntity,
      EducationEntity,
    ]),
  ],
  controllers: [
    StudyController,
    MaterialController,
    SkillController,
    CertificationController,
    EducationController,
  ],
  providers: [
    StudyService,
    MaterialService,
    SkillService,
    CertificationService,
    EducationService,
    LearningLookupService,
    { provide: StudyRepository, useClass: TypeOrmStudyRepository },
    { provide: MaterialRepository, useClass: TypeOrmMaterialRepository },
    { provide: SkillRepository, useClass: TypeOrmSkillRepository },
    {
      provide: CertificationRepository,
      useClass: TypeOrmCertificationRepository,
    },
    { provide: EducationRepository, useClass: TypeOrmEducationRepository },
    { provide: LearningLookup, useExisting: LearningLookupService },
  ],
  exports: [LearningLookup],
})
export class LearningModule {}
