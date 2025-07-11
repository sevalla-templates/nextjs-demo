'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FinancialHeatmapProps {
  data: any;
  quarter: string;
  ticker: string;
}

const FinancialHeatmap: React.FC<FinancialHeatmapProps> = ({ data, quarter, ticker }) => {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  // Process actual financial data to create meaningful sections
  const processedData = useMemo(() => {
    if (!data || !data.metrics || !data.periods) {
      return { sections: [], maxValue: 0 };
    }

    // Group metrics by financial statement
    const incomeMetrics = data.metrics.filter((m: any) => m.statement === 'income');
    const balanceMetrics = data.metrics.filter((m: any) => m.statement === 'balance');
    const cashflowMetrics = data.metrics.filter((m: any) => m.statement === 'cashflow');

    // Get current quarter index
    const currentQuarterIndex = data.periods.indexOf(quarter);
    const previousQuarter = data.periods[currentQuarterIndex + 1]; // Next in array = previous in time

    let maxValue = 0;
    
    const createSection = (sectionName: string, metrics: any[]) => {
      const items = metrics.map(metric => {
        const currentData = metric.dataPoints.find((dp: any) => dp.period === quarter);
        if (!currentData) return null;

        const value = Math.abs(currentData.value);
        maxValue = Math.max(maxValue, value);

        // Calculate real percentage change
        let change = 0;
        if (previousQuarter) {
          const previousData = metric.dataPoints.find((dp: any) => dp.period === previousQuarter);
          if (previousData && previousData.value !== 0) {
            change = ((currentData.value - previousData.value) / Math.abs(previousData.value)) * 100;
          }
        }

        return {
          id: metric.name.toLowerCase().replace(/\s+/g, '_'),
          label: metric.name,
          value: currentData.value,
          change: change,
          unit: metric.unit || 'USD'
        };
      }).filter(Boolean);

      return {
        id: sectionName.toLowerCase().replace(/\s+/g, '_'),
        label: sectionName.toUpperCase(),
        items: items.filter(item => item !== null)
      };
    };

    const sections = [
      createSection('Income Statement', incomeMetrics),
      createSection('Balance Sheet', balanceMetrics),
      createSection('Cash Flow Statement', cashflowMetrics)
    ].filter(section => section.items.length > 0);

    return { sections, maxValue };
  }, [data, quarter]);

  // Helper functions
  const formatValue = (value: number, unit: string = 'USD') => {
    if (value === 0) return '$0';
    const absValue = Math.abs(value);
    if (absValue >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (absValue >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (absValue >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (absValue >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatChange = (change: number) => {
    if (change === 0) return '0%';
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getChangeColor = (change: number) => {
    if (change === 0) return 'text-gray-500';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change: number) => {
    if (change === 0) return <Minus className="w-3 h-3" />;
    return change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
  };

  const getCellColorClass = (change: number) => {
    if (change === 0) return 'bg-gray-500';
    const intensity = Math.abs(change);
    if (change > 0) {
      if (intensity >= 20) return 'bg-green-600';
      if (intensity >= 10) return 'bg-green-500';
      if (intensity >= 5) return 'bg-green-400';
      return 'bg-green-300';
    } else {
      if (intensity >= 20) return 'bg-red-600';
      if (intensity >= 10) return 'bg-red-500';
      if (intensity >= 5) return 'bg-red-400';
      return 'bg-red-300';
    }
  };

  // Calculate optimal grid dimensions for each section
  const getGridDimensions = (itemCount: number) => {
    if (itemCount <= 4) return { cols: 2, rows: 2 };
    if (itemCount <= 9) return { cols: 3, rows: 3 };
    if (itemCount <= 16) return { cols: 4, rows: 4 };
    if (itemCount <= 25) return { cols: 5, rows: 5 };
    return { cols: 6, rows: Math.ceil(itemCount / 6) };
  };

  return (
    <div className="w-full h-full p-6 bg-white">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Comprehensive Financial Heatmap</h3>
        <p className="text-sm text-gray-600">
          Box size reflects absolute value magnitude, color intensity shows percentage change from previous quarter.
          Displays all metrics from Income Statement, Balance Sheet, and Cash Flow Statement for {quarter}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">
        {processedData.sections.map((section) => {
          const { cols, rows } = getGridDimensions(section.items.length);
          const cellSize = Math.min(200 / cols, 200 / rows); // Adaptive cell size
          
          return (
            <div key={section.id} className="border-2 border-gray-800 bg-gray-50 flex flex-col">
              <h4 className="text-sm font-bold p-3 text-gray-700 bg-gray-100 border-b-2 border-gray-800">
                {section.label}
              </h4>
              <div 
                className="flex-1 p-0 grid gap-0"
                style={{ 
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                  minHeight: '400px'
                }}
              >
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className={`
                      ${getCellColorClass(item.change)}
                      border border-gray-800 cursor-pointer transition-all duration-200
                      hover:brightness-110 hover:z-10 hover:scale-105 hover:shadow-lg
                      ${selectedCell === item.id ? 'ring-2 ring-blue-500 z-20' : ''}
                      flex flex-col justify-center items-center p-2
                    `}
                    onClick={() => setSelectedCell(selectedCell === item.id ? null : item.id)}
                  >
                    <div className="text-center h-full flex flex-col justify-center">
                      <div className="font-medium text-white text-xs leading-tight mb-1">
                        {item.label.length > 20 ? item.label.substring(0, 20) + '...' : item.label}
                      </div>
                      <div className="font-bold text-white text-sm mb-1">
                        {formatValue(item.value)}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-white">
                        {getChangeIcon(item.change)}
                        <span className="text-xs font-medium">{formatChange(item.change)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Fill empty cells if needed */}
                {Array.from({ length: (cols * rows) - section.items.length }, (_, i) => (
                  <div key={`empty-${i}`} className="bg-gray-200 border border-gray-800"></div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedCell && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold mb-2">Selected Metric Details</h4>
          {processedData.sections.map((section) => {
            const item = section.items.find(i => i.id === selectedCell);
            if (!item) return null;
            return (
              <div key={item.id} className="text-sm">
                <div className="font-medium">{item.label}</div>
                <div className="text-gray-600">
                  Current Value: {formatValue(item.value)} | 
                  Change: {formatChange(item.change)} | 
                  Quarter: {quarter}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FinancialHeatmap;
