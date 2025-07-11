"use client";
import { useState, useEffect, useRef } from 'react';

interface TickerSearchProps {
  onTickerSelect: (ticker: string, viewType?: string) => void;
  onClear: () => void;
  selectedTicker: string | null;
  currentView?: string;
  companyData?: any;
}

export default function TickerSearch({ onTickerSelect, onClear, selectedTicker, currentView, companyData }: TickerSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTickers, setFilteredTickers] = useState<string[]>([]);
  const [availableTickers, setAvailableTickers] = useState<Record<string, { cik: string; title: string }>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load available tickers
  useEffect(() => {
    const loadTickers = async () => {
      try {
        const response = await fetch('/api/tickers');
        if (response.ok) {
          const data = await response.json();
          setAvailableTickers(data);
        }
      } catch (error) {
        console.error('Failed to load tickers:', error);
      }
    };
    loadTickers();
  }, []);

  // Filter tickers based on search term
  const filterTickers = (term: string) => {
    if (!term) {
      setFilteredTickers([]);
      return;
    }
    const upperTerm = term.toUpperCase();
    const results = Object.keys(availableTickers).filter(ticker => 
      ticker.includes(upperTerm) || 
      availableTickers[ticker].title.toUpperCase().includes(upperTerm)
    ).slice(0, 10);
    setFilteredTickers(results);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === '/' && !isOpen) {
        event.preventDefault();
        setIsOpen(true);
        setSearchTerm('');
        setFilteredTickers([]);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      } else if (event.key === '=' && !isOpen && selectedTicker) {
        event.preventDefault();
        onClear();
      } else if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
        setFilteredTickers([]);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, selectedTicker, onClear]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterTickers(term);
  };

  const handleTickerClick = (ticker: string) => {
    // Parse view type from suffix
    const lowerTicker = ticker.toLowerCase();
    let viewType = 'default';
    let cleanTicker = ticker;
    
    if (lowerTicker.endsWith('.d')) {
      viewType = 'detailed';
      cleanTicker = ticker.slice(0, -2);
    } else if (lowerTicker.endsWith('.q')) {
      viewType = 'quarterly';
      cleanTicker = ticker.slice(0, -2);
    } else if (lowerTicker.endsWith('.ch')) {
      viewType = 'charts';
      cleanTicker = ticker.slice(0, -3);
    } else if (lowerTicker.endsWith('.v')) {
      viewType = 'visualization';
      cleanTicker = ticker.slice(0, -2);
    } else if (lowerTicker.endsWith('.i')) {
      viewType = 'income';
      cleanTicker = ticker.slice(0, -2);
    } else if (lowerTicker.endsWith('.b')) {
      viewType = 'balance';
      cleanTicker = ticker.slice(0, -2);
    } else if (lowerTicker.endsWith('.c')) {
      viewType = 'cashflow';
      cleanTicker = ticker.slice(0, -2);
    }
    
    setIsOpen(false);
    setSearchTerm('');
    setFilteredTickers([]);
    onTickerSelect(cleanTicker, viewType);
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const term = searchTerm.trim().toUpperCase();
      
      // Parse view type from suffix
      let viewType = 'default';
      let cleanTerm = term;
      
      if (term.endsWith('.D')) {
        viewType = 'detailed';
        cleanTerm = term.slice(0, -2);
      } else if (term.endsWith('.Q')) {
        viewType = 'quarterly';
        cleanTerm = term.slice(0, -2);
      } else if (term.endsWith('.CH')) {
        viewType = 'charts';
        cleanTerm = term.slice(0, -3);
      } else if (term.endsWith('.V')) {
        viewType = 'visualization';
        cleanTerm = term.slice(0, -2);
      } else if (term.endsWith('.I')) {
        viewType = 'income';
        cleanTerm = term.slice(0, -2);
      } else if (term.endsWith('.B')) {
        viewType = 'balance';
        cleanTerm = term.slice(0, -2);
      } else if (term.endsWith('.C')) {
        viewType = 'cashflow';
        cleanTerm = term.slice(0, -2);
      }
      
      if (filteredTickers.length > 0) {
        handleTickerClick(filteredTickers[0]);
      } else if (cleanTerm && availableTickers[cleanTerm]) {
        setIsOpen(false);
        setSearchTerm('');
        setFilteredTickers([]);
        onTickerSelect(cleanTerm, viewType);
      }
    }
  };

  // Helper function to format values compactly
  function formatCompact(value: number, unit: string): string {
    if (unit === 'USD') {
      if (Math.abs(value) >= 1e9) {
        return `$${(value / 1e9).toFixed(1)}B`;
      } else if (Math.abs(value) >= 1e6) {
        return `$${(value / 1e6).toFixed(1)}M`;
      } else if (Math.abs(value) >= 1e3) {
        return `$${(value / 1e3).toFixed(1)}K`;
      } else {
        return `$${value.toLocaleString()}`;
      }
    } else if (unit === 'USD/shares') {
      return `$${value.toFixed(2)}`;
    } else if (unit === 'shares') {
      if (Math.abs(value) >= 1e9) {
        return `${(value / 1e9).toFixed(1)}B`;
      } else if (Math.abs(value) >= 1e6) {
        return `${(value / 1e6).toFixed(1)}M`;
      }
      return value.toLocaleString();
    } else {
      return value.toLocaleString();
    }
  }

  // Helper function to extract key metrics from company data
  function extractKeyMetrics(data: any) {
    if (!data) return null;

    const metrics: any = {};

    // CIK
    metrics.cik = data.cik;

    // Public Float
    if (data.facts?.dei?.EntityPublicFloat?.units?.USD?.length > 0) {
      metrics.publicFloat = formatCompact(data.facts.dei.EntityPublicFloat.units.USD[0].val, 'USD');
    }

    // Shares Outstanding
    if (data.facts?.dei?.EntityCommonStockSharesOutstanding?.units?.shares?.length > 0) {
      metrics.sharesOutstanding = formatCompact(data.facts.dei.EntityCommonStockSharesOutstanding.units.shares[0].val, 'shares');
    }

    // Latest EPS, Revenue, and Weighted Average Shares from metrics
    if (data.metrics && data.metrics.length > 0) {
      // Find latest EPS
      const epsMetric = data.metrics.find((m: any) => 
        m.name.includes('Earnings Per Share Basic') || m.name.includes('EPS Basic')
      );
      if (epsMetric && epsMetric.dataPoints.length > 0) {
        const latestEps = epsMetric.dataPoints[0]; // Assuming sorted by latest first
        metrics.latestEps = formatCompact(latestEps.value, epsMetric.unit);
      }

      // Find latest Revenue
      const revenueMetric = data.metrics.find((m: any) => 
        m.name.includes('Revenues') || m.name.includes('Revenue')
      );
      if (revenueMetric && revenueMetric.dataPoints.length > 0) {
        const latestRevenue = revenueMetric.dataPoints[0];
        metrics.latestRevenue = formatCompact(latestRevenue.value, revenueMetric.unit);
      }

      // Find Weighted Average Shares Outstanding Basic
      const sharesBasicMetric = data.metrics.find((m: any) => 
        m.name.includes('Weighted Average Number Of Shares Outstanding Basic')
      );
      if (sharesBasicMetric && sharesBasicMetric.dataPoints.length > 0) {
        const latestShares = sharesBasicMetric.dataPoints[0];
        metrics.weightedAvgShares = formatCompact(latestShares.value, 'shares');
      }
    }

    return metrics;
  }

  if (!isOpen && !selectedTicker) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Financial Data Lookup</h1>
          <p className="text-gray-600 mb-8">Press "/" to search for any ticker symbol</p>
          <div className="text-sm text-gray-500 space-y-2">
            <p>Examples: AAPL, MSFT, TSLA, GOOGL</p>
            <p className="text-blue-600">View types:</p>
            <div className="text-xs space-y-1 text-left max-w-md mx-auto">
              <p>• Default: <code>AAPL</code> - Key metrics overview</p>
              <p>• Detailed: <code>AAPL.d</code> - All metrics with trends</p>
              <p>• Quarterly: <code>AAPL.q</code> - Grouped quarterly table</p>
              <p>• Income: <code>AAPL.i</code> - Income statement metrics</p>
              <p>• Balance: <code>AAPL.b</code> - Balance sheet metrics</p>
              <p>• Cash Flow: <code>AAPL.c</code> - Cash flow metrics</p>
              <p>• Charts: <code>AAPL.ch</code> - All metrics as charts</p>
              <p>• Visualization: <code>AAPL.v</code> - Financial flow analysis</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen && selectedTicker) {
    const getViewDisplayName = (view?: string) => {
      switch (view) {
        case 'quarterly': return 'Quarterly Data';
        case 'income': return 'Income Statement';
        case 'balance': return 'Balance Sheet';
        case 'cashflow': return 'Cash Flow';
        case 'detailed': return 'Detailed View';
        default: return 'Overview';
      }
    };

    const keyMetrics = extractKeyMetrics(companyData);

    return (
      <div className="w-full bg-white border-b border-gray-200">
        <div className="w-[90%] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedTicker}
                </h1>
                <div className="text-sm text-gray-600">
                  {availableTickers[selectedTicker]?.title || 'Loading...'}
                </div>
              </div>
              
              {/* Compact Key Metrics */}
              {keyMetrics && (
                <div className="flex items-center gap-4 text-xs text-gray-700">
                  {keyMetrics.cik && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">CIK:</span>
                      <span className="font-mono">{keyMetrics.cik}</span>
                    </div>
                  )}
                  {keyMetrics.publicFloat && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Float:</span>
                      <span className="font-mono">{keyMetrics.publicFloat}</span>
                    </div>
                  )}
                  {keyMetrics.sharesOutstanding && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Shares:</span>
                      <span className="font-mono">{keyMetrics.sharesOutstanding}</span>
                    </div>
                  )}
                  {keyMetrics.latestEps && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">EPS:</span>
                      <span className="font-mono">{keyMetrics.latestEps}</span>
                    </div>
                  )}
                  {keyMetrics.latestRevenue && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Rev:</span>
                      <span className="font-mono">{keyMetrics.latestRevenue}</span>
                    </div>
                  )}
                  {keyMetrics.weightedAvgShares && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">WtgAvg:</span>
                      <span className="font-mono">{keyMetrics.weightedAvgShares}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Data Available Status */}
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                companyData?.financialData === 'available' 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
              }`}>
                {companyData?.financialData === 'available' ? '📊 Data Available' : '⚠️ Data Not Loaded'}
              </div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium">
                {getViewDisplayName(currentView)}
              </div>
              <button
                onClick={onClear}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
              >
                <span>✕</span>
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mt-20 p-6">
        <div className="flex justify-between items-center mb-4">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Type ticker symbol (e.g., AAPL, MSFT.d for detailed, AAPL.v for visualization, AAPL.i for income statement)..."
            className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleEnter}
          />
          <button
            onClick={() => {
              setIsOpen(false);
              setSearchTerm('');
              setFilteredTickers([]);
            }}
            className="ml-4 p-2 text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4 text-sm text-gray-600">
          <p><strong>Tip:</strong> Add ".d" for detailed view, ".v" for visualization, ".i" for income statement, ".b" for balance sheet, ".c" for cashflow, ".ch" for charts, ".q" for quarterly table (e.g., AAPL.d, AAPL.v, AAPL.i, AAPL.b, AAPL.c, AAPL.ch, AAPL.q)</p>
        </div>
        
        {searchTerm && filteredTickers.length === 0 && (
          <p className="text-gray-500">No tickers found matching "{searchTerm}".</p>
        )}
        
        {filteredTickers.length > 0 && (
          <ul className="max-h-80 overflow-y-auto">
            {filteredTickers.map(ticker => (
              <li key={ticker} className="border-b border-gray-200 last:border-b-0">
                <button
                  onClick={() => handleTickerClick(ticker)}
                  className="block w-full text-left p-4 hover:bg-gray-100 rounded-md"
                >
                  <div className="font-semibold text-blue-700">{ticker}</div>
                  <div className="text-sm text-gray-600">{availableTickers[ticker]?.title}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
