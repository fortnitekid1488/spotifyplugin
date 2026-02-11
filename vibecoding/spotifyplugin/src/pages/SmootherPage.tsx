import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { usePlaylistTracks } from '../hooks/usePlaylist';
import { useSmoother } from '../hooks/useSmoother';
import { useAuth } from '../hooks/useAuth';
import { SmoothButton } from '../components/SmoothButton';
import { ProgressBar } from '../components/ProgressBar';
import { ResultView } from '../components/ResultView';
import { TrackList } from '../components/TrackList';
import { reorderExistingPlaylist, createSmoothedPlaylist } from '../services/playlist-writer';

export default function SmootherPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const { tracks: rawTracks, playlist, isLoading: tracksLoading, error: tracksError } = usePlaylistTracks(id);
  const smoother = useSmoother();
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  if (!id) {
    navigate('/dashboard');
    return null;
  }

  const isOwner = playlist?.owner.id === user?.id;

  const handleSmooth = () => {
    if (rawTracks.length === 0) return;
    smoother.run(rawTracks);
  };

  const handleReorder = async () => {
    if (!accessToken || !id) return;
    setIsSaving(true);
    setSavedMessage(null);
    try {
      await reorderExistingPlaylist(accessToken, id, smoother.smoothedTracks);
      setSavedMessage('Playlist reordered successfully! Open Spotify to see the changes.');
    } catch (err) {
      setSavedMessage(`Error: ${err instanceof Error ? err.message : 'Failed to reorder'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = async () => {
    if (!accessToken || !user || !playlist) return;
    setIsSaving(true);
    setSavedMessage(null);
    try {
      const newId = await createSmoothedPlaylist(
        accessToken,
        user.id,
        playlist.name,
        smoother.smoothedTracks,
      );
      setSavedMessage(`New playlist created! Check "${playlist.name} (Smoothed)" in your Spotify library.`);
      // Small delay then navigate to the new playlist
      setTimeout(() => navigate(`/smooth/${newId}`), 2000);
    } catch (err) {
      setSavedMessage(`Error: ${err instanceof Error ? err.message : 'Failed to create playlist'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Playlist header */}
      <div className="flex items-center gap-4">
        {playlist?.images[0] && (
          <img src={playlist.images[0].url} alt="" className="w-20 h-20 rounded-lg" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{playlist?.name ?? 'Loading...'}</h1>
          <p className="text-gray-400">
            {playlist ? `${playlist.tracks.total} tracks · by ${playlist.owner.display_name}` : ''}
          </p>
        </div>
      </div>

      {tracksError && <p className="text-red-400">{tracksError}</p>}

      {tracksLoading && (
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading tracks...
        </div>
      )}

      {/* Action area */}
      {!tracksLoading && rawTracks.length > 0 && smoother.phase === 'idle' && (
        <div className="flex flex-col items-center gap-4 py-4">
          <SmoothButton onClick={handleSmooth} />
          <p className="text-sm text-gray-500">
            {rawTracks.length} tracks will be analyzed for BPM, key, and energy
          </p>
        </div>
      )}

      {/* Enriching progress */}
      {smoother.phase === 'enriching' && (
        <div className="space-y-4 py-4">
          <ProgressBar
            current={smoother.enrichProgress.done}
            total={smoother.enrichProgress.total}
            label="Analyzing tracks..."
          />
        </div>
      )}

      {/* Smoothing */}
      {smoother.phase === 'smoothing' && (
        <div className="flex items-center gap-3 text-[#1DB954] py-4">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Optimizing track order...
        </div>
      )}

      {/* Error */}
      {smoother.phase === 'error' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{smoother.error}</p>
          <button
            onClick={smoother.reset}
            className="mt-2 text-sm text-red-300 underline hover:text-red-200"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {smoother.phase === 'done' && (
        <ResultView
          originalTracks={smoother.originalTracks}
          smoothedTracks={smoother.smoothedTracks}
          originalCost={smoother.originalCost}
          optimizedCost={smoother.optimizedCost}
          isOwner={isOwner}
          onReorder={handleReorder}
          onCreateNew={handleCreateNew}
          isSaving={isSaving}
          savedMessage={savedMessage}
        />
      )}

      {/* Show original track list when idle */}
      {smoother.phase === 'idle' && smoother.originalTracks.length === 0 && !tracksLoading && rawTracks.length > 0 && (
        <TrackList
          tracks={rawTracks.filter(item => item.track).map((item, i) => ({
            spotifyId: item.track!.id,
            spotifyUri: item.track!.uri,
            name: item.track!.name,
            artist: item.track!.artists.map(a => a.name).join(', '),
            albumArt: item.track!.album.images[0]?.url ?? '',
            durationMs: item.track!.duration_ms,
            bpm: null,
            camelotCode: null,
            energy: null,
            originalIndex: i,
          }))}
          label="Current Order"
        />
      )}
    </div>
  );
}
