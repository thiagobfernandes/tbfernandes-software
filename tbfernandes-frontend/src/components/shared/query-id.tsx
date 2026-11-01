"use client";

import { useSearchParams } from "next/navigation";

/**
 * The record id of a detail page, read from `?id=` (see lib/routes.ts). Call
 * it under a Suspense boundary: the query string is only known in the browser.
 */
export function useQueryId() {
  return useSearchParams().get("id") ?? "";
}
