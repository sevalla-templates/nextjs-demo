'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import companyTickers from '../../data/company_tickers.json';

interface TimeBasedStock {
  ticker: string;
  title: string;
  growthVotes: number;
  declineVotes: number;
  netScore: number;
}

interface TimeRankings {
  daily: TimeBasedStock[];
  weekly: TimeBasedStock[];
  monthly: TimeBasedStock[];
}

export default function TimeBasedRankings() {
  const [rankings, setRankings] = useState<TimeRankings>({
    daily: [],
    weekly: [],
    monthly: []
  });
  const [activeTimeframe, setActiveTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const now = new Date();
    
    // Calculate time boundaries
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const votesRef = collection(db, 'votes');
    
    // Listen to all votes to calculate time-based rankings
    const unsubscribe = onSnapshot(votesRef, (snapshot) => {
      const votes = snapshot.docs.map(doc => doc.data());
      
      // Filter votes by time periods
      const dailyVotes = votes.filter(vote => {
        const voteDate = vote.timestamp?.toDate ? vote.timestamp.toDate() : new Date(vote.timestamp);
        return voteDate >= today;
      });
      
      const weeklyVotes = votes.filter(vote => {
        const voteDate = vote.timestamp?.toDate ? vote.timestamp.toDate() : new Date(vote.timestamp);
        return voteDate >= weekAgo;
      });
      
      const monthlyVotes = votes.filter(vote => {
        const voteDate = vote.timestamp?.toDate ? vote.timestamp.toDate() : new Date(vote.timestamp);
        return voteDate >= monthAgo;
      });

      // Function to calculate rankings for a time period
      const calculateRankings = (timeVotes: any[]): TimeBasedStock[] => {
        const tickerVotes: { [ticker: string]: { growth: number; decline: number } } = {};
        
        timeVotes.forEach(vote => {
          if (!tickerVotes[vote.ticker]) {
            tickerVotes[vote.ticker] = { growth: 0, decline: 0 };
          }
          
          if (vote.voteType === 'growth') {
            tickerVotes[vote.ticker].growth++;
          } else {
            tickerVotes[vote.ticker].decline++;
          }
        });

        // Convert to ranked array
        return Object.entries(tickerVotes)
          .map(([ticker, votes]) => {
            const company = companyTickers[ticker as keyof typeof companyTickers] as any;
            return {
              ticker,
              title: company?.title || ticker,
              growthVotes: votes.growth,
              declineVotes: votes.decline,
              netScore: votes.growth - votes.decline
            };
          })
          .filter(stock => stock.growthVotes + stock.declineVotes > 0)
          .sort((a, b) => (b.growthVotes + b.declineVotes) - (a.growthVotes + a.declineVotes))
          .slice(0, 10);
      };

      setRankings({
        daily: calculateRankings(dailyVotes),
        weekly: calculateRankings(weeklyVotes),
        monthly: calculateRankings(monthlyVotes)
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleTickerClick = (ticker: string) => {
    router.push(`/${ticker}`);
  };

  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      default: return timeframe;
    }
  };

  const getTimeframeDescription = (timeframe: string) => {
    switch (timeframe) {
      case 'daily': return 'Most active stocks voted on today';
      case 'weekly': return 'Top stocks by votes in the last 7 days';
      case 'monthly': return 'Most popular stocks this month';
      default: return '';
    }
  };

  const currentRankings = rankings[activeTimeframe];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="flex space-x-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded w-20"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Trending Stocks</h3>
            <p className="text-sm text-gray-500">{getTimeframeDescription(activeTimeframe)}</p>
          </div>
          
          {/* Time Period Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['daily', 'weekly', 'monthly'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setActiveTimeframe(timeframe)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activeTimeframe === timeframe
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {getTimeframeLabel(timeframe)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {currentRankings.length > 0 ? (
          <div className="space-y-3">
            {currentRankings.map((stock, index) => (
              <div 
                key={stock.ticker}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-100"
                onClick={() => handleTickerClick(stock.ticker)}
              >
                <div className="flex items-center">
                  {/* Rank Badge */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-4 text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* Stock Info */}
                  <div>
                    <div className="font-medium text-gray-900">{stock.ticker}</div>
                    <div className="text-sm text-gray-600 truncate max-w-48">{stock.title}</div>
                  </div>
                </div>

                {/* Vote Stats */}
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-600">{stock.growthVotes}</div>
                    <div className="text-xs text-gray-500">Growth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-red-600">{stock.declineVotes}</div>
                    <div className="text-xs text-gray-500">Decline</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${
                      stock.netScore > 0 ? 'text-green-600' : 
                      stock.netScore < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stock.netScore > 0 ? '+' : ''}{stock.netScore}
                    </div>
                    <div className="text-xs text-gray-500">Net</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No votes {activeTimeframe === 'daily' ? 'today' : `this ${activeTimeframe.slice(0, -2)}`}</h4>
            <p className="text-gray-600 mb-4">
              Be the first to vote on stocks {activeTimeframe === 'daily' ? 'today' : `this ${activeTimeframe.slice(0, -2)}`}!
            </p>
            <button 
              onClick={() => router.push('/search')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Stocks to Vote On
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {currentRankings.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{currentRankings.length}</div>
              <div className="text-xs text-gray-600">Active Stocks</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {currentRankings.reduce((sum, stock) => sum + stock.growthVotes, 0)}
              </div>
              <div className="text-xs text-gray-600">Growth Votes</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {currentRankings.reduce((sum, stock) => sum + stock.declineVotes, 0)}
              </div>
              <div className="text-xs text-gray-600">Decline Votes</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
