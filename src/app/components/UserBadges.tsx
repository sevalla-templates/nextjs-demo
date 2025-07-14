'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface UserStats {
  totalVotes: number;
  growthVotes: number;
  declineVotes: number;
  uniqueStocks: number;
  firstVoteDate: Date | null;
  badges: string[];
}

import React from 'react';

export default function UserBadges() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalVotes: 0,
    growthVotes: 0,
    declineVotes: 0,
    uniqueStocks: 0,
    firstVoteDate: null,
    badges: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const votesRef = collection(db, 'votes');
    const userVotesQuery = query(
      votesRef,
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(userVotesQuery, (snapshot) => {
      const votes = snapshot.docs.map(doc => doc.data());
      
      const growthVotes = votes.filter(vote => vote.voteType === 'growth').length;
      const declineVotes = votes.filter(vote => vote.voteType === 'decline').length;
      const uniqueStocks = new Set(votes.map(vote => vote.ticker)).size;
      
      // Find first vote date
      const dates = votes.map(vote => vote.timestamp).filter(Boolean);
      const firstVoteDate = dates.length > 0 
        ? new Date(Math.min(...dates.map(d => d.toDate ? d.toDate().getTime() : new Date(d).getTime())))
        : null;

      // Calculate badges
      const badges = calculateBadges({
        totalVotes: votes.length,
        growthVotes,
        declineVotes,
        uniqueStocks,
        firstVoteDate
      });

      setStats({
        totalVotes: votes.length,
        growthVotes,
        declineVotes,
        uniqueStocks,
        firstVoteDate,
        badges
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const calculateBadges = (userStats: Omit<UserStats, 'badges'>): string[] => {
    const badges: string[] = [];

    // First Vote Badge
    if (userStats.totalVotes >= 1) {
      badges.push('First Vote');
    }

    // Vote Count Badges
    if (userStats.totalVotes >= 5) {
      badges.push('Active Analyst');
    }
    if (userStats.totalVotes >= 15) {
      badges.push('Dedicated Voter');
    }
    if (userStats.totalVotes >= 50) {
      badges.push('Market Expert');
    }

    // Diversity Badges
    if (userStats.uniqueStocks >= 5) {
      badges.push('Stock Explorer');
    }
    if (userStats.uniqueStocks >= 15) {
      badges.push('Portfolio Analyst');
    }

    // Specialization Badges
    if (userStats.growthVotes >= 10 && userStats.declineVotes <= 2) {
      badges.push('Growth Specialist');
    }
    if (userStats.declineVotes >= 10 && userStats.growthVotes <= 2) {
      badges.push('Decline Expert');
    }

    // Balanced Badges
    if (userStats.growthVotes >= 5 && userStats.declineVotes >= 5) {
      badges.push('Balanced Analyst');
    }

    // Early Adopter (if voting within first week of platform)
    if (userStats.firstVoteDate) {
      const platformLaunch = new Date('2025-07-14'); // Today's date as launch
      const daysSinceLaunch = Math.floor((userStats.firstVoteDate.getTime() - platformLaunch.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLaunch <= 7) {
        badges.push('Early Adopter');
      }
    }

    return badges;
  };

  const getBadgeColor = (badge: string): string => {
    const colors: { [key: string]: string } = {
      'First Vote': 'bg-blue-100 text-blue-800',
      'Active Analyst': 'bg-green-100 text-green-800',
      'Dedicated Voter': 'bg-purple-100 text-purple-800',
      'Market Expert': 'bg-yellow-100 text-yellow-800',
      'Stock Explorer': 'bg-indigo-100 text-indigo-800',
      'Portfolio Analyst': 'bg-pink-100 text-pink-800',
      'Growth Specialist': 'bg-emerald-100 text-emerald-800',
      'Decline Expert': 'bg-red-100 text-red-800',
      'Balanced Analyst': 'bg-gray-100 text-gray-800',
      'Early Adopter': 'bg-orange-100 text-orange-800'
    };
    return colors[badge] || 'bg-gray-100 text-gray-800';
  };

  const getBadgeIcon = (badge: string): React.ReactElement => {
    const icons: { [key: string]: React.ReactElement } = {
      'First Vote': (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'Active Analyst': (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      'Early Adopter': (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    };
    
    return icons[badge] || (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Analysis Stats</h3>
        <div className="text-sm text-gray-500">
          {stats.totalVotes} total votes
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.growthVotes}</div>
          <div className="text-sm text-gray-600">Growth Votes</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{stats.declineVotes}</div>
          <div className="text-sm text-gray-600">Decline Votes</div>
        </div>
      </div>

      <div className="text-center p-3 bg-blue-50 rounded-lg mb-6">
        <div className="text-xl font-bold text-blue-600">{stats.uniqueStocks}</div>
        <div className="text-sm text-gray-600">Stocks Analyzed</div>
      </div>

      {/* Badges */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Achievements</h4>
        {stats.badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {stats.badges.map((badge) => (
              <span
                key={badge}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(badge)}`}
              >
                {getBadgeIcon(badge)}
                {badge}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Vote on stocks to earn your first badge!
          </p>
        )}
      </div>
    </div>
  );
}
