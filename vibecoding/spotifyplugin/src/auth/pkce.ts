const STORAGE_KEY = 'spotify_pkce_code_verifier';

/**
 * Characters allowed in a PKCE code verifier (RFC 7636 Section 4.1).
 * Unreserved characters: A-Z, a-z, 0-9, '-', '.', '_', '~'
 */
const UNRESERVED_CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

/**
 * Generates a cryptographically random code verifier string of 64 characters,
 * using only unreserved URI characters as required by PKCE (RFC 7636).
 */
export function generateCodeVerifier(): string {
  const randomValues = crypto.getRandomValues(new Uint8Array(64));
  const chars = UNRESERVED_CHARACTERS;
  let verifier = '';

  for (const byte of randomValues) {
    verifier += chars[byte % chars.length];
  }

  sessionStorage.setItem(STORAGE_KEY, verifier);
  return verifier;
}

/**
 * Generates a base64url-encoded SHA-256 hash of the given code verifier,
 * used as the PKCE code challenge.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  // Convert ArrayBuffer to base64url string (no padding)
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Retrieves the stored code verifier from sessionStorage.
 * Returns null if no verifier is stored.
 */
export function getStoredCodeVerifier(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

/**
 * Removes the stored code verifier from sessionStorage.
 */
export function clearCodeVerifier(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
