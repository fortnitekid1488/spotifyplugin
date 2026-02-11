import type { EnrichedTrack } from '../types/track';
import { TrackList } from './TrackList';
import { transitionCost } from '../algorithm/scoring';

interface ResultViewProps {
  originalTracks: EnrichedTrack[];
  smoothedTracks: EnrichedTrack[];
  originalCost: number;
  optimizedCost: number;
  isOwner: boolean;
  onReorder: () => void;
  onCreateNew: () => void;
  isSaving: boolean;
  savedMessage: string | null;
}

function getTransitionScores(tracks: EnrichedTrack[]): number[] {
  return tracks.map((track, i) =>
    i === 0 ? 0 : transitionCost(tracks[i - 1], track)
  );
}

export function ResultView({
  originalTracks,
  smoothedTracks,
  originalCost,
  optimizedCost,
  isOwner,
  onReorder,
  onCreateNew,
  isSaving,
  savedMessage,
}: ResultViewProps) {
  const improvement = originalCost > 0
    ? Math.round(((originalCost - optimizedCost) / originalCost) * 100)
    : 0;

  const originalScores = getTransitionScores(originalTracks);
  const smoothedScores = getTransitionScores(smoothedTracks);

  return (
    <div className="space-y-6">
      <div className="bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-lg p-4 text-center">
        <p className="text-2xl font-bold text-[#1DB954]">{improvement}% smoother</p>
        <p className="text-sm text-gray-400 mt-1">
          Transition cost: {originalCost.toFixed(2)} → {optimizedCost.toFixed(2)}
        </p>
      </div>

      <div className="flex gap-3 justify-center flex-wrap">
        {isOwner && (
          <button
            onClick={onReorder}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#1DB954] text-black font-semibold rounded-full hover:bg-[#1ed760] disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Reorder Existing Playlist'}
          </button>
        )}
        <button
          onClick={onCreateNew}
          disabled={isSaving}
          className="px-6 py-2.5 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 border border-white/20 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Creating...' : 'Create New Playlist'}
        </button>
      </div>

      {savedMessage && (
        <p className="text-center text-[#1DB954] font-medium">{savedMessage}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrackList
          tracks={originalTracks}
          transitionScores={originalScores}
          label="Original Order"
          totalCost={originalCost}
        />
        <TrackList
          tracks={smoothedTracks}
          transitionScores={smoothedScores}
          label="Smoothed Order"
          totalCost={optimizedCost}
        />
      </div>
    </div>
  );
}
