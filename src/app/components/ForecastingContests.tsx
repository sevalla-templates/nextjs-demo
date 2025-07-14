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
  isCorrect?: boolean; // Optional field, added when contest ends
}

interface UserRank {
  title: string;
  badge: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  description: string;
}

interface UserContestStats {
  totalPoints: number;
  correctPredictions: number;
  totalPredictions: number;
  rank: number;
  accuracy: number;
  currentRank: UserRank;
  nextRank: UserRank | null;
  progressToNext: number;
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

  // Define ranking system
  const userRanks: UserRank[] = [
    { title: 'Market Rookie', badge: '🌱', minPoints: 0, maxPoints: 499, color: 'from-green-400 to-green-600', description: 'Just starting your market journey' },
    { title: 'Casual Trader', badge: '📈', minPoints: 500, maxPoints: 999, color: 'from-blue-400 to-blue-600', description: 'Learning market patterns' },
    { title: 'Active Investor', badge: '💼', minPoints: 1000, maxPoints: 1999, color: 'from-purple-400 to-purple-600', description: 'Building investment experience' },
    { title: 'Market Strategist', badge: '🎯', minPoints: 2000, maxPoints: 3999, color: 'from-orange-400 to-orange-600', description: 'Developing strategic insights' },
    { title: 'Portfolio Expert', badge: '🏆', minPoints: 4000, maxPoints: 7999, color: 'from-yellow-400 to-yellow-600', description: 'Advanced market understanding' },
    { title: 'Market Specialist', badge: '⭐', minPoints: 8000, maxPoints: 15999, color: 'from-red-400 to-red-600', description: 'Expert-level market knowledge' },
    { title: 'Elite Predictor', badge: '🔥', minPoints: 16000, maxPoints: 31999, color: 'from-pink-400 to-pink-600', description: 'Exceptional forecasting ability' },
    { title: 'Market Legend', badge: '💎', minPoints: 32000, maxPoints: Infinity, color: 'from-indigo-400 to-indigo-600', description: 'Legendary market insight' }
  ];

  const getCurrentRank = (points: number): UserRank => {
    return userRanks.find(rank => points >= rank.minPoints && points <= rank.maxPoints) || userRanks[0];
  };

  const getNextRank = (currentRank: UserRank): UserRank | null => {
    const currentIndex = userRanks.indexOf(currentRank);
    return currentIndex < userRanks.length - 1 ? userRanks[currentIndex + 1] : null;
  };

  const getProgressToNext = (points: number, currentRank: UserRank, nextRank: UserRank | null): number => {
    if (!nextRank) return 100;
    const progress = ((points - currentRank.minPoints) / (nextRank.minPoints - currentRank.minPoints)) * 100;
    return Math.min(progress, 100);
  };

  // Check if financial data is available for a given quarter
  const checkQuarterDataAvailability = (quarter: number, year: number): boolean => {
    const now = new Date();
    
    // Calculate the typical earnings reporting deadline for each quarter
    // Q1 ends March 31, reports by May 15
    // Q2 ends June 30, reports by August 15  
    // Q3 ends September 30, reports by November 15
    // Q4 ends December 31, reports by March 15 (next year)
    
    const quarterEndDates = {
      1: new Date(year, 2, 31), // March 31
      2: new Date(year, 5, 30), // June 30
      3: new Date(year, 8, 30), // September 30
      4: new Date(year, 11, 31) // December 31
    };
    
    const reportingDeadlines = {
      1: new Date(year, 4, 15), // May 15
      2: new Date(year, 7, 15), // August 15
      3: new Date(year, 10, 15), // November 15
      4: new Date(year + 1, 2, 15) // March 15 (next year)
    };
    
    const quarterEndDate = quarterEndDates[quarter as keyof typeof quarterEndDates];
    const reportingDeadline = reportingDeadlines[quarter as keyof typeof reportingDeadlines];
    
    // If we haven't reached the quarter end date, predictions are allowed
    if (now < quarterEndDate) {
      return false;
    }
    
    // If we're past the reporting deadline, data should be available
    if (now > reportingDeadline) {
      return true;
    }
    
    // If we're between quarter end and reporting deadline, 
    // assume data is not yet available (most companies need time to report)
    return false;
  };

  useEffect(() => {
    // Initialize current contest
    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    const currentYear = now.getFullYear();
    
    // Check data availability for current and next quarter
    const currentQuarterHasData = checkQuarterDataAvailability(currentQuarter, currentYear);
    const nextQuarter = currentQuarter === 4 ? 1 : currentQuarter + 1;
    const nextYear = currentQuarter === 4 ? currentYear + 1 : currentYear;
    const nextQuarterHasData = checkQuarterDataAvailability(nextQuarter, nextYear);
    
    // Create demo contests - only allow predictions for quarters without data
    const demoContests: Contest[] = [];
    
    // Add current quarter contest only if data is NOT available
    if (!currentQuarterHasData) {
      demoContests.push({
        id: `q${currentQuarter}-${currentYear}`,
        quarter: `Q${currentQuarter}`,
        year: currentYear,
        status: 'active',
        startDate: new Date(currentYear, (currentQuarter - 1) * 3, 1),
        endDate: new Date(currentYear, currentQuarter * 3, 0),
        description: `Predict earnings and stock performance for Q${currentQuarter} ${currentYear}`,
        participantCount: Math.floor(Math.random() * 500) + 200
      });
    }
    
    // Add next quarter contest only if data is NOT available
    if (!nextQuarterHasData) {
      demoContests.push({
        id: `q${nextQuarter}-${nextYear}`,
        quarter: `Q${nextQuarter}`,
        year: nextYear,
        status: currentQuarterHasData ? 'active' : 'upcoming',
        startDate: new Date(nextYear, (nextQuarter - 1) * 3, 1),
        endDate: new Date(nextYear, nextQuarter * 3, 0),
        description: `Predict earnings and stock performance for Q${nextQuarter} ${nextYear}`,
        participantCount: 0
      });
    }
    
    // If no valid contests, add a future quarter
    if (demoContests.length === 0) {
      const futureQuarter = nextQuarter === 4 ? 1 : nextQuarter + 1;
      const futureYear = nextQuarter === 4 ? nextYear + 1 : nextYear;
      
      demoContests.push({
        id: `q${futureQuarter}-${futureYear}`,
        quarter: `Q${futureQuarter}`,
        year: futureYear,
        status: 'upcoming',
        startDate: new Date(futureYear, (futureQuarter - 1) * 3, 1),
        endDate: new Date(futureYear, futureQuarter * 3, 0),
        description: `Predict earnings and stock performance for Q${futureQuarter} ${futureYear}`,
        participantCount: 0
      });
    }

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
        const contestPredictions = predictions.filter(p => p.contestId === demoContests[0]?.id);
        const correctPredictions = contestPredictions.filter(p => p.isCorrect).length;
        const totalPredictions = contestPredictions.length;
        const totalPoints = contestPredictions.reduce((sum, p) => sum + p.points, 0);
        const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

        // Calculate ranking info
        const currentRank = getCurrentRank(totalPoints);
        const nextRank = getNextRank(currentRank);
        const progressToNext = getProgressToNext(totalPoints, currentRank, nextRank);

        setUserStats({
          totalPoints,
          correctPredictions,
          totalPredictions,
          rank: Math.floor(Math.random() * 50) + 1, // Demo rank
          accuracy,
          currentRank,
          nextRank,
          progressToNext
        });

        setLoading(false);
      });

      // Listen to all predictions to update participant counts
      const allPredictionsQuery = query(collection(db, 'predictions'));
      const unsubscribeAll = onSnapshot(allPredictionsQuery, (snapshot) => {
        const allPredictions = snapshot.docs.map(doc => doc.data());
        
        // Update participant counts for each contest
        const updatedContests = demoContests.map(contest => {
          const contestParticipants = new Set(
            allPredictions
              .filter(p => p.contestId === contest.id)
              .map(p => p.userId)
          );
          
          return {
            ...contest,
            participantCount: contestParticipants.size
          };
        });
        
        setContests(updatedContests);
        setActiveContest(updatedContests[0]);
      });

      return () => {
        unsubscribe();
        unsubscribeAll();
      };
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

    const prediction = {
      id: predictionId,
      userId: user.uid,
      contestId: activeContest.id,
      ticker: selectedTicker,
      predictionType,
      confidence,
      reasoning,
      timestamp: new Date(),
      points
      // isCorrect will be added when contest ends
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
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Forecasting Contests</h3>
          <p className="text-sm text-gray-500">Compete with other analysts in quarterly prediction challenges</p>
        </div>
      </div>

      <div className="p-6">
        {/* No Contests Available Message */}
        {contests.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Contests</h3>
            <p className="text-gray-500 mb-4">
              All current quarters have already reported their financial results.
              <br />
              New prediction contests will be available for upcoming quarters.
            </p>
            <div className="text-sm text-gray-400">
              Financial data is typically available 45-75 days after quarter end.
            </div>
          </div>
        )}

        {/* Contest Selection */}
        {contests.length > 0 && (
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
        )}

        {/* User Stats */}
        {userStats && contests.length > 0 && (
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

        {/* Current Rank Display */}
        {userStats && contests.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{userStats.currentRank.badge}</span>
                <div>
                  <h4 className="font-semibold text-indigo-900">{userStats.currentRank.title}</h4>
                  <p className="text-sm text-indigo-700">{userStats.currentRank.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-indigo-900">{userStats.totalPoints} pts</div>
                <div className="text-sm text-indigo-600">
                  {userStats.nextRank ? `${userStats.nextRank.minPoints - userStats.totalPoints} to next` : 'Max rank!'}
                </div>
              </div>
            </div>
            
            {userStats.nextRank && (
              <div>
                <div className="flex justify-between text-sm text-indigo-700 mb-1">
                  <span>{userStats.currentRank.title}</span>
                  <span>{userStats.nextRank.title}</span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${userStats.progressToNext}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Predictions */}
        {userPredictions.length > 0 && contests.length > 0 && (
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
