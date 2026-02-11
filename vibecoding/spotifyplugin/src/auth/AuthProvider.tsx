import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { SpotifyUser } from '../types/spotify.ts';
import type { AuthState, AuthContextType } from './AuthContext.ts';
import { AuthContext } from './AuthContext.ts';
import { SPOTIFY_API_BASE } from '../config/constants.ts';
import { redirectToSpotifyLogin, exchangeCodeForToken, refreshAccessToken } from './spotify-auth.ts';

// --- Storage keys ---
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'spotify_access_token',
  REFRESH_TOKEN: 'spotify_refresh_token',
  EXPIRES_AT: 'spotify_expires_at',
  USER: 'spotify_user',
} as const;

// --- Refresh 5 minutes before expiry ---
const REFRESH_BUFFER_MS = 5 * 60 * 1000;
const REFRESH_CHECK_INTERVAL_MS = 60 * 1000;

// --- Helper: persist tokens to localStorage ---

function persistTokens(
  accessToken: string,
  refreshToken: string | undefined,
  expiresAt: number,
  user: SpotifyUser,
): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
  localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(expiresAt));
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

function clearPersistedTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

function loadPersistedState(): Omit<AuthState, 'isLoading'> {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const expiresAtRaw = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
  const userRaw = localStorage.getItem(STORAGE_KEYS.USER);

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAtRaw ? Number(expiresAtRaw) : null,
    user: userRaw ? (JSON.parse(userRaw) as SpotifyUser) : null,
  };
}

/**
 * Returns true if the persisted tokens need a refresh (expired or about to expire).
 */
function tokensNeedRefresh(): boolean {
  const expiresAtRaw = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
  if (!expiresAtRaw) return false;
  return Date.now() >= Number(expiresAtRaw) - REFRESH_BUFFER_MS;
}

// --- Fetch user profile ---

async function fetchUserProfile(accessToken: string): Promise<SpotifyUser> {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile (${response.status})`);
  }

  return response.json() as Promise<SpotifyUser>;
}

// --- Compute initial state synchronously ---

function computeInitialState(): AuthState {
  const persisted = loadPersistedState();
  const { accessToken, refreshToken, expiresAt } = persisted;

  // No tokens stored -- nothing to load
  if (!accessToken || !refreshToken || !expiresAt) {
    return { ...persisted, isLoading: false };
  }

  // Tokens exist but are still valid -- render immediately, no loading needed
  if (!tokensNeedRefresh()) {
    return { ...persisted, isLoading: false };
  }

  // Tokens exist but need refresh -- show loading until refresh completes
  return { ...persisted, isLoading: true };
}

// --- Provider component ---

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(computeInitialState);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Perform a token refresh and update state + storage.
  // This is called from async contexts (interval callbacks, mount effect promise chains),
  // never synchronously inside an effect body.
  const performTokenRefresh = useCallback(async (currentRefreshToken: string) => {
    try {
      const tokenResponse = await refreshAccessToken(currentRefreshToken);
      const expiresAt = Date.now() + tokenResponse.expires_in * 1000;
      const user = await fetchUserProfile(tokenResponse.access_token);

      setState((prev) => ({
        ...prev,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token ?? prev.refreshToken,
        expiresAt,
        user,
        isLoading: false,
      }));

      persistTokens(
        tokenResponse.access_token,
        tokenResponse.refresh_token ?? currentRefreshToken,
        expiresAt,
        user,
      );
    } catch {
      // Refresh failed -- clear everything and force re-login
      clearPersistedTokens();
      setState({
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        user: null,
        isLoading: false,
      });
    }
  }, []);

  // Start the auto-refresh interval
  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    refreshTimerRef.current = setInterval(() => {
      setState((currentState) => {
        const { expiresAt, refreshToken } = currentState;

        if (expiresAt && refreshToken && Date.now() >= expiresAt - REFRESH_BUFFER_MS) {
          void performTokenRefresh(refreshToken);
        }

        return currentState;
      });
    }, REFRESH_CHECK_INTERVAL_MS);
  }, [performTokenRefresh]);

  // On mount: kick off token refresh if needed and start the refresh timer.
  // The initial state is computed synchronously in computeInitialState(),
  // so no synchronous setState is needed here.
  useEffect(() => {
    const persisted = loadPersistedState();
    const { accessToken, refreshToken, expiresAt } = persisted;

    if (!accessToken || !refreshToken || !expiresAt) {
      return;
    }

    if (tokensNeedRefresh()) {
      // Defer to a microtask so setState is not called synchronously within the effect body
      const timer = setTimeout(() => {
        void performTokenRefresh(refreshToken);
      }, 0);
      return () => {
        clearTimeout(timer);
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }

    startRefreshTimer();

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [performTokenRefresh, startRefreshTimer]);

  // --- Actions ---

  const login = useCallback(() => {
    void redirectToSpotifyLogin();
  }, []);

  const logout = useCallback(() => {
    clearPersistedTokens();

    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    setState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isLoading: false,
    });
  }, []);

  const handleCallback = useCallback(
    async (code: string) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const tokenResponse = await exchangeCodeForToken(code);
        const expiresAt = Date.now() + tokenResponse.expires_in * 1000;
        const user = await fetchUserProfile(tokenResponse.access_token);

        setState({
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token ?? null,
          expiresAt,
          user,
          isLoading: false,
        });

        persistTokens(
          tokenResponse.access_token,
          tokenResponse.refresh_token,
          expiresAt,
          user,
        );

        startRefreshTimer();
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [startRefreshTimer],
  );

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    handleCallback,
  };

  return <AuthContext value={contextValue}>{children}</AuthContext>;
}
