'use client';

import { useCallback, useEffect, useState } from 'react';
import { authApi } from './api';
import { getToken, onTokenChange, setToken } from './auth-token';
import type { AuthenticatedUser } from './types';

interface AuthState {
  user: AuthenticatedUser | null;
  /** True until the stored token has been checked against the API. */
  loading: boolean;
  signOut: () => void;
}

/**
 * Resolves the stored token into a user.
 *
 * The token is verified against /auth/me on mount rather than decoded locally,
 * so a token that the server has since rejected does not leave the UI showing
 * a signed-in state that no longer works.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const resolve = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await authApi.me();
      setUser(data);
    } catch {
      // The response interceptor has already cleared an invalid token.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void resolve();
    return onTokenChange(() => void resolve());
  }, [resolve]);

  const signOut = useCallback(() => setToken(null), []);

  return { user, loading, signOut };
}
