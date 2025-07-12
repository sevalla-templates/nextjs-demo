'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useFirestore';
import { useWatchlist } from '../../hooks/useWatchlist';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { watchlist, loading: watchlistLoading, removeFromWatchlist, getWatchlistByType } = useWatchlist();
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  const handleTickerClick = (ticker: string) => {
    router.push(`/${ticker}`);
  };

  const handleRemoveFromWatchlist = async (ticker: string) => {
    await removeFromWatchlist(ticker);
  };

  const growthStocks = getWatchlistByType('growth');
  const declineStocks = getWatchlistByType('decline');

  if (profileLoading || watchlistLoading) {
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
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
                </h1>
                <p className="text-gray-600">
                  Ready to explore financial insights and track your investments?
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <img
                  src={user?.photoURL || '/default-avatar.png'}
                  alt="Profile"
                  className="w-12 h-12 rounded-full"
                />
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{profile?.subscription.plan}</p>
                  <p className="text-xs text-gray-500">Plan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <nav className="flex space-x-8 px-6 py-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'search'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Search Stocks
              </button>
              <button
                onClick={() => setActiveTab('watchlists')}
                className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'watchlists'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Watchlists
              </button>
            </nav>
          </div>

          {/* Content Area */}
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h3>
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Watched</span>
                    <span className="font-semibold text-blue-600">
                      {growthStocks.length + declineStocks.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Growth Stocks */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Growth</h3>
                {growthStocks.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2"
                       onClick={() => handleTickerClick(item.ticker)}>
                    <span className="font-medium text-gray-900">{item.ticker}</span>
                    <span className="text-xs text-gray-500">
                      {item.addedAt instanceof Date ? 
                        item.addedAt.toLocaleDateString() : 
                        new Date(item.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {growthStocks.length === 0 && (
                  <p className="text-gray-500 text-sm">No growth stocks added yet</p>
                )}
              </div>

              {/* Recent Decline Stocks */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Decline</h3>
                {declineStocks.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2"
                       onClick={() => handleTickerClick(item.ticker)}>
                    <span className="font-medium text-gray-900">{item.ticker}</span>
                    <span className="text-xs text-gray-500">
                      {item.addedAt instanceof Date ? 
                        item.addedAt.toLocaleDateString() : 
                        new Date(item.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {declineStocks.length === 0 && (
                  <p className="text-gray-500 text-sm">No decline stocks added yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Financial Data</h3>
              <p className="text-gray-600 mb-4">
                Search for any stock ticker to view detailed financial analysis and add to your watchlists.
              </p>
              <div className="text-center py-8">
                <a 
                  href="/search"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Go to Stock Search
                </a>
                <p className="text-sm text-gray-500 mt-4">
                  Access the full stock search interface with financial visualizations
                </p>
              </div>
            </div>
          )}

          {activeTab === 'watchlists' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Growth Watchlist */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-green-600 mb-4">
                  Growth Watchlist ({growthStocks.length})
                </h3>
                <div className="space-y-3">
                  {growthStocks.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div 
                        className="cursor-pointer flex-1"
                        onClick={() => handleTickerClick(item.ticker)}
                      >
                        <span className="font-medium text-gray-900">{item.ticker}</span>
                        <p className="text-xs text-gray-500">
                          Added {item.addedAt instanceof Date ? 
                            item.addedAt.toLocaleDateString() : 
                            new Date(item.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleRemoveFromWatchlist(item.ticker)}
                        className="text-red-500 hover:text-red-700 text-sm ml-4"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {growthStocks.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No growth stocks in your watchlist</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Search for stocks and mark them as growth opportunities
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Decline Watchlist */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-red-600 mb-4">
                  Decline Watchlist ({declineStocks.length})
                </h3>
                <div className="space-y-3">
                  {declineStocks.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div 
                        className="cursor-pointer flex-1"
                        onClick={() => handleTickerClick(item.ticker)}
                      >
                        <span className="font-medium text-gray-900">{item.ticker}</span>
                        <p className="text-xs text-gray-500">
                          Added {item.addedAt instanceof Date ? 
                            item.addedAt.toLocaleDateString() : 
                            new Date(item.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleRemoveFromWatchlist(item.ticker)}
                        className="text-red-500 hover:text-red-700 text-sm ml-4"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {declineStocks.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No decline stocks in your watchlist</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Search for stocks and mark them as decline patterns
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
