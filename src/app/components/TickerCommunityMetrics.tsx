'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

interface TickerCommunityData {
  growthVotes: number;
  declineVotes: number;
  netScore: number;
  totalVoters: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  communityRank: number;
  sectorRank: number;
  recentActivity: {
    todayVotes: number;
    weekVotes: number;
  };
}

interface TickerCommunityMetricsProps {
  ticker: string;
  sector?: string;
}

export default function TickerCommunityMetrics({ ticker, sector }: TickerCommunityMetricsProps) {
  const [communityData, setCommunityData] = useState<TickerCommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const votesRef = collection(db, 'votes');
    const tickerQuery = query(votesRef, where('ticker', '==', ticker));
    
    const unsubscribe = onSnapshot(tickerQuery, (snapshot) => {
      const votes = snapshot.docs.map(doc => doc.data());
      
      if (votes.length === 0) {
        setCommunityData({
          growthVotes: 0,
          declineVotes: 0,
          netScore: 0,
          totalVoters: 0,
          sentiment: 'neutral',
          communityRank: 0,
          sectorRank: 0,
          recentActivity: {
            todayVotes: 0,
            weekVotes: 0
          }
        });
        setLoading(false);
        return;
      }

      // Calculate basic metrics
      const growthVotes = votes.filter(v => v.voteType === 'growth').length;
      const declineVotes = votes.filter(v => v.voteType === 'decline').length;
      const netScore = growthVotes - declineVotes;
      const totalVoters = new Set(votes.map(v => v.userId)).size;

      // Calculate sentiment
      let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (netScore > 2) sentiment = 'bullish';
      else if (netScore < -2) sentiment = 'bearish';

      // Calculate recent activity
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const todayVotes = votes.filter(v => {
        const voteDate = v.timestamp?.toDate ? v.timestamp.toDate() : new Date(v.timestamp);
        return voteDate >= today;
      }).length;

      const weekVotes = votes.filter(v => {
        const voteDate = v.timestamp?.toDate ? v.timestamp.toDate() : new Date(v.timestamp);
        return voteDate >= weekAgo;
      }).length;

      setCommunityData({
        growthVotes,
        declineVotes,
        netScore,
        totalVoters,
        sentiment,
        communityRank: Math.floor(Math.random() * 100) + 1, // Demo ranking
        sectorRank: Math.floor(Math.random() * 50) + 1, // Demo sector ranking
        recentActivity: {
          todayVotes,
          weekVotes
        }
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, [ticker]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600 bg-green-100';
      case 'bearish': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return '📈';
      case 'bearish': return '📉';
      default: return '➖';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!communityData) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Community Sentiment */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">Community Sentiment</h3>
          <span className="text-lg">{getSentimentIcon(communityData.sentiment)}</span>
        </div>
        <div className="flex items-center">
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${getSentimentColor(communityData.sentiment)}`}>
            {communityData.sentiment.charAt(0).toUpperCase() + communityData.sentiment.slice(1)}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Net Score: {communityData.netScore > 0 ? '+' : ''}{communityData.netScore}
        </div>
      </div>

      {/* Vote Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Community Votes</h3>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-green-600 text-sm">Growth</span>
            <span className="font-semibold text-green-600">{communityData.growthVotes}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-600 text-sm">Decline</span>
            <span className="font-semibold text-red-600">{communityData.declineVotes}</span>
          </div>
          <div className="flex justify-between pt-1 border-t">
            <span className="text-gray-600 text-sm">Analysts</span>
            <span className="font-semibold">{communityData.totalVoters}</span>
          </div>
        </div>
      </div>

      {/* Community Rankings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Rankings</h3>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Overall</span>
            <span className="font-semibold">#{communityData.communityRank}</span>
          </div>
          {sector && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{sector}</span>
              <span className="font-semibold">#{communityData.sectorRank}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Activity</h3>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Today</span>
            <span className="font-semibold">{communityData.recentActivity.todayVotes}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">This Week</span>
            <span className="font-semibold">{communityData.recentActivity.weekVotes}</span>
          </div>
        </div>
        <button
          onClick={() => router.push(`/${ticker}/predictions`)}
          className="mt-3 w-full bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          📊 Make Predictions
        </button>
      </div>
    </div>
  );
}
