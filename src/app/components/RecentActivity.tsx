'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

interface RecentVote {
  id: string;
  ticker: string;
  voteType: 'growth' | 'decline';
  timestamp: any;
  userId: string;
}

export default function RecentActivity() {
  const [recentVotes, setRecentVotes] = useState<RecentVote[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const votesRef = collection(db, 'votes');
    const recentQuery = query(
      votesRef,
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(recentQuery, (snapshot) => {
      const votes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RecentVote[];

      setRecentVotes(votes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'just now';
    
    const now = new Date();
    const voteTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now.getTime() - voteTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleTickerClick = (ticker: string) => {
    router.push(`/${ticker}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Community Activity</h3>
          <p className="text-sm text-gray-500">Latest analysis and votes from the community</p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Community Activity</h3>
        <p className="text-sm text-gray-500">Latest analysis and votes from the community</p>
      </div>
      <div className="p-6">
        {recentVotes.length > 0 ? (
          <div className="space-y-3">
            {recentVotes.map((vote) => (
              <div key={vote.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  {/* Vote Type Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    vote.voteType === 'growth' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {vote.voteType === 'growth' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Vote Description */}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      <span className="text-gray-600">Someone voted </span>
                      <span className={vote.voteType === 'growth' ? 'text-green-600' : 'text-red-600'}>
                        {vote.voteType}
                      </span>
                      <span className="text-gray-600"> on </span>
                      <button 
                        onClick={() => handleTickerClick(vote.ticker)}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {vote.ticker}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Based on financial fundamentals analysis
                    </div>
                  </div>
                </div>
                
                {/* Timestamp */}
                <div className="text-xs text-gray-500">
                  {formatTimeAgo(vote.timestamp)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h4>
            <p className="text-gray-600 mb-4">
              Be the first to vote on a stock based on financial fundamentals!
            </p>
            <button 
              onClick={() => router.push('/search')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Stocks to Analyze
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
