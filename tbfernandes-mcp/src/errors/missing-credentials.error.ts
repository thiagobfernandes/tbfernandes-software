export class MissingCredentialsError extends Error {
  constructor() {
    super('Defina TBF_API_URL, TBF_EMAIL e TBF_PASSWORD (ou TBF_ENV_FILE).');
    this.name = 'MissingCredentialsError';
  }
}
