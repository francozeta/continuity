"use client";

import { useSyncExternalStore } from "react";

const preference = {
  subscribe(callback: () => void) {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    query.addEventListener("change", callback);
    return () => query.removeEventListener("change", callback);
  },
  getSnapshot: () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  getServerSnapshot: () => true,
};

export function useReducedMotionPreference() {
  return useSyncExternalStore(
    preference.subscribe,
    preference.getSnapshot,
    preference.getServerSnapshot,
  );
}
