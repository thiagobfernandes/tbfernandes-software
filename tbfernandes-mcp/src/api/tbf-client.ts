import { ApiError } from '../errors/api.error.ts';
import { MissingCredentialsError } from '../errors/missing-credentials.error.ts';
import { CookieJar } from './cookie-jar.ts';
import { toQueryString, type QueryParams } from './query-string.ts';
import {
  readJson,
  readResponseBody,
  type JsonObject,
} from './response-body.ts';

const XSRF_COOKIE = 'XSRF-TOKEN';
const XSRF_HEADER = 'X-XSRF-TOKEN';
const TOTAL_COUNT_HEADER = 'x-total-count';
const UNAUTHORIZED = 401;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface Credentials {
  apiUrl: string;
  email: string | undefined;
  password: string | undefined;
}

export interface Page<Item> {
  items: Item[];
  total: number | undefined;
}

// Session mode of the API: GET /auth/session sets the XSRF cookie, POST /auth/login sets
// the session cookie, and every write echoes the XSRF token. Logs in again once on 401.
export class TbfClient {
  private readonly baseUrl: string;
  private readonly email: string;
  private readonly password: string;
  private readonly cookies = new CookieJar();
  private loggedIn = false;

  constructor({ apiUrl, email, password }: Credentials) {
    if (!apiUrl || !email || !password) throw new MissingCredentialsError();
    this.baseUrl = apiUrl.replace(/\/+$/, '');
    this.email = email;
    this.password = password;
  }

  async get<Item = JsonObject>(path: string): Promise<Item> {
    const response = await this.request('GET', path);
    return readJson<Item>(response);
  }

  async list<Item = JsonObject>(
    path: string,
    query?: QueryParams,
  ): Promise<Page<Item>> {
    const response = await this.request('GET', path + toQueryString(query));
    const total = response.headers.get(TOTAL_COUNT_HEADER);
    return {
      items: await readJson<Item[]>(response),
      total: total === null ? undefined : Number(total),
    };
  }

  async post<Item = JsonObject>(path: string, body: object): Promise<Item> {
    const response = await this.request('POST', path, body);
    return readJson<Item>(response);
  }

  async put<Item = JsonObject>(path: string, body: object): Promise<Item> {
    const response = await this.request('PUT', path, body);
    return readJson<Item>(response);
  }

  async delete(path: string): Promise<void> {
    await this.request('DELETE', path);
  }

  private async request(
    method: HttpMethod,
    path: string,
    body?: object,
  ): Promise<Response> {
    if (!this.loggedIn) await this.login();
    let response = await this.send(method, path, body);
    if (response.status === UNAUTHORIZED) {
      await this.login();
      response = await this.send(method, path, body);
    }
    if (!response.ok)
      throw new ApiError(response.status, await readResponseBody(response));
    return response;
  }

  private async login(): Promise<void> {
    this.cookies.clear();
    await this.send('GET', '/auth/session');
    const credentials = { email: this.email, password: this.password };
    const response = await this.send('POST', '/auth/login', credentials);
    if (!response.ok)
      throw new ApiError(response.status, await readResponseBody(response));
    this.loggedIn = true;
  }

  private async send(
    method: HttpMethod,
    path: string,
    body?: object,
  ): Promise<Response> {
    const response = await fetch(this.baseUrl + path, {
      method,
      headers: this.headers(body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    this.cookies.storeFrom(response);
    return response;
  }

  private headers(hasBody: boolean): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (hasBody) headers['Content-Type'] = 'application/json';
    const cookie = this.cookies.toHeader();
    if (cookie) headers['Cookie'] = cookie;
    const xsrf = this.cookies.get(XSRF_COOKIE);
    if (xsrf) headers[XSRF_HEADER] = decodeURIComponent(xsrf);
    return headers;
  }
}
