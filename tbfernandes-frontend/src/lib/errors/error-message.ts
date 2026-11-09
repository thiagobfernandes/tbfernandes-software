import { ApiError } from "./api.error";
import { NetworkError } from "./network.error";

const FALLBACK_BY_STATUS: Record<number, string> = {
  401: "Entre primeiro",
  403: "Acesso negado",
  429: "Muitas tentativas. Tente de novo em instantes.",
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.problem.detail ?? FALLBACK_BY_STATUS[error.status] ?? error.message;
  }
  if (error instanceof NetworkError) return error.message;
  return "Algo deu errado. Tente de novo.";
}

export function isUnauthenticated(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}
