import { useState, useCallback } from 'react';
import type { SpotifyPlaylistTrackItem } from '../types/spotify';
import type { EnrichedTrack } from '../types/track';
import { enrichTracks } from '../services/track-enricher';
import { smoothPlaylist } from '../algorithm/smoother';

export type SmootherPhase = 'idle' | 'enriching' | 'smoothing' | 'done' | 'error';

interface SmootherState {
  phase: SmootherPhase;
  enrichProgress: { done: number; total: number };
  originalTracks: EnrichedTrack[];
  smoothedTracks: EnrichedTrack[];
  originalCost: number;
  optimizedCost: number;
  error: string | null;
}

export function useSmoother() {
  const [state, setState] = useState<SmootherState>({
    phase: 'idle',
    enrichProgress: { done: 0, total: 0 },
    originalTracks: [],
    smoothedTracks: [],
    originalCost: 0,
    optimizedCost: 0,
    error: null,
  });

  const run = useCallback(async (rawTracks: SpotifyPlaylistTrackItem[]) => {
    const apiKey = import.meta.env.VITE_GETSONGBPM_API_KEY;

    setState(s => ({ ...s, phase: 'enriching', error: null, enrichProgress: { done: 0, total: rawTracks.length } }));

    try {
      const enriched = await enrichTracks(rawTracks, apiKey, (done, total) => {
        setState(s => ({ ...s, enrichProgress: { done, total } }));
      });

      setState(s => ({ ...s, phase: 'smoothing', originalTracks: enriched }));

      // Run algorithm (synchronous but fast)
      await new Promise(resolve => setTimeout(resolve, 0)); // yield to UI
      const { sorted, originalCost, optimizedCost } = smoothPlaylist(enriched);

      setState(s => ({
        ...s,
        phase: 'done',
        smoothedTracks: sorted,
        originalCost,
        optimizedCost,
      }));
    } catch (err) {
      setState(s => ({
        ...s,
        phase: 'error',
        error: err instanceof Error ? err.message : 'Something went wrong',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      phase: 'idle',
      enrichProgress: { done: 0, total: 0 },
      originalTracks: [],
      smoothedTracks: [],
      originalCost: 0,
      optimizedCost: 0,
      error: null,
    });
  }, []);

  return { ...state, run, reset };
}
