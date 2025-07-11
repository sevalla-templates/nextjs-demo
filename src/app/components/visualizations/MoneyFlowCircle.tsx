'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, DollarSign } from 'lucide-react';

interface MoneyFlowCircleProps {
  data: any;
  quarter: string;
  ticker: string;
}

const MoneyFlowCircle: React.FC<MoneyFlowCircleProps> = ({ data, quarter, ticker }) => {
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Extract real financial data from comprehensive data
  const realData = useMemo(() => {
    if (!data || !data.metrics) {
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

    // Get key financial metrics from all three statements
    return {
      // Income Statement
      revenue: { value: getMetricValue('Revenues'), change: getMetricChange('Revenues') },
      grossProfit: { value: getMetricValue('Gross Profit'), change: getMetricChange('Gross Profit') },
      operatingIncome: { value: getMetricValue('Operating Income Loss'), change: getMetricChange('Operating Income Loss') },
      netIncome: { value: getMetricValue('Net Income Loss'), change: getMetricChange('Net Income Loss') },
      costOfRevenue: { value: getMetricValue('Cost Of Goods And Services Sold'), change: getMetricChange('Cost Of Goods And Services Sold') },
      rnd: { value: getMetricValue('Research And Development Expense'), change: getMetricChange('Research And Development Expense') },
      sga: { value: getMetricValue('Selling General And Administrative Expense'), change: getMetricChange('Selling General And Administrative Expense') },
      
      // Balance Sheet
      cash: { value: getMetricValue('Cash And Cash Equivalents At Carrying Value'), change: getMetricChange('Cash And Cash Equivalents At Carrying Value') },
      assets: { value: getMetricValue('Assets'), change: getMetricChange('Assets') },
      currentAssets: { value: getMetricValue('Assets Current'), change: getMetricChange('Assets Current') },
      longTermDebt: { value: getMetricValue('Long Term Debt'), change: getMetricChange('Long Term Debt') },
      stockholdersEquity: { value: getMetricValue('Stockholders Equity'), change: getMetricChange('Stockholders Equity') },
      
      // Cash Flow Statement
      operatingCashFlow: { value: getMetricValue('Net Cash Provided By Used In Operating Activities'), change: getMetricChange('Net Cash Provided By Used In Operating Activities') },
      investingCashFlow: { value: getMetricValue('Net Cash Provided By Used In Investing Activities'), change: getMetricChange('Net Cash Provided By Used In Investing Activities') },
      financingCashFlow: { value: getMetricValue('Net Cash Provided By Used In Financing Activities'), change: getMetricChange('Net Cash Provided By Used In Financing Activities') }
    };
  }, [data, quarter]);

  if (!realData) {
    return <div className="p-8 text-center">No financial data available for visualization</div>;
  }

  const flows = [
    { from: 'Revenue', to: 'Cost of Revenue', amount: Math.abs(realData.costOfRevenue.value), color: 'red' },
    { from: 'Revenue', to: 'R&D', amount: Math.abs(realData.rnd.value), color: 'blue' },
    { from: 'Revenue', to: 'SG&A', amount: Math.abs(realData.sga.value), color: 'orange' },
    { from: 'Revenue', to: 'Gross Profit', amount: Math.abs(realData.grossProfit.value), color: 'green' },
    { from: 'Gross Profit', to: 'Operating Income', amount: Math.abs(realData.operatingIncome.value), color: 'darkgreen' },
    { from: 'Operating Income', to: 'Net Income', amount: Math.abs(realData.netIncome.value), color: 'emerald' },
    { from: 'Operating Income', to: 'Operating Cash Flow', amount: Math.abs(realData.operatingCashFlow.value), color: 'teal' },
    { from: 'Operating Cash Flow', to: 'Cash', amount: Math.abs(realData.cash.value) * 0.1, color: 'gold' }
  ];

  const nodes = [
    { id: 'Revenue', x: 400, y: 80, value: realData.revenue.value, change: realData.revenue.change, color: 'bg-green-500' },
    { id: 'Cost of Revenue', x: 150, y: 200, value: realData.costOfRevenue.value, change: realData.costOfRevenue.change, color: 'bg-red-500' },
    { id: 'R&D', x: 650, y: 200, value: realData.rnd.value, change: realData.rnd.change, color: 'bg-blue-500' },
    { id: 'SG&A', x: 100, y: 380, value: realData.sga.value, change: realData.sga.change, color: 'bg-orange-500' },
    { id: 'Gross Profit', x: 400, y: 200, value: realData.grossProfit.value, change: realData.grossProfit.change, color: 'bg-green-400' },
    { id: 'Operating Income', x: 400, y: 320, value: realData.operatingIncome.value, change: realData.operatingIncome.change, color: 'bg-green-600' },
    { id: 'Net Income', x: 280, y: 450, value: realData.netIncome.value, change: realData.netIncome.change, color: 'bg-emerald-600' },
    { id: 'Operating Cash Flow', x: 520, y: 450, value: realData.operatingCashFlow.value, change: realData.operatingCashFlow.change, color: 'bg-teal-500' },
    { id: 'Cash', x: 700, y: 380, value: realData.cash.value, change: realData.cash.change, color: 'bg-yellow-500' }
  ];

  const formatValue = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getNodeSize = (value: number, change: number) => {
    const baseSize = 40;
    const maxSize = 120;
    const minSize = 20;
    
    // Calculate size based on both value and change magnitude
    const maxValue = Math.max(...nodes.map(n => n.value));
    const maxChange = Math.max(...nodes.map(n => Math.abs(n.change)));
    
    // Weight change more heavily than value for dramatic effect
    const valueWeight = 0.3;
    const changeWeight = 0.7;
    
    // Normalize value
    const normalizedValue = Math.log(Math.abs(value) + 1) / Math.log(maxValue + 1);
    
    // Normalize change with higher sensitivity
    const normalizedChange = Math.abs(change) / (maxChange + 1);
    
    // Combine both factors
    const combinedFactor = (valueWeight * normalizedValue) + (changeWeight * normalizedChange);
    
    // Apply exponential scaling for more dramatic differences
    const scaledFactor = Math.pow(combinedFactor, 1.5);
    
    return Math.max(minSize, baseSize + (scaledFactor * (maxSize - baseSize)));
  };

  const getFlowWidth = (amount: number, fromNode?: any, toNode?: any) => {
    const maxFlow = Math.max(...flows.map(f => f.amount));
    const minWidth = 2;
    const maxWidth = 16;
    
    // Use logarithmic scale for more pronounced differences
    const normalizedAmount = Math.log(amount + 1) / Math.log(maxFlow + 1);
    
    // If we have node information, factor in their changes for more dynamic flow
    let changeFactor = 1;
    if (fromNode && toNode) {
      const avgChange = Math.abs((fromNode.change + toNode.change) / 2);
      changeFactor = 1 + (avgChange / 100); // Boost based on average change
    }
    
    return Math.max(minWidth, (minWidth + normalizedAmount * (maxWidth - minWidth)) * changeFactor);
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">Comprehensive Money Flow - {ticker}</h3>
        <p className="text-gray-600">Watch money flow through all business areas using complete financial data</p>
      </div>

      <div className="flex gap-6">
        {/* Flow Visualization */}
        <div className="flex-1 relative bg-gray-50 rounded-lg p-8" style={{ height: '650px' }}>
          {/* Flow Lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            {flows.map((flow, index) => {
              const fromNode = nodes.find(n => n.id === flow.from);
              const toNode = nodes.find(n => n.id === flow.to);
              if (!fromNode || !toNode) return null;

              const flowWidth = getFlowWidth(flow.amount, fromNode, toNode);
              const animationOffset = (animationStep * 2) % 100;

              return (
                <g key={index}>
                  {/* Flow line */}
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={flow.color === 'green' ? '#10b981' : 
                            flow.color === 'blue' ? '#3b82f6' :
                            flow.color === 'orange' ? '#f59e0b' :
                            flow.color === 'purple' ? '#8b5cf6' :
                            flow.color === 'red' ? '#ef4444' :
                            flow.color === 'teal' ? '#14b8a6' :
                            '#eab308'}
                    strokeWidth={flowWidth}
                    opacity={0.6}
                  />
                  
                  {/* Animated flow particles */}
                  <circle
                    cx={fromNode.x + (toNode.x - fromNode.x) * (animationOffset / 100)}
                    cy={fromNode.y + (toNode.y - fromNode.y) * (animationOffset / 100)}
                    r={flowWidth / 2}
                    fill={flow.color === 'green' ? '#10b981' : 
                          flow.color === 'blue' ? '#3b82f6' :
                          flow.color === 'orange' ? '#f59e0b' :
                          flow.color === 'purple' ? '#8b5cf6' :
                          flow.color === 'red' ? '#ef4444' :
                          flow.color === 'teal' ? '#14b8a6' :
                          '#eab308'}
                    opacity={0.8}
                  />
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const size = getNodeSize(node.value, node.change);
            return (
              <div
                key={node.id}
                className={`absolute ${node.color} rounded-full flex flex-col items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 transition-transform`}
                style={{
                  left: `${node.x - size/2}px`,
                  top: `${node.y - size/2}px`,
                  width: `${size}px`,
                  height: `${size}px`,
                  zIndex: 2
                }}
              >
                <DollarSign size={16} />
                <div className="text-xs font-semibold text-center px-1">{node.id}</div>
                <div className="text-xs">{formatValue(node.value)}</div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg" style={{ zIndex: 3 }}>
            <h4 className="font-semibold mb-2">Flow Legend</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-green-500 rounded"></div>
                <span className="text-xs">Revenue to Operations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-blue-500 rounded"></div>
                <span className="text-xs">Revenue to R&D</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-purple-500 rounded"></div>
                <span className="text-xs">Operations to Investments</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-yellow-500 rounded"></div>
                <span className="text-xs">Cash to Profit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Flow Summary - Right Side */}
        <div className="w-96 space-y-3">
          <h4 className="font-semibold text-lg">Flow Summary</h4>
          <div className="grid grid-cols-4 gap-2">
            {flows.map((flow, index) => (
              <div key={index} className="bg-white p-2 rounded-lg border shadow-sm">
                <div className="flex items-center space-x-1 mb-1">
                  <ArrowRight size={12} />
                  <span className="text-xs font-medium truncate">{flow.from} → {flow.to}</span>
                </div>
                <div className="text-sm font-semibold">{formatValue(flow.amount)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Flow width reflects magnitude
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyFlowCircle;
