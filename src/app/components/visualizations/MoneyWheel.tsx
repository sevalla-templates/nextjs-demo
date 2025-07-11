'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';

interface MoneyWheelProps {
  data: any;
  quarter: string;
  ticker: string;
}

const MoneyWheel: React.FC<MoneyWheelProps> = ({ data, quarter, ticker }) => {
  const [rotation, setRotation] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  // Extract real financial data from comprehensive data
  const realData = useMemo(() => {
    if (!data || !data.metrics || !data.periods) {
      return null;
    }

    const getMetricValue = (metricName: string) => {
      const metric = data.metrics.find((m: any) => m.name === metricName);
      if (!metric) return 0;
      const dataPoint = metric.dataPoints.find((dp: any) => dp.period === quarter);
      return dataPoint ? dataPoint.value : 0;
    };

    const getMetricChange = (metricName: string) => {
      const metric = data.metrics.find((m: any) => m.name === metricName);
      if (!metric) return 0;
      
      const currentQuarterIndex = data.periods.indexOf(quarter);
      const previousQuarter = data.periods[currentQuarterIndex + 1];
      
      if (!previousQuarter) return 0;
      
      const currentData = metric.dataPoints.find((dp: any) => dp.period === quarter);
      const previousData = metric.dataPoints.find((dp: any) => dp.period === previousQuarter);
      
      if (!currentData || !previousData || previousData.value === 0) return 0;
      
      return ((currentData.value - previousData.value) / Math.abs(previousData.value)) * 100;
    };

    return {
      // Income Statement
      revenue: { value: getMetricValue('Revenues'), change: getMetricChange('Revenues') },
      grossProfit: { value: getMetricValue('Gross Profit'), change: getMetricChange('Gross Profit') },
      operatingIncome: { value: getMetricValue('Operating Income Loss'), change: getMetricChange('Operating Income Loss') },
      netIncome: { value: getMetricValue('Net Income Loss'), change: getMetricChange('Net Income Loss') },
      costOfRevenue: { value: Math.abs(getMetricValue('Cost Of Goods And Services Sold')), change: getMetricChange('Cost Of Goods And Services Sold') },
      rnd: { value: Math.abs(getMetricValue('Research And Development Expense')), change: getMetricChange('Research And Development Expense') },
      sga: { value: Math.abs(getMetricValue('Selling General And Administrative Expense')), change: getMetricChange('Selling General And Administrative Expense') },
      
      // Balance Sheet
      cash: { value: getMetricValue('Cash And Cash Equivalents At Carrying Value'), change: getMetricChange('Cash And Cash Equivalents At Carrying Value') },
      assets: { value: getMetricValue('Assets'), change: getMetricChange('Assets') },
      currentAssets: { value: getMetricValue('Assets Current'), change: getMetricChange('Assets Current') },
      longTermDebt: { value: Math.abs(getMetricValue('Long Term Debt')), change: getMetricChange('Long Term Debt') },
      stockholdersEquity: { value: getMetricValue('Stockholders Equity'), change: getMetricChange('Stockholders Equity') },
      
      // Cash Flow Statement
      operatingCashFlow: { value: getMetricValue('Net Cash Provided By Used In Operating Activities'), change: getMetricChange('Net Cash Provided By Used In Operating Activities') },
      investingCashFlow: { value: Math.abs(getMetricValue('Net Cash Provided By Used In Investing Activities')), change: getMetricChange('Net Cash Provided By Used In Investing Activities') },
      financingCashFlow: { value: Math.abs(getMetricValue('Net Cash Provided By Used In Financing Activities')), change: getMetricChange('Net Cash Provided By Used In Financing Activities') }
    };
  }, [data, quarter]);

  if (!realData) {
    return <div className="p-8 text-center">No financial data available for visualization</div>;
  }

  const segments = [
    // Income Statement segments
    { id: 'revenue', label: 'Revenue', value: realData.revenue.value, change: realData.revenue.change, color: '#10b981' },
    { id: 'grossProfit', label: 'Gross Profit', value: Math.abs(realData.grossProfit.value), change: realData.grossProfit.change, color: '#059669' },
    { id: 'operatingIncome', label: 'Operating Income', value: Math.abs(realData.operatingIncome.value), change: realData.operatingIncome.change, color: '#047857' },
    { id: 'netIncome', label: 'Net Income', value: Math.abs(realData.netIncome.value), change: realData.netIncome.change, color: '#065f46' },
    { id: 'costOfRevenue', label: 'Cost of Revenue', value: realData.costOfRevenue.value, change: realData.costOfRevenue.change, color: '#ef4444' },
    { id: 'rnd', label: 'R&D', value: realData.rnd.value, change: realData.rnd.change, color: '#8b5cf6' },
    { id: 'sga', label: 'SG&A', value: realData.sga.value, change: realData.sga.change, color: '#3b82f6' },
    
    // Balance Sheet segments
    { id: 'cash', label: 'Cash', value: realData.cash.value, change: realData.cash.change, color: '#14b8a6' },
    { id: 'assets', label: 'Total Assets', value: realData.assets.value, change: realData.assets.change, color: '#f59e0b' },
    { id: 'currentAssets', label: 'Current Assets', value: realData.currentAssets.value, change: realData.currentAssets.change, color: '#d97706' },
    { id: 'longTermDebt', label: 'Long Term Debt', value: realData.longTermDebt.value, change: realData.longTermDebt.change, color: '#dc2626' },
    { id: 'stockholdersEquity', label: 'Stockholders Equity', value: realData.stockholdersEquity.value, change: realData.stockholdersEquity.change, color: '#7c3aed' },
    
    // Cash Flow segments
    { id: 'operatingCashFlow', label: 'Operating Cash Flow', value: Math.abs(realData.operatingCashFlow.value), change: realData.operatingCashFlow.change, color: '#0891b2' },
    { id: 'investingCashFlow', label: 'Investing Cash Flow', value: realData.investingCashFlow.value, change: realData.investingCashFlow.change, color: '#0284c7' },
    { id: 'financingCashFlow', label: 'Financing Cash Flow', value: realData.financingCashFlow.value, change: realData.financingCashFlow.change, color: '#0369a1' }
  ].filter(segment => segment.value > 0); // Only show segments with actual values

  const totalValue = segments.reduce((sum, segment) => sum + segment.value, 0);

  const formatValue = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const createSegmentPath = (segment: any, index: number) => {
    const centerX = 250;
    const centerY = 250;
    const radius = 150;
    const innerRadius = 80;
    
    const percentage = segment.value / totalValue;
    const angle = percentage * 360;
    
    let startAngle = 0;
    for (let i = 0; i < index; i++) {
      startAngle += (segments[i].value / totalValue) * 360;
    }
    
    const endAngle = startAngle + angle;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const outerStartX = centerX + radius * Math.cos(startAngleRad);
    const outerStartY = centerY + radius * Math.sin(startAngleRad);
    const outerEndX = centerX + radius * Math.cos(endAngleRad);
    const outerEndY = centerY + radius * Math.sin(endAngleRad);
    
    const innerStartX = centerX + innerRadius * Math.cos(startAngleRad);
    const innerStartY = centerY + innerRadius * Math.sin(startAngleRad);
    const innerEndX = centerX + innerRadius * Math.cos(endAngleRad);
    const innerEndY = centerY + innerRadius * Math.sin(endAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    return `M ${innerStartX} ${innerStartY} 
            L ${outerStartX} ${outerStartY} 
            A ${radius} ${radius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}
            L ${innerEndX} ${innerEndY} 
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY} Z`;
  };

  const getSegmentCenter = (segment: any, index: number) => {
    const centerX = 250;
    const centerY = 250;
    const radius = 115;
    
    const percentage = segment.value / totalValue;
    const angle = percentage * 360;
    
    let startAngle = 0;
    for (let i = 0; i < index; i++) {
      startAngle += (segments[i].value / totalValue) * 360;
    }
    
    const midAngle = startAngle + angle / 2;
    const midAngleRad = (midAngle * Math.PI) / 180;
    
    const x = centerX + radius * Math.cos(midAngleRad);
    const y = centerY + radius * Math.sin(midAngleRad);
    
    return { x, y };
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">Comprehensive Money Wheel - {ticker}</h3>
        <p className="text-gray-600">Complete financial overview from all three statements</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Wheel Visualization */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <svg width="500" height="500" className="drop-shadow-lg">
              {/* Outer ring */}
              <circle
                cx="250"
                cy="250"
                r="180"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              
              {/* Inner ring */}
              <circle
                cx="250"
                cy="250"
                r="60"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />

              {/* Segments */}
              <g transform={`rotate(${rotation} 250 250)`}>
                {segments.map((segment, index) => {
                  const path = createSegmentPath(segment, index);
                  const center = getSegmentCenter(segment, index);
                  
                  return (
                    <g key={segment.id}>
                      <path
                        d={path}
                        fill={segment.color}
                        stroke="white"
                        strokeWidth="2"
                        opacity={selectedSegment === segment.id ? 1 : 0.8}
                        className="cursor-pointer hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedSegment(selectedSegment === segment.id ? null : segment.id)}
                      />
                      
                      {/* Segment labels */}
                      <text
                        x={center.x}
                        y={center.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {segment.label}
                      </text>
                      
                      <text
                        x={center.x}
                        y={center.y + 15}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="10"
                        className="pointer-events-none"
                      >
                        {formatValue(segment.value)}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Center circle */}
              <circle
                cx="250"
                cy="250"
                r="60"
                fill="#1f2937"
                stroke="white"
                strokeWidth="3"
              />
              
              {/* Center text */}
              <text
                x="250"
                y="240"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
              >
                {ticker}
              </text>
              
              <text
                x="250"
                y="255"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="12"
              >
                {quarter}
              </text>
              
              <text
                x="250"
                y="270"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="10"
              >
                Total: {formatValue(totalValue)}
              </text>
            </svg>

            {/* Rotation control */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setRotation(0)}
                className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                title="Reset rotation"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Segment Details */}
        <div className="w-[500px] bg-white rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-base mb-4">Segment Details</h4>
          
          <div className="grid grid-cols-3 gap-2 max-h-none">
            {segments.map((segment) => (
              <div
                key={segment.id}
                className={`p-2 rounded border cursor-pointer transition-all text-sm ${
                  selectedSegment === segment.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedSegment(selectedSegment === segment.id ? null : segment.id)}
              >
                <div className="flex items-start space-x-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: segment.color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-xs mb-1">{segment.label}</div>
                    <div className="flex items-center space-x-1 mb-1">
                      {segment.change > 0 ? (
                        <TrendingUp className="text-green-600" size={8} />
                      ) : (
                        <TrendingDown className="text-red-600" size={8} />
                      )}
                      <span className={`text-xs font-semibold ${segment.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {segment.change > 0 ? '+' : ''}{segment.change.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{formatValue(segment.value)}</div>
                    <div className="text-xs text-gray-500">
                      {((segment.value / totalValue) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Segment Details */}
      {selectedSegment && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          {(() => {
            const segment = segments.find(s => s.id === selectedSegment);
            if (!segment) return null;
            
            return (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  ></div>
                  <h4 className="font-semibold">{segment.label} - Detailed View</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Current Value:</span>
                    <div className="font-semibold text-lg">{formatValue(segment.value)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Change:</span>
                    <div className={`font-semibold text-lg ${segment.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {segment.change > 0 ? '+' : ''}{segment.change.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Percentage of Total:</span>
                    <div className="font-semibold text-lg">
                      {((segment.value / totalValue) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default MoneyWheel;
