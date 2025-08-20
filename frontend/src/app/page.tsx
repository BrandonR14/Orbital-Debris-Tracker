'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // If user is already authenticated, redirect to predict page
    if (isAuthenticated()) {
      router.push('/predict');
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black/60 text-white px-4">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold mb-6 text-center bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
          Orbital Debris Tracker
        </h1>
        <p className="text-xl text-center mb-8 text-gray-300 leading-relaxed">
          Advanced satellite collision prediction using real-time orbital data and machine learning algorithms.
          <br />
          Monitor, analyze, and predict potential space debris collisions with unprecedented accuracy.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login">
            <button className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 text-black">
              Sign In
            </button>
          </Link>
          <Link href="/register">
            <button className="px-8 py-4 bg-navy-900/80 backdrop-blur-lg border border-yellow-500/20 rounded-xl hover:bg-navy-800/80 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 text-white">
              Create Account
            </button>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-navy-900/80 backdrop-blur-lg rounded-xl p-6 border border-yellow-500/20">
            <div className="text-3xl mb-4">🛰️</div>
            <h3 className="text-xl font-semibold mb-2 text-yellow-400">Real-time Tracking</h3>
            <p className="text-gray-300">Monitor thousands of satellites and debris objects in real-time</p>
          </div>
          <div className="bg-navy-900/80 backdrop-blur-lg rounded-xl p-6 border border-yellow-500/20">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2 text-yellow-400">AI Predictions</h3>
            <p className="text-gray-300">Advanced machine learning algorithms for collision risk assessment</p>
          </div>
          <div className="bg-navy-900/80 backdrop-blur-lg rounded-xl p-6 border border-yellow-500/20">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-yellow-400">Detailed Analytics</h3>
            <p className="text-gray-300">Comprehensive reports and visualizations of orbital data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
