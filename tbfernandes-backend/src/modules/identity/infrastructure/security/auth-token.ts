export const AUTH_COOKIE = 'TBF_TOKEN';

export interface AuthTokenPayload {
  sub: string;
}

export interface AuthenticatedUser {
  ownerId: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
