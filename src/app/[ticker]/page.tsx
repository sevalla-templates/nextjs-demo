'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWatchlist } from '../../hooks/useWatchlist';
import ProtectedRoute from '../../components/ProtectedRoute';
import TickerDisplay from '../components/TickerDisplay';
import { TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';

export default function TickerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticker = params.ticker as string;
  const viewType = searchParams.get('view') || 'default';
  const { user } = useAuth();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  const [tickerData, setTickerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const watchlistItem = isInWatchlist(ticker?.toUpperCase());

  useEffect(() => {
    const fetchTickerData = async () => {
      if (!ticker) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Use the standard API endpoint - let TickerDisplay handle the view type
        const response = await fetch(`/api/tickers/${ticker.toUpperCase()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${ticker.toUpperCase()}`);
        }
        
        const data = await response.json();
        setTickerData(data);
      } catch (err) {
        console.error('Error fetching ticker data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ticker data');
      } finally {
        setLoading(false);
      }
    };

    fetchTickerData();
  }, [ticker]);

  const handleWatchlistAction = async (action: 'growth' | 'decline') => {
    if (!user || !ticker) return;

    const upperTicker = ticker.toUpperCase();
    
    if (watchlistItem) {
      if (watchlistItem.type === action) {
        // Remove if clicking same action
        await removeFromWatchlist(upperTicker);
      } else {
        // Switch to new action
        await removeFromWatchlist(upperTicker);
        await addToWatchlist(upperTicker, action);
      }
    } else {
      // Add new item
      await addToWatchlist(upperTicker, action);
    }
  };

  const handleClear = () => {
    router.push('/search');
  };

  if (!ticker) {
    return <div>Invalid ticker</div>;
  }

  if (loading) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading {ticker.toUpperCase()} data...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {ticker.toUpperCase()}
                  </h1>
                  <p className="text-gray-600">Stock Analysis</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => router.push('/search')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Back to Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {ticker.toUpperCase()}
                  </h1>
                  <p className="text-gray-600">
                    {tickerData?.title || 'Stock Analysis'}
                  </p>
                </div>
              </div>
              
              {/* Watchlist Actions */}
              {user && (
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleWatchlistAction('growth')}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      watchlistItem?.type === 'growth'
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-green-50 hover:border-green-300'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    {watchlistItem?.type === 'growth' ? 'In Growth List' : 'Add to Growth'}
                  </button>
                  <button
                    onClick={() => handleWatchlistAction('decline')}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      watchlistItem?.type === 'decline'
                        ? 'bg-red-100 text-red-700 border-2 border-red-300'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-red-50 hover:border-red-300'
                    }`}
                  >
                    <TrendingDown className="w-5 h-5 mr-2" />
                    {watchlistItem?.type === 'decline' ? 'In Decline List' : 'Add to Decline'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          {tickerData && (
            <TickerDisplay
              ticker={ticker.toUpperCase()}
              data={tickerData}
              onClear={handleClear}
              viewType={viewType}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
