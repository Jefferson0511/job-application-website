// src/lib/auth-token.ts
const STORAGE_KEY = 'jobboard.accessToken';

type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

/**
 * Token storage, kept separate from the API client so that both the axios
 * interceptor and the React components read the same value.
 *
 * localStorage is readable by any script on the page, so this trades some XSS
 * resistance for being able to serve the frontend and API from different
 * origins. An httpOnly cookie would be the stronger choice if they ever share
 * a domain.
 */
export function getToken(): string | null {
  // Guarded because this module is imported by components that also render on
  // the server, where localStorage does not exist.
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem(STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  listeners.forEach((listener) => listener(token));
}

/** Notifies components when sign-in state changes. Returns an unsubscribe. */
export function onTokenChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
