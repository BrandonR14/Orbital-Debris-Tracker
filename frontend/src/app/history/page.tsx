'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getStoredUser, logout, authenticatedFetch } from '@/utils/auth';
import Link from 'next/link';
import { Loader2, LogOut, Satellite, History, ArrowLeft, Target } from 'lucide-react';

interface PredictionRecord {
  id: number;
  sat1_id: string;
  sat2_id: string;
  sat1_name: string;
  sat2_name: string;
  miss_distance: number;
  probability: number;
  tca: string;
  relative_velocity: number | null;
  avg_altitude: number | null;
  time_to_tca_hours: number | null;
  risk_label: string;
  risk_probabilities: Record<string, number> | null;
  created_at: string;
}

const RISK_COLORS: Record<string, string> = {
  HIGH: 'text-red-400 bg-red-500/10 border-red-500/30',
  MEDIUM: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  LOW: 'text-green-400 bg-green-500/10 border-green-500/30',
};

export default function HistoryPage() {
  const router = useRouter();
  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const user = getStoredUser();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const resp = await authenticatedFetch('http://127.0.0.1:8000/api/prediction-history/');
        if (!resp.ok) throw new Error('Failed to load history');
        const data = await resp.json();
        setRecords(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const toggle = (id: number) => setExpanded(prev => (prev === id ? null : id));

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
                <span className="text-gray-300">History</span>
              </div>
              <div className="flex items-center space-x-3">
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

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Nav */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/predict')}
              className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Predictions</span>
            </button>
            <button
              onClick={() => router.push('/predict')}
              className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-4 py-2 rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 transition-all"
            >
              <Target className="h-4 w-4" />
              <span>New Prediction</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <History className="h-7 w-7 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Prediction History</h2>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-navy-900/80 rounded-xl p-12 border border-yellow-500/20 text-center">
              <Loader2 className="h-10 w-10 text-yellow-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-300">Loading your predictions…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && records.length === 0 && (
            <div className="bg-navy-900/80 rounded-xl p-12 border border-yellow-500/20 text-center">
              <History className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-white font-medium mb-1">No predictions yet</p>
              <p className="text-gray-400 text-sm">Run your first prediction to see results here.</p>
              <button
                onClick={() => router.push('/predict')}
                className="mt-4 bg-yellow-500 text-black px-5 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
              >
                Start a Prediction
              </button>
            </div>
          )}

          {/* Records */}
          {records.map((rec) => {
            const riskStyle = RISK_COLORS[rec.risk_label] || RISK_COLORS.LOW;
            const isOpen = expanded === rec.id;

            return (
              <div
                key={rec.id}
                className="bg-navy-900/80 backdrop-blur-lg rounded-xl border border-yellow-500/20 overflow-hidden"
              >
                {/* Summary row */}
                <button
                  onClick={() => toggle(rec.id)}
                  className="w-full text-left p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center space-x-6 flex-1 min-w-0">
                    {/* Risk badge */}
                    <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border ${riskStyle}`}>
                      {rec.risk_label || '—'}
                    </span>

                    {/* Satellites */}
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {rec.sat1_name || `NORAD ${rec.sat1_id}`}
                        <span className="text-gray-500 mx-2">vs</span>
                        {rec.sat2_name || `NORAD ${rec.sat2_id}`}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(rec.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Key stats */}
                  <div className="hidden md:flex items-center space-x-8 shrink-0 mr-4">
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Miss Distance</p>
                      <p className="text-white font-semibold">{rec.miss_distance?.toFixed(2)} km</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Probability</p>
                      <p className="text-white font-semibold">{(rec.probability * 100).toFixed(6)}%</p>
                    </div>
                  </div>

                  <span className="text-gray-500 ml-2">{isOpen ? '▲' : '▼'}</span>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-yellow-500/10 p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Satellite 1</p>
                      <p className="text-white text-sm font-medium">{rec.sat1_name || '—'}</p>
                      <p className="text-yellow-400 text-xs font-mono">ID: {rec.sat1_id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Satellite 2</p>
                      <p className="text-white text-sm font-medium">{rec.sat2_name || '—'}</p>
                      <p className="text-yellow-400 text-xs font-mono">ID: {rec.sat2_id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">TCA</p>
                      <p className="text-white text-sm">{new Date(rec.tca).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Relative Velocity</p>
                      <p className="text-white text-sm">{rec.relative_velocity?.toFixed(2) ?? '—'} km/s</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Avg Altitude</p>
                      <p className="text-white text-sm">{rec.avg_altitude?.toFixed(0) ?? '—'} km</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Time to TCA</p>
                      <p className="text-white text-sm">{rec.time_to_tca_hours?.toFixed(1) ?? '—'} hrs</p>
                    </div>
                    {rec.risk_probabilities && (
                      <div className="col-span-2">
                        <p className="text-gray-400 text-xs mb-2">ML Confidence</p>
                        <div className="space-y-1">
                          {Object.entries(rec.risk_probabilities).map(([label, prob]) => (
                            <div key={label} className="flex items-center space-x-2">
                              <span className="text-gray-300 text-xs w-16">{label}</span>
                              <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full bg-yellow-500"
                                  style={{ width: `${(prob * 100).toFixed(1)}%` }}
                                />
                              </div>
                              <span className="text-gray-400 text-xs w-10 text-right">
                                {(prob * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </main>
      </div>
    </ProtectedRoute>
  );
}
