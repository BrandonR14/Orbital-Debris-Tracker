'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getStoredUser, logout, authenticatedFetch } from '@/utils/auth';
import Link from 'next/link';
import {
  Loader2, LogOut, Satellite, BarChart3, CheckCircle,
  XCircle, ArrowLeft, History, Zap, Globe, Clock,
} from 'lucide-react';

interface RiskProbabilities {
  HIGH: number;
  MEDIUM: number;
  LOW: number;
}

interface PredictionResult {
  status: string;
  report_id: number;
  sat1_id: number;
  sat2_id: number;
  sat1_name: string;
  sat2_name: string;
  miss_distance: number;
  probability: number;
  tca: string;
  relative_velocity: number;
  avg_altitude: number;
  time_to_tca_hours: number;
  risk_label: string;
  risk_probabilities: RiskProbabilities | null;
}

const RISK_COLORS: Record<string, string> = {
  HIGH: 'text-red-400',
  MEDIUM: 'text-yellow-400',
  LOW: 'text-green-400',
};

const RISK_BG: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-yellow-500',
  LOW: 'bg-green-500',
};

const RISK_BORDER: Record<string, string> = {
  HIGH: 'border-red-500/30 bg-red-500/10',
  MEDIUM: 'border-yellow-500/30 bg-yellow-500/10',
  LOW: 'border-green-500/30 bg-green-500/10',
};

function ResultsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get('task_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [taskStatus, setTaskStatus] = useState('PENDING');

  const user = getStoredUser();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const checkTaskStatus = async () => {
    if (!taskId) {
      setError('No task ID provided');
      setLoading(false);
      return;
    }

    try {
      const response = await authenticatedFetch(`http://127.0.0.1:8000/api/prediction-status/${taskId}/`);

      if (!response.ok) {
        setError('Failed to check task status');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setTaskStatus(data.status);

      if (data.status === 'SUCCESS' && data.result) {
        if (data.result.status === 'error') {
          setError(data.result.message || 'Prediction failed');
          setLoading(false);
        } else {
          setResult(data.result);
          setLoading(false);
        }
      } else if (data.status === 'FAILURE') {
        setError(data.error || 'Prediction task failed unexpectedly');
        setLoading(false);
      } else {
        setTimeout(checkTaskStatus, 2000);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    checkTaskStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const riskLabel = result?.risk_label || 'LOW';
  const riskColor = RISK_COLORS[riskLabel] || 'text-green-400';
  const riskBorder = RISK_BORDER[riskLabel] || RISK_BORDER.LOW;

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
                <span className="text-gray-300">Results</span>
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

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Back */}
          <button
            onClick={() => router.push('/predict')}
            className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Predictions</span>
          </button>

          {/* Status bar */}
          <div className="bg-navy-900/80 backdrop-blur-lg rounded-xl p-4 border border-yellow-500/20 flex items-center space-x-3">
            {taskStatus === 'SUCCESS' && !error
              ? <CheckCircle className="h-6 w-6 text-green-400 shrink-0" />
              : taskStatus === 'FAILURE' || error
              ? <XCircle className="h-6 w-6 text-red-400 shrink-0" />
              : <Loader2 className="h-6 w-6 text-yellow-400 animate-spin shrink-0" />}
            <div>
              <p className={`font-medium ${taskStatus === 'SUCCESS' && !error ? 'text-green-400' : taskStatus === 'FAILURE' || error ? 'text-red-400' : 'text-yellow-400'}`}>
                {taskStatus === 'SUCCESS' && !error
                  ? 'Analysis complete'
                  : taskStatus === 'FAILURE' || error
                  ? 'Analysis failed'
                  : 'Analysing orbital data…'}
              </p>
              {taskStatus === 'PENDING' && (
                <p className="text-gray-400 text-sm">Fetching TLEs and running SGP4 propagation</p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
              <p className="text-red-400 font-medium mb-1">Prediction failed</p>
              <p className="text-red-300 text-sm">{error}</p>
              <p className="text-gray-400 text-sm mt-2">
                Make sure both NORAD IDs exist and are currently tracked by Space-Track.
              </p>
            </div>
          )}

          {/* Loading spinner */}
          {loading && !error && (
            <div className="bg-navy-900/80 backdrop-blur-lg rounded-xl p-16 border border-yellow-500/20 text-center">
              <Loader2 className="h-12 w-12 text-yellow-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Running orbital calculations…</p>
              <p className="text-gray-400 text-sm mt-1">This typically takes 10–30 seconds</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Satellite names */}
              <div className="bg-navy-900/80 backdrop-blur-lg rounded-xl p-6 border border-yellow-500/20">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Satellite className="h-5 w-5 text-yellow-400" />
                  <span>Conjunction Analysis</span>
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-black/30 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Satellite 1</p>
                    <p className="text-white font-semibold">{result.sat1_name || `NORAD ${result.sat1_id}`}</p>
                    <p className="text-yellow-400 text-sm font-mono">ID: {result.sat1_id}</p>
                  </div>
                  <div className="p-4 bg-black/30 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Satellite 2</p>
                    <p className="text-white font-semibold">{result.sat2_name || `NORAD ${result.sat2_id}`}</p>
                    <p className="text-yellow-400 text-sm font-mono">ID: {result.sat2_id}</p>
                  </div>
                </div>
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-navy-900/80 backdrop-blur-lg rounded-xl p-5 border border-yellow-500/20 text-center">
                  <p className="text-gray-400 text-sm mb-2">Miss Distance</p>
                  <p className="text-3xl font-bold text-white">{result.miss_distance?.toFixed(2)}</p>
                  <p className="text-gray-400 text-sm">km</p>
                </div>
                <div className="bg-navy-900/80 backdrop-blur-lg rounded-xl p-5 border border-yellow-500/20 text-center">
                  <p className="text-gray-400 text-sm mb-2">Collision Probability</p>
                  <p className="text-3xl font-bold text-white">{(result.probability * 100).toFixed(8)}</p>
                  <p className="text-gray-400 text-sm">%</p>
                </div>
                <div className="bg-navy-900/80 backdrop-blur-lg rounded-xl p-5 border border-yellow-500/20 text-center">
                  <p className="text-gray-400 text-sm mb-2">Time of Closest Approach</p>
                  <p className="text-lg font-bold text-yellow-400">{new Date(result.tca).toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">in {result.time_to_tca_hours?.toFixed(1)} hrs</p>
                </div>
              </div>

              {/* Orbital context */}
              <div className="bg-navy-900/80 backdrop-blur-lg rounded-xl p-6 border border-yellow-500/20">
                <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-blue-400" />
                  <span>Orbital Context at TCA</span>
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-8 w-8 text-blue-400 shrink-0" />
                    <div>
                      <p className="text-gray-400 text-sm">Relative Velocity</p>
                      <p className="text-white font-bold text-xl">{result.relative_velocity?.toFixed(2)} <span className="text-gray-400 text-sm font-normal">km/s</span></p>
                      {result.relative_velocity > 3 && (
                        <p className="text-orange-400 text-xs mt-1">Hypervelocity — above Whipple shield threshold</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="h-8 w-8 text-green-400 shrink-0" />
                    <div>
                      <p className="text-gray-400 text-sm">Average Altitude</p>
                      <p className="text-white font-bold text-xl">{result.avg_altitude?.toFixed(0)} <span className="text-gray-400 text-sm font-normal">km</span></p>
                      <p className="text-gray-400 text-xs mt-1">
                        {result.avg_altitude < 2000 ? 'LEO' : result.avg_altitude < 35000 ? 'MEO' : 'GEO'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ML Risk assessment */}
              <div className={`rounded-xl p-6 border ${riskBorder}`}>
                <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-yellow-400" />
                  <span>ML Risk Assessment</span>
                  <span className="text-gray-500 text-xs font-normal">(Random Forest)</span>
                </h3>

                <div className="flex items-center space-x-4 mb-6">
                  <span className={`text-4xl font-bold ${riskColor}`}>{riskLabel}</span>
                  <div className="text-gray-400 text-sm">
                    {riskLabel === 'HIGH' && 'Conjunction screening alert — consider maneuver planning'}
                    {riskLabel === 'MEDIUM' && 'Monitor closely — elevated conjunction risk'}
                    {riskLabel === 'LOW' && 'Within normal conjunction parameters'}
                  </div>
                </div>

                {result.risk_probabilities && (
                  <div className="space-y-3">
                    <p className="text-gray-400 text-sm mb-3">Model confidence</p>
                    {(['HIGH', 'MEDIUM', 'LOW'] as const).map((label) => {
                      const pct = ((result.risk_probabilities![label] || 0) * 100).toFixed(1);
                      return (
                        <div key={label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className={RISK_COLORS[label]}>{label}</span>
                            <span className="text-gray-300">{pct}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${RISK_BG[label]}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push('/predict')}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black py-3 rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 transition-all"
                >
                  New Prediction
                </button>
                <button
                  onClick={() => router.push('/history')}
                  className="flex-1 bg-black/40 text-white py-3 rounded-lg font-medium hover:bg-black/60 transition-all border border-yellow-500/20 flex items-center justify-center space-x-2"
                >
                  <History className="h-4 w-4" />
                  <span>View History</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-black/40 text-white py-3 rounded-lg font-medium hover:bg-black/60 transition-all border border-yellow-500/20"
                >
                  Print Report
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsPageContent />
    </Suspense>
  );
}
