import { useNavigate } from 'react-router-dom';
import { useUserPlaylists } from '../hooks/usePlaylist';
import { PlaylistInput } from '../components/PlaylistInput';
import { PlaylistPicker } from '../components/PlaylistPicker';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { playlists, isLoading, error } = useUserPlaylists();

  const handleSelect = (playlistId: string) => {
    navigate(`/smooth/${playlistId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Choose a Playlist</h1>
        <p className="text-gray-400">Paste a Spotify playlist URL or pick from your library</p>
      </div>

      <PlaylistInput onSubmit={handleSelect} />

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Your Playlists</h2>
        <PlaylistPicker playlists={playlists} onSelect={handleSelect} isLoading={isLoading} />
      </div>
    </div>
  );
}
