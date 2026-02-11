import type { EnrichedTrack } from '../types/track.ts';
import { reorderPlaylist, createPlaylist, addTracksToPlaylist } from '../api/spotify-client.ts';

/**
 * Reorders an existing playlist to match the given track order.
 * Replaces all tracks in the playlist with the enriched tracks' URIs in sequence.
 */
export async function reorderExistingPlaylist(
  accessToken: string,
  playlistId: string,
  tracks: EnrichedTrack[],
): Promise<void> {
  const uris = tracks.map((track) => track.spotifyUri);
  await reorderPlaylist(accessToken, playlistId, uris);
}

/**
 * Creates a new playlist containing the smoothed track order.
 * The new playlist is named "{originalName} (Smoothed)" and set to private.
 * Returns the new playlist's ID.
 */
export async function createSmoothedPlaylist(
  accessToken: string,
  userId: string,
  originalName: string,
  tracks: EnrichedTrack[],
): Promise<string> {
  const name = `${originalName} (Smoothed)`;
  const description = `Smoothed version of ${originalName} — optimized for key, BPM, and energy flow.`;

  const playlist = await createPlaylist(accessToken, userId, name, description);

  const uris = tracks.map((track) => track.spotifyUri);
  await addTracksToPlaylist(accessToken, playlist.id, uris);

  return playlist.id;
}
