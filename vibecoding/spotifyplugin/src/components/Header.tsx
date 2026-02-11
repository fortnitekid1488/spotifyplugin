import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

export function Header() {
  const { user, logout, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!accessToken) return null;

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-lg font-bold text-white hover:text-[#1DB954] transition-colors"
      >
        <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" fill="#1DB954" />
          <path d="M30 62 C38 52, 62 48, 70 38" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M30 50 C38 42, 62 38, 70 30" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M30 74 C38 64, 62 58, 70 48" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
        Playlist Smoother
      </button>

      <div className="flex items-center gap-4">
        {location.pathname !== '/dashboard' && (
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            My Playlists
          </button>
        )}
        {user && (
          <span className="text-sm text-gray-400">
            {user.display_name}
          </span>
        )}
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-red-400 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
