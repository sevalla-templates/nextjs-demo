'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, setDoc, deleteDoc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface VoteButtonProps {
  ticker: string;
  type: 'growth' | 'decline';
  showCount?: boolean;
  className?: string;
}

interface Vote {
  id: string;
  userId: string;
  ticker: string;
  voteType: 'growth' | 'decline';
  timestamp: Date;
  credibilityWeight: number;
}

export default function VoteButton({ ticker, type, showCount = true, className = '' }: VoteButtonProps) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<'growth' | 'decline' | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Listen to user's current vote for this ticker
  useEffect(() => {
    if (!user || !ticker) return;

    const checkUserVote = async () => {
      try {
        const voteRef = doc(db, 'votes', `${user.uid}_${ticker}`);
        const voteDoc = await getDoc(voteRef);
        
        if (voteDoc.exists()) {
          const voteData = voteDoc.data();
          setUserVote(voteData.voteType);
        } else {
          setUserVote(null);
        }
      } catch (error) {
        console.error('Error checking user vote:', error);
      }
    };

    checkUserVote();
  }, [user, ticker]);

  // Listen to vote count for this ticker and type
  useEffect(() => {
    if (!ticker || !showCount) return;

    const votesRef = collection(db, 'votes');
    const q = query(
      votesRef,
      where('ticker', '==', ticker),
      where('voteType', '==', type)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVoteCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [ticker, type, showCount]);

  const handleVote = async () => {
    if (!user || loading) return;

    // Prevent clicking if user already voted for the opposite type
    if (isOppositeActive) return;

    setLoading(true);

    try {
      const voteId = `${user.uid}_${ticker}`;
      const voteRef = doc(db, 'votes', voteId);

      // If user already voted for this type, remove the vote
      if (userVote === type) {
        await deleteDoc(voteRef);
        setUserVote(null);
      } else {
        // If no vote exists, set new vote
        const voteData = {
          userId: user.uid,
          ticker: ticker.toUpperCase(),
          voteType: type,
          timestamp: new Date(),
          credibilityWeight: 1, // Start with base weight
        };

        await setDoc(voteRef, voteData);
        setUserVote(type);
      }
    } catch (error) {
      console.error('Error handling vote:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Don't show buttons for non-authenticated users
  }

  const isActive = userVote === type;
  const isOppositeActive = Boolean(userVote && userVote !== type);

  const baseClasses = "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const typeClasses = type === 'growth' 
    ? {
        active: "bg-green-600 text-white shadow-lg scale-105",
        inactive: "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300",
        disabled: "bg-gray-100 text-gray-400 border border-gray-200 pointer-events-none cursor-not-allowed"
      }
    : {
        active: "bg-red-600 text-white shadow-lg scale-105", 
        inactive: "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300",
        disabled: "bg-gray-100 text-gray-400 border border-gray-200 pointer-events-none cursor-not-allowed"
      };

  const buttonClass = isActive 
    ? typeClasses.active 
    : isOppositeActive 
    ? typeClasses.disabled 
    : typeClasses.inactive;

  const icon = type === 'growth' 
    ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );

  return (
    <button
      onClick={handleVote}
      disabled={loading || isOppositeActive}
      className={`${baseClasses} ${buttonClass} ${className}`}
      title={
        isActive 
          ? `Remove ${type} vote` 
          : isOppositeActive 
          ? `You've already voted ${userVote}` 
          : `Vote ${type}`
      }
    >
      {loading ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      
      <span className="capitalize">
        {isActive ? `✓ ${type}` : type}
      </span>
      
      {showCount && voteCount > 0 && (
        <span className={`text-xs px-2 py-1 rounded-full ${
          isActive 
            ? 'bg-white/20 text-white' 
            : type === 'growth' 
            ? 'bg-green-200 text-green-800' 
            : 'bg-red-200 text-red-800'
        }`}>
          {voteCount}
        </span>
      )}
    </button>
  );
}
