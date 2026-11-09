import { Education } from './education';

export abstract class EducationRepository {
  abstract create(education: Education): Promise<Education>;
  abstract save(education: Education): Promise<Education>;
  abstract findById(ownerId: string, id: string): Promise<Education | null>;
  /** Newest start date first. */
  abstract findAll(ownerId: string): Promise<Education[]>;
  abstract delete(education: Education): Promise<void>;
}
