/**
 * Runs a use case in one database transaction. Repositories called inside `run` join it, and
 * events published inside it go out only after the commit.
 */
export abstract class UnitOfWork {
  abstract run<T>(work: () => Promise<T>): Promise<T>;
}
