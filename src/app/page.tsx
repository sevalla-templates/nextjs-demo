'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CommunityMetrics from './components/CommunityMetrics';
import RecentActivity from './components/RecentActivity';
import SectorRankings from './components/SectorRankings';
import TimeBasedRankings from './components/TimeBasedRankings';
import ForecastingContests from './components/ForecastingContests';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user && mounted) {
      router.push('/landing');
    }
  }, [user, loading, mounted, router]);

  if (loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Community Activity</h1>
          <p className="mt-2 text-gray-600">
            See what the community is analyzing and trending stocks based on financial fundamentals
          </p>
        </div>

        {/* Community Stats and Rankings */}
        <CommunityMetrics />

        {/* Time-based Rankings */}
        <div className="mt-8">
          <TimeBasedRankings />
        </div>

        {/* Sector Rankings */}
        <div className="mt-8">
          <SectorRankings />
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <RecentActivity />
        </div>

        {/* Forecasting Contests */}
        <div className="mt-8">
          <ForecastingContests />
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm">
          <div className="px-6 py-8 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Start Analyzing Stocks</h3>
            <p className="text-blue-100 mb-4">
              Press "/" to search for any stock and start your financial analysis
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Go to Your Dashboard
              </button>
              <button 
                onClick={() => router.push('/search')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors border border-blue-400"
              >
                Search Stocks
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
