'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { firestoreService } from '../../../lib/firestore';
import UserCredibilitySystem from '../../components/UserCredibilitySystem';

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  email: string;
  createdAt: any;
  subscription: {
    plan: 'free' | 'premium';
    status: 'active' | 'cancelled' | 'expired';
  };
}

interface UserPrediction {
  id: string;
  userId: string;
  ticker: string;
  predictionType: 'earnings_beat' | 'earnings_miss' | 'revenue_beat' | 'revenue_miss' | 'price_up' | 'price_down';
  confidence: number;
  reasoning: string;
  timestamp: Date;
  points: number;
  contestId?: string;
  isCorrect?: boolean;
  quarter?: string;
  year?: number;
}

interface UserStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  totalPoints: number;
  rank: number;
  credibilityLevel: string;
  badge: string;
  joinDate: Date;
  favoriteStock: string;
  totalVotes: number;
  growthVotes: number;
  declineVotes: number;
}

export default function UserProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [predictions, setPredictions] = useState<UserPrediction[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!userId) return;

    const loadUserProfile = async () => {
      try {
        // Load user profile
        const userProfile = await firestoreService.getUserProfile(userId as string);
        if (!userProfile) {
          router.push('/404');
          return;
        }
        setProfile(userProfile);

        // Load user predictions
        const predictionsQuery = query(
          collection(db, 'predictions'),
          where('userId', '==', userId),
          limit(50)
        );

        const unsubscribePredictions = onSnapshot(predictionsQuery, (snapshot) => {
          const userPredictions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date()
          })) as UserPrediction[];
          
          // Sort by timestamp on client side
          const sortedPredictions = userPredictions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setPredictions(sortedPredictions);
        });

        // Load user votes for stats
        const votesQuery = query(
          collection(db, 'votes'),
          where('userId', '==', userId)
        );

        const unsubscribeVotes = onSnapshot(votesQuery, (snapshot) => {
          const votes = snapshot.docs.map(doc => doc.data());
          const currentPredictions = predictions; // Use current predictions state
          
          // Calculate stats
          const totalVotes = votes.length;
          const growthVotes = votes.filter(v => v.voteType === 'growth').length;
          const declineVotes = votes.filter(v => v.voteType === 'decline').length;
          
          const correctPredictions = currentPredictions.filter(p => p.isCorrect === true).length;
          const totalPredictions = currentPredictions.length;
          const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;
          const totalPoints = currentPredictions.reduce((sum: number, p: UserPrediction) => sum + (p.points || 0), 0);
          
          // Find most predicted stock
          const tickerCounts = currentPredictions.reduce((acc: Record<string, number>, p: UserPrediction) => {
            acc[p.ticker] = (acc[p.ticker] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const favoriteStock = Object.entries(tickerCounts)
            .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A';

          setUserStats({
            totalPredictions,
            correctPredictions,
            accuracy,
            totalPoints,
            rank: Math.floor(Math.random() * 1000) + 1, // Demo rank
            credibilityLevel: 'Market Specialist',
            badge: '⭐',
            joinDate: userProfile.createdAt?.toDate ? userProfile.createdAt.toDate() : new Date(),
            favoriteStock,
            totalVotes,
            growthVotes,
            declineVotes
          });
        });

        setLoading(false);

        return () => {
          unsubscribePredictions();
          unsubscribeVotes();
        };
      } catch (error) {
        console.error('Error loading user profile:', error);
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId, router]);

  const getPredictionTypeLabel = (type: string) => {
    switch (type) {
      case 'earnings_beat': return 'Earnings Beat';
      case 'earnings_miss': return 'Earnings Miss';
      case 'revenue_beat': return 'Revenue Beat';
      case 'revenue_miss': return 'Revenue Miss';
      case 'price_up': return 'Price Up 10%+';
      case 'price_down': return 'Price Down 10%+';
      default: return type;
    }
  };

  const getResultBadge = (isCorrect?: boolean) => {
    if (isCorrect === undefined) return <span className="text-gray-500">Pending</span>;
    return isCorrect ? 
      <span className="text-green-600 font-semibold">✓ Correct</span> : 
      <span className="text-red-600 font-semibold">✗ Incorrect</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600">The user profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.uid === userId;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <img
                src={profile.photoURL || '/default-avatar.png'}
                alt={profile.displayName || 'User'}
                className="w-20 h-20 rounded-full mr-6"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.displayName || 'Anonymous User'}
                </h1>
                <p className="text-gray-600 mb-2">
                  {isOwnProfile ? 'Your Profile' : 'Market Analyst'}
                </p>
                {userStats && (
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{userStats.badge}</span>
                    <span className="font-semibold text-indigo-600">{userStats.credibilityLevel}</span>
                    <span className="text-sm text-gray-500">
                      Joined {userStats.joinDate.toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Stats Overview */}
          {userStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{userStats.totalPredictions}</div>
                <div className="text-sm text-gray-600">Predictions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{userStats.accuracy.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{userStats.totalPoints}</div>
                <div className="text-sm text-gray-600">Points</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">#{userStats.rank}</div>
                <div className="text-sm text-gray-600">Rank</div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('predictions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'predictions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Predictions ({predictions.length})
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Activity
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && userStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Detailed Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Predictions:</span>
                      <span className="font-semibold">{userStats.totalPredictions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Correct Predictions:</span>
                      <span className="font-semibold text-green-600">{userStats.correctPredictions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Accuracy Rate:</span>
                      <span className="font-semibold">{userStats.accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Points:</span>
                      <span className="font-semibold text-purple-600">{userStats.totalPoints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Community Rank:</span>
                      <span className="font-semibold">#{userStats.rank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Favorite Stock:</span>
                      <span className="font-semibold text-blue-600">{userStats.favoriteStock}</span>
                    </div>
                  </div>
                </div>

                {/* Voting Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Voting Activity</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Votes:</span>
                      <span className="font-semibold">{userStats.totalVotes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Growth Votes:</span>
                      <span className="font-semibold text-green-600">{userStats.growthVotes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Decline Votes:</span>
                      <span className="font-semibold text-red-600">{userStats.declineVotes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Voting Tendency:</span>
                      <span className="font-semibold">
                        {userStats.growthVotes > userStats.declineVotes ? 'Bullish 📈' : 'Bearish 📉'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'predictions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Prediction History</h3>
                  <div className="text-sm text-gray-500">
                    {predictions.length} predictions made
                  </div>
                </div>
                
                {predictions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No predictions made yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {predictions.map((prediction) => (
                      <div key={prediction.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold text-blue-600">{prediction.ticker}</span>
                            <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {getPredictionTypeLabel(prediction.predictionType)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {prediction.confidence}% confident
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-purple-600">
                              {prediction.points} pts
                            </span>
                            {getResultBadge(prediction.isCorrect)}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{prediction.reasoning}</p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            {prediction.timestamp.toLocaleDateString()} at {prediction.timestamp.toLocaleTimeString()}
                          </span>
                          {prediction.contestId && (
                            <span>Contest: {prediction.contestId}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <div className="space-y-3">
                  {predictions.slice(0, 10).map((prediction) => (
                    <div key={prediction.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">📊</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          Made a prediction for <span className="font-semibold text-blue-600">{prediction.ticker}</span>
                          {' '}({getPredictionTypeLabel(prediction.predictionType)})
                        </p>
                        <p className="text-xs text-gray-500">
                          {prediction.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Credibility System */}
        <UserCredibilitySystem />
      </div>
    </div>
  );
}
