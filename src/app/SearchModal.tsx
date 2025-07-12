"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchModal({ tickers }: { tickers: Record<string, { cik: string; title: string }> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTickers, setFilteredTickers] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter tickers based on search term (case-insensitive)
  const filterTickers = (term: string) => {
    if (!term) {
      setFilteredTickers([]);
      return;
    }
    const lowerCaseTerm = term.toLowerCase();
    
    // Base ticker results
    const baseResults = Object.keys(tickers).filter(ticker => 
      ticker.toLowerCase().includes(lowerCaseTerm) || 
      tickers[ticker].title.toLowerCase().includes(lowerCaseTerm)
    );
    
    // If user typed something like "mvst.d", also show the specific view
    const hasViewSuffix = term.includes('.');
    let viewResults: string[] = [];
    
    if (hasViewSuffix) {
      const parts = term.split('.');
      if (parts.length === 2) {
        const baseTicker = parts[0].toUpperCase();
        const viewSuffix = parts[1].toLowerCase();
        
        // Only add if the base ticker exists and view suffix is valid
        if (tickers[baseTicker] && ['d', 'ch', 'q', 'i', 'b', 'c', 'v'].includes(viewSuffix)) {
          viewResults.push(`${baseTicker}.${viewSuffix}`);
        }
      }
    }
    
    // Combine and limit results
    const allResults = [...new Set([...viewResults, ...baseResults])];
    setFilteredTickers(allResults.slice(0, 10));
  };


  // Open search modal on '/' key press, clear filter on '=' key press
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      console.log('SearchModal: Key pressed:', event.key, 'isOpen:', isOpen, 'target:', event.target);
      
      if (event.key === '/' && !isOpen) {
        console.log('SearchModal: Opening modal...');
        event.preventDefault();
        setIsOpen(true);
        setSearchTerm('');
        setFilteredTickers([]);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      } else if (event.key === '=' && !isOpen) {
        // Clear filter and show all tickers
        event.preventDefault();
        const params = new URLSearchParams(searchParams);
        params.delete('q');
        router.replace(`?${params.toString()}`);
      } else if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
        setFilteredTickers([]);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterTickers(term);
  };

  const handleTickerClick = (ticker: string) => {
    setIsOpen(false);
    setSearchTerm('');
    setFilteredTickers([]);
    
    // Check if the ticker includes a view suffix (e.g., "MVST.d")
    const parts = ticker.split('.');
    if (parts.length === 2) {
      const baseTicker = parts[0];
      const viewSuffix = parts[1];
      
      // Map view suffixes to full view names
      const viewMapping: Record<string, string> = {
        'd': 'detailed',
        'ch': 'charts',      // Charts view uses 'ch' suffix
        'q': 'quarterly',
        'i': 'income',
        'b': 'balance',
        'c': 'cashflow',     // Cash flow uses 'c' suffix
        'v': 'visualization'
      };
      
      const viewType = viewMapping[viewSuffix] || 'default';
      router.push(`/${baseTicker}?view=${viewType}`);
    } else {
      // Regular ticker without view suffix
      router.push(`/${ticker}`);
    }
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filteredTickers.length > 0) {
        // Use the first filtered ticker
        handleTickerClick(filteredTickers[0]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mt-20 p-6">
        <div className="flex justify-between items-center mb-4">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Type to search tickers (e.g., AAPL, MVST.d, TSLA.ch)..."
            className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            X
          </button>
        </div>
        {searchTerm && filteredTickers.length === 0 && (
          <p className="text-gray-500">No tickers found matching "{searchTerm}".</p>
        )}
        {filteredTickers.length > 0 && (
          <ul className="max-h-80 overflow-y-auto">
            {filteredTickers.map((ticker: string) => {
              const isViewSuffix = ticker.includes('.');
              const baseTicker = isViewSuffix ? ticker.split('.')[0] : ticker;
              const viewSuffix = isViewSuffix ? ticker.split('.')[1] : '';
              
              // Get ticker info from base ticker
              const tickerInfo = tickers[baseTicker];
              if (!tickerInfo) return null;
              
              // View type descriptions
              const viewDescriptions: Record<string, string> = {
                'd': 'Detailed View',
                'ch': 'Charts View',     // Charts view uses 'ch' suffix
                'q': 'Quarterly View',
                'i': 'Income Statement',
                'b': 'Balance Sheet',
                'c': 'Cash Flow',        // Cash flow uses 'c' suffix
                'v': 'Visualization'
              };
              
              return (
                <li key={ticker} className="border-b border-gray-200 last:border-b-0">
                  <button
                    onClick={() => handleTickerClick(ticker)}
                    className="block w-full text-left p-4 hover:bg-gray-100 rounded-md"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-700 font-semibold">{baseTicker}</span>
                          {isViewSuffix && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                              .{viewSuffix} - {viewDescriptions[viewSuffix]}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-500 text-sm">{tickerInfo.title}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
