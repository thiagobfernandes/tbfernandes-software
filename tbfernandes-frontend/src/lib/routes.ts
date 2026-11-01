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
