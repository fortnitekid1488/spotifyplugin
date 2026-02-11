import { useState, useEffect, useCallback } from 'react';
import type { SpotifyPlaylist, SpotifyPlaylistTrackItem } from '../types/spotify';
import { getUserPlaylists, getPlaylistTracks, getPlaylistDetails } from '../api/spotify-client';
import { useAuth } from './useAuth';

export function useUserPlaylists() {
  const { accessToken } = useAuth();
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const allPlaylists: SpotifyPlaylist[] = [];
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await getUserPlaylists(accessToken, 50, offset);
          allPlaylists.push(...response.items);
          offset += response.items.length;
          hasMore = response.next !== null;
        }

        if (!cancelled) setPlaylists(allPlaylists);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load playlists');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [accessToken]);

  return { playlists, isLoading, error };
}

export function usePlaylistTracks(playlistId: string | undefined) {
  const { accessToken } = useAuth();
  const [tracks, setTracks] = useState<SpotifyPlaylistTrackItem[]>([]);
  const [playlist, setPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || !playlistId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [details, items] = await Promise.all([
        getPlaylistDetails(accessToken, playlistId),
        getPlaylistTracks(accessToken, playlistId),
      ]);
      setPlaylist(details);
      setTracks(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracks');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, playlistId]);

  useEffect(() => { load(); }, [load]);

  return { tracks, playlist, isLoading, error, reload: load };
}
