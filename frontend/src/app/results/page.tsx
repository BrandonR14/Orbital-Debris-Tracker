'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { logout, getStoredUser } from '@/utils/auth';
import { Loader2, LogOut, Satellite, BarChart3, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get('task_id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState('PENDING');

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
      const response = await fetch(`http://127.0.0.1:8000/api/prediction-status/${taskId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);

        if (data.status === 'SUCCESS' && data.result) {
          setResult(data.result);
          setLoading(false);
        } else if (data.status === 'FAILURE') {
          setError(data.error || 'Prediction failed');
          setLoading(false);
        } else if (data.status === 'PENDING') {
          // Continue polling
          setTimeout(checkTaskStatus, 2000);
        }
      } else {
        setError('Failed to check task status');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    checkTaskStatus();
  }, [taskId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'text-green-400';
      case 'FAILURE':
        return 'text-red-400';
      case 'PENDING':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-6 w-6 text-green-400" />;
      case 'FAILURE':
        return <XCircle className="h-6 w-6 text-red-400" />;
      case 'PENDING':
        return <Loader2 className="h-6 w-6 text-yellow-400 animate-spin" />;
      default:
        return <BarChart3 className="h-6 w-6 text-gray-400" />;
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
                <span className="text-gray-300">Prediction Results</span>
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
            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={() => router.push('/predict')}
                className="flex items-center space-x-2 text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Predictions</span>
              </button>
            </div>

            <div className="flex items-center space-x-3 mb-6">
              <BarChart3 className="h-8 w-8 text-yellow-400" />
              <h2 className="text-3xl font-bold text-white">Prediction Results</h2>
            </div>

            {/* Status */}
            <div className="mb-6 p-4 bg-black/50 border border-gray-600 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status)}
                <div>
                  <p className={`font-medium ${getStatusColor(status)}`}>
                    Status: {status}
                  </p>
                  {status === 'PENDING' && (
                    <p className="text-gray-300 text-sm">
                      Analyzing orbital data and calculating collision probability...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Loading */}
            {loading && status === 'PENDING' && (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 text-yellow-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-300">Processing your prediction request...</p>
                <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
              </div>
            )}

            {/* Results */}
            {result && result.status === 'success' && (
              <div className="space-y-6">
                <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    <h3 className="text-xl font-semibold text-white">Analysis Complete</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-black/30 rounded-lg">
                      <p className="text-gray-300 text-sm mb-2">Miss Distance</p>
                      <p className="text-3xl font-bold text-green-400">
                        {result.miss_distance?.toFixed(2)} km
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-black/30 rounded-lg">
                      <p className="text-gray-300 text-sm mb-2">Collision Probability</p>
                      <p className="text-3xl font-bold text-red-400">
                        {(result.probability * 100).toFixed(6)}%
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-black/30 rounded-lg">
                      <p className="text-gray-300 text-sm mb-2">Time of Closest Approach</p>
                      <p className="text-lg font-semibold text-yellow-400">
                        {new Date(result.tca).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Risk Assessment</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Risk Level:</span>
                      <span className={`font-semibold ${
                        result.probability > 0.001 ? 'text-red-400' :
                        result.probability > 0.0001 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {result.probability > 0.001 ? 'HIGH' :
                         result.probability > 0.0001 ? 'MEDIUM' : 'LOW'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Report ID:</span>
                      <span className="text-yellow-400 font-mono">{result.report_id}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => router.push('/predict')}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black py-3 px-4 rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200"
                  >
                    New Prediction
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 bg-navy-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-navy-700 transition-all duration-200 border border-yellow-500/20"
                  >
                    Print Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
