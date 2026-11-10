export const DOCUMENTS_PATH = "/documents";

/** Editor of a saved document (id in the query string, see lib/routes.ts). */
export const documentHref = (id: string) =>
  `${DOCUMENTS_PATH}/edit?id=${encodeURIComponent(id)}`;
