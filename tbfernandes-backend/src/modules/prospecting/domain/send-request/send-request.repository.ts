import { SendableStage, SendRequest, SendRequestStatus } from './send-request';

export abstract class SendRequestRepository {
  abstract create(request: SendRequest): Promise<SendRequest>;
  abstract save(request: SendRequest): Promise<SendRequest>;
  abstract findById(ownerId: string, id: string): Promise<SendRequest | null>;
  /** The latest request for this lead and stage, whatever its status. */
  abstract findLatest(
    ownerId: string,
    leadId: string,
    stage: SendableStage,
  ): Promise<SendRequest | null>;
  /** Newest first; all statuses when status is null. */
  abstract findAll(
    ownerId: string,
    status: SendRequestStatus | null,
  ): Promise<SendRequest[]>;
  /** PENDING and APPROVED, oldest first. */
  abstract findOpen(ownerId: string): Promise<SendRequest[]>;
}
