import 'express-session';

declare module 'express-session' {
  interface SessionData {
    ownerId: string;
  }
}

export const SESSION_COOKIE = 'TBF_SESSION';
