"use client";
import { useState } from "react";
import TickerSearch from "./components/TickerSearch";
import TickerDisplay from "./components/TickerDisplay";
export default function HomePage() {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [currentView, setCurrentView] = useState<string>('default');

  const handleTickerSelect = async (ticker: string, viewType: string = 'default') => {
    setSelectedTicker(ticker);
    setCurrentView(viewType);
    
    try {
      // Add view parameter to API call
      const url = `/api/tickers/${ticker}?view=${viewType}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCompanyData(data);
      } else {
        setCompanyData(null);
      }
    } catch (error) {
      console.error('Error fetching ticker data:', error);
      setCompanyData(null);
    }
  };

  const handleClearTicker = () => {
    setSelectedTicker(null);
    setCompanyData(null);
    setCurrentView('default');
  };

  return (
    <div className="w-full bg-white pb-8">
      <div className="w-full bg-white">
        <TickerSearch 
          onTickerSelect={handleTickerSelect}
          onClear={handleClearTicker}
          selectedTicker={selectedTicker}
          currentView={currentView}
          companyData={companyData}
        />
      </div>
      
      {selectedTicker && (
        <TickerDisplay 
          ticker={selectedTicker}
          data={companyData}
          onClear={handleClearTicker}
          viewType={currentView}
        />
      )}
    </div>
  );
}