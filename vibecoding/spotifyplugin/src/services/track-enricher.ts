import type { SpotifyPlaylistTrackItem } from '../types/spotify.ts';
import type { EnrichedTrack } from '../types/track.ts';
import { OPEN_KEY_TO_CAMELOT, SHORT_KEY_TO_CAMELOT } from '../config/constants.ts';
import { lookupTrackDetails, processInBatches } from '../api/bpm-client.ts';
import type { BpmSongDetails } from '../api/bpm-client.ts';

/**
 * Convert a GetSongBPM open_key or key_of value to a Camelot wheel code.
 *
 * Tries the open_key first (e.g. "2m" -> "2A"), then falls back to
 * the short key name (e.g. "Em" -> "9A"). Returns null if neither
 * mapping produces a result.
 */
function toCamelotCode(details: BpmSongDetails): string | null {
  if (details.open_key) {
    const fromOpenKey = OPEN_KEY_TO_CAMELOT[details.open_key];
    if (fromOpenKey) return fromOpenKey;
  }

  if (details.key_of) {
    const fromShortKey = SHORT_KEY_TO_CAMELOT[details.key_of];
    if (fromShortKey) return fromShortKey;
  }

  return null;
}

/**
 * Extract a numeric BPM value from a BpmSongDetails tempo string.
 * Returns null if the value is missing or not a valid positive number.
 */
function parseBpm(details: BpmSongDetails): number | null {
  const value = parseFloat(details.tempo);
  if (isNaN(value) || value <= 0) return null;
  return Math.round(value);
}

/**
 * Extract a numeric energy / danceability score (0-100) from a BpmSongDetails.
 * Returns null if the value is missing or not a valid number.
 */
function parseEnergy(details: BpmSongDetails): number | null {
  if (details.danceability === undefined || details.danceability === '') return null;
  const value = parseFloat(details.danceability);
  if (isNaN(value)) return null;
  return value;
}

/**
 * Convert a SpotifyPlaylistTrackItem to a basic EnrichedTrack with null
 * BPM / key / energy fields. These will be filled in by the enrichment step.
 */
function toBaseEnrichedTrack(
  item: SpotifyPlaylistTrackItem,
  index: number,
): EnrichedTrack | null {
  const track = item.track;
  if (!track) return null;

  return {
    spotifyId: track.id,
    spotifyUri: track.uri,
    name: track.name,
    artist: track.artists.map((a) => a.name).join(', '),
    albumArt: track.album.images[0]?.url ?? '',
    durationMs: track.duration_ms,
    bpm: null,
    camelotCode: null,
    energy: null,
    originalIndex: index,
  };
}

/**
 * Enrich an array of Spotify playlist track items with BPM, musical key,
 * and energy data from the GetSongBPM API.
 *
 * Processes tracks in rate-limited batches. Calls `onProgress` after each
 * individual track lookup completes so the UI can display a progress bar.
 *
 * @param tracks     - Raw Spotify playlist track items (may contain null tracks)
 * @param apiKey     - GetSongBPM API key
 * @param onProgress - Callback fired after each track is processed: (done, total)
 * @returns            Array of enriched tracks with BPM/key/energy filled in where available
 */
export async function enrichTracks(
  tracks: SpotifyPlaylistTrackItem[],
  apiKey: string,
  onProgress: (done: number, total: number) => void,
): Promise<EnrichedTrack[]> {
  // Step 1: Build base enriched tracks, filtering out null tracks
  const enrichedTracks: EnrichedTrack[] = [];
  for (let i = 0; i < tracks.length; i++) {
    const base = toBaseEnrichedTrack(tracks[i], i);
    if (base) {
      enrichedTracks.push(base);
    }
  }

  const total = enrichedTracks.length;
  let done = 0;

  // If no API key, skip enrichment — return base tracks with null BPM/key/energy
  if (!apiKey) {
    onProgress(total, total);
    return enrichedTracks;
  }

  // Step 2: Create a lookup task for each track
  const tasks = enrichedTracks.map((enriched) => {
    return async (): Promise<void> => {
      try {
        const details = await lookupTrackDetails(enriched.artist, enriched.name, apiKey);

        if (details) {
          enriched.bpm = parseBpm(details);
          enriched.camelotCode = toCamelotCode(details);
          enriched.energy = parseEnergy(details);
        }
      } catch (err) {
        console.warn(`Failed to enrich "${enriched.name}" by "${enriched.artist}":`, err);
      }

      done++;
      onProgress(done, total);
    };
  });

  // Step 3: Process in rate-limited batches
  await processInBatches(tasks);

  return enrichedTracks;
}
