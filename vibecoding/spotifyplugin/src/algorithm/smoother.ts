import type { EnrichedTrack } from '../types/track.ts';
import { totalRouteCost } from './scoring.ts';
import { nearestNeighborRoute } from './nearest-neighbor.ts';
import { twoOpt } from './two-opt.ts';

export interface SmoothResult {
  sorted: EnrichedTrack[];
  originalCost: number;
  optimizedCost: number;
}

/**
 * Orchestrate the full playlist smoothing pipeline:
 *  1. Compute the original route cost.
 *  2. Build a greedy nearest-neighbor route.
 *  3. Refine it with 2-opt local search.
 *  4. Return sorted tracks and cost comparison.
 *
 * If the playlist has fewer than 3 tracks, returns it as-is.
 */
export function smoothPlaylist(tracks: EnrichedTrack[]): SmoothResult {
  const originalCost = totalRouteCost(tracks);

  if (tracks.length < 3) {
    return {
      sorted: [...tracks],
      originalCost,
      optimizedCost: originalCost,
    };
  }

  const greedy = nearestNeighborRoute(tracks);
  const optimized = twoOpt(greedy);
  const optimizedCost = totalRouteCost(optimized);

  return {
    sorted: optimized,
    originalCost,
    optimizedCost,
  };
}
