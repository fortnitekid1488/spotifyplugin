import { useState } from 'react';

interface PlaylistInputProps {
  onSubmit: (playlistId: string) => void;
}

function extractPlaylistId(input: string): string | null {
  // Handle Spotify URLs like:
  // https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
  // spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
  const urlMatch = input.match(/playlist[/:]([a-zA-Z0-9]+)/);
  if (urlMatch) return urlMatch[1];
  // Handle bare playlist ID
  if (/^[a-zA-Z0-9]{22}$/.test(input.trim())) return input.trim();
  return null;
}

export function PlaylistInput({ onSubmit }: PlaylistInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractPlaylistId(value);
    if (id) {
      setError('');
      onSubmit(id);
    } else {
      setError('Invalid playlist URL or ID');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(''); }}
        placeholder="Paste Spotify playlist URL or ID..."
        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#1DB954] transition-colors"
      />
      <button
        type="submit"
        className="px-6 py-3 bg-[#1DB954] text-black font-semibold rounded-lg hover:bg-[#1ed760] transition-colors"
      >
        Go
      </button>
      {error && <p className="absolute mt-14 text-sm text-red-400">{error}</p>}
    </form>
  );
}
