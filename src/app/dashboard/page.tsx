'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useFirestore';
import { useWatchlist } from '../../hooks/useWatchlist';
import UserBadges from '../components/UserBadges';
import UserCredibilitySystem from '../components/UserCredibilitySystem';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { watchlist, loading: watchlistLoading, removeFromWatchlist, getWatchlistByType } = useWatchlist();
  const [activeTab, setActiveTab] = useState('overview');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user && mounted) {
      router.push('/landing');
    }
  }, [user, loading, mounted, router]);

  // Reset loading states when user changes
  useEffect(() => {
    // This ensures that when navigating back to dashboard, 
    // the loading states are properly reset
  }, [user]);

  const handleTickerClick = (ticker: string) => {
    router.push(`/${ticker}`);
  };

  const handleRemoveFromWatchlist = async (ticker: string) => {
    await removeFromWatchlist(ticker);
  };

  const growthStocks = getWatchlistByType('growth');
  const declineStocks = getWatchlistByType('decline');

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

  // Show loading only if both profile and watchlist are still loading
  if (profileLoading && watchlistLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-gray-600 mt-2">
                Track your analysis, manage your watchlists, and see your progress
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/search')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Analyze New Stock
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('watchlist')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'watchlist'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Watchlist ({watchlist.length})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Activity
              </button>
            </div>
          </div>

          {/* Content Area */}
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-3 gap-6 p-6">
              {/* User Stats & Badges */}
              <UserBadges />

              {/* Credibility System */}
              <UserCredibilitySystem />

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Watchlists</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Growth Stocks</span>
                    <span className="font-semibold text-green-600">
                      {growthStocks.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Decline Stocks</span>
                    <span className="font-semibold text-red-600">
                      {declineStocks.length}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-900 font-medium">Total Tracked</span>
                    <span className="font-semibold text-blue-600">
                      {watchlist.length}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('watchlist')}
                  className="w-full mt-4 bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  View Full Watchlist
                </button>
              </div>
            </div>
          )}

          {activeTab === 'watchlist' && (
            <div className="p-6">
              <div className="space-y-6">
                {/* Growth Watchlist */}
                <div>
                  <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Growth Watchlist ({growthStocks.length})
                  </h3>
                  {growthStocks.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {growthStocks.map((item) => (
                        <div key={item.ticker} className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{item.ticker}</h4>
                            <button
                              onClick={() => handleRemoveFromWatchlist(item.ticker)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">Added on {new Date(item.addedAt).toLocaleDateString()}</p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleTickerClick(item.ticker)}
                              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              View Analysis
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No growth stocks in your watchlist yet.</p>
                      <button
                        onClick={() => router.push('/search')}
                        className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Find Growth Stocks
                      </button>
                    </div>
                  )}
                </div>

                {/* Decline Watchlist */}
                <div>
                  <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                    Decline Watchlist ({declineStocks.length})
                  </h3>
                  {declineStocks.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {declineStocks.map((item) => (
                        <div key={item.ticker} className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{item.ticker}</h4>
                            <button
                              onClick={() => handleRemoveFromWatchlist(item.ticker)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">Added on {new Date(item.addedAt).toLocaleDateString()}</p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleTickerClick(item.ticker)}
                              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              View Analysis
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No decline stocks in your watchlist yet.</p>
                      <button
                        onClick={() => router.push('/search')}
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Find Decline Stocks
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="p-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Activity Feed</h3>
                <p className="text-gray-600">Your recent analysis and voting activity will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
