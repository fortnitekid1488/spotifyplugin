import type { SpotifyPlaylist } from '../types/spotify';

interface PlaylistPickerProps {
  playlists: SpotifyPlaylist[];
  onSelect: (playlistId: string) => void;
  isLoading: boolean;
}

export function PlaylistPicker({ playlists, onSelect, isLoading }: PlaylistPickerProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white/5 rounded-lg h-20" />
        ))}
      </div>
    );
  }

  if (playlists.length === 0) {
    return <p className="text-gray-400 text-center py-8">No playlists found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {playlists.map((playlist) => (
        <button
          key={playlist.id}
          onClick={() => onSelect(playlist.id)}
          className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#1DB954]/50 transition-all text-left group"
        >
          {playlist.images[0] ? (
            <img
              src={playlist.images[0].url}
              alt={playlist.name}
              className="w-14 h-14 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-white truncate group-hover:text-[#1DB954] transition-colors">
              {playlist.name}
            </p>
            <p className="text-sm text-gray-400">
              {playlist.tracks.total} tracks
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
