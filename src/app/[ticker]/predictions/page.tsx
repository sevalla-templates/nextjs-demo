'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import companyTickers from '../../../data/company_tickers.json';

interface CompanyData {
  cik: string;
  title: string;
  sector?: string;
  industry?: string;
}

interface Contest {
  id: string;
  quarter: string;
  year: number;
  status: 'active' | 'upcoming';
  endDate: Date;
  startDate: Date;
  description: string;
  participantCount: number;
}

interface Prediction {
  id: string;
  userId: string;
  contestId?: string;
  ticker: string;
  predictionType: 'earnings_beat' | 'earnings_miss' | 'revenue_beat' | 'revenue_miss' | 'price_up' | 'price_down';
  confidence: number;
  reasoning: string;
  timestamp: Date;
  points: number;
  isCorrect?: boolean;
}

export default function TickerPredictionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const ticker = (params.ticker as string)?.toUpperCase();
  
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [availableContests, setAvailableContests] = useState<Contest[]>([]);
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPredictionForm, setShowPredictionForm] = useState(false);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [predictionType, setPredictionType] = useState<Prediction['predictionType']>('earnings_beat');
  const [confidence, setConfidence] = useState(50);
  const [reasoning, setReasoning] = useState('');

  // Check if financial data exists for a specific quarter
  const checkDataAvailability = async (ticker: string, quarter: number, year: number): Promise<boolean> => {
    try {
      // Fetch the ticker's financial data to check if specific quarter exists
      const response = await fetch(`/api/tickers/${ticker.toUpperCase()}`);
      if (!response.ok) return false;
      
      const data = await response.json();
      
      // If no financial data is available at all, assume data is not available
      if (data.financialData !== 'available' || !data.metrics || data.metrics.length === 0) {
        return false;
      }
      
      // Check if we have data for the specific quarter
      const quarterKey = `${year}-Q${quarter}`;
      
      // Look through the financial metrics to see if we have data for this quarter
      const hasQuarterData = data.metrics.some((metric: any) => 
        metric.dataPoints && metric.dataPoints.some((point: any) => point.period === quarterKey)
      );
      
      if (hasQuarterData) {
        return true; // Data exists for this quarter
      }
      
      // If we don't have data for this quarter, check if we're past the typical reporting deadline
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12
      
      // Calculate when this quarter's data should be available
      // Q1 (Jan-Mar) -> reported by May 15
      // Q2 (Apr-Jun) -> reported by August 15  
      // Q3 (Jul-Sep) -> reported by November 15
      // Q4 (Oct-Dec) -> reported by March 15 of following year
      
      let reportingMonth: number;
      let reportingYear: number;
      
      switch (quarter) {
        case 1: // Q1
          reportingMonth = 5; // May
          reportingYear = year;
          break;
        case 2: // Q2
          reportingMonth = 8; // August
          reportingYear = year;
          break;
        case 3: // Q3
          reportingMonth = 11; // November
          reportingYear = year;
          break;
        case 4: // Q4
          reportingMonth = 3; // March
          reportingYear = year + 1;
          break;
        default:
          return false;
      }
      
      // Check if we're past the typical reporting deadline
      if (currentYear > reportingYear) return true;
      if (currentYear === reportingYear && currentMonth > reportingMonth) return true;
      if (currentYear === reportingYear && currentMonth === reportingMonth && now.getDate() > 15) return true;
      
      return false;
    } catch (error) {
      console.error('Error checking data availability:', error);
      return false;
    }
  };

  const generateAvailableContests = async (ticker: string): Promise<Contest[]> => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    
    const contests: Contest[] = [];
    
    // Check next 4 quarters for prediction opportunities
    for (let i = 0; i < 4; i++) {
      let quarter = currentQuarter + i;
      let year = currentYear;
      
      // Handle year rollover
      while (quarter > 4) {
        quarter -= 4;
        year += 1;
      }
      
      // Check if data is already available for this quarter
      const dataAvailable = await checkDataAvailability(ticker, quarter, year);
      
      if (!dataAvailable) {
        // Calculate contest dates
        const quarterEndMonth = quarter * 3; // 3, 6, 9, 12
        const startDate = new Date(year, (quarter - 1) * 3, 1); // Start of quarter
        const endDate = new Date(year, quarterEndMonth, 0); // End of quarter
        
        // Only include if contest hasn't ended yet
        if (endDate > now) {
          contests.push({
            id: `${ticker}_q${quarter}-${year}`,
            quarter: `Q${quarter}`,
            year: year,
            status: startDate <= now ? 'active' : 'upcoming',
            startDate,
            endDate,
            description: `Predict ${ticker} performance for Q${quarter} ${year}`,
            participantCount: 0
          });
        }
      }
    }
    
    return contests;
  };

  useEffect(() => {
    if (!ticker) {
      router.push('/search');
      return;
    }

    // Get company info
    const companyData = companyTickers[ticker as keyof typeof companyTickers] as CompanyData;
    if (!companyData) {
      router.push('/search');
      return;
    }
    
    setCompany(companyData);

    const initializeContests = async () => {
      try {
        setLoading(true);
        const contests = await generateAvailableContests(ticker);
        setAvailableContests(contests);
        
        if (user) {
          // Listen to user's predictions for this ticker
          const predictionsQuery = query(
            collection(db, 'predictions'),
            where('userId', '==', user.uid),
            where('ticker', '==', ticker)
          );

          const unsubscribe = onSnapshot(predictionsQuery, (snapshot) => {
            const predictions = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate() || new Date()
            })) as Prediction[];

            setUserPredictions(predictions);
            setLoading(false);
          });

          return () => unsubscribe();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing contests:', error);
        setLoading(false);
      }
    };

    initializeContests();
  }, [ticker, user, router]);

  const handleSubmitPrediction = async () => {
    if (!user || !selectedContest || !reasoning.trim()) return;

    const predictionId = `${user.uid}_${selectedContest.id}_${Date.now()}`;
    
    const basePoints = 100;
    const confidenceMultiplier = confidence / 100;
    const points = Math.round(basePoints * confidenceMultiplier);

    const prediction = {
      id: predictionId,
      userId: user.uid,
      contestId: selectedContest.id,
      ticker: ticker,
      predictionType,
      confidence,
      reasoning,
      timestamp: new Date(),
      points
    };

    try {
      await setDoc(doc(db, 'predictions', predictionId), prediction);
      
      // Reset form
      setReasoning('');
      setConfidence(50);
      setShowPredictionForm(false);
      setSelectedContest(null);
    } catch (error) {
      console.error('Error submitting prediction:', error);
    }
  };

  const getPredictionTypeLabel = (type: Prediction['predictionType']) => {
    switch (type) {
      case 'earnings_beat': return 'Earnings Beat Expectations';
      case 'earnings_miss': return 'Earnings Miss Expectations';
      case 'revenue_beat': return 'Revenue Beat Expectations';
      case 'revenue_miss': return 'Revenue Miss Expectations';
      case 'price_up': return 'Stock Price Up 10%+';
      case 'price_down': return 'Stock Price Down 10%+';
      default: return type;
    }
  };

  const getStatusColor = (status: Contest['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking {ticker} earnings data availability...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to make predictions</p>
          <button
            onClick={() => router.push('/landing')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{ticker} Predictions</h1>
              <p className="text-gray-600 mt-2">{company?.title}</p>
              <p className="text-sm text-gray-500 mt-1">
                Make predictions for upcoming quarterly earnings and performance
              </p>
            </div>
            <button
              onClick={() => router.push(`/${ticker}`)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back to Analysis
            </button>
          </div>
        </div>

        {/* Available Contests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Available Prediction Contests</h2>
            <p className="text-sm text-gray-500">Predict earnings and performance for upcoming quarters</p>
          </div>

          <div className="p-6">
            {availableContests.length > 0 ? (
              <div className="grid gap-4">
                {availableContests.map((contest) => (
                  <div 
                    key={contest.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <h3 className="font-semibold text-gray-900 mr-3">{contest.quarter} {contest.year}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contest.status)}`}>
                          {contest.status}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedContest(contest);
                          setShowPredictionForm(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Make Prediction
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{contest.description}</p>
                    
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Contest ends: {contest.endDate.toLocaleDateString()}</span>
                      <span>Started: {contest.startDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Contests</h3>
                <p className="text-gray-600 mb-4">
                  Recent quarterly earnings for {ticker} have already been reported. 
                  New prediction contests will open closer to future earnings seasons.
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Quarterly earnings are typically reported:</p>
                  <p>• Q1 (Jan-Mar): By mid-May</p>
                  <p>• Q2 (Apr-Jun): By mid-August</p>
                  <p>• Q3 (Jul-Sep): By mid-November</p>
                  <p>• Q4 (Oct-Dec): By mid-March of next year</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User's Previous Predictions */}
        {userPredictions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Your {ticker} Predictions</h2>
              <p className="text-sm text-gray-500">Track your prediction history and results</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {userPredictions.map((prediction) => (
                  <div key={prediction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900 mr-2">
                          {prediction.contestId?.includes('q1') ? 'Q1' :
                           prediction.contestId?.includes('q2') ? 'Q2' :
                           prediction.contestId?.includes('q3') ? 'Q3' : 'Q4'} 
                          {prediction.contestId?.slice(-4) || ''}
                        </span>
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
          </div>
        )}

        {/* Prediction Form Modal */}
        {showPredictionForm && selectedContest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Predict {ticker} {selectedContest.quarter} {selectedContest.year}
                </h3>
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
                {/* Prediction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prediction Type</label>
                  <select
                    value={predictionType}
                    onChange={(e) => setPredictionType(e.target.value as Prediction['predictionType'])}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="earnings_beat">Earnings Beat Expectations</option>
                    <option value="earnings_miss">Earnings Miss Expectations</option>
                    <option value="revenue_beat">Revenue Beat Expectations</option>
                    <option value="revenue_miss">Revenue Miss Expectations</option>
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
                    <span>Low Confidence</span>
                    <span>High Confidence</span>
                  </div>
                </div>

                {/* Reasoning */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Analysis</label>
                  <textarea
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    placeholder="Explain your prediction based on financial analysis..."
                    rows={4}
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
                  disabled={!reasoning.trim()}
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
