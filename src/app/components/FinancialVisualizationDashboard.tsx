'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3, PieChart, Zap, Calendar } from 'lucide-react';
import FinancialHeatmap from './visualizations/FinancialHeatmap';
import MoneyFlowCircle from './visualizations/MoneyFlowCircle';
import MoneyWheel from './visualizations/MoneyWheel';
import { prepareVisualizationData } from '../../lib/visualizationUtils';

interface FinancialVisualizationDashboardProps {
  ticker: string;
  data: any;
  currentQuarter: string;
}

type VisualizationMode = 'heatmap' | 'flow' | 'wheel';

const FinancialVisualizationDashboard: React.FC<FinancialVisualizationDashboardProps> = ({
  ticker,
  data,
  currentQuarter
}) => {
  const [mode, setMode] = useState<VisualizationMode>('heatmap');
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [timeframe, setTimeframe] = useState<'quarterly' | 'yearly'>('quarterly');
  const [comprehensiveData, setComprehensiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch comprehensive financial data from all three endpoints
  useEffect(() => {
    const fetchComprehensiveData = async () => {
      try {
        setLoading(true);
        const [incomeRes, balanceRes, cashFlowRes] = await Promise.all([
          fetch(`/api/tickers/${ticker}?view=income`),
          fetch(`/api/tickers/${ticker}?view=balance`),
          fetch(`/api/tickers/${ticker}?view=cashflow`)
        ]);

        const [incomeData, balanceData, cashFlowData] = await Promise.all([
          incomeRes.json(),
          balanceRes.json(),
          cashFlowRes.json()
        ]);

        // Combine all metrics from all three statements
        const combinedMetrics = [
          ...incomeData.metrics.map((m: any) => ({ ...m, statement: 'income' })),
          ...balanceData.metrics.map((m: any) => ({ ...m, statement: 'balance' })),
          ...cashFlowData.metrics.map((m: any) => ({ ...m, statement: 'cashflow' }))
        ];

        // Use the periods from the main data or from any of the statements
        const periods = data?.periods || incomeData.periods || balanceData.periods || cashFlowData.periods;

        setComprehensiveData({
          metrics: combinedMetrics,
          periods: periods,
          ticker: ticker,
          incomeData,
          balanceData,
          cashFlowData
        });
      } catch (error) {
        console.error('Error fetching comprehensive financial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComprehensiveData();
  }, [ticker, data]);

  // Get available quarters (up to 6 quarters or 3 years based on timeframe)
  const availableQuarters = useMemo(() => {
    if (!comprehensiveData || !comprehensiveData.periods) return [];
    
    if (timeframe === 'yearly') {
      // Group by year and take up to 3 years
      const yearlyPeriods = comprehensiveData.periods.filter((period: string) => {
        const [year, quarter] = period.split('-');
        return quarter === 'Q4'; // Take only Q4 for yearly view
      }).slice(0, 3);
      return yearlyPeriods;
    } else {
      // Use the periods from the data structure
      return comprehensiveData.periods.slice(0, 6); // Last 6 quarters (18 months)
    }
  }, [comprehensiveData, timeframe]);

  // Update selected quarter when timeframe changes
  React.useEffect(() => {
    if (availableQuarters.length > 0 && !availableQuarters.includes(selectedQuarter)) {
      setSelectedQuarter(availableQuarters[0]);
    }
  }, [availableQuarters, selectedQuarter]);

  // Get current quarter index
  const currentQuarterIndex = availableQuarters.indexOf(selectedQuarter);

  // Navigate quarters
  const navigateQuarter = (direction: 'prev' | 'next') => {
    const currentIndex = availableQuarters.indexOf(selectedQuarter);
    if (direction === 'prev' && currentIndex < availableQuarters.length - 1) {
      setSelectedQuarter(availableQuarters[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedQuarter(availableQuarters[currentIndex - 1]);
    }
  };

  // Prepare visualization data
  const visualizationData = useMemo(() => {
    if (!comprehensiveData || !comprehensiveData.metrics || !comprehensiveData.periods) {
      return null;
    }
    
    // For other visualizations, create the mock structure
    const quarterData: { [key: string]: number } = {};
    comprehensiveData.metrics.forEach((metric: any) => {
      const dataPoint = metric.dataPoints.find((dp: any) => dp.period === selectedQuarter);
      if (dataPoint) {
        quarterData[metric.name.replace(/\s+/g, '')] = dataPoint.value;
      }
    });
    
    return prepareVisualizationData(quarterData, selectedQuarter);
  }, [comprehensiveData, selectedQuarter]);

  const modes = [
    { id: 'heatmap', label: 'Heatmap', icon: BarChart3, description: 'Size & color show financial changes' },
    { id: 'flow', label: 'Money Flow', icon: Zap, description: 'See money flowing through business' },
    { id: 'wheel', label: 'Money Wheel', icon: PieChart, description: 'Static circular view of finances' }
  ];

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading comprehensive financial data...</p>
        </div>
      </div>
    );
  }

  if (!comprehensiveData) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">No financial data available for visualization</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Timeframe Switch */}
        <div className="flex items-center justify-center space-x-4 bg-gray-50 p-4 rounded-lg">
          <Calendar size={20} className="text-gray-600" />
          <span className="font-medium text-gray-700">Timeframe:</span>
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setTimeframe('quarterly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeframe === 'quarterly'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setTimeframe('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeframe === 'yearly'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Yearly (Q4s)
            </button>
          </div>
        </div>

        {/* Quarter Navigation */}
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateQuarter('prev')}
              disabled={currentQuarterIndex >= availableQuarters.length - 1}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              <ChevronLeft size={16} />
              <span>Previous Quarter</span>
            </button>
            
            <div className="text-center">
              <div className="font-semibold text-lg">{selectedQuarter}</div>
              <div className="text-sm text-gray-500">
                {currentQuarterIndex + 1} of {availableQuarters.length} quarters
              </div>
            </div>
            
            <button
              onClick={() => navigateQuarter('next')}
              disabled={currentQuarterIndex <= 0}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              <span>Next Quarter</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quarter Timeline */}
          <div className="flex space-x-2">
            {availableQuarters.map((quarter: string, index: number) => (
              <button
                key={quarter}
                onClick={() => setSelectedQuarter(quarter)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  quarter === selectedQuarter
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {quarter}
              </button>
            ))}
          </div>
        </div>

        {/* Visualization Mode Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modes.map((modeOption) => {
            const Icon = modeOption.icon;
            return (
              <button
                key={modeOption.id}
                onClick={() => setMode(modeOption.id as VisualizationMode)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mode === modeOption.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon size={24} className="mx-auto mb-2" />
                <div className="font-medium">{modeOption.label}</div>
                <div className="text-xs text-gray-500 mt-1">{modeOption.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visualization Area */}
      <div className="w-full h-full min-h-[600px]">
        {mode === 'heatmap' && (
          <FinancialHeatmap 
            data={comprehensiveData} 
            quarter={selectedQuarter}
            ticker={ticker}
          />
        )}
        
        {mode === 'flow' && (
          <MoneyFlowCircle 
            data={comprehensiveData} 
            quarter={selectedQuarter}
            ticker={ticker}
          />
        )}
        
        {mode === 'wheel' && (
          <MoneyWheel 
            data={comprehensiveData} 
            quarter={selectedQuarter}
            ticker={ticker}
          />
        )}
      </div>

      {/* Key Insights */}
      {visualizationData && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="text-green-600" size={20} />
              <span className="font-semibold text-green-800">Growing Areas</span>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              {visualizationData.growingAreas.map((area, index) => (
                <li key={index}>• {area}</li>
              ))}
            </ul>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className="text-red-600" size={20} />
              <span className="font-semibold text-red-800">Declining Areas</span>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {visualizationData.decliningAreas.map((area, index) => (
                <li key={index}>• {area}</li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="text-blue-600" size={20} />
              <span className="font-semibold text-blue-800">Key Metrics</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Revenue: ${visualizationData.keyMetrics.revenue}</li>
              <li>• Profit: ${visualizationData.keyMetrics.profit}</li>
              <li>• Cash: ${visualizationData.keyMetrics.cash}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialVisualizationDashboard;
