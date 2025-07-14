'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import companyTickers from '../../../data/company_tickers.json';

interface CompanyData {
  cik: string;
  title: string;
  sector?: string;
  industry?: string;
}

interface CommunityPrediction {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  userRank: string;
  userBadge: string;
  ticker: string;
  predictionType: 'earnings_beat' | 'earnings_miss' | 'revenue_beat' | 'revenue_miss' | 'price_up' | 'price_down';
  confidence: number;
  reasoning: string;
  targetPrice?: number;
  timeframe: string;
  timestamp: Date;
  likes: number;
  replies: number;
  contestId?: string;
  quarter?: string;
  year?: number;
  isCorrect?: boolean;
  points: number;
  tags: string[];
}

interface PredictionComment {
  id: string;
  predictionId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  comment: string;
  timestamp: Date;
  likes: number;
}

interface PredictionStats {
  totalPredictions: number;
  bullishPredictions: number;
  bearishPredictions: number;
  averageConfidence: number;
  topPredictors: Array<{
    userId: string;
    userName: string;
    userPhoto: string;
    accuracy: number;
    predictionCount: number;
  }>;
}

export default function CommunityPredictionsPage() {
  const { ticker } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [predictions, setPredictions] = useState<CommunityPrediction[]>([]);
  const [comments, setComments] = useState<Record<string, PredictionComment[]>>({});
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'confidence' | 'likes'>('newest');
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!ticker) return;

    const tickerSymbol = (ticker as string).toUpperCase();
    const companyData = companyTickers[tickerSymbol as keyof typeof companyTickers] as CompanyData;
    
    if (!companyData) {
      router.push('/search');
      return;
    }
    
    setCompany(companyData);

    // Load predictions - modify query to avoid composite index
    const predictionsQuery = query(
      collection(db, 'predictions'),
      where('ticker', '==', tickerSymbol),
      limit(100)
    );

    const unsubscribePredictions = onSnapshot(predictionsQuery, async (snapshot) => {
      const predictionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as CommunityPrediction[];

      // Sort by timestamp on client side
      const sortedPredictions = predictionData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Enrich with user data (in real app, this would be optimized)
      const enrichedPredictions = await Promise.all(
        sortedPredictions.map(async (prediction) => {
          // In a real app, you'd fetch user data from a users collection
          return {
            ...prediction,
            userName: prediction.userName || 'Anonymous User',
            userPhoto: prediction.userPhoto || '/default-avatar.png',
            userRank: 'Market Analyst',
            userBadge: '📊',
            likes: prediction.likes || 0,
            replies: prediction.replies || 0,
            tags: prediction.tags || []
          };
        })
      );

      setPredictions(enrichedPredictions);
      
      // Calculate stats
      const totalPredictions = enrichedPredictions.length;
      const bullishPredictions = enrichedPredictions.filter(p => 
        ['earnings_beat', 'revenue_beat', 'price_up'].includes(p.predictionType)
      ).length;
      const bearishPredictions = totalPredictions - bullishPredictions;
      const averageConfidence = totalPredictions > 0 
        ? enrichedPredictions.reduce((sum, p) => sum + p.confidence, 0) / totalPredictions 
        : 0;

      setStats({
        totalPredictions,
        bullishPredictions,
        bearishPredictions,
        averageConfidence,
        topPredictors: [] // Would be calculated from user data
      });

      setLoading(false);
    });

    // Load comments for each prediction
    const commentsQuery = query(
      collection(db, 'predictionComments'),
      where('ticker', '==', tickerSymbol),
      limit(200)
    );

    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as PredictionComment[];

      // Sort comments by timestamp on client side
      const sortedComments = commentsData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Group comments by prediction ID
      const groupedComments = sortedComments.reduce((acc, comment) => {
        if (!acc[comment.predictionId]) {
          acc[comment.predictionId] = [];
        }
        acc[comment.predictionId].push(comment);
        return acc;
      }, {} as Record<string, PredictionComment[]>);

      setComments(groupedComments);
    });

    return () => {
      unsubscribePredictions();
      unsubscribeComments();
    };
  }, [ticker, router]);

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

  const getPredictionTypeColor = (type: string) => {
    switch (type) {
      case 'earnings_beat':
      case 'revenue_beat':
      case 'price_up':
        return 'bg-green-100 text-green-800';
      case 'earnings_miss':
      case 'revenue_miss':
      case 'price_down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultBadge = (isCorrect?: boolean) => {
    if (isCorrect === undefined) return <span className="text-gray-500 text-sm">Pending</span>;
    return isCorrect ? 
      <span className="text-green-600 font-semibold text-sm">✓ Correct</span> : 
      <span className="text-red-600 font-semibold text-sm">✗ Incorrect</span>;
  };

  const handleLikePrediction = async (predictionId: string) => {
    if (!user) return;
    
    try {
      const predictionRef = doc(db, 'predictions', predictionId);
      await updateDoc(predictionRef, {
        likes: increment(1)
      });
      
      // Also track user's like (in real app, prevent duplicate likes)
      await addDoc(collection(db, 'predictionLikes'), {
        predictionId,
        userId: user.uid,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error liking prediction:', error);
    }
  };

  const handleAddComment = async (predictionId: string) => {
    if (!user || !newComment[predictionId]?.trim()) return;
    
    try {
      await addDoc(collection(db, 'predictionComments'), {
        predictionId,
        ticker: ticker,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhoto: user.photoURL || '',
        comment: newComment[predictionId].trim(),
        timestamp: serverTimestamp(),
        likes: 0
      });

      // Update replies count
      const predictionRef = doc(db, 'predictions', predictionId);
      await updateDoc(predictionRef, {
        replies: increment(1)
      });

      setNewComment(prev => ({ ...prev, [predictionId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const toggleComments = (predictionId: string) => {
    setShowComments(prev => ({
      ...prev,
      [predictionId]: !prev[predictionId]
    }));
  };

  const filteredPredictions = predictions.filter(prediction => {
    if (filter === 'all') return true;
    if (filter === 'bullish') {
      return ['earnings_beat', 'revenue_beat', 'price_up'].includes(prediction.predictionType);
    }
    if (filter === 'bearish') {
      return ['earnings_miss', 'revenue_miss', 'price_down'].includes(prediction.predictionType);
    }
    return true;
  });

  const sortedPredictions = [...filteredPredictions].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.timestamp.getTime() - a.timestamp.getTime();
      case 'confidence':
        return b.confidence - a.confidence;
      case 'likes':
        return b.likes - a.likes;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading community predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {ticker} Community Predictions
              </h1>
              <p className="text-gray-600 mt-2">
                {company?.title} - See what the community is predicting
              </p>
            </div>
            <button
              onClick={() => router.push(`/${ticker}/predictions`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Make Prediction
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Community Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalPredictions}</div>
                <div className="text-sm text-gray-600">Total Predictions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.bullishPredictions}</div>
                <div className="text-sm text-gray-600">Bullish</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.bearishPredictions}</div>
                <div className="text-sm text-gray-600">Bearish</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.averageConfidence.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Avg Confidence</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Filter:</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Predictions</option>
                  <option value="bullish">Bullish Only</option>
                  <option value="bearish">Bearish Only</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="confidence">Highest Confidence</option>
                  <option value="likes">Most Liked</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {sortedPredictions.length} of {predictions.length} predictions
            </div>
          </div>
        </div>

        {/* Predictions List */}
        <div className="space-y-6">
          {sortedPredictions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">🔮</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No predictions yet</h3>
              <p className="text-gray-600">Be the first to make a prediction for {ticker}!</p>
            </div>
          ) : (
            sortedPredictions.map((prediction) => (
              <div key={prediction.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => router.push(`/profile/${prediction.userId}`)}
                      className="flex-shrink-0"
                    >
                      <img
                        src={prediction.userPhoto}
                        alt={prediction.userName}
                        className="w-12 h-12 rounded-full"
                      />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => router.push(`/profile/${prediction.userId}`)}
                            className="font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {prediction.userName}
                          </button>
                          <span className="text-lg">{prediction.userBadge}</span>
                          <span className="text-sm text-gray-500">{prediction.userRank}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">
                            {prediction.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getPredictionTypeColor(prediction.predictionType)}`}>
                            {getPredictionTypeLabel(prediction.predictionType)}
                          </span>
                          {getResultBadge(prediction.isCorrect)}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center space-x-4 mb-2">
                          <span className="text-sm text-gray-600">
                            Confidence: <span className="font-semibold">{prediction.confidence}%</span>
                          </span>
                          <span className="text-sm text-gray-600">
                            Points: <span className="font-semibold text-purple-600">{prediction.points}</span>
                          </span>
                          {prediction.timeframe && (
                            <span className="text-sm text-gray-600">
                              Timeframe: <span className="font-semibold">{prediction.timeframe}</span>
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-700 leading-relaxed">{prediction.reasoning}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleLikePrediction(prediction.id)}
                            className="flex items-center space-x-1 text-gray-500 hover:text-blue-600"
                          >
                            <span>👍</span>
                            <span className="text-sm">{prediction.likes}</span>
                          </button>
                          
                          <button
                            onClick={() => toggleComments(prediction.id)}
                            className="flex items-center space-x-1 text-gray-500 hover:text-blue-600"
                          >
                            <span>💬</span>
                            <span className="text-sm">{prediction.replies}</span>
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {prediction.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Comments Section */}
                {showComments[prediction.id] && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="space-y-3">
                      {comments[prediction.id]?.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <img
                            src={comment.userPhoto}
                            alt={comment.userName}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 text-sm">{comment.userName}</span>
                              <span className="text-xs text-gray-500">
                                {comment.timestamp.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm mt-1">{comment.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {user && (
                      <div className="mt-4 flex space-x-3">
                        <img
                          src={user.photoURL || '/default-avatar.png'}
                          alt={user.displayName || 'You'}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 flex space-x-2">
                          <input
                            type="text"
                            value={newComment[prediction.id] || ''}
                            onChange={(e) => setNewComment(prev => ({ ...prev, [prediction.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(prediction.id);
                              }
                            }}
                            placeholder="Add a comment..."
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleAddComment(prediction.id)}
                            disabled={!newComment[prediction.id]?.trim()}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
