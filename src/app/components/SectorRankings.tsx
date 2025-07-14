'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

// Import company data to get sector information
import companyTickers from '../../data/company_tickers.json';

interface CompanyData {
  cik: string;
  title: string;
  sector?: string;
  industry?: string;
  exchange?: string;
  country?: string;
  ipo_year?: string;
}

interface SectorStock {
  ticker: string;
  title: string;
  sector: string;
  industry: string;
  growthVotes: number;
  declineVotes: number;
  netScore: number;
}

interface SectorRankings {
  [sector: string]: {
    topGrowth: SectorStock[];
    topDecline: SectorStock[];
    totalVotes: number;
  };
}

export default function SectorRankings() {
  const [sectorRankings, setSectorRankings] = useState<SectorRankings>({});
  const [selectedSector, setSelectedSector] = useState<string>('Technology');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Get available sectors from the data
  const availableSectors = [...new Set(
    Object.values(companyTickers).map((company: CompanyData) => company.sector).filter(Boolean)
  )].sort();

  useEffect(() => {
    const votesRef = collection(db, 'votes');
    
    const unsubscribe = onSnapshot(votesRef, (snapshot) => {
      const votes = snapshot.docs.map(doc => doc.data());
      
      // Aggregate votes by ticker with sector information
      const tickerVotes: { [ticker: string]: { growth: number; decline: number; company: any } } = {};
      
      votes.forEach(vote => {
        const company = companyTickers[vote.ticker as keyof typeof companyTickers] as CompanyData;
        if (!company || !company.sector) return; // Skip if no sector data
        
        if (!tickerVotes[vote.ticker]) {
          tickerVotes[vote.ticker] = { growth: 0, decline: 0, company };
        }
        
        if (vote.voteType === 'growth') {
          tickerVotes[vote.ticker].growth++;
        } else {
          tickerVotes[vote.ticker].decline++;
        }
      });

      // Group by sector
      const rankings: SectorRankings = {};
      
      Object.entries(tickerVotes).forEach(([ticker, data]) => {
        const { company, growth, decline } = data;
        const sector = company.sector;
        
        if (!rankings[sector]) {
          rankings[sector] = {
            topGrowth: [],
            topDecline: [],
            totalVotes: 0
          };
        }
        
        const stock: SectorStock = {
          ticker,
          title: company.title,
          sector: company.sector,
          industry: company.industry,
          growthVotes: growth,
          declineVotes: decline,
          netScore: growth - decline
        };
        
        rankings[sector].topGrowth.push(stock);
        rankings[sector].topDecline.push(stock);
        rankings[sector].totalVotes += growth + decline;
      });

      // Sort rankings within each sector
      Object.keys(rankings).forEach(sector => {
        rankings[sector].topGrowth.sort((a, b) => b.growthVotes - a.growthVotes);
        rankings[sector].topDecline.sort((a, b) => b.declineVotes - a.declineVotes);
        rankings[sector].topGrowth = rankings[sector].topGrowth.slice(0, 5);
        rankings[sector].topDecline = rankings[sector].topDecline.slice(0, 5);
      });

      setSectorRankings(rankings);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleTickerClick = (ticker: string) => {
    router.push(`/${ticker}`);
  };

  const currentSectorData = sectorRankings[selectedSector];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sector Rankings</h3>
            <p className="text-sm text-gray-500">Community votes by industry sector</p>
          </div>
          
          {/* Sector Selector */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availableSectors.map(sector => (
              <option key={sector} value={sector}>
                {sector} {sector && sectorRankings[sector] ? `(${sectorRankings[sector].totalVotes} votes)` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6">
        {currentSectorData && currentSectorData.totalVotes > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Growth in Sector */}
            <div>
              <h4 className="text-md font-semibold text-green-600 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Top Growth - {selectedSector}
              </h4>
              
              {currentSectorData.topGrowth.length > 0 ? (
                <div className="space-y-2">
                  {currentSectorData.topGrowth.map((stock, index) => (
                    <div 
                      key={stock.ticker} 
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 cursor-pointer transition-colors"
                      onClick={() => handleTickerClick(stock.ticker)}
                    >
                      <div className="flex items-center">
                        <span className="flex items-center justify-center w-5 h-5 bg-green-600 text-white text-xs font-bold rounded-full mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900">{stock.ticker}</div>
                          <div className="text-xs text-gray-600">{stock.industry}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">{stock.growthVotes}</div>
                        <div className="text-xs text-gray-500">votes</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No growth votes in {selectedSector} yet</p>
              )}
            </div>

            {/* Top Decline in Sector */}
            <div>
              <h4 className="text-md font-semibold text-red-600 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                Top Decline - {selectedSector}
              </h4>
              
              {currentSectorData.topDecline.length > 0 ? (
                <div className="space-y-2">
                  {currentSectorData.topDecline.map((stock, index) => (
                    <div 
                      key={stock.ticker} 
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 cursor-pointer transition-colors"
                      onClick={() => handleTickerClick(stock.ticker)}
                    >
                      <div className="flex items-center">
                        <span className="flex items-center justify-center w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900">{stock.ticker}</div>
                          <div className="text-xs text-gray-600">{stock.industry}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-600">{stock.declineVotes}</div>
                        <div className="text-xs text-gray-500">votes</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No decline votes in {selectedSector} yet</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No votes in {selectedSector}</h4>
            <p className="text-gray-600 mb-4">
              Be the first to vote on stocks in the {selectedSector} sector!
            </p>
            <button 
              onClick={() => router.push('/search')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Find {selectedSector} Stocks
            </button>
          </div>
        )}
      </div>

      {/* Sector Overview Stats */}
      {Object.keys(sectorRankings).length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{Object.keys(sectorRankings).length}</div>
              <div className="text-xs text-gray-600">Active Sectors</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {Object.values(sectorRankings).reduce((sum, sector) => sum + sector.totalVotes, 0)}
              </div>
              <div className="text-xs text-gray-600">Total Votes</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {Object.values(sectorRankings).reduce((sum, sector) => 
                  sum + sector.topGrowth.reduce((s, stock) => s + stock.growthVotes, 0), 0
                )}
              </div>
              <div className="text-xs text-gray-600">Growth Votes</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {Object.values(sectorRankings).reduce((sum, sector) => 
                  sum + sector.topDecline.reduce((s, stock) => s + stock.declineVotes, 0), 0
                )}
              </div>
              <div className="text-xs text-gray-600">Decline Votes</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
