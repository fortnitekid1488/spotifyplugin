export interface EnrichedTrack {
  spotifyId: string;
  spotifyUri: string;
  name: string;
  artist: string;
  albumArt: string;
  durationMs: number;
  bpm: number | null;
  camelotCode: string | null;
  energy: number | null;
  originalIndex: number;
}
