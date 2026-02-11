import type { EnrichedTrack } from '../types/track.ts';
import { TWO_OPT_MAX_ITERATIONS } from '../config/constants.ts';
import { totalRouteCost } from './scoring.ts';

/**
 * Reverse the segment [i..j] of the route in place and return a new array.
 */
function reverseSegment(route: EnrichedTrack[], i: number, j: number): EnrichedTrack[] {
  const result = [...route];
  let left = i;
  let right = j;
  while (left < right) {
    const temp = result[left];
    result[left] = result[right];
    result[right] = temp;
    left++;
    right--;
  }
  return result;
}

/**
 * Improve a route using the 2-opt local search heuristic.
 *
 * Iteratively tries reversing every segment [i..j]. If a reversal reduces
 * the total route cost, the improvement is kept and the search restarts.
 *
 * Stops after TWO_OPT_MAX_ITERATIONS full passes without any improvement,
 * or when all pairs have been exhausted in a single pass without improvement.
 */
export function twoOpt(tracks: EnrichedTrack[]): EnrichedTrack[] {
  if (tracks.length < 4) return [...tracks];

  let route = [...tracks];
  let currentCost = totalRouteCost(route);
  let iterationsWithoutImprovement = 0;

  while (iterationsWithoutImprovement < TWO_OPT_MAX_ITERATIONS) {
    let improved = false;

    for (let i = 0; i < route.length - 2; i++) {
      for (let j = i + 2; j < route.length; j++) {
        const candidate = reverseSegment(route, i, j);
        const candidateCost = totalRouteCost(candidate);

        if (candidateCost < currentCost) {
          route = candidate;
          currentCost = candidateCost;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }

    if (!improved) {
      iterationsWithoutImprovement++;
    } else {
      iterationsWithoutImprovement = 0;
    }
  }

  return route;
}
