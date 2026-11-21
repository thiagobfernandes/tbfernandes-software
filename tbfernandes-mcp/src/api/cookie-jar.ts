export class CookieJar {
  private readonly cookies = new Map<string, string>();

  storeFrom(response: Response): void {
    for (const setCookie of response.headers.getSetCookie()) {
      this.store(setCookie);
    }
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }

  clear(): void {
    this.cookies.clear();
  }

  toHeader(): string | undefined {
    if (this.cookies.size === 0) return undefined;
    return [...this.cookies]
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  private store(setCookie: string): void {
    const [pair = ''] = setCookie.split(';');
    const separator = pair.indexOf('=');
    if (separator <= 0) return;
    const name = pair.slice(0, separator).trim();
    this.cookies.set(name, pair.slice(separator + 1).trim());
  }
}
