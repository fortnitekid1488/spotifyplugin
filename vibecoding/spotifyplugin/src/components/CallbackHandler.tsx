import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.ts';

export function CallbackHandler() {
  const [searchParams] = useSearchParams();
  const { handleCallback } = useAuth();
  const navigate = useNavigate();

  const [asyncError, setAsyncError] = useState<string | null>(null);
  const processedRef = useRef(false);

  // Derive synchronous errors from URL params during render (no setState needed)
  const urlError = useMemo(() => {
    const authError = searchParams.get('error');
    if (authError) {
      return `Spotify authorization failed: ${authError}`;
    }
    if (!searchParams.get('code')) {
      return 'No authorization code received from Spotify.';
    }
    return null;
  }, [searchParams]);

  const error = urlError ?? asyncError;

  useEffect(() => {
    // Skip if there's already a URL-level error or if we've already started processing
    if (urlError || processedRef.current) return;

    const code = searchParams.get('code');
    if (!code) return;

    processedRef.current = true;

    handleCallback(code)
      .then(() => {
        navigate('/dashboard', { replace: true });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setAsyncError(message);
        processedRef.current = false;
      });
  }, [searchParams, urlError, handleCallback, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-lg font-medium text-red-400">Authentication Error</p>
          <p className="mt-2 text-sm text-red-300/80">{error}</p>
        </div>
        <button
          onClick={() => {
            setAsyncError(null);
            processedRef.current = false;
            navigate('/', { replace: true });
          }}
          className="rounded-full bg-[#1DB954] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1ed760]"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1DB954] border-t-transparent" />
      <p className="text-sm text-gray-400">Connecting to Spotify...</p>
    </div>
  );
}
