export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super("Não foi possível acessar a API. Verifique sua conexão.", { cause });
    this.name = "NetworkError";
  }
}
