import type { EnrichedTrack } from '../types/track';

interface TrackRowProps {
  track: EnrichedTrack;
  index: number;
  transitionScore?: number | null;
}

function getScoreColor(score: number | null | undefined): string {
  if (score == null) return 'text-gray-500';
  if (score < 0.2) return 'text-green-400';
  if (score < 0.4) return 'text-yellow-400';
  if (score < 0.6) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreBg(score: number | null | undefined): string {
  if (score == null) return '';
  if (score < 0.2) return 'border-l-green-500/50';
  if (score < 0.4) return 'border-l-yellow-500/50';
  if (score < 0.6) return 'border-l-orange-500/50';
  return 'border-l-red-500/50';
}

function formatBpm(bpm: number | null): string {
  return bpm != null ? `${Math.round(bpm)}` : '—';
}

export function TrackRow({ track, index, transitionScore }: TrackRowProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2 border-l-2 ${getScoreBg(transitionScore)} hover:bg-white/5 transition-colors`}>
      <span className="w-8 text-right text-sm text-gray-500 flex-shrink-0">
        {index + 1}
      </span>

      <img
        src={track.albumArt}
        alt=""
        className="w-10 h-10 rounded flex-shrink-0"
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm text-white truncate">{track.name}</p>
        <p className="text-xs text-gray-400 truncate">{track.artist}</p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {track.bpm != null && (
          <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300" title="BPM">
            {formatBpm(track.bpm)}
          </span>
        )}
        {track.camelotCode && (
          <span className="text-xs px-2 py-0.5 rounded bg-[#1DB954]/20 text-[#1DB954]" title="Key (Camelot)">
            {track.camelotCode}
          </span>
        )}
        {track.energy != null && (
          <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300" title="Energy">
            {track.energy}
          </span>
        )}
        {transitionScore != null && (
          <span className={`text-xs font-mono ${getScoreColor(transitionScore)}`} title="Transition cost">
            {transitionScore.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}
