/**
 * Ids for new aggregates. The first aggregate a request creates takes the id the client chose
 * in X-Client-Id (ADR-007); everything else gets a new UUID v7.
 */
export abstract class IdGenerator {
  /** Id for a new aggregate root. */
  abstract forNewAggregate(): string;
  /** Id for a child record (never the client's id). */
  abstract newId(): string;
}
