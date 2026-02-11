// Spotify API
export const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
export const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
export const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
export const SPOTIFY_SCOPES = [
  'playlist-read-private',
  'playlist-modify-private',
  'playlist-modify-public',
].join(' ');

// GetSongBPM API
export const GETSONGBPM_API_BASE = 'https://api.getsong.co';
export const BPM_REQUEST_DELAY_MS = 200;
export const BPM_MAX_CONCURRENT = 3;

// Scoring weights
export const WEIGHT_KEY = 0.40;
export const WEIGHT_BPM = 0.30;
export const WEIGHT_ENERGY = 0.20;
export const WEIGHT_ARTIST = 0.10;
export const NEUTRAL_SCORE = 0.5;

// 2-opt
export const TWO_OPT_MAX_ITERATIONS = 50;

// Camelot Wheel mapping: musical key name → Camelot code
export const KEY_TO_CAMELOT: Record<string, string> = {
  'Ab minor': '1A', 'B major': '1B',
  'Eb minor': '2A', 'Gb major': '2B', 'F# major': '2B',
  'Bb minor': '3A', 'Db major': '3B',
  'F minor': '4A', 'Ab major': '4B',
  'C minor': '5A', 'Eb major': '5B',
  'G minor': '6A', 'Bb major': '6B',
  'D minor': '7A', 'F major': '7B',
  'A minor': '8A', 'C major': '8B',
  'E minor': '9A', 'G major': '9B',
  'B minor': '10A', 'D major': '10B',
  'F# minor': '11A', 'A major': '11B', 'Gb minor': '11A',
  'Db minor': '12A', 'C# minor': '12A', 'E major': '12B',
};

// Short key names (from GetSongBPM key_of field like "Em", "C")
export const SHORT_KEY_TO_CAMELOT: Record<string, string> = {
  'Abm': '1A', 'G#m': '1A', 'B': '1B',
  'Ebm': '2A', 'D#m': '2A', 'Gb': '2B', 'F#': '2B',
  'Bbm': '3A', 'A#m': '3A', 'Db': '3B', 'C#': '3B',
  'Fm': '4A', 'Ab': '4B', 'G#': '4B',
  'Cm': '5A', 'Eb': '5B', 'D#': '5B',
  'Gm': '6A', 'Bb': '6B', 'A#': '6B',
  'Dm': '7A', 'F': '7B',
  'Am': '8A', 'C': '8B',
  'Em': '9A', 'G': '9B',
  'Bm': '10A', 'D': '10B',
  'F#m': '11A', 'Gbm': '11A', 'A': '11B',
  'C#m': '12A', 'Dbm': '12A', 'E': '12B',
};

// Open Key notation (from GetSongBPM open_key field like "2m", "8d")
// "m" = minor (A), "d" = major (B)
export const OPEN_KEY_TO_CAMELOT: Record<string, string> = {
  '1m': '1A', '1d': '1B',
  '2m': '2A', '2d': '2B',
  '3m': '3A', '3d': '3B',
  '4m': '4A', '4d': '4B',
  '5m': '5A', '5d': '5B',
  '6m': '6A', '6d': '6B',
  '7m': '7A', '7d': '7B',
  '8m': '8A', '8d': '8B',
  '9m': '9A', '9d': '9B',
  '10m': '10A', '10d': '10B',
  '11m': '11A', '11d': '11B',
  '12m': '12A', '12d': '12B',
};
