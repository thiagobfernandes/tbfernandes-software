import { Lead, LeadStatus } from './lead';

export abstract class LeadRepository {
  abstract create(lead: Lead): Promise<Lead>;
  abstract save(lead: Lead): Promise<Lead>;
  abstract findById(ownerId: string, id: string): Promise<Lead | null>;
  abstract findByExternalId(
    ownerId: string,
    externalId: string,
  ): Promise<Lead | null>;
  /** Most recent contact first, then by name; all statuses when status is null. */
  abstract findAll(ownerId: string, status: LeadStatus | null): Promise<Lead[]>;
  /** Messages go with the lead (ON DELETE CASCADE). */
  abstract delete(lead: Lead): Promise<void>;
}
