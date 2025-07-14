'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface UserCredibility {
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  score: number;
  accuracy: number;
  totalVotes: number;
  correctPredictions: number;
  streak: number;
  multiplier: number;
  badge: string;
  description: string;
}

interface PredictionOutcome {
  ticker: string;
  userVote: 'growth' | 'decline';
  actualOutcome: 'growth' | 'decline' | 'neutral';
  date: Date;
  isCorrect: boolean;
}

export default function UserCredibilitySystem() {
  const { user } = useAuth();
  const [credibility, setCredibility] = useState<UserCredibility | null>(null);
  const [recentOutcomes, setRecentOutcomes] = useState<PredictionOutcome[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const calculateCredibility = async () => {
      try {
        // Get user's votes
        const votesQuery = query(
          collection(db, 'votes'),
          where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(votesQuery, async (snapshot) => {
          const votes = snapshot.docs.map(doc => doc.data());
          
          // Calculate base stats
          const totalVotes = votes.length;
          
          // For demo purposes, simulate prediction accuracy
          // In a real app, this would compare against actual stock performance
          const simulatedAccuracy = Math.min(0.45 + (totalVotes * 0.02), 0.85);
          const correctPredictions = Math.floor(totalVotes * simulatedAccuracy);
          
          // Calculate current streak (simulated)
          const currentStreak = Math.floor(Math.random() * 8) + 1;
          
          // Calculate credibility score
          const baseScore = correctPredictions * 10;
          const accuracyBonus = simulatedAccuracy > 0.6 ? (simulatedAccuracy - 0.6) * 500 : 0;
          const streakBonus = currentStreak * 25;
          const volumeBonus = Math.min(totalVotes * 2, 200);
          
          const credibilityScore = baseScore + accuracyBonus + streakBonus + volumeBonus;
          
          // Determine level and multiplier
          let level: UserCredibility['level'];
          let multiplier: number;
          let badge: string;
          let description: string;
          
          if (credibilityScore >= 1000) {
            level = 'Diamond';
            multiplier = 3.0;
            badge = '💎';
            description = 'Elite analyst with exceptional accuracy';
          } else if (credibilityScore >= 750) {
            level = 'Platinum';
            multiplier = 2.5;
            badge = '🏆';
            description = 'Expert analyst with proven track record';
          } else if (credibilityScore >= 500) {
            level = 'Gold';
            multiplier = 2.0;
            badge = '🥇';
            description = 'Skilled analyst with good accuracy';
          } else if (credibilityScore >= 250) {
            level = 'Silver';
            multiplier = 1.5;
            badge = '🥈';
            description = 'Experienced analyst building credibility';
          } else {
            level = 'Bronze';
            multiplier = 1.0;
            badge = '🥉';
            description = 'New analyst learning the market';
          }
          
          const credibilityData: UserCredibility = {
            level,
            score: credibilityScore,
            accuracy: simulatedAccuracy,
            totalVotes,
            correctPredictions,
            streak: currentStreak,
            multiplier,
            badge,
            description
          };
          
          setCredibility(credibilityData);
          
          // Update user's credibility in Firestore
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            credibility: credibilityData,
            lastCredibilityUpdate: new Date()
          });
          
          // Generate recent outcomes for display
          const recentOutcomesData: PredictionOutcome[] = votes
            .slice(-5)
            .map(vote => ({
              ticker: vote.ticker,
              userVote: vote.voteType,
              actualOutcome: Math.random() > 0.4 ? vote.voteType : (vote.voteType === 'growth' ? 'decline' : 'growth'),
              date: vote.timestamp?.toDate ? vote.timestamp.toDate() : new Date(vote.timestamp),
              isCorrect: Math.random() > 0.45
            }));
          
          setRecentOutcomes(recentOutcomesData);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error calculating credibility:', error);
        setLoading(false);
      }
    };

    calculateCredibility();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!credibility) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Build Your Credibility</h3>
          <p className="text-gray-600">Start voting on stocks to build your analyst credibility score</p>
        </div>
      </div>
    );
  }

  const getLevelColor = (level: UserCredibility['level']) => {
    switch (level) {
      case 'Diamond': return 'from-purple-500 to-pink-500';
      case 'Platinum': return 'from-gray-400 to-gray-600';
      case 'Gold': return 'from-yellow-400 to-yellow-600';
      case 'Silver': return 'from-gray-300 to-gray-500';
      case 'Bronze': return 'from-orange-400 to-orange-600';
      default: return 'from-gray-300 to-gray-500';
    }
  };

  const getNextLevel = (currentLevel: UserCredibility['level']) => {
    const levels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  };

  const getScoreForNextLevel = (currentLevel: UserCredibility['level']) => {
    switch (currentLevel) {
      case 'Bronze': return 250;
      case 'Silver': return 500;
      case 'Gold': return 750;
      case 'Platinum': return 1000;
      case 'Diamond': return 1000;
      default: return 250;
    }
  };

  const nextLevel = getNextLevel(credibility.level);
  const nextLevelScore = getScoreForNextLevel(credibility.level);
  const progressPercentage = nextLevel ? (credibility.score / nextLevelScore) * 100 : 100;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Your Credibility Score</h3>
        <p className="text-sm text-gray-500">Your vote weight is multiplied by {credibility.multiplier}x</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Level Badge */}
        <div className="text-center">
          <div className={`inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${getLevelColor(credibility.level)} text-white font-bold text-lg mb-2`}>
            <span className="mr-2 text-2xl">{credibility.badge}</span>
            {credibility.level} Analyst
          </div>
          <p className="text-gray-600 text-sm">{credibility.description}</p>
        </div>

        {/* Score and Progress */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{credibility.score.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mb-4">Credibility Points</div>
          
          {nextLevel && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{credibility.level}</span>
                <span>{nextLevel}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${getLevelColor(credibility.level)}`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {nextLevelScore - credibility.score} points to {nextLevel}
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{(credibility.accuracy * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{credibility.totalVotes}</div>
            <div className="text-sm text-gray-600">Total Votes</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{credibility.correctPredictions}</div>
            <div className="text-sm text-gray-600">Correct</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{credibility.streak}</div>
            <div className="text-sm text-gray-600">Streak</div>
          </div>
        </div>

        {/* Recent Outcomes */}
        {recentOutcomes.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recent Predictions</h4>
            <div className="space-y-2">
              {recentOutcomes.map((outcome, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 mr-2">{outcome.ticker}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      outcome.userVote === 'growth' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {outcome.userVote}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">
                      {outcome.date.toLocaleDateString()}
                    </span>
                    <span className={`text-sm font-medium ${
                      outcome.isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {outcome.isCorrect ? '✅' : '❌'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How Credibility Works</h4>
          <p className="text-sm text-blue-800">
            Your credibility score is based on prediction accuracy, vote volume, and consistency. 
            Higher credibility gives your votes more weight in community rankings.
          </p>
        </div>
      </div>
    </div>
  );
}
