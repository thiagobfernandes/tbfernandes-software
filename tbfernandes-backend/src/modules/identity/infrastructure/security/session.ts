import 'express-session';

declare module 'express-session' {
  interface SessionData {
    /** The signed-in account (IDN-01). */
    ownerId: string;
  }
}

export const SESSION_COOKIE = 'TBF_SESSION';
