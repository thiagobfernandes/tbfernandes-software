import type { ProblemDetail } from "./problem-detail";

export class ApiError extends Error {
  constructor(public readonly problem: ProblemDetail) {
    super(
      problem.detail ?? problem.title ?? `Falha na requisição (${problem.status})`,
    );
    this.name = "ApiError";
  }

  get status() {
    return this.problem.status;
  }
}
