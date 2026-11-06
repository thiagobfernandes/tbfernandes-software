import { IsoDate } from '../../common/domain';

export interface StudyView {
  id: string;
  name: string;
  status: string;
  goalId: string | null;
  dueDate: IsoDate | null;
  nextActivity: string | null;
}

export interface CertificationView {
  id: string;
  name: string;
  issuer: string;
  status: string;
  expiresAt: IsoDate | null;
}

export abstract class LearningLookup {
  abstract studies(ownerId: string): Promise<StudyView[]>;
  abstract certifications(ownerId: string): Promise<CertificationView[]>;
}
