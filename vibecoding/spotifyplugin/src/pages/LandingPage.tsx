import { LoginButton } from '../components/LoginButton.tsx';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Hero */}
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Playlist{' '}
          <span className="text-[#1DB954]">Smoother</span>
        </h1>

        <p className="mt-4 text-lg text-gray-400">
          Reorder your Spotify playlists for seamless transitions between tracks.
        </p>

        {/* Features */}
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 text-2xl">🎵</div>
            <h3 className="font-semibold text-white">Key Matching</h3>
            <p className="mt-1 text-sm text-gray-400">
              Arrange tracks by musical key using the Camelot Wheel for harmonic mixing.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 text-2xl">🥁</div>
            <h3 className="font-semibold text-white">BPM Flow</h3>
            <p className="mt-1 text-sm text-gray-400">
              Smooth tempo transitions so energy builds and drops naturally.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 text-2xl">⚡</div>
            <h3 className="font-semibold text-white">Energy Curve</h3>
            <p className="mt-1 text-sm text-gray-400">
              Balance energy levels across your playlist for the perfect listening arc.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12">
          <LoginButton />
        </div>

        <p className="mt-6 text-xs text-gray-500">
          We only read and reorder your playlists. No data is stored on any server.
        </p>
      </div>
    </div>
  );
}
