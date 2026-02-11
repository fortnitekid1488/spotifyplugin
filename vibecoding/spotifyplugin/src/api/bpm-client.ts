import {
  GETSONGBPM_API_BASE,
  BPM_REQUEST_DELAY_MS,
  BPM_MAX_CONCURRENT,
} from '../config/constants.ts';

export interface BpmSearchResult {
  id: string;
  title: string;
  artist: { name: string };
}

export interface BpmSongDetails {
  tempo: string;
  key_of: string;
  open_key: string;
  artist: { name: string };
  danceability?: string;
}

/**
 * Remove parenthesized/bracketed suffixes and remaster tags from a track title
 * so the search query is cleaner and more likely to match.
 *
 * Examples:
 *   "Blinding Lights (feat. Dua Lipa)"  -> "Blinding Lights"
 *   "Come Together - Remastered 2009"    -> "Come Together"
 *   "Yesterday (Remastered 2015)"        -> "Yesterday"
 *   "Help! [Single Version]"             -> "Help!"
 */
function cleanTitle(raw: string): string {
  return raw
    .replace(/\(feat\.[^)]*\)/gi, '')
    .replace(/\[feat\.[^\]]*\]/gi, '')
    .replace(/\(Remastered[^)]*\)/gi, '')
    .replace(/\[Remastered[^\]]*\]/gi, '')
    .replace(/-\s*Remastered.*$/gi, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .trim();
}

/**
 * Extract the primary artist name by stripping featured artists,
 * collaborator separators, etc.
 *
 * Examples:
 *   "Drake feat. Rihanna"  -> "Drake"
 *   "Daft Punk, Pharrell"  -> "Daft Punk"
 *   "ABBA & Cher"          -> "ABBA"
 */
function cleanArtist(raw: string): string {
  return raw
    .split(/\s+feat\.?\s+/i)[0]
    .split(/,/)[0]
    .split(/\s+&\s+/)[0]
    .trim();
}

/**
 * Build a sessionStorage cache key for a given artist + title pair.
 */
function cacheKey(artist: string, title: string): string {
  return `bpm_cache_${artist.toLowerCase()}_${title.toLowerCase()}`;
}

/**
 * Read a cached BpmSongDetails (or explicit null) from sessionStorage.
 * Returns undefined if no cache entry exists.
 */
function readCache(artist: string, title: string): BpmSongDetails | null | undefined {
  const key = cacheKey(artist, title);
  const raw = sessionStorage.getItem(key);
  if (raw === null) return undefined;
  return JSON.parse(raw) as BpmSongDetails | null;
}

/**
 * Write a BpmSongDetails (or null) to sessionStorage.
 */
function writeCache(artist: string, title: string, data: BpmSongDetails | null): void {
  const key = cacheKey(artist, title);
  sessionStorage.setItem(key, JSON.stringify(data));
}

/**
 * Search the GetSongBPM API for a song matching the given artist and title.
 * Returns the first matching result, or null if nothing is found.
 */
export async function searchSong(
  artist: string,
  title: string,
  apiKey: string,
): Promise<BpmSearchResult | null> {
  const cleanedTitle = cleanTitle(title);
  const cleanedArtist = cleanArtist(artist);

  const params = new URLSearchParams({
    api_key: apiKey,
    type: 'song',
    lookup: `song:${cleanedTitle} artist:${cleanedArtist}`,
  });

  const response = await fetch(`${GETSONGBPM_API_BASE}/search/?${params.toString()}`);

  if (!response.ok) {
    console.warn(`GetSongBPM search failed (${response.status}) for "${cleanedTitle}" by "${cleanedArtist}"`);
    return null;
  }

  const data = (await response.json()) as { search: BpmSearchResult[] | undefined };

  if (!data.search || data.search.length === 0) {
    return null;
  }

  return data.search[0];
}

/**
 * Fetch detailed song information (BPM, key, energy) from GetSongBPM by song ID.
 */
export async function getSongDetails(
  songId: string,
  apiKey: string,
): Promise<BpmSongDetails | null> {
  const params = new URLSearchParams({
    api_key: apiKey,
    id: songId,
  });

  const response = await fetch(`${GETSONGBPM_API_BASE}/song/?${params.toString()}`);

  if (!response.ok) {
    console.warn(`GetSongBPM song details failed (${response.status}) for id "${songId}"`);
    return null;
  }

  const data = (await response.json()) as { song: BpmSongDetails | undefined };

  if (!data.song) {
    return null;
  }

  return data.song;
}

/**
 * Look up full BPM/key details for a track, using the sessionStorage cache
 * when available. Performs a search followed by a details fetch.
 */
export async function lookupTrackDetails(
  artist: string,
  title: string,
  apiKey: string,
): Promise<BpmSongDetails | null> {
  const cached = readCache(artist, title);
  if (cached !== undefined) {
    return cached;
  }

  const searchResult = await searchSong(artist, title, apiKey);
  if (!searchResult) {
    writeCache(artist, title, null);
    return null;
  }

  const details = await getSongDetails(searchResult.id, apiKey);
  writeCache(artist, title, details);
  return details;
}

/**
 * A simple rate-limited queue that processes async tasks in batches.
 * Runs at most `concurrency` tasks at once, then waits `delayMs`
 * before starting the next batch.
 */
export async function processInBatches<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number = BPM_MAX_CONCURRENT,
  delayMs: number = BPM_REQUEST_DELAY_MS,
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((task) => task()));
    results.push(...batchResults);

    // Add delay between batches (skip delay after the last batch)
    const isLastBatch = i + concurrency >= tasks.length;
    if (!isLastBatch) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
