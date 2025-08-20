'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { logout, getStoredUser } from '@/utils/auth';
import { Loader2, LogOut, Satellite, Target, BarChart3 } from 'lucide-react';

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
    setLoading(true);
    setError('');

    try {
      // Trigger Celery task for prediction
      const response = await fetch('http://127.0.0.1:8000/api/trigger-prediction/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          sat1_id: parseInt(sat1Id),
          sat2_id: parseInt(sat2Id),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to results page with the task ID
        router.push(`/results?task_id=${data.task_id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to start prediction');
      }
    } catch (err) {
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
                <Satellite className="h-8 w-8 text-yellow-400" />
                <h1 className="text-2xl font-bold text-white">Orbital Debris Tracker</h1>
                <span className="text-gray-300">|</span>
                <span className="text-gray-300">Prediction Tool</span>
              </div>
              <div className="flex items-center space-x-4">
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

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-navy-900/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-yellow-500/20">
            <div className="flex items-center space-x-3 mb-6">
              <Target className="h-8 w-8 text-yellow-400" />
              <h2 className="text-3xl font-bold text-white">Collision Risk Prediction</h2>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handlePrediction} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-yellow-400">
                    Satellite 1 ID
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter satellite 1 ID"
                    value={sat1Id}
                    onChange={(e) => setSat1Id(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-yellow-400">
                    Satellite 2 ID
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter satellite 2 ID"
                    value={sat2Id}
                    onChange={(e) => setSat2Id(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black py-3 px-4 rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Starting prediction analysis...</span>
                  </>
                ) : (
                  <>
                    <Target className="h-5 w-5" />
                    <span>Start Collision Prediction</span>
                  </>
                )}
              </button>
            </form>

            {/* Instructions */}
            <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <BarChart3 className="h-6 w-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">How it works</h3>
              </div>
              <div className="text-gray-300 text-sm space-y-2">
                <p>1. Enter the NORAD IDs of two satellites you want to analyze</p>
                <p>2. Our system will calculate collision probability using orbital mechanics</p>
                <p>3. Results will show miss distance, collision probability, and time of closest approach</p>
                <p>4. You'll be redirected to view detailed results</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
