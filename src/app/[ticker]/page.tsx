'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import TickerDisplay from '../components/TickerDisplay';
import TickerCommunityMetrics from '../components/TickerCommunityMetrics';
import TickerChat from '../components/TickerChat';
import { ArrowLeft } from 'lucide-react';
import companyTickers from '../../data/company_tickers.json';

export default function TickerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticker = params.ticker as string;
  const viewType = searchParams.get('view') || 'default';
  const { user } = useAuth();

  const [tickerData, setTickerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get company info for sector data
  const companyInfo = companyTickers[ticker?.toUpperCase() as keyof typeof companyTickers] as any;

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
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
                  {tickerData?.title || companyInfo?.title || 'Stock Analysis'}
                </p>
              </div>
            </div>
          </div>

          {/* Community Metrics */}
          <div className="mb-6">
            <TickerCommunityMetrics 
              ticker={ticker.toUpperCase()} 
              sector={companyInfo?.sector}
            />
          </div>

          {/* Two-column layout for content and chat */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2">
              {tickerData && (
                <TickerDisplay
                  ticker={ticker.toUpperCase()}
                  data={tickerData}
                  onClear={handleClear}
                  viewType={viewType}
                />
              )}
            </div>

            {/* Chat sidebar */}
            <div className="lg:col-span-1">
              <TickerChat ticker={ticker.toUpperCase()} />
              
              {/* Community Predictions Link */}
              <div className="mt-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Community Predictions</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    See what other analysts are predicting for {ticker.toUpperCase()}
                  </p>
                  <button
                    onClick={() => router.push(`/${ticker}/community`)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View All Predictions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
