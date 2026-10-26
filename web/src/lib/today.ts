"use client";

import { useSyncExternalStore } from "react";

import { env } from "@/lib/env";
import { SAMPLE_TODAY } from "@/lib/sample-data/work";

// "Today" for every date the screens compute (due chips, overdue counts,
// the current month). The sample data is written around a fixed day, so
// local mode stays on it; with the API the real local day is used.

function localDay(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** For event handlers and helpers outside React rendering. */
export function currentDay() {
  return env.dataSource === "api" ? localDay() : SAMPLE_TODAY;
}

const noopSubscribe = () => () => {};

/** For rendering: the server render uses the sample day, the browser the real one. */
export function useToday() {
  return useSyncExternalStore(noopSubscribe, currentDay, () => SAMPLE_TODAY);
}
