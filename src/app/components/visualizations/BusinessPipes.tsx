'use client';

import React, { useState } from 'react';
import { Droplets, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface BusinessPipesProps {
  data: any;
  quarter: string;
  ticker: string;
}

const BusinessPipes: React.FC<BusinessPipesProps> = ({ data, quarter, ticker }) => {
  const [selectedPipe, setSelectedPipe] = useState<string | null>(null);

  const pipes = [
    {
      id: 'revenue',
      label: 'Revenue Pipe',
      value: data.revenue,
      change: data.revenueChange,
      type: 'input',
      color: 'bg-green-500',
      description: 'Money flowing into the business'
    },
    {
      id: 'operations',
      label: 'Operations Pipe',
      value: data.operatingExpenses,
      change: data.opexChange,
      type: 'main',
      color: 'bg-blue-500',
      description: 'Main business operations'
    },
    {
      id: 'rd',
      label: 'R&D Pipe',
      value: data.rnd,
      change: data.rdChange,
      type: 'branch',
      color: 'bg-purple-500',
      description: 'Investment in future products'
    },
    {
      id: 'inventory',
      label: 'Inventory Tank',
      value: data.inventory,
      change: data.inventoryChange,
      type: 'storage',
      color: 'bg-orange-500',
      description: 'Products waiting to be sold'
    },
    {
      id: 'investments',
      label: 'Investment Pipe',
      value: data.investments,
      change: data.investmentsChange,
      type: 'branch',
      color: 'bg-indigo-500',
      description: 'Money for growth and expansion'
    },
    {
      id: 'debt',
      label: 'Debt Pipe',
      value: data.debt,
      change: data.debtChange,
      type: 'drain',
      color: 'bg-red-500',
      description: 'Money owed to others'
    },
    {
      id: 'cash',
      label: 'Cash Tank',
      value: data.cash,
      change: data.cashChange,
      type: 'storage',
      color: 'bg-teal-500',
      description: 'Money available for use'
    },
    {
      id: 'profit',
      label: 'Profit Pipe',
      value: data.revenue * 0.15,
      change: data.revenueChange,
      type: 'output',
      color: 'bg-yellow-500',
      description: 'Money kept by the business'
    }
  ];

  const formatValue = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getPipeWidth = (value: number) => {
    const maxValue = Math.max(...pipes.map(p => p.value));
    const minWidth = 20;
    const maxWidth = 80;
    return minWidth + (value / maxValue) * (maxWidth - minWidth);
  };

  const getPipeHeight = (type: string) => {
    switch (type) {
      case 'input':
      case 'output':
        return 60;
      case 'main':
        return 80;
      case 'branch':
        return 40;
      case 'storage':
        return 100;
      case 'drain':
        return 30;
      default:
        return 50;
    }
  };

  const getStatusIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="text-green-600" size={16} />;
    if (change < -5) return <TrendingDown className="text-red-600" size={16} />;
    return <AlertTriangle className="text-yellow-600" size={16} />;
  };

  const getFlowAnimation = (type: string) => {
    switch (type) {
      case 'input':
        return 'animate-pulse';
      case 'main':
        return 'animate-bounce';
      case 'storage':
        return 'animate-ping';
      case 'drain':
        return 'animate-pulse';
      default:
        return '';
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">Business Pipes - {ticker}</h3>
        <p className="text-gray-600">Company as a plumbing system - see where money flows</p>
      </div>

      <div className="relative bg-gray-50 rounded-lg p-8" style={{ height: '600px' }}>
        {/* Pipe System Layout */}
        <div className="absolute inset-0 p-8">
          {/* Input Pipes (Top) */}
          <div className="flex justify-center mb-8">
            {pipes.filter(p => p.type === 'input').map((pipe) => (
              <div
                key={pipe.id}
                className={`${pipe.color} rounded-lg mx-2 cursor-pointer hover:scale-105 transition-transform ${getFlowAnimation(pipe.type)}`}
                style={{
                  width: `${getPipeWidth(pipe.value)}px`,
                  height: `${getPipeHeight(pipe.type)}px`
                }}
                onClick={() => setSelectedPipe(selectedPipe === pipe.id ? null : pipe.id)}
              >
                <div className="h-full flex flex-col items-center justify-center text-white text-xs font-semibold">
                  <Droplets size={20} />
                  <div>{pipe.label}</div>
                  <div>{formatValue(pipe.value)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Pipes (Center) */}
          <div className="flex justify-center mb-8">
            {pipes.filter(p => p.type === 'main').map((pipe) => (
              <div
                key={pipe.id}
                className={`${pipe.color} rounded-lg mx-2 cursor-pointer hover:scale-105 transition-transform ${getFlowAnimation(pipe.type)}`}
                style={{
                  width: `${getPipeWidth(pipe.value)}px`,
                  height: `${getPipeHeight(pipe.type)}px`
                }}
                onClick={() => setSelectedPipe(selectedPipe === pipe.id ? null : pipe.id)}
              >
                <div className="h-full flex flex-col items-center justify-center text-white text-xs font-semibold">
                  <Droplets size={24} />
                  <div>{pipe.label}</div>
                  <div>{formatValue(pipe.value)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Branch Pipes (Left and Right) */}
          <div className="flex justify-between mb-8">
            {pipes.filter(p => p.type === 'branch').map((pipe, index) => (
              <div
                key={pipe.id}
                className={`${pipe.color} rounded-lg cursor-pointer hover:scale-105 transition-transform ${getFlowAnimation(pipe.type)}`}
                style={{
                  width: `${getPipeWidth(pipe.value)}px`,
                  height: `${getPipeHeight(pipe.type)}px`
                }}
                onClick={() => setSelectedPipe(selectedPipe === pipe.id ? null : pipe.id)}
              >
                <div className="h-full flex flex-col items-center justify-center text-white text-xs font-semibold">
                  <Droplets size={16} />
                  <div>{pipe.label}</div>
                  <div>{formatValue(pipe.value)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Storage Tanks (Bottom Center) */}
          <div className="flex justify-center mb-8">
            {pipes.filter(p => p.type === 'storage').map((pipe) => (
              <div
                key={pipe.id}
                className={`${pipe.color} rounded-lg mx-2 cursor-pointer hover:scale-105 transition-transform ${getFlowAnimation(pipe.type)}`}
                style={{
                  width: `${getPipeWidth(pipe.value)}px`,
                  height: `${getPipeHeight(pipe.type)}px`
                }}
                onClick={() => setSelectedPipe(selectedPipe === pipe.id ? null : pipe.id)}
              >
                <div className="h-full flex flex-col items-center justify-center text-white text-xs font-semibold">
                  <Droplets size={20} />
                  <div>{pipe.label}</div>
                  <div>{formatValue(pipe.value)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Output and Drain Pipes (Bottom) */}
          <div className="flex justify-between">
            {pipes.filter(p => p.type === 'output' || p.type === 'drain').map((pipe) => (
              <div
                key={pipe.id}
                className={`${pipe.color} rounded-lg cursor-pointer hover:scale-105 transition-transform ${getFlowAnimation(pipe.type)}`}
                style={{
                  width: `${getPipeWidth(pipe.value)}px`,
                  height: `${getPipeHeight(pipe.type)}px`
                }}
                onClick={() => setSelectedPipe(selectedPipe === pipe.id ? null : pipe.id)}
              >
                <div className="h-full flex flex-col items-center justify-center text-white text-xs font-semibold">
                  <Droplets size={16} />
                  <div>{pipe.label}</div>
                  <div>{formatValue(pipe.value)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Revenue to Operations */}
          <line x1="50%" y1="80" x2="50%" y2="160" stroke="#6b7280" strokeWidth="2" strokeDasharray="5,5" />
          {/* Operations to branches */}
          <line x1="50%" y1="240" x2="20%" y2="320" stroke="#6b7280" strokeWidth="2" strokeDasharray="5,5" />
          <line x1="50%" y1="240" x2="80%" y2="320" stroke="#6b7280" strokeWidth="2" strokeDasharray="5,5" />
          {/* To storage */}
          <line x1="50%" y1="240" x2="50%" y2="400" stroke="#6b7280" strokeWidth="2" strokeDasharray="5,5" />
          {/* To outputs */}
          <line x1="50%" y1="500" x2="20%" y2="580" stroke="#6b7280" strokeWidth="2" strokeDasharray="5,5" />
          <line x1="50%" y1="500" x2="80%" y2="580" stroke="#6b7280" strokeWidth="2" strokeDasharray="5,5" />
        </svg>
      </div>

      {/* Selected Pipe Details */}
      {selectedPipe && (
        <div className="mt-4 bg-blue-50 p-4 rounded-lg">
          {(() => {
            const pipe = pipes.find(p => p.id === selectedPipe);
            if (!pipe) return null;
            
            return (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-4 h-4 ${pipe.color} rounded`}></div>
                  <h4 className="font-semibold">{pipe.label}</h4>
                  {getStatusIcon(pipe.change)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{pipe.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Current Value:</span>
                    <div className="font-semibold">{formatValue(pipe.value)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Change:</span>
                    <div className="font-semibold">
                      {pipe.change > 0 ? '+' : ''}{pipe.change.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Pipe Legend */}
      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Pipe System Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Input (Revenue)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">Main Operations</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-teal-500 rounded"></div>
            <span className="text-sm">Storage (Cash/Inventory)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">Drain (Debt)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPipes;
