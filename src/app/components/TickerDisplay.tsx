/**
 * TickerDisplay Component - Financial Dashboard
 * 
 * Current Features:
 * - Multiple view types: default, detailed (.d), quarterly (.q), charts (.c), income (.i)
 * - Parabolic trend analysis with short-term trend indicators
 * - Trend percentage calculations showing curve acceleration/deceleration
 * 
 * Future Vision:
 * - Heat maps for financial sections (OpEx, Liabilities, Debt, etc.)
 * - Money flow visualization (Cash → Inventory → Projects)
 * - Corporate financial health indicators
 * - Flow analysis to detect artificial revenue boosting (e.g., inventory decline rates)
 * - Visual representation of money movement within corporation
 */

"use client";

import React, { useState, useEffect, useRef } from 'react';
import FinancialVisualizationDashboard from './FinancialVisualizationDashboard';

interface TickerDisplayProps {
  ticker: string;
  data: any;
  onClear: () => void;
  viewType?: string;
}

interface FinancialDataPoint {
  value: number;
  period: string;
  date: string;
  quarter?: string;
  year?: string;
  filed?: string;
}

interface ProcessedMetric {
  name: string;
  description: string;
  unit: string;
  dataPoints: FinancialDataPoint[];
}

// Simple chart component for financial metrics
function MetricChart({ metric, className = "" }: { metric: ProcessedMetric; className?: string }) {
  if (metric.dataPoints.length < 2) return null;

  // Sort all data points by date
  const allSortedData = [...metric.dataPoints].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Limit to last 6 years (24 quarters) for charts to keep them readable
  const maxDataPoints = 24; // 6 years * 4 quarters
  const sortedData = allSortedData.slice(-maxDataPoints);

  const values = sortedData.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue;

  // Calculate parabolic regression (quadratic)
  const n = sortedData.length;
  const xValues = sortedData.map((_, i) => i);
  const yValues = sortedData.map(d => d.value);
  
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  const sumX3 = xValues.reduce((sum, x) => sum + x * x * x, 0);
  const sumX4 = xValues.reduce((sum, x) => sum + x * x * x * x, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2Y = xValues.reduce((sum, x, i) => sum + x * x * yValues[i], 0);
  
  // Simple quadratic fit using normal equations
  const A = [
    [n, sumX, sumX2],
    [sumX, sumX2, sumX3],
    [sumX2, sumX3, sumX4]
  ];
  const B = [sumY, sumXY, sumX2Y];
  
  // Solve for quadratic coefficients (simplified)
  const det = A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
              A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
              A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
  
  let quadA = 0, quadB = 0, quadC = 0;
  if (Math.abs(det) > 0.001) {
    quadA = ((B[0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
              A[0][1] * (B[1] * A[2][2] - A[1][2] * B[2]) +
              A[0][2] * (B[1] * A[2][1] - A[1][1] * B[2])) / det);
    quadB = ((A[0][0] * (B[1] * A[2][2] - A[1][2] * B[2]) -
              B[0] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
              A[0][2] * (A[1][0] * B[2] - B[1] * A[2][0])) / det);
    quadC = ((A[0][0] * (A[1][1] * B[2] - B[1] * A[2][1]) -
              A[0][1] * (A[1][0] * B[2] - B[1] * A[2][0]) +
              B[0] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])) / det);
  }

  // Determine trend direction from parabolic regression
  const firstQuadY = quadA + quadB * 0 + quadC * 0 * 0;
  const lastQuadY = quadA + quadB * (n-1) + quadC * (n-1) * (n-1);
  const isTrendingUp = lastQuadY > firstQuadY;

  // Generate regression line points
  const regressionPoints = xValues.map(x => {
    const quadraticY = quadA + quadB * x + quadC * x * x;
    return { x, quadraticY };
  });

  // Format time labels
  const formatTimeLabel = (dataPoint: FinancialDataPoint) => {
    const date = new Date(dataPoint.date);
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
    return `${dataPoint.quarter}-${year}`; // dataPoint.quarter already includes "Q"
  };

  // Calculate value scale ticks
  const getValueTicks = () => {
    const tickCount = 5;
    const step = range / (tickCount - 1);
    return Array.from({ length: tickCount }, (_, i) => minValue + step * i);
  };

  const valueTicks = getValueTicks();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 mb-2">{metric.name}</h4>
      <div className="relative h-50 w-full">
        <svg 
          viewBox="0 0 400 120" 
          className="w-full "
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          <defs>
            <pattern id={`grid-${metric.name.replace(/\s+/g, '')}`} width="32" height="16" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 16" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect x="50" y="5" width="330" height="85" fill={`url(#grid-${metric.name.replace(/\s+/g, '')})`}/>
          
          {/* Y-axis (Value scale) */}
          <line x1="50" y1="5" x2="50" y2="90" stroke="#9ca3af" strokeWidth="1"/>
          {valueTicks.map((tick, index) => {
            const y = 90 - ((tick - minValue) / range) * 85;
            return (
              <g key={index}>
                <line x1="45" y1={y} x2="50" y2={y} stroke="#9ca3af" strokeWidth="1"/>
                <text x="40" y={y + 3} textAnchor="end" fontSize="8" fill="#6b7280">
                  {formatValue(tick, metric.unit)}
                </text>
              </g>
            );
          })}
          
          {/* X-axis (Time scale) */}
          <line x1="50" y1="90" x2="380" y2="90" stroke="#9ca3af" strokeWidth="1"/>
          {sortedData.map((dataPoint, index) => {
            // Show every 2nd or 3rd label depending on data density, plus always show first and last
            const showLabel = index === 0 || index === n - 1 || 
                            (n <= 8 && index % 2 === 0) || 
                            (n > 8 && index % 3 === 0);
            
            if (showLabel) {
              const x = 50 + (index / (n - 1)) * 330;
              return (
                <g key={index}>
                  <line x1={x} y1="90" x2={x} y2="95" stroke="#9ca3af" strokeWidth="1"/>
                  <text x={x} y="105" textAnchor="middle" fontSize="8" fill="#6b7280">
                    {formatTimeLabel(dataPoint)}
                  </text>
                </g>
              );
            }
            return null;
          })}
          
          {/* Parabolic trend line */}
          {Math.abs(det) > 0.001 && (
            <polyline
              fill="none"
              stroke={isTrendingUp ? "#10b981" : "#ef4444"}
              strokeWidth="2"
              points={regressionPoints.map((point, index) => {
                const x = 50 + (index / (n - 1)) * 330;
                const y = range === 0 ? 47.5 : 90 - ((point.quadraticY - minValue) / range) * 85;
                return `${x},${Math.max(5, Math.min(90, y))}`;
              }).join(' ')}
            />
          )}
          
          {/* Data points (blue dots) */}
          {sortedData.map((point, index) => {
            const x = 50 + (index / (n - 1)) * 330;
            const y = range === 0 ? 47.5 : 90 - ((point.value - minValue) / range) * 85;
            return (
              <circle
                key={index}
                cx={x}
                cy={Math.max(5, Math.min(90, y))}
                r="3"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
        </svg>
        
        {/* Current value and trend indicator */}
        <div className="mt-2 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs">
            {Math.abs(det) > 0.001 && (
              <div className="flex items-center gap-1">
                <div className={`w-3 h-0.5 ${isTrendingUp ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-600">Trend</span>
                <span className={`text-xs ${isTrendingUp ? 'text-green-600' : 'text-red-600'}`}>
                  {isTrendingUp ? 'Up' : 'Down'}
                </span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Latest</div>
            <span className="text-sm font-bold text-gray-900">
              {formatValue(values[values.length - 1], metric.unit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to process financial data
function processFinancialData(facts: any, isDetailedView: boolean = false): { metrics: ProcessedMetric[], periods: string[] } {
  if (!facts || !facts['us-gaap']) {
    return { metrics: [], periods: [] };
  }

  const metrics: ProcessedMetric[] = [];
  const allPeriods = new Set<string>();

  // Key financial metrics to display in default view
  const keyMetrics = [
    'Revenues',
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'GrossProfit',
    'OperatingIncomeLoss',
    'NetIncomeLoss',
    'EarningsPerShareBasic',
    'EarningsPerShareDiluted',
    'Assets',
    'AssetsCurrent',
    'Liabilities',
    'LiabilitiesCurrent',
    'StockholdersEquity',
    'CashAndCashEquivalentsAtCarryingValue',
    'OperatingCashFlowsFromOperatingActivities'
  ];

  // In detailed view, process ALL available metrics
  const metricsToProcess = isDetailedView 
    ? Object.keys(facts['us-gaap']) 
    : keyMetrics;

  metricsToProcess.forEach(metricKey => {
    const metric = facts['us-gaap'][metricKey];
    if (!metric || !metric.units) return;

    // Find the most common unit (usually USD)
    const units = Object.keys(metric.units);
    const primaryUnit = units.find(unit => unit === 'USD') || units[0];
    
    if (!primaryUnit || !metric.units[primaryUnit]) return;

    // Process and deduplicate data points
    const rawDataPoints = metric.units[primaryUnit]
      .filter((point: any) => point.end && point.val)
      .map((point: any) => {
        const endDate = new Date(point.end);
        const year = endDate.getFullYear();
        const month = endDate.getMonth() + 1;
        const quarter = Math.ceil(month / 3);
        const periodKey = `${year}-Q${quarter}`;
        
        return {
          value: point.val,
          period: periodKey,
          date: point.end,
          quarter: `Q${quarter}`,
          year: year.toString(),
          filed: point.filed || point.end // Use filed date for deduplication preference
        };
      });

    // Deduplicate by period, keeping the most recently filed data for each period
    const periodMap = new Map<string, FinancialDataPoint>();
    rawDataPoints.forEach((point: any) => {
      const existing = periodMap.get(point.period);
      if (!existing || (point.filed && existing.filed && new Date(point.filed).getTime() > new Date(existing.filed).getTime())) {
        periodMap.set(point.period, point);
        allPeriods.add(point.period);
      } else if (!existing || (!point.filed && !existing.filed)) {
        // If neither has filed date, just use the first one or keep existing
        if (!existing) {
          periodMap.set(point.period, point);
          allPeriods.add(point.period);
        }
      }
    });

    const dataPoints: FinancialDataPoint[] = Array.from(periodMap.values())
      .sort((a: FinancialDataPoint, b: FinancialDataPoint) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

    if (dataPoints.length > 0) {
      metrics.push({
        name: formatMetricName(metricKey),
        description: metric.description || formatMetricName(metricKey),
        unit: primaryUnit,
        dataPoints
      });
    }
  });

  // Sort periods chronologically with latest first (descending order)
  const sortedPeriods = Array.from(allPeriods).sort((a, b) => {
    const [yearA, quarterA] = a.split('-Q');
    const [yearB, quarterB] = b.split('-Q');
    const dateA = parseInt(yearA) * 4 + parseInt(quarterA);
    const dateB = parseInt(yearB) * 4 + parseInt(quarterB);
    return dateB - dateA; // Latest first
  });

  return { metrics, periods: sortedPeriods };
}

// Helper function to format values
function formatValue(value: number, unit: string): string {
  if (unit === 'USD') {
    if (Math.abs(value) >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (Math.abs(value) >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  } else if (unit === 'USD/shares') {
    return `$${value.toFixed(2)}`;
  } else {
    return value.toLocaleString();
  }
}

// Helper function to calculate trend for a metric
function calculateMetricTrend(metric: ProcessedMetric, shortTermPeriods: number = 3): { 
  overallTrend: 'up' | 'down' | 'neutral', 
  shortTermTrend: 'up' | 'down' | 'neutral',
  latestValue: number 
} {
  if (metric.dataPoints.length < 2) {
    return { overallTrend: 'neutral', shortTermTrend: 'neutral', latestValue: metric.dataPoints[0]?.value || 0 };
  }

  const sortedData = [...metric.dataPoints].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const n = sortedData.length;
  const xValues = sortedData.map((_, i) => i);
  const yValues = sortedData.map(d => d.value);
  
  // Calculate parabolic regression for overall trend
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  const sumX3 = xValues.reduce((sum, x) => sum + x * x * x, 0);
  const sumX4 = xValues.reduce((sum, x) => sum + x * x * x * x, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2Y = xValues.reduce((sum, x, i) => sum + x * x * yValues[i], 0);
  
  const A = [
    [n, sumX, sumX2],
    [sumX, sumX2, sumX3],
    [sumX2, sumX3, sumX4]
  ];
  const B = [sumY, sumXY, sumX2Y];
  
  const det = A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
              A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
              A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
  
  let overallTrend: 'up' | 'down' | 'neutral' = 'neutral';
  if (Math.abs(det) > 0.001) {
    const quadA = ((B[0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
                    A[0][1] * (B[1] * A[2][2] - A[1][2] * B[2]) +
                    A[0][2] * (B[1] * A[2][1] - A[1][1] * B[2])) / det);
    const quadB = ((A[0][0] * (B[1] * A[2][2] - A[1][2] * B[2]) -
                    B[0] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
                    A[0][2] * (A[1][0] * B[2] - B[1] * A[2][0])) / det);
    const quadC = ((A[0][0] * (A[1][1] * B[2] - B[1] * A[2][1]) -
                    A[0][1] * (A[1][0] * B[2] - B[1] * A[2][0]) +
                    B[0] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])) / det);

    const firstQuadY = quadA + quadB * 0 + quadC * 0 * 0;
    const lastQuadY = quadA + quadB * (n-1) + quadC * (n-1) * (n-1);
    overallTrend = lastQuadY > firstQuadY ? 'up' : 'down';
  }

  // Calculate short-term trend (configurable number of periods)
  const lastNPeriods = sortedData.slice(-shortTermPeriods);
  let shortTermTrend: 'up' | 'down' | 'neutral' = 'neutral';
  
  if (lastNPeriods.length >= 2) {
    const firstValue = lastNPeriods[0].value;
    const lastValue = lastNPeriods[lastNPeriods.length - 1].value;
    const change = ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
    
    if (Math.abs(change) > 5) { // 5% threshold for significant change
      shortTermTrend = change > 0 ? 'up' : 'down';
    }
  }

  return { 
    overallTrend, 
    shortTermTrend, 
    latestValue: sortedData[sortedData.length - 1].value 
  };
}

// Helper function to calculate trend percentages for recent quarters
function calculateTrendPercentages(metric: ProcessedMetric): { quarterlyTrends: Array<{ quarter: string, trendPercent: number }> } {
  if (metric.dataPoints.length < 2) {
    return { quarterlyTrends: [] };
  }

  const sortedData = [...metric.dataPoints].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const n = sortedData.length;
  if (n < 6) {
    return { quarterlyTrends: [] };
  }

  const xValues = sortedData.map((_, i) => i);
  const yValues = sortedData.map(d => d.value);
  
  // Use the SAME parabolic regression calculation as the main trend calculation
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  const sumX3 = xValues.reduce((sum, x) => sum + x * x * x, 0);
  const sumX4 = xValues.reduce((sum, x) => sum + x * x * x * x, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2Y = xValues.reduce((sum, x, i) => sum + x * x * yValues[i], 0);
  
  const A = [
    [n, sumX, sumX2],
    [sumX, sumX2, sumX3],
    [sumX2, sumX3, sumX4]
  ];
  const B = [sumY, sumXY, sumX2Y];
  
  const det = A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
              A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
              A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
  
  if (Math.abs(det) < 0.001) {
    return { quarterlyTrends: [] };
  }

  const quadA = ((B[0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
                  A[0][1] * (B[1] * A[2][2] - A[1][2] * B[2]) +
                  A[0][2] * (B[1] * A[2][1] - A[1][1] * B[2])) / det);
  const quadB = ((A[0][0] * (B[1] * A[2][2] - A[1][2] * B[2]) -
                  B[0] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
                  A[0][2] * (A[1][0] * B[2] - B[1] * A[2][0])) / det);
  const quadC = ((A[0][0] * (A[1][1] * B[2] - B[1] * A[2][1]) -
                  A[0][1] * (A[1][0] * B[2] - B[1] * A[2][0]) +
                  B[0] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])) / det);

  // Calculate trend curve values for last 7 quarters (need 7 to get 6 percentage changes)
  const quarterlyTrends: Array<{ quarter: string, trendPercent: number }> = [];
  const trendValues: number[] = [];
  
  // Calculate trend values for last 7 quarters
  for (let i = 0; i < 7; i++) {
    const xPos = n - 7 + i; // Position in the overall dataset
    const trendValue = quadA + quadB * xPos + quadC * xPos * xPos;
    trendValues.push(trendValue);
  }
  
  // Calculate percentage changes between consecutive trend points
  for (let i = 1; i < 7; i++) {
    const currentTrendValue = trendValues[i];
    const previousTrendValue = trendValues[i - 1];
    
    // Calculate percentage change from previous to current trend point
    const trendPercent = previousTrendValue !== 0 ? 
      ((currentTrendValue - previousTrendValue) / Math.abs(previousTrendValue)) * 100 : 0;
    
    quarterlyTrends.push({
      quarter: `${i}Q`, // 1Q, 2Q, 3Q, 4Q, 5Q, 6Q (where 1Q is oldest change, 6Q is newest)
      trendPercent: trendPercent
    });
  }

  return { quarterlyTrends: quarterlyTrends }; // Order is already correct: 1Q to 6Q (oldest to newest)
}

// Helper function to format metric names with proper spacing
function formatMetricName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between lowercase and uppercase
    .trim() // Remove leading/trailing spaces
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

// Helper function to get short metric names
function getShortMetricName(name: string): string {
  const nameMap: Record<string, string> = {
    'Revenues': 'Revenue',
    'Revenue From Contract With Customer Excluding Assessed Tax': 'Contract Revenue',
    'Gross Profit': 'Gross Profit',
    'Operating Income Loss': 'Operating Income',
    'Net Income Loss': 'Net Income',
    'Earnings Per Share Basic': 'EPS Basic',
    'Earnings Per Share Diluted': 'EPS Diluted',
    'Assets': 'Total Assets',
    'Assets Current': 'Current Assets',
    'Liabilities': 'Total Liabilities',
    'Liabilities Current': 'Current Liabilities',
    'Stockholders Equity': 'Equity',
    'Cash And Cash Equivalents At Carrying Value': 'Cash',
    'Operating Cash Flows From Operating Activities': 'Operating Cash Flow'
  };
  
  return nameMap[name] || name;
}

// Function to group metrics by financial statement category
function groupMetricsByCategory(metrics: ProcessedMetric[]) {
  const groups: Record<string, ProcessedMetric[]> = {
    'Revenue & Income': [],
    'Expenses': [],
    'Assets': [],
    'Liabilities': [],
    'Equity': [],
    'Cash Flow': [],
    'Other': []
  };

  metrics.forEach(metric => {
    const name = metric.name.toLowerCase();
    
    if (name.includes('revenue') || name.includes('income') || name.includes('earnings') || name.includes('profit')) {
      groups['Revenue & Income'].push(metric);
    } else if (name.includes('expense') || name.includes('cost') || name.includes('operating expense')) {
      groups['Expenses'].push(metric);
    } else if (name.includes('asset') || name.includes('cash') || name.includes('inventory') || name.includes('goodwill') || name.includes('property')) {
      groups['Assets'].push(metric);
    } else if (name.includes('liabilit') || name.includes('debt') || name.includes('payable')) {
      groups['Liabilities'].push(metric);
    } else if (name.includes('equity') || name.includes('stockholder') || name.includes('retained earnings')) {
      groups['Equity'].push(metric);
    } else if (name.includes('cash flow') || name.includes('operating activities') || name.includes('investing activities') || name.includes('financing activities')) {
      groups['Cash Flow'].push(metric);
    } else {
      groups['Other'].push(metric);
    }
  });

  // Remove empty groups
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
}

/**
 * TickerDisplay Component
 * 
 * Supports multiple view types:
 * - default: Shows key metrics summary + limited charts + collapsible table
 * - detailed: Shows all metrics summary + limited charts (no bottom table)
 * - quarterly: Shows full table with all metrics only  
 * - charts: Shows all metrics as charts only
 */

export default function TickerDisplay({ ticker, data, onClear, viewType = 'default' }: TickerDisplayProps) {
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [shortTermPeriods, setShortTermPeriods] = useState(3);
  const [isRawDataView, setIsRawDataView] = useState(false); // Toggle for income statement view
  const [showDescriptions, setShowDescriptions] = useState(false); // Toggle for description column visibility
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut handling for trend period adjustment, view switching, and horizontal scrolling
  useEffect(() => {
    let inputBuffer = '';
    let isTypingT = false;
    let isTypingQ = false;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toLowerCase();

      // Handle horizontal scrolling with j/k keys
      if (key === 'j' || key === 'k') {
        if (scrollContainerRef.current) {
          const scrollAmount = 200; // Pixels to scroll
          const currentScroll = scrollContainerRef.current.scrollLeft;
          
          if (key === 'j') {
            // Scroll right
            scrollContainerRef.current.scrollTo({
              left: currentScroll - scrollAmount,
              behavior: 'smooth'
            });
          } else {
            // Scroll left
            scrollContainerRef.current.scrollTo({
              left: currentScroll + scrollAmount,
              behavior: 'smooth'
            });
          }
          event.preventDefault();
          return;
        }
      }

      // Handle arrow key horizontal scrolling
      if (key === 'arrowleft' || key === 'arrowright') {
        if (scrollContainerRef.current) {
          const scrollAmount = 200; // Pixels to scroll
          const currentScroll = scrollContainerRef.current.scrollLeft;
          
          if (key === 'arrowright') {
            // Scroll right
            scrollContainerRef.current.scrollTo({
              left: currentScroll + scrollAmount,
              behavior: 'smooth'
            });
          } else {
            // Scroll left
            scrollContainerRef.current.scrollTo({
              left: currentScroll - scrollAmount,
              behavior: 'smooth'
            });
          }
          event.preventDefault();
          return;
        }
      }

      // Handle 'd' key for description toggle
      if (key === 'd' && !isTypingT && !isTypingQ) {
        setShowDescriptions(prev => !prev);
        event.preventDefault();
        return;
      }

      // Handle 't' key for view toggle (financial statement views and detailed view)
      if (key === 't' && !isTypingQ && (viewType === 'income' || viewType === 'balance' || viewType === 'cashflow' || viewType === 'detailed')) {
        setIsRawDataView(prev => !prev);
        event.preventDefault();
        return;
      }

      // Handle 't' key sequences for other views (legacy trend period change)
      if (key === 't' && !isTypingT && !isTypingQ && viewType !== 'income' && viewType !== 'balance' && viewType !== 'cashflow' && viewType !== 'detailed') {
        isTypingT = true;
        inputBuffer = '';
        event.preventDefault();
        return;
      }

      // Handle 'q' key sequences for quarter changes
      if (key === 'q' && !isTypingT && !isTypingQ) {
        isTypingQ = true;
        inputBuffer = '';
        event.preventDefault();
        return;
      }

      if (isTypingT) {
        if (key === 'enter') {
          // For financial statement views and detailed view: toggle between summary and raw data view
          if ((viewType === 'income' || viewType === 'balance' || viewType === 'cashflow' || viewType === 'detailed') && inputBuffer === '') {
            setIsRawDataView(prev => !prev);
            isTypingT = false;
            inputBuffer = '';
            event.preventDefault();
            return;
          }
          
          // For other views: change trend periods (legacy behavior)
          const num = parseInt(inputBuffer);
          if (!isNaN(num) && num >= 1 && num <= 6) {
            setShortTermPeriods(num);
          }
          isTypingT = false;
          inputBuffer = '';
          event.preventDefault();
        } else if (key >= '0' && key <= '9') {
          inputBuffer += key;
          event.preventDefault();
        } else if (key === 'escape' || key === 'backspace') {
          isTypingT = false;
          inputBuffer = '';
          event.preventDefault();
        } else {
          // Any other key should cancel the T sequence
          isTypingT = false;
          inputBuffer = '';
        }
      }

      if (isTypingQ) {
        if (key === 'enter') {
          const num = parseInt(inputBuffer);
          if (!isNaN(num) && num >= 1 && num <= 6) {
            setShortTermPeriods(num);
          }
          isTypingQ = false;
          inputBuffer = '';
          event.preventDefault();
        } else if (key >= '0' && key <= '9') {
          inputBuffer += key;
          event.preventDefault();
        } else if (key === 'escape' || key === 'backspace') {
          isTypingQ = false;
          inputBuffer = '';
          event.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [viewType]);

  if (!data) {
    return (
      <div className="w-full min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading financial data for {ticker}...</p>
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="w-full min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
            <p className="text-red-600">{data.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { title } = data;

  return (
    <div className="w-full bg-white text-gray-900">
      <div className="w-[90%] mx-auto px-6 py-6 space-y-6">
        {/* Financial Charts and Data */}
        {(data.facts || data.metrics || data.forwardEstimates) && (() => {
          const isDetailedView = viewType === 'quarterly' || viewType === 'charts' || viewType === 'visualization';
          const isFinancialStatementView = viewType === 'income' || viewType === 'balance' || viewType === 'cashflow' || viewType === 'detailed';
          const isSpecialView = isDetailedView || isFinancialStatementView || viewType === 'forward';
          
          // Handle both old format (data.facts) and new format (data.metrics)
          let metrics, periods;
          if (data.metrics && data.periods) {
            // New server-processed format - server already did the filtering
            metrics = data.metrics;
            periods = data.periods;
            console.log('Server-processed data:', { 
              totalMetrics: metrics.length, 
              viewType, 
              serverView: data.view,
              isDetailedView,
              firstFewMetrics: metrics.slice(0, 5).map((m: ProcessedMetric) => m.name)
            });
          } else if (data.facts) {
            // Old client-processed format (fallback)
            const processed = processFinancialData(data.facts, isDetailedView);
            metrics = processed.metrics;
            periods = processed.periods;
            console.log('Client-processed data:', { 
              totalMetrics: metrics.length, 
              viewType, 
              isDetailedView 
            });
          } else {
            metrics = [];
            periods = [];
          }
          
          console.log(`Final result - View Type: ${viewType}, Is Detailed: ${isDetailedView}, Metrics Count: ${metrics.length}`);
          
          // Forward estimates view: show forward estimates tables
          if (viewType === 'forward') {
            const forwardData = data.forwardEstimates || {};
            const annualEstimates = forwardData.annualEstimates || [];
            const quarterlyEstimates = forwardData.quarterlyEstimates || [];
            const analysisMetrics = forwardData.analysisMetrics || {};
            const hasError = forwardData.error;
            
            if (hasError) {
              return (
                <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-4">Forward Estimates Unavailable</h3>
                  <p className="text-yellow-700 mb-4">{hasError}</p>
                  <div className="bg-yellow-100 rounded-lg p-4 border border-yellow-300">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Requirements for Forward Estimates:</h4>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      <li>• At least 2 years of quarterly financial data</li>
                      <li>• Complete revenue, net income, and EPS data</li>
                      <li>• Regular quarterly reporting pattern</li>
                    </ul>
                  </div>
                </div>
              );
            }
            
            return (
              <div className="space-y-6">
                {/* Analysis Summary */}
                {analysisMetrics.dataQuality && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800 mb-3">Financial Analysis Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <label className="block text-blue-600 mb-1">Revenue Growth</label>
                        <p className={`font-mono ${analysisMetrics.revenueGrowthRate >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {analysisMetrics.revenueGrowthRate >= 0 ? '+' : ''}{analysisMetrics.revenueGrowthRate}%
                        </p>
                      </div>
                      <div>
                        <label className="block text-blue-600 mb-1">EPS Growth</label>
                        <p className={`font-mono ${analysisMetrics.epsGrowthRate >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {analysisMetrics.epsGrowthRate >= 0 ? '+' : ''}{analysisMetrics.epsGrowthRate}%
                        </p>
                      </div>
                      <div>
                        <label className="block text-blue-600 mb-1">Net Margin</label>
                        <p className="font-mono text-gray-700">{analysisMetrics.netMargin}%</p>
                      </div>
                      <div>
                        <label className="block text-blue-600 mb-1">Data Quality</label>
                        <p className={`font-medium ${analysisMetrics.dataQuality === 'Good' ? 'text-green-700' : 'text-yellow-700'}`}>
                          {analysisMetrics.dataQuality}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Annual Estimates Table */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Annual Estimates (AI-Generated)</h3>
                  {annualEstimates.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Year</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">EPS ($)</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">High</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Low</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Price Target</th>
                          </tr>
                        </thead>
                        <tbody>
                          {annualEstimates.map((estimate: any, index: number) => (
                            <tr key={estimate.year} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                              <td className="py-3 px-4 font-medium text-gray-900">{estimate.year}</td>
                              <td className="py-3 px-4 text-center font-mono text-sm">{estimate.eps}</td>
                              <td className="py-3 px-4 text-center font-mono text-sm">{estimate.high}</td>
                              <td className="py-3 px-4 text-center font-mono text-sm">{estimate.low}</td>
                              <td className="py-3 px-4 text-center font-mono text-sm text-blue-600">{estimate.priceTarget}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No annual estimates available.</p>
                  )}
                </div>

                {/* Quarterly Estimates Table */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Quarterly Estimates (AI-Generated)</h3>
                  {quarterlyEstimates.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Quarter</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">EPS($)</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">%Chg</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">Sales($B)</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700 text-sm">% Chg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quarterlyEstimates.map((estimate: any, index: number) => (
                            <tr key={estimate.quarter} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                              <td className="py-3 px-4 font-medium text-gray-900">{estimate.quarter}</td>
                              <td className="py-3 px-4 text-center font-mono text-sm">{estimate.eps}</td>
                              <td className="py-3 px-4 text-center font-mono text-sm">
                                <span className={`${
                                  estimate.change.startsWith('+') ? 'text-green-600' : 
                                  estimate.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {estimate.change}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-mono text-sm">{estimate.sales}</td>
                              <td className="py-3 px-4 text-center font-mono text-sm">
                                <span className={`${
                                  estimate.salesChange.startsWith('+') ? 'text-blue-600' : 
                                  estimate.salesChange.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {estimate.salesChange}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No quarterly estimates available.</p>
                  )}
                </div>

                {/* Methodology Info Box */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="text-sm font-medium text-green-800 mb-2">AI Financial Analysis Methodology</h4>
                  <p className="text-xs text-green-700 mb-2">
                    📊 <strong>Data-Driven Projections:</strong> Forward estimates generated by analyzing historical financial statements, 
                    growth patterns, profit margins, and industry-typical metrics.
                  </p>
                  <p className="text-xs text-green-700 mb-2">
                    📈 <strong>Growth Analysis:</strong> Revenue and EPS growth rates calculated from trailing 2-year performance 
                    with conservative adjustments for sustainability.
                  </p>
                  <p className="text-xs text-green-700">
                    ⚠️ <strong>Disclaimer:</strong> These are algorithmic projections based on historical data and should not be considered 
                    investment advice. Actual results may vary significantly due to market conditions, company performance, and external factors.
                  </p>
                </div>
              </div>
            );
          }
          
          if (metrics.length === 0 || periods.length === 0) {
            return (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Financial Data</h2>
                <div className="text-center py-8">
                  <p className="text-gray-600">No quarterly financial data available for display.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    This may occur if the company hasn't filed recent quarterly reports or if the data format is different.
                  </p>
                </div>
              </div>
            );
          }

          // Quarterly view: show grouped financial data table
          if (viewType === 'quarterly') {
            const groupedMetrics = groupMetricsByCategory(metrics);
            
            return (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Financial Data (Quarterly)</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDescriptions(!showDescriptions)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        showDescriptions 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {showDescriptions ? 'Hide' : 'Show'} Descriptions
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto" ref={scrollContainerRef}>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700 text-xs w-[350px]">
                          Metric
                        </th>
                        {showDescriptions && (
                          <th className="text-left py-2 px-3 font-semibold text-gray-700 text-xs min-w-[250px]">Description</th>
                        )}
                        {periods.map((period: string) => {
                          const [year, quarter] = period.split('-');
                          return (
                            <th key={period} className="text-center py-2 px-3 font-semibold text-gray-700 text-xs min-w-[140px]">
                              <div className="text-center">
                                <div className="text-xs">{year}</div>
                                <div className="text-xs font-normal text-gray-500">{quarter}</div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(groupedMetrics).map(([categoryName, categoryMetrics]) => (
                        <React.Fragment key={categoryName}>
                          {/* Category Header */}
                          <tr className="bg-gray-100 border-b border-gray-300">
                            <td 
                              colSpan={showDescriptions ? periods.length + 2 : periods.length + 1} 
                              className="py-3 px-3 font-bold text-gray-800 text-sm"
                            >
                              {categoryName}
                            </td>
                          </tr>
                          {/* Category Metrics */}
                          {categoryMetrics.map((metric: ProcessedMetric, index: number) => (
                            <tr key={metric.name} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="py-2 px-3 w-[350px]">
                                <div className="font-medium text-gray-900 text-xs pl-4">
                                  {metric.name}
                                </div>
                              </td>
                              {/* Description column - shown only when toggled on */}
                              {showDescriptions && (
                                <td className="py-2 px-3 min-w-[250px]">
                                  <div className="text-xs text-gray-500">
                                    {metric.description}
                                  </div>
                                </td>
                              )}
                              {periods.map((period: string) => {
                                const dataPoint = metric.dataPoints.find((dp: FinancialDataPoint) => dp.period === period);
                                return (
                                  <td key={period} className="py-2 px-3 text-right">
                                    {dataPoint ? (
                                      <span className="font-mono text-xs text-gray-800">
                                        {formatValue(dataPoint.value, metric.unit)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-500 text-xs">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    📊 <strong>Quarterly View:</strong> Shows all {metrics.length} available quarterly financial metrics organized by financial statement section. 
                    Metrics are grouped into categories like Revenue & Income, Assets, Liabilities, etc.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    💡 Quick shortcuts: Press 'd' to toggle description column • Use 'j'/'k' or ←/→ arrows to scroll table horizontally
                  </p>
                </div>
              </div>
            );
          }

          // Charts view: show only charts with all metrics
          // Charts view
          if (viewType === 'charts') {
            return (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    Financial Charts
                    <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      All {metrics.length} Metrics
                    </span>
                  </h2>
                </div>
                
                {/* All Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {metrics.map((metric: ProcessedMetric) => (
                    <MetricChart key={metric.name} metric={metric} />
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p className="text-blue-800">
                    📊 <strong>Charts View:</strong> Displaying all {metrics.length} available financial metrics as charts. 
                    Charts display the last 6 years (24 quarters) for readability.
                  </p>
                </div>
              </div>
            );
          }

          // Visualization view - Financial Flow Analysis
          if (viewType === 'visualization') {
            return (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <FinancialVisualizationDashboard
                  ticker={ticker}
                  data={data}
                  currentQuarter={periods && periods.length > 0 ? periods[0] : 'Q1 2024'}
                />
              </div>
            );
          }

          return (
            <>
              {/* Metrics Summary Table */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-gray-800">
                    {viewType === 'income' ? 'Income Statement' : 
                     viewType === 'balance' ? 'Balance Sheet' :
                     viewType === 'cashflow' ? 'Cash Flow Statement' : 
                     viewType === 'detailed' ? 'All Financial Metrics' : 'Metrics Summary'}
                    {(isDetailedView || viewType === 'detailed') && (
                      <span className="ml-2 text-sm font-normal text-purple-600 bg-purple-50 px-2 py-1 rounded">
                        {metrics.length} Metrics
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Short-term periods:</label>
                      <select
                        value={shortTermPeriods}
                        onChange={(e) => setShortTermPeriods(Number(e.target.value))}
                        className="px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={1}>1Q</option>
                        <option value={2}>2Q</option>
                        <option value={3}>3Q</option>
                        <option value={4}>4Q</option>
                        <option value={5}>5Q</option>
                        <option value={6}>6Q</option>
                      </select>
                    </div>
                    
                    {/* Toggle Switch for Income Statement View */}
                    {(viewType === 'income' || viewType === 'balance' || viewType === 'cashflow' || viewType === 'detailed') && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">View:</label>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${!isRawDataView ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                            Summary
                          </span>
                          <button
                            onClick={() => setIsRawDataView(!isRawDataView)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              isRawDataView ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
                                isRawDataView ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-xs ${isRawDataView ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                            Raw Data
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto" ref={scrollContainerRef}>
                  <table className="w-full text-sm transition-all duration-300 ease-in-out">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700 text-xs w-[350px]">Metric</th>
                        {showDescriptions && (
                          <th className="text-left py-2 px-3 font-semibold text-gray-700 text-xs min-w-[250px]">Description</th>
                        )}
                        {/* Dynamic headers based on view mode for financial statements */}
                        {(viewType === 'income' || viewType === 'balance' || viewType === 'cashflow' || viewType === 'detailed') && isRawDataView ? (
                          // Raw Data View - show quarterly periods with 2-row headers
                          periods.map((period: string) => {
                            const [year, quarter] = period.split('-');
                            return (
                              <th key={period} className="text-center py-2 px-3 font-semibold text-gray-700 text-xs min-w-[140px]">
                                <div className="text-center">
                                  <div className="text-xs">{year}</div>
                                  <div className="text-xs font-normal text-gray-500">{quarter}</div>
                                </div>
                              </th>
                            );
                          })
                        ) : (
                          // Summary View - show trends
                          <>
                            <th className="text-right py-2 px-3 font-semibold text-gray-700 text-xs min-w-[140px]">Latest Value</th>
                            <th className="text-center py-2 px-3 font-semibold text-gray-700 text-xs min-w-[120px]">Overall Trend</th>
                            <th className="text-center py-2 px-3 font-semibold text-gray-700 text-xs min-w-[120px]">
                              <div className="flex items-center justify-center gap-1">
                                <span>{shortTermPeriods}Q Trend</span>
                                <span className="text-xs text-gray-400 font-normal">(t+num)</span>
                              </div>
                            </th>
                            {/* Show quarterly trend percentages only in detailed and income views */}
                            {(viewType === 'detailed' || viewType === 'income' || viewType === 'balance' || viewType === 'cashflow') && (
                              <>
                                <th className="text-center py-2 px-1 font-semibold text-gray-700 text-xs min-w-[80px]">6Q Ago<br/><span className="text-xs text-gray-400 font-normal">Trend %</span></th>
                                <th className="text-center py-2 px-1 font-semibold text-gray-700 text-xs min-w-[80px]">5Q Ago<br/><span className="text-xs text-gray-400 font-normal">Trend %</span></th>
                                <th className="text-center py-2 px-1 font-semibold text-gray-700 text-xs min-w-[80px]">4Q Ago<br/><span className="text-xs text-gray-400 font-normal">Trend %</span></th>
                                <th className="text-center py-2 px-1 font-semibold text-gray-700 text-xs min-w-[80px]">3Q Ago<br/><span className="text-xs text-gray-400 font-normal">Trend %</span></th>
                                <th className="text-center py-2 px-1 font-semibold text-gray-700 text-xs min-w-[80px]">2Q Ago<br/><span className="text-xs text-gray-400 font-normal">Trend %</span></th>
                                <th className="text-center py-2 px-1 font-semibold text-gray-700 text-xs min-w-[80px]">1Q Ago<br/><span className="text-xs text-gray-400 font-normal">Trend %</span></th>
                              </>
                            )}
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((metric: ProcessedMetric, index: number) => {
                        const trends = calculateMetricTrend(metric, shortTermPeriods);
                        const trendPercentages = (viewType === 'detailed' || viewType === 'income' || viewType === 'balance' || viewType === 'cashflow') ? calculateTrendPercentages(metric) : null;
                        return (
                          <tr key={metric.name} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} transition-all duration-300`}>
                            <td className="py-2 px-3 min-w-[350px] w-[350px]">
                              {/* Show metric name only */}
                              <div className="font-medium text-gray-900 text-xs">
                                {metric.name}
                              </div>
                            </td>
                            
                            {/* Description column - shown only when toggled on */}
                            {showDescriptions && (
                              <td className="py-2 px-3 min-w-[250px]">
                                <div className="text-xs text-gray-500">
                                  {metric.description}
                                </div>
                              </td>
                            )}
                            
                            {/* Dynamic content based on view mode for financial statements */}
                            {(viewType === 'income' || viewType === 'balance' || viewType === 'cashflow' || viewType === 'detailed') && isRawDataView ? (
                              // Raw Data View - show quarterly data
                              periods.map((period: string) => {
                                const dataPoint = metric.dataPoints.find((dp: FinancialDataPoint) => dp.period === period);
                                return (
                                  <td key={period} className="py-2 px-3 text-right">
                                    <div className="transform transition-all duration-300 ease-in-out">
                                      {dataPoint ? (
                                        <span className="text-xs font-mono text-gray-800">
                                          {formatValue(dataPoint.value, metric.unit)}
                                        </span>
                                      ) : (
                                        <span className="text-gray-500 text-xs">—</span>
                                      )}
                                    </div>
                                  </td>
                                );
                              })
                            ) : (
                              // Summary View - show trends
                              <>
                                <td className="py-2 px-3 text-right">
                                  <div className="transform transition-all duration-300 ease-in-out">
                                    <span className="text-xs font-mono text-gray-800">
                                      {formatValue(trends.latestValue, metric.unit)}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1 transform transition-all duration-300 ease-in-out">
                                    {trends.overallTrend === 'up' && (
                                      <span className="text-green-600 text-xs font-medium">Up</span>
                                    )}
                                    {trends.overallTrend === 'down' && (
                                      <span className="text-red-600 text-xs font-medium">Down</span>
                                    )}
                                    {trends.overallTrend === 'neutral' && (
                                      <span className="text-gray-500 text-xs">Neutral</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1 transform transition-all duration-300 ease-in-out">
                                    {trends.shortTermTrend === 'up' && (
                                      <span className="text-green-600 text-xs font-medium">Up</span>
                                    )}
                                    {trends.shortTermTrend === 'down' && (
                                      <span className="text-red-600 text-xs font-medium">Down</span>
                                    )}
                                    {trends.shortTermTrend === 'neutral' && (
                                      <span className="text-gray-500 text-xs">Flat</span>
                                    )}
                                  </div>
                                </td>
                                {/* Show quarterly trend percentages only in detailed and financial statement views */}
                                {(viewType === 'detailed' || viewType === 'income' || viewType === 'balance' || viewType === 'cashflow') && trendPercentages && (
                                  <>
                                    {[0, 1, 2, 3, 4, 5].map(quarterIndex => {
                                      const trendData = trendPercentages.quarterlyTrends[quarterIndex];
                                      const percent = trendData?.trendPercent || 0;
                                      const isPositive = percent > 0;
                                      const isNegative = percent < 0;
                                      
                                      return (
                                        <td key={quarterIndex} className="py-2 px-1 text-center">
                                          <div className="transform transition-all duration-300 ease-in-out">
                                            <span 
                                              className={`text-xs font-mono ${
                                                isPositive ? 'text-green-600' : 
                                                isNegative ? 'text-red-600' : 
                                                'text-gray-500'
                                              }`}
                                            >
                                              {Math.abs(percent) < 0.1 ? '0%' : 
                                               `${isPositive ? '+' : ''}${percent.toFixed(1)}%`}
                                            </span>
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </>
                                )}
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Table Legend - moved to bottom */}
                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                  <div className="mb-2">
                    <strong>Overall Trend:</strong> Based on parabolic regression across all available data. 
                    <strong> {shortTermPeriods}Q Trend:</strong> Short-term trend over last {shortTermPeriods} quarters using actual reported values (&gt;5% change threshold).
                  </div>
                  {(viewType === 'detailed' || viewType === 'income' || viewType === 'balance' || viewType === 'cashflow') && (
                    <div>
                      📊 <strong>Trend %:</strong> Shows the percentage change between consecutive points on the parabolic trend curve (fitted to all historical data).
                      Note: Short-term trend may show Up while Trend % shows negative values - this indicates the underlying mathematical trend is decelerating even if recent quarters show growth.
                      Green = accelerating trend, Red = decelerating trend.
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Data Table - Hide in detailed view and financial statement views */}
              {viewType !== 'detailed' && viewType !== 'income' && viewType !== 'balance' && viewType !== 'cashflow' && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
                  >
                    <h2 className="text-xl font-bold text-gray-800">Financial Data (Quarterly)</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {isMetricsExpanded ? 'Hide Table' : 'Show Table'}
                    </span>
                    <div className={`transform transition-transform duration-200 ${isMetricsExpanded ? 'rotate-180' : ''}`}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                {isMetricsExpanded && (
                  <div className="mt-4">
                    <div className="overflow-x-auto" ref={scrollContainerRef}>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 min-w-[350px]">
                              Metric
                            </th>
                            {showDescriptions && (
                              <th className="text-left py-3 px-4 font-semibold text-gray-700 min-w-[250px]">Description</th>
                            )}
                            {periods.map((period: string) => {
                              const [year, quarter] = period.split('-');
                              return (
                                <th key={period} className="text-center py-3 px-4 font-semibold text-gray-700 min-w-[140px]">
                                  <div className="text-center">
                                    <div className="text-xs">{year}</div>
                                    <div className="text-xs font-normal text-gray-500">{quarter}</div>
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.map((metric: ProcessedMetric, index: number) => (
                            <tr key={metric.name} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="py-3 px-4 w-[350px]">
                                <div>
                                  <div className="font-medium text-gray-900 text-xs">
                                    {metric.name}
                                  </div>
                                </div>
                              </td>
                              {/* Description column - shown only when toggled on */}
                              {showDescriptions && (
                                <td className="py-3 px-4 min-w-[250px]">
                                  <div className="text-xs text-gray-500">
                                    {metric.description}
                                  </div>
                                </td>
                              )}
                              {periods.map((period: string) => {
                                const dataPoint = metric.dataPoints.find((dp: FinancialDataPoint) => dp.period === period);
                                return (
                                  <td key={period} className="py-3 px-4 text-right">
                                    {dataPoint ? (
                                      <span className="font-mono text-sm text-gray-800">
                                        {formatValue(dataPoint.value, metric.unit)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-500 text-sm">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Legend */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        {viewType === 'detailed' || viewType === 'quarterly'
                          ? `Shows ALL ${metrics.length} available financial metrics from SEC filings. Hover over metric names for descriptions. ` 
                          : `Default View: Shows ${metrics.length} key financial metrics. Use /Ticker.d for detailed view (all ${data.metrics?.length || 'available'} metrics) or /Ticker.q for quarterly table. `
                        }
                        Table shows all available quarterly data. Charts display the last 6 years (24 quarters) for readability.
                        Values are shown in millions (M) or billions (B) where applicable.
                      </p>
                    </div>
                    
                    {isDetailedView && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
                        <p className="text-green-800">
                          🔍 <strong>Detailed View:</strong> Displaying all {metrics.length} available financial metrics. 
                          This includes comprehensive data across all financial statement categories.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
