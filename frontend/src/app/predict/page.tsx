'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { logout, getStoredUser, authenticatedFetch } from '@/utils/auth';
import SatelliteCombobox from '@/components/SatelliteCombobox';
import Link from 'next/link';
import { Loader2, LogOut, Satellite, Target, BarChart3, History } from 'lucide-react';

const SatelliteGlobe = dynamic(() => import('@/components/SatelliteGlobe'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] bg-black/30 rounded-xl border border-yellow-500/20">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading globe…</p>
      </div>
    </div>
  ),
});

export default function PredictPage() {
  const router = useRouter();
  const [sat1Id, setSat1Id] = useState('');
  const [sat2Id, setSat2Id] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const user = getStoredUser();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handlePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sat1Id || !sat2Id) {
      setError('Please select both satellites before running a prediction');
      return;
    }
    const n1 = parseInt(sat1Id, 10);
    const n2 = parseInt(sat2Id, 10);
    if (isNaN(n1) || n1 <= 0 || isNaN(n2) || n2 <= 0) {
      setError('Invalid NORAD ID — enter a positive integer or pick from the list');
      return;
    }
    if (sat1Id === sat2Id) {
      setError('The two satellites must be different');
      return;
    }

    setLoading(true);
    try {
      const response = await authenticatedFetch('http://127.0.0.1:8000/api/trigger-prediction/', {
        method: 'POST',
        body: JSON.stringify({
          sat1_id: parseInt(sat1Id),
          sat2_id: parseInt(sat2Id),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/results?task_id=${data.task_id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to start prediction');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-black via-navy-900 to-black">
        {/* Header */}
        <header className="bg-navy-900/80 backdrop-blur-lg border-b border-yellow-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                  <Satellite className="h-8 w-8 text-yellow-400" />
                  <h1 className="text-2xl font-bold text-white">Orbital Debris Tracker</h1>
                </Link>
                <span className="text-gray-300">|</span>
                <span className="text-gray-300">Prediction Tool</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/history')}
                  className="flex items-center space-x-2 text-gray-300 hover:text-yellow-400 transition-colors px-3 py-2"
                >
                  <History className="h-4 w-4" />
                  <span>History</span>
                </button>
                <span className="text-gray-300">Welcome, {user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

            {/* Globe — left 3 columns */}
            <div
              className="lg:col-span-3 bg-navy-900/80 backdrop-blur-lg rounded-2xl border border-yellow-500/20 overflow-hidden"
              style={{ minHeight: '560px' }}
            >
              <div className="px-5 py-4 border-b border-yellow-500/10 flex items-center space-x-2">
                <Satellite className="h-5 w-5 text-yellow-400" />
                <h2 className="text-white font-semibold">Live Satellite Positions</h2>
                <span className="text-gray-500 text-xs ml-auto hidden sm:block">
                  From your prediction history · updates every 5 s
                </span>
              </div>
              <div style={{ height: '500px' }}>
                <SatelliteGlobe />
              </div>
            </div>

            {/* Prediction form — right 2 columns */}
            <div className="lg:col-span-2">
              <div className="bg-navy-900/80 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-yellow-500/20">
                <div className="flex items-center space-x-3 mb-5">
                  <Target className="h-7 w-7 text-yellow-400" />
                  <h2 className="text-2xl font-bold text-white">Collision Risk Prediction</h2>
                </div>

                {error && (
                  <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handlePrediction} className="space-y-5">
                  <SatelliteCombobox
                    label="Satellite 1"
                    placeholder="Search name or enter NORAD ID…"
                    value={sat1Id}
                    onChange={setSat1Id}
                  />

                  <SatelliteCombobox
                    label="Satellite 2"
                    placeholder="Search name or enter NORAD ID…"
                    value={sat2Id}
                    onChange={setSat2Id}
                  />

                  <p className="text-xs text-gray-500">
                    Can&apos;t find a satellite?{' '}
                    <a
                      href="https://celestrak.org/satcat/search.php"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-400 hover:text-yellow-300 underline underline-offset-2 transition-colors"
                    >
                      Browse the full Celestrak catalog ↗
                    </a>
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black py-3 px-4 rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Starting analysis…</span>
                      </>
                    ) : (
                      <>
                        <Target className="h-5 w-5" />
                        <span>Start Collision Prediction</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 p-5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    <h3 className="text-base font-semibold text-white">How it works</h3>
                  </div>
                  <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                    <li>Fetches latest TLE data from Space-Track.org</li>
                    <li>Propagates orbits over 7 days using SGP4</li>
                    <li>Finds TCA with 1-second precision</li>
                    <li>Random Forest ML classifies conjunction risk</li>
                  </ol>
                  <p className="text-gray-500 text-xs mt-3">
                    Search by name, or type any NORAD ID directly.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
