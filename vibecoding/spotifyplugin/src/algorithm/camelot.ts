import { NEUTRAL_SCORE } from '../config/constants.ts';

/**
 * Parse a Camelot code like "8A" or "12B" into its numeric and letter parts.
 * Returns null if the code cannot be parsed.
 */
function parseCamelotCode(code: string): { number: number; letter: string } | null {
  const match = code.match(/^(\d{1,2})([AB])$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (num < 1 || num > 12) return null;
  return { number: num, letter: match[2] };
}

/**
 * Compute the circular distance between two positions on the Camelot wheel (1-12).
 * The wheel wraps: 12 + 1 = 1, 1 - 1 = 12.
 */
function circularDistance(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 12 - diff);
}

/**
 * Compute the Camelot distance between two Camelot codes, normalized to 0.0-1.0.
 *
 * Compatibility tiers:
 *  - Same code                          = 0.0
 *  - +/-1 on wheel, same letter         = 1/6 (~0.17)
 *  - Same number, different letter       = 1/6 (~0.17)
 *  - +/-1 on wheel AND different letter  = 2/6 (~0.33)
 *  - Everything else                     = 1.0
 *
 * If either code is null, returns NEUTRAL_SCORE (0.5).
 */
export function camelotDistance(codeA: string | null, codeB: string | null): number {
  if (codeA === null || codeB === null) return NEUTRAL_SCORE;

  const a = parseCamelotCode(codeA);
  const b = parseCamelotCode(codeB);
  if (!a || !b) return NEUTRAL_SCORE;

  const numDist = circularDistance(a.number, b.number);
  const sameLetter = a.letter === b.letter;

  // Same code
  if (numDist === 0 && sameLetter) return 0.0;

  // Adjacent on the wheel, same letter (e.g., 8A -> 7A or 9A)
  if (numDist === 1 && sameLetter) return 1 / 6;

  // Same number, different letter (relative major/minor, e.g., 8A -> 8B)
  if (numDist === 0 && !sameLetter) return 1 / 6;

  // Adjacent on the wheel AND different letter (e.g., 8A -> 7B or 9B)
  if (numDist === 1 && !sameLetter) return 2 / 6;

  // Everything else is maximally distant
  return 1.0;
}
