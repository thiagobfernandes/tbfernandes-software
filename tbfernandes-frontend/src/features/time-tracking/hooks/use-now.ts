"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let current = Date.now();
let timer: number | undefined;

function tick() {
  current = Date.now();
  listeners.forEach((listener) => listener());
}

function subscribeTicking(listener: () => void) {
  listeners.add(listener);
  if (timer === undefined) {
    tick();
    timer = window.setInterval(tick, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

const subscribeStill = () => () => {};

export function useNow(ticking: boolean) {
  const millis = useSyncExternalStore(
    ticking ? subscribeTicking : subscribeStill,
    () => current,
    () => 0,
  );
  return new Date(millis);
}
