import type { SpotifyTokenResponse } from '../types/spotify.ts';
import { SPOTIFY_AUTH_URL, SPOTIFY_TOKEN_URL, SPOTIFY_SCOPES } from '../config/constants.ts';
import { generateCodeVerifier, generateCodeChallenge, getStoredCodeVerifier, clearCodeVerifier } from './pkce.ts';

const STATE_STORAGE_KEY = 'spotify_auth_state';

/**
 * Generates a random state string for CSRF protection.
 */
function generateState(): string {
  const array = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Initiates the Spotify PKCE authorization flow.
 * Generates verifier, challenge, and state, stores them in sessionStorage,
 * then redirects the user to Spotify's authorization page.
 */
export async function redirectToSpotifyLogin(): Promise<void> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error(
      'Missing VITE_SPOTIFY_CLIENT_ID or VITE_SPOTIFY_REDIRECT_URI environment variables.',
    );
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateState();

  sessionStorage.setItem(STATE_STORAGE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  });

  window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchanges an authorization code for access and refresh tokens.
 * Uses the stored PKCE code verifier from sessionStorage.
 */
export async function exchangeCodeForToken(code: string): Promise<SpotifyTokenResponse> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  const verifier = getStoredCodeVerifier();

  if (!verifier) {
    throw new Error('No code verifier found in sessionStorage. Please restart the login flow.');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${errorBody}`);
  }

  clearCodeVerifier();

  return response.json() as Promise<SpotifyTokenResponse>;
}

/**
 * Refreshes an access token using a refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${errorBody}`);
  }

  return response.json() as Promise<SpotifyTokenResponse>;
}

/**
 * Retrieves the stored auth state from sessionStorage for CSRF validation.
 */
export function getStoredState(): string | null {
  return sessionStorage.getItem(STATE_STORAGE_KEY);
}

/**
 * Clears the stored auth state from sessionStorage.
 */
export function clearStoredState(): void {
  sessionStorage.removeItem(STATE_STORAGE_KEY);
}
