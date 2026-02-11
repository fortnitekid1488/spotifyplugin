import type { EnrichedTrack } from '../types/track.ts';
import { transitionCost, totalRouteCost } from './scoring.ts';

/**
 * Build a greedy nearest-neighbor route starting from the given index.
 * At each step, pick the unvisited track with the lowest transition cost.
 */
function buildRoute(tracks: EnrichedTrack[], startIndex: number): EnrichedTrack[] {
  const n = tracks.length;
  const visited = new Array<boolean>(n).fill(false);
  const route: EnrichedTrack[] = [];

  visited[startIndex] = true;
  route.push(tracks[startIndex]);

  for (let step = 1; step < n; step++) {
    const current = route[step - 1];
    let bestIdx = -1;
    let bestCost = Infinity;

    for (let j = 0; j < n; j++) {
      if (visited[j]) continue;
      const cost = transitionCost(current, tracks[j]);
      if (cost < bestCost) {
        bestCost = cost;
        bestIdx = j;
      }
    }

    visited[bestIdx] = true;
    route.push(tracks[bestIdx]);
  }

  return route;
}

/**
 * Find the best nearest-neighbor route by trying every track as the starting point.
 * Returns the route with the lowest total transition cost.
 *
 * Time complexity: O(n^3) -- acceptable for playlists up to ~200 tracks.
 */
export function nearestNeighborRoute(tracks: EnrichedTrack[]): EnrichedTrack[] {
  if (tracks.length <= 1) return [...tracks];

  let bestRoute: EnrichedTrack[] | null = null;
  let bestCost = Infinity;

  for (let i = 0; i < tracks.length; i++) {
    const route = buildRoute(tracks, i);
    const cost = totalRouteCost(route);
    if (cost < bestCost) {
      bestCost = cost;
      bestRoute = route;
    }
  }

  return bestRoute!;
}
