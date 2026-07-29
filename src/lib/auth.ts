const SESSION_KEY = "bc_admin_session";

export const DEMO_CREDENTIALS = {
  username: "admin",
  password: "bacoffee2026",
};

export type AdminSession = {
  username: string;
};

// Cache the parsed session so getSession() returns a stable reference when
// the underlying sessionStorage value hasn't changed — required for
// useSyncExternalStore, which otherwise sees a "new" snapshot every render.
let cachedRaw: string | null = null;
let cachedSession: AdminSession | null = null;

export function login(username: string, password: string): boolean {
  if (username !== DEMO_CREDENTIALS.username || password !== DEMO_CREDENTIALS.password) {
    return false;
  }
  const raw = JSON.stringify({ username } satisfies AdminSession);
  sessionStorage.setItem(SESSION_KEY, raw);
  cachedRaw = raw;
  cachedSession = { username };
  return true;
}

export function getSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (raw === cachedRaw) return cachedSession;

  cachedRaw = raw;
  if (!raw) {
    cachedSession = null;
    return null;
  }
  try {
    cachedSession = JSON.parse(raw) as AdminSession;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}
