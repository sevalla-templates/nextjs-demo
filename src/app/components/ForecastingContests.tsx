'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import companyTickers from '../../data/company_tickers.json';

interface Contest {
  id: string;
  quarter: string;
  year: number;
  status: 'active' | 'ended' | 'upcoming';
  endDate: Date;
  startDate: Date;
  description: string;
  prizes: string[];
  participantCount: number;
}

interface Prediction {
  id: string;
  userId: string;
  contestId: string;
  ticker: string;
  predictionType: 'earnings_beat' | 'earnings_miss' | 'revenue_beat' | 'revenue_miss' | 'price_up' | 'price_down';
  confidence: number;
  reasoning: string;
  timestamp: Date;
  points: number;
  isCorrect?: boolean;
}

interface UserContestStats {
  totalPoints: number;
  correctPredictions: number;
  totalPredictions: number;
  rank: number;
  accuracy: number;
}

export default function ForecastingContests() {
  const { user } = useAuth();
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [activeContest, setActiveContest] = useState<Contest | null>(null);
  const [userStats, setUserStats] = useState<UserContestStats | null>(null);
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPredictionForm, setShowPredictionForm] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState('');
  const [predictionType, setPredictionType] = useState<Prediction['predictionType']>('earnings_beat');
  const [confidence, setConfidence] = useState(50);
  const [reasoning, setReasoning] = useState('');

  useEffect(() => {
    // Initialize current contest
    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    const currentYear = now.getFullYear();
    
    // Create demo contests
    const demoContests: Contest[] = [
      {
        id: `q${currentQuarter}-${currentYear}`,
        quarter: `Q${currentQuarter}`,
        year: currentYear,
        status: 'active',
        startDate: new Date(currentYear, (currentQuarter - 1) * 3, 1),
        endDate: new Date(currentYear, currentQuarter * 3, 0),
        description: `Predict earnings and stock performance for Q${currentQuarter} ${currentYear}`,
        prizes: ['$500 Amazon Gift Card', '$300 Stock Trading Credit', '$200 Investment Course'],
        participantCount: Math.floor(Math.random() * 500) + 200
      },
      {
        id: `q${currentQuarter + 1}-${currentYear}`,
        quarter: `Q${currentQuarter + 1}`,
        year: currentYear,
        status: 'upcoming',
        startDate: new Date(currentYear, currentQuarter * 3, 1),
        endDate: new Date(currentYear, (currentQuarter + 1) * 3, 0),
        description: `Predict earnings and stock performance for Q${currentQuarter + 1} ${currentYear}`,
        prizes: ['$500 Amazon Gift Card', '$300 Stock Trading Credit', '$200 Investment Course'],
        participantCount: 0
      }
    ];

    setContests(demoContests);
    setActiveContest(demoContests[0]);

    if (user) {
      // Listen to user's predictions
      const predictionsQuery = query(
        collection(db, 'predictions'),
        where('userId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(predictionsQuery, (snapshot) => {
        const predictions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        })) as Prediction[];

        setUserPredictions(predictions);

        // Calculate user stats
        const contestPredictions = predictions.filter(p => p.contestId === demoContests[0].id);
        const correctPredictions = contestPredictions.filter(p => p.isCorrect).length;
        const totalPredictions = contestPredictions.length;
        const totalPoints = contestPredictions.reduce((sum, p) => sum + p.points, 0);
        const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

        setUserStats({
          totalPoints,
          correctPredictions,
          totalPredictions,
          rank: Math.floor(Math.random() * 50) + 1, // Demo rank
          accuracy
        });

        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSubmitPrediction = async () => {
    if (!user || !activeContest || !selectedTicker || !reasoning.trim()) return;

    const predictionId = `${user.uid}_${activeContest.id}_${selectedTicker}_${Date.now()}`;
    
    // Calculate points based on confidence
    const basePoints = 100;
    const confidenceMultiplier = confidence / 100;
    const points = Math.round(basePoints * confidenceMultiplier);

    const prediction: Prediction = {
      id: predictionId,
      userId: user.uid,
      contestId: activeContest.id,
      ticker: selectedTicker,
      predictionType,
      confidence,
      reasoning,
      timestamp: new Date(),
      points,
      isCorrect: undefined // Will be determined when contest ends
    };

    try {
      await setDoc(doc(db, 'predictions', predictionId), prediction);
      
      // Reset form
      setSelectedTicker('');
      setReasoning('');
      setConfidence(50);
      setShowPredictionForm(false);
    } catch (error) {
      console.error('Error submitting prediction:', error);
    }
  };

  const getPredictionTypeLabel = (type: Prediction['predictionType']) => {
    switch (type) {
      case 'earnings_beat': return 'Earnings Beat';
      case 'earnings_miss': return 'Earnings Miss';
      case 'revenue_beat': return 'Revenue Beat';
      case 'revenue_miss': return 'Revenue Miss';
      case 'price_up': return 'Stock Price Up';
      case 'price_down': return 'Stock Price Down';
      default: return type;
    }
  };

  const getStatusColor = (status: Contest['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
            <h3 className="text-lg font-semibold text-gray-900">Forecasting Contests</h3>
            <p className="text-sm text-gray-500">Compete with other analysts in quarterly prediction challenges</p>
          </div>
          <button
            onClick={() => setShowPredictionForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Make Prediction
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Contest Selection */}
        <div className="mb-6">
          <div className="flex space-x-4">
            {contests.map((contest) => (
              <button
                key={contest.id}
                onClick={() => setActiveContest(contest)}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  activeContest?.id === contest.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{contest.quarter} {contest.year}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contest.status)}`}>
                    {contest.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{contest.description}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Ends: {formatDate(contest.endDate)}</span>
                  <span>{contest.participantCount} participants</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User Stats */}
        {userStats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">#{userStats.rank}</div>
              <div className="text-sm text-gray-600">Rank</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{userStats.totalPoints}</div>
              <div className="text-sm text-gray-600">Points</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{userStats.accuracy.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{userStats.totalPredictions}</div>
              <div className="text-sm text-gray-600">Predictions</div>
            </div>
          </div>
        )}

        {/* Prize Pool */}
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2">🏆 Prize Pool</h4>
          <div className="grid grid-cols-3 gap-4">
            {activeContest?.prizes.map((prize, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl mb-1">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div className="text-sm font-medium text-yellow-800">{prize}</div>
              </div>
            ))}
          </div>
        </div>

        {/* User Predictions */}
        {userPredictions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Your Predictions</h4>
            <div className="space-y-3">
              {userPredictions
                .filter(p => p.contestId === activeContest?.id)
                .map((prediction) => (
                <div key={prediction.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 mr-2">{prediction.ticker}</span>
                      <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {getPredictionTypeLabel(prediction.predictionType)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{prediction.confidence}% confident</span>
                      <span className="text-sm font-medium text-blue-600">{prediction.points} pts</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{prediction.reasoning}</p>
                  <div className="text-xs text-gray-500">
                    Submitted {prediction.timestamp.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prediction Form Modal */}
        {showPredictionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Make a Prediction</h3>
                <button
                  onClick={() => setShowPredictionForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Stock Ticker Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Ticker</label>
                  <input
                    type="text"
                    value={selectedTicker}
                    onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
                    placeholder="e.g., AAPL"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Prediction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prediction Type</label>
                  <select
                    value={predictionType}
                    onChange={(e) => setPredictionType(e.target.value as Prediction['predictionType'])}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="earnings_beat">Earnings Beat</option>
                    <option value="earnings_miss">Earnings Miss</option>
                    <option value="revenue_beat">Revenue Beat</option>
                    <option value="revenue_miss">Revenue Miss</option>
                    <option value="price_up">Stock Price Up 10%+</option>
                    <option value="price_down">Stock Price Down 10%+</option>
                  </select>
                </div>

                {/* Confidence Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confidence: {confidence}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={confidence}
                    onChange={(e) => setConfidence(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Reasoning */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reasoning</label>
                  <textarea
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    placeholder="Explain your prediction..."
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Points Preview */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Potential Points:</strong> {Math.round(100 * (confidence / 100))}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Higher confidence = more points if correct, but bigger penalty if wrong
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitPrediction}
                  disabled={!selectedTicker || !reasoning.trim()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Prediction
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
