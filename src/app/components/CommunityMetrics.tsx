'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

interface DashboardMetrics {
  growthVotesToday: number;
  declineVotesToday: number;
  activeAnalysts: number;
  totalVotes: number;
}

interface TrendingStock {
  ticker: string;
  growthVotes: number;
  declineVotes: number;
  netScore: number;
}

export default function CommunityMetrics() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    growthVotesToday: 0,
    declineVotesToday: 0,
    activeAnalysts: 0,
    totalVotes: 0
  });
  const [topGrowthStocks, setTopGrowthStocks] = useState<TrendingStock[]>([]);
  const [topDeclineStocks, setTopDeclineStocks] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);

  const handleStockClick = (ticker: string) => {
    router.push(`/${ticker}`);
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const todayStart = new Date(today);
  const todayEnd = new Date(today);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Listen to today's votes for real-time metrics
  useEffect(() => {
    const votesRef = collection(db, 'votes');
    const todayQuery = query(
      votesRef,
      where('timestamp', '>=', todayStart),
      where('timestamp', '<', todayEnd)
    );

    const unsubscribe = onSnapshot(todayQuery, (snapshot) => {
      const votes = snapshot.docs.map(doc => doc.data());
      
      const growthVotes = votes.filter(vote => vote.voteType === 'growth').length;
      const declineVotes = votes.filter(vote => vote.voteType === 'decline').length;
      const uniqueUsers = new Set(votes.map(vote => vote.userId)).size;

      setMetrics({
        growthVotesToday: growthVotes,
        declineVotesToday: declineVotes,
        activeAnalysts: uniqueUsers,
        totalVotes: growthVotes + declineVotes
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, [todayStart, todayEnd]);

  // Listen to all votes for trending stocks calculation
  useEffect(() => {
    const votesRef = collection(db, 'votes');
    
    const unsubscribe = onSnapshot(votesRef, (snapshot) => {
      const votes = snapshot.docs.map(doc => doc.data());
      
      // Aggregate votes by ticker
      const tickerVotes: { [ticker: string]: { growth: number; decline: number } } = {};
      
      votes.forEach(vote => {
        if (!tickerVotes[vote.ticker]) {
          tickerVotes[vote.ticker] = { growth: 0, decline: 0 };
        }
        
        if (vote.voteType === 'growth') {
          tickerVotes[vote.ticker].growth++;
        } else {
          tickerVotes[vote.ticker].decline++;
        }
      });

      // Convert to trending stocks array
      const trendingStocks: TrendingStock[] = Object.entries(tickerVotes)
        .map(([ticker, votes]) => ({
          ticker,
          growthVotes: votes.growth,
          declineVotes: votes.decline,
          netScore: votes.growth - votes.decline
        }))
        .filter(stock => stock.growthVotes + stock.declineVotes > 0); // Only stocks with votes

      // Sort by growth votes (descending)
      const topGrowth = [...trendingStocks]
        .sort((a, b) => b.growthVotes - a.growthVotes)
        .slice(0, 5);

      // Sort by decline votes (descending)
      const topDecline = [...trendingStocks]
        .sort((a, b) => b.declineVotes - a.declineVotes)
        .slice(0, 5);

      setTopGrowthStocks(topGrowth);
      setTopDeclineStocks(topDecline);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Community Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Growth Votes Today</p>
              <p className="text-lg font-semibold text-gray-900">{metrics.growthVotesToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Decline Votes Today</p>
              <p className="text-lg font-semibold text-gray-900">{metrics.declineVotesToday}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Analysts</p>
              <p className="text-lg font-semibold text-gray-900">{metrics.activeAnalysts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Votes Today</p>
              <p className="text-lg font-semibold text-gray-900">{metrics.totalVotes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rankings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Growth Stocks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Top Growth Stocks
            </h3>
            <p className="text-sm text-gray-500">Most voted growth stocks by the community</p>
          </div>
          <div className="p-6">
            {topGrowthStocks.length > 0 ? (
              <div className="space-y-3">
                {topGrowthStocks.map((stock, index) => (
                  <div 
                    key={stock.ticker} 
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 cursor-pointer transition-colors"
                    onClick={() => handleStockClick(stock.ticker)}
                  >
                    <div className="flex items-center">
                      <span className="flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full mr-3">
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-medium text-gray-900">{stock.ticker}</span>
                        <div className="text-sm text-gray-600">
                          {stock.growthVotes} growth • {stock.declineVotes} decline
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">+{stock.netScore}</div>
                      <div className="text-xs text-gray-500">net score</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No votes yet</h4>
                <p className="text-gray-600">Be the first to vote on a stock!</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Decline Stocks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
              Top Decline Stocks
            </h3>
            <p className="text-sm text-gray-500">Most voted decline stocks by the community</p>
          </div>
          <div className="p-6">
            {topDeclineStocks.length > 0 ? (
              <div className="space-y-3">
                {topDeclineStocks.map((stock, index) => (
                  <div 
                    key={stock.ticker} 
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 cursor-pointer transition-colors"
                    onClick={() => handleStockClick(stock.ticker)}
                  >
                    <div className="flex items-center">
                      <span className="flex items-center justify-center w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full mr-3">
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-medium text-gray-900">{stock.ticker}</span>
                        <div className="text-sm text-gray-600">
                          {stock.growthVotes} growth • {stock.declineVotes} decline
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">{stock.netScore}</div>
                      <div className="text-xs text-gray-500">net score</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No votes yet</h4>
                <p className="text-gray-600">Community decline rankings will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
