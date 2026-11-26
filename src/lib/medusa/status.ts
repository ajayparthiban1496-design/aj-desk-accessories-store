import { useSyncExternalStore } from "react";
import { hasBackend } from "@/lib/env";

/**
 * Whether the Medusa backend is answering. When it isn't, the catalogue is
 * served from the bundled copy and ordering is paused (see BackendNotice).
 */
let online = hasBackend;
const listeners = new Set<() => void>();

export function setBackendOnline(value: boolean) {
  if (value === online) return;
  online = value;
  listeners.forEach((l) => l());
}

export function useBackendOnline() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => online,
  );
}

const TIMEOUT_MS = 4000;

/** Runs a backend call; on failure or timeout, marks the backend offline and returns the fallback. */
export async function withFallback<T>(call: () => Promise<T>, fallback: () => T): Promise<T> {
  if (!hasBackend) return fallback();
  try {
    const result = await Promise.race([
      call(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
    ]);
    setBackendOnline(true);
    return result;
  } catch (e) {
    console.warn("[Aj Desk] Shop backend unavailable, using the bundled catalogue.", e);
    setBackendOnline(false);
    return fallback();
  }
}
