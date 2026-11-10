/**
 * Detail pages take the id in the query string (`/projects/view?id=…`), not in
 * the path, so the app can be exported as static files for the desktop build
 * (`output: "export"` cannot pre-render ids that only exist at runtime).
 */
const detail = (base: string) => (id: string) =>
  `${base}/view?id=${encodeURIComponent(id)}`;

export const projectHref = detail("/projects");
export const companyHref = detail("/companies");
export const goalHref = detail("/goals");
export const methodHref = detail("/methods");

export const LOGIN_PATH = "/login";

export function loginHref(next?: string) {
  if (!next || next === "/") return LOGIN_PATH;
  return `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;
}

export function safeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  if (next.startsWith(LOGIN_PATH)) return "/";
  return next;
}
