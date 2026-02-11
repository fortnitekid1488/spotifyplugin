import type { EnrichedTrack } from '../types/track';
import { TrackRow } from './TrackRow';

interface TrackListProps {
  tracks: EnrichedTrack[];
  transitionScores?: number[];
  label: string;
  totalCost?: number;
}

export function TrackList({ tracks, transitionScores, label, totalCost }: TrackListProps) {
  return (
    <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="font-semibold text-white">{label}</h3>
        {totalCost != null && (
          <span className="text-sm text-gray-400">
            Total cost: <span className="font-mono text-white">{totalCost.toFixed(2)}</span>
          </span>
        )}
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {tracks.map((track, i) => (
          <TrackRow
            key={`${track.spotifyId}-${i}`}
            track={track}
            index={i}
            transitionScore={transitionScores?.[i] ?? null}
          />
        ))}
      </div>
    </div>
  );
}
