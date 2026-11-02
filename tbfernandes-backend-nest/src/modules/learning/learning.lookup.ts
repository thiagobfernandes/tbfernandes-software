import { IsoDate } from '../../common/domain';

/** Lightweight copy of a study, safe to hold outside the module. Status in lower case. */
export interface StudyView {
  id: string;
  name: string;
  status: string;
  goalId: string | null;
  dueDate: IsoDate | null;
  nextActivity: string | null;
}

/** Lightweight copy of a certification, safe to hold outside the module. */
export interface CertificationView {
  id: string;
  name: string;
  issuer: string;
  status: string;
  expiresAt: IsoDate | null;
}

/** Read access to learning data for other modules (goals, the assistant). */
export abstract class LearningLookup {
  abstract studies(ownerId: string): Promise<StudyView[]>;
  abstract certifications(ownerId: string): Promise<CertificationView[]>;
}
