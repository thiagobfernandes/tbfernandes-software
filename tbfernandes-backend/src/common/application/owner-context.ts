/**
 * Who owns the data of the current request. Every table has owner_id (RNF-SEG-03), and use
 * cases always read and write within this owner. Implemented by the identity module.
 */
export abstract class OwnerContext {
  abstract currentOwnerId(): string;
}
