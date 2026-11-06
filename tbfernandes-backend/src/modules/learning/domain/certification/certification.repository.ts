import { Certification } from './certification';

export abstract class CertificationRepository {
  abstract create(certification: Certification): Promise<Certification>;
  abstract save(certification: Certification): Promise<Certification>;
  abstract findById(ownerId: string, id: string): Promise<Certification | null>;
  /** Ordered by name. */
  abstract findAll(ownerId: string): Promise<Certification[]>;
  abstract delete(certification: Certification): Promise<void>;
}
