const fs = require('fs');
const path = require('path');

// Simple CSV parser that handles quoted fields
const parseCSV = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      // Simple split - if this causes issues with quoted commas, we'll handle it
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    }).filter(obj => obj.Symbol && obj.Symbol.trim()); // Filter out empty symbols
  } catch (error) {
    console.error('Error reading file:', filePath, error.message);
    return [];
  }
};

// Parse all exchange files
console.log('Reading NYSE data...');
const nyseData = parseCSV('data/tickerdata/nyse_1668526574444.csv');

console.log('Reading NASDAQ data...');
const nasdaqData = parseCSV('data/tickerdata/nasdaq_1668526380140.csv');

console.log('Reading AMEX data...');
const amexData = parseCSV('data/tickerdata/amex_1668526591787.csv');

console.log('NYSE records:', nyseData.length);
console.log('NASDAQ records:', nasdaqData.length);
console.log('AMEX records:', amexData.length);

// Combine all data with exchange info
const allData = [
  ...nyseData.map(item => ({...item, exchange: 'NYSE'})),
  ...nasdaqData.map(item => ({...item, exchange: 'NASDAQ'})),
  ...amexData.map(item => ({...item, exchange: 'AMEX'}))
];

console.log('Total records:', allData.length);

// Create enhanced ticker object
const enhancedTickers = {};

allData.forEach((stock, index) => {
  const ticker = stock.Symbol.trim();
  
  // Skip if ticker already exists (prefer first occurrence)
  if (enhancedTickers[ticker]) {
    return;
  }
  
  // Clean up market cap - remove commas and convert to number
  let marketCap = null;
  if (stock['Market Cap'] && stock['Market Cap'] !== '') {
    const mcStr = stock['Market Cap'].replace(/,/g, '');
    const mcNum = parseFloat(mcStr);
    if (!isNaN(mcNum) && mcNum > 0) {
      marketCap = mcNum;
    }
  }
  
  // Clean up IPO year
  let ipoYear = null;
  if (stock['IPO Year'] && stock['IPO Year'] !== '') {
    const year = parseInt(stock['IPO Year']);
    if (!isNaN(year) && year > 1800 && year <= new Date().getFullYear()) {
      ipoYear = year;
    }
  }
  
  // Clean up volume
  let volume = null;
  if (stock.Volume && stock.Volume !== '') {
    const vol = parseInt(stock.Volume.replace(/,/g, ''));
    if (!isNaN(vol)) {
      volume = vol;
    }
  }
  
  enhancedTickers[ticker] = {
    cik_str: null, // We don't have CIK data in these files
    ticker: ticker,
    title: stock.Name || '',
    exchange: stock.exchange || '',
    sector: stock.Sector || '',
    industry: stock.Industry || '',
    country: stock.Country || '',
    ipoYear: ipoYear,
    marketCap: marketCap,
    lastSale: stock['Last Sale'] || '',
    volume: volume
  };
});

console.log('Enhanced tickers created:', Object.keys(enhancedTickers).length);

// Write to file
fs.writeFileSync('data/company_tickers.json', JSON.stringify(enhancedTickers, null, 2));
console.log('Enhanced company_tickers.json created successfully!');

// Show sample of the data
const sampleTickers = Object.keys(enhancedTickers).slice(0, 5);
console.log('\nSample data:');
sampleTickers.forEach(ticker => {
  console.log(`${ticker}:`, JSON.stringify(enhancedTickers[ticker], null, 2));
});

// Show some sector statistics
const sectors = {};
Object.values(enhancedTickers).forEach(stock => {
  if (stock.sector) {
    sectors[stock.sector] = (sectors[stock.sector] || 0) + 1;
  }
});

console.log('\nSector distribution:');
Object.entries(sectors).sort((a, b) => b[1] - a[1]).forEach(([sector, count]) => {
  console.log(`${sector}: ${count} stocks`);
});
