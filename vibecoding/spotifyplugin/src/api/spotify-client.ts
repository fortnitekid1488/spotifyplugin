import type { SpotifyUser, SpotifyPlaylist, SpotifyPlaylistsResponse, SpotifyPlaylistTrackItem, SpotifyPlaylistTracksResponse } from '../types/spotify.ts';
import { SPOTIFY_API_BASE } from '../config/constants.ts';

const TRACKS_PER_PAGE = 100;

/**
 * Error thrown when the Spotify API returns a 401 Unauthorized response.
 * Indicates the access token has expired or is invalid.
 */
export class SpotifyAuthError extends Error {
  constructor(message = 'Spotify access token expired or invalid') {
    super(message);
    this.name = 'SpotifyAuthError';
  }
}

/**
 * Error thrown when the Spotify API returns a non-OK response (other than 401).
 */
export class SpotifyApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'SpotifyApiError';
    this.status = status;
  }
}

/**
 * Internal fetch wrapper that attaches the Authorization header
 * and handles error responses from the Spotify API.
 *
 * Throws `SpotifyAuthError` on 401 responses and `SpotifyApiError`
 * on all other non-OK responses.
 */
async function spotifyFetch(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${SPOTIFY_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    throw new SpotifyAuthError();
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new SpotifyApiError(
      response.status,
      `Spotify API error (${response.status}): ${errorBody}`,
    );
  }

  return response;
}

/**
 * Fetches the current user's Spotify profile.
 */
export async function getUserProfile(accessToken: string): Promise<SpotifyUser> {
  const response = await spotifyFetch(accessToken, '/me');
  return response.json() as Promise<SpotifyUser>;
}

/**
 * Fetches the current user's playlists with pagination support.
 */
export async function getUserPlaylists(
  accessToken: string,
  limit = 50,
  offset = 0,
): Promise<SpotifyPlaylistsResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  const response = await spotifyFetch(accessToken, `/me/playlists?${params.toString()}`);
  return response.json() as Promise<SpotifyPlaylistsResponse>;
}

/**
 * Fetches the details of a specific playlist by ID.
 */
export async function getPlaylistDetails(
  accessToken: string,
  playlistId: string,
): Promise<SpotifyPlaylist> {
  const response = await spotifyFetch(accessToken, `/playlists/${playlistId}`);
  return response.json() as Promise<SpotifyPlaylist>;
}

/**
 * Fetches all tracks in a playlist, automatically handling pagination.
 * Returns a flat array of all track items.
 */
export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
): Promise<SpotifyPlaylistTrackItem[]> {
  const allItems: SpotifyPlaylistTrackItem[] = [];
  let url: string | null = `/playlists/${playlistId}/tracks?limit=${TRACKS_PER_PAGE}`;

  while (url !== null) {
    const response = await spotifyFetch(accessToken, url);
    const data = (await response.json()) as SpotifyPlaylistTracksResponse;

    allItems.push(...data.items);
    url = data.next;
  }

  return allItems;
}

/**
 * Replaces all tracks in a playlist with the given URIs in order.
 *
 * For playlists with 100 or fewer tracks, a single PUT replaces all tracks.
 * For larger playlists, the first PUT sets the first 100 tracks (clearing existing),
 * then subsequent POST requests append the remaining tracks in batches of 100.
 */
export async function reorderPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[],
): Promise<void> {
  if (uris.length === 0) {
    // Clear the playlist by replacing with an empty array
    await spotifyFetch(accessToken, `/playlists/${playlistId}/tracks`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [] }),
    });
    return;
  }

  // First batch: PUT replaces all existing tracks
  const firstBatch = uris.slice(0, TRACKS_PER_PAGE);
  await spotifyFetch(accessToken, `/playlists/${playlistId}/tracks`, {
    method: 'PUT',
    body: JSON.stringify({ uris: firstBatch }),
  });

  // Remaining batches: POST appends tracks
  for (let i = TRACKS_PER_PAGE; i < uris.length; i += TRACKS_PER_PAGE) {
    const batch = uris.slice(i, i + TRACKS_PER_PAGE);
    await spotifyFetch(accessToken, `/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ uris: batch }),
    });
  }
}

/**
 * Creates a new private playlist for the given user.
 */
export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string,
  description?: string,
): Promise<SpotifyPlaylist> {
  const response = await spotifyFetch(accessToken, `/users/${userId}/playlists`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      description: description ?? '',
      public: false,
    }),
  });

  return response.json() as Promise<SpotifyPlaylist>;
}

/**
 * Adds tracks to an existing playlist in batches of 100.
 * Tracks are appended to the end of the playlist in order.
 */
export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[],
): Promise<void> {
  for (let i = 0; i < uris.length; i += TRACKS_PER_PAGE) {
    const batch = uris.slice(i, i + TRACKS_PER_PAGE);
    await spotifyFetch(accessToken, `/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ uris: batch }),
    });
  }
}
