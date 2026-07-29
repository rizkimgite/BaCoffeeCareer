"use client";

import { useSyncExternalStore } from "react";
import { getSession, type AdminSession } from "./auth";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getServerSnapshot(): AdminSession | null {
  return null;
}

export function useAdminSession() {
  return useSyncExternalStore(subscribe, getSession, getServerSnapshot);
}
