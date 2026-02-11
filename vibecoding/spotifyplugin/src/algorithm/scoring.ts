import type { EnrichedTrack } from '../types/track.ts';
import {
  WEIGHT_KEY,
  WEIGHT_BPM,
  WEIGHT_ENERGY,
  WEIGHT_ARTIST,
  NEUTRAL_SCORE,
} from '../config/constants.ts';
import { camelotDistance } from './camelot.ts';

/**
 * Compute the normalized BPM distance between two tracks, accounting for
 * half-time and double-time relationships.
 *
 * The raw difference is the minimum of:
 *   |bpmA - bpmB|, |bpmA - bpmB*2|, |bpmA*2 - bpmB|
 * This is then divided by 20 and clamped to [0, 1].
 *
 * Returns NEUTRAL_SCORE if either BPM is null.
 */
function bpmDistance(bpmA: number | null, bpmB: number | null): number {
  if (bpmA === null || bpmB === null) return NEUTRAL_SCORE;

  const diff = Math.min(
    Math.abs(bpmA - bpmB),
    Math.abs(bpmA - bpmB * 2),
    Math.abs(bpmA * 2 - bpmB),
  );

  return Math.min(diff / 20, 1.0);
}

/**
 * Compute the normalized energy distance between two tracks.
 * Energy values are on a 0-100 scale.
 *
 * Returns NEUTRAL_SCORE if either energy is null.
 */
function energyDistance(energyA: number | null, energyB: number | null): number {
  if (energyA === null || energyB === null) return NEUTRAL_SCORE;
  return Math.abs(energyA - energyB) / 100;
}

/**
 * Compute the artist penalty: 1.0 if same artist, 0.0 otherwise.
 */
function artistPenalty(artistA: string, artistB: string): number {
  return artistA === artistB ? 1.0 : 0.0;
}

/**
 * Compute the weighted transition cost between two adjacent tracks.
 * Returns a value in the range [0.0, 1.0].
 */
export function transitionCost(a: EnrichedTrack, b: EnrichedTrack): number {
  const keyDist = camelotDistance(a.camelotCode, b.camelotCode);
  const bpmDist = bpmDistance(a.bpm, b.bpm);
  const energyDist = energyDistance(a.energy, b.energy);
  const artistPen = artistPenalty(a.artist, b.artist);

  return (
    WEIGHT_KEY * keyDist +
    WEIGHT_BPM * bpmDist +
    WEIGHT_ENERGY * energyDist +
    WEIGHT_ARTIST * artistPen
  );
}

/**
 * Compute the total route cost as the sum of consecutive transition costs.
 */
export function totalRouteCost(tracks: EnrichedTrack[]): number {
  let cost = 0;
  for (let i = 0; i < tracks.length - 1; i++) {
    cost += transitionCost(tracks[i], tracks[i + 1]);
  }
  return cost;
}
