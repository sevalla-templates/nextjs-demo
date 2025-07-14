#!/usr/bin/env python3
"""
Script to enhance company_tickers.json with sector, industry, and exchange data
while preserving the existing CIK structure for financial data mapping.
"""

import json
import csv
import os
from pathlib import Path

def load_current_tickers():
    """Load the current company_tickers.json file."""
    ticker_file = Path("src/data/company_tickers.json")
    if ticker_file.exists():
        with open(ticker_file, 'r') as f:
            return json.load(f)
    return {}

def load_exchange_data(file_path, exchange_name):
    """Load ticker data from a CSV file for a specific exchange."""
    exchange_data = {}
    
    if not os.path.exists(file_path):
        print(f"Warning: {file_path} not found")
        return exchange_data
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            ticker = row['Symbol'].strip()
            if ticker:
                exchange_data[ticker] = {
                    'name': row['Name'].strip(),
                    'sector': row.get('Sector', '').strip(),
                    'industry': row.get('Industry', '').strip(),
                    'exchange': exchange_name,
                    'country': row.get('Country', '').strip(),
                    'ipo_year': row.get('IPO Year', '').strip()
                }
    
    return exchange_data

def enhance_company_tickers():
    """Main function to enhance company_tickers.json."""
    print("Loading current company_tickers.json...")
    current_tickers = load_current_tickers()
    print(f"Found {len(current_tickers)} existing tickers")
    
    # Load data from all exchanges
    print("\nLoading exchange data...")
    exchange_files = [
        ('data/tickerdata/nyse_3105.csv', 'NYSE'),
        ('data/tickerdata/nasadaq_3105.csv', 'NASDAQ'),
        ('data/tickerdata/amex_3105.csv', 'AMEX')
    ]
    
    all_exchange_data = {}
    for file_path, exchange_name in exchange_files:
        exchange_data = load_exchange_data(file_path, exchange_name)
        all_exchange_data.update(exchange_data)
        print(f"Loaded {len(exchange_data)} tickers from {exchange_name}")
    
    print(f"Total exchange data: {len(all_exchange_data)} tickers")
    
    # Enhance existing tickers with exchange data
    enhanced_tickers = {}
    enhanced_count = 0
    preserved_count = 0
    
    for ticker, ticker_data in current_tickers.items():
        if ticker in all_exchange_data:
            # Enhance with exchange data while preserving CIK
            exchange_info = all_exchange_data[ticker]
            enhanced_tickers[ticker] = {
                'cik': ticker_data['cik'],  # Preserve CIK
                'title': ticker_data['title'],  # Preserve title
                'sector': exchange_info['sector'],
                'industry': exchange_info['industry'],
                'exchange': exchange_info['exchange'],
                'country': exchange_info['country'],
                'ipo_year': exchange_info['ipo_year']
            }
            enhanced_count += 1
        else:
            # Preserve original data if no exchange data found
            enhanced_tickers[ticker] = ticker_data
            preserved_count += 1
    
    print(f"\nEnhancement results:")
    print(f"Enhanced with sector/industry data: {enhanced_count} tickers")
    print(f"Preserved original data: {preserved_count} tickers")
    print(f"Total tickers: {len(enhanced_tickers)}")
    
    # Save enhanced data
    output_file = Path("src/data/company_tickers_enhanced.json")
    with open(output_file, 'w') as f:
        json.dump(enhanced_tickers, f, indent=2)
    
    print(f"\nEnhanced data saved to {output_file}")
    
    # Show some examples
    print("\nExample enhanced entries:")
    example_count = 0
    for ticker, data in enhanced_tickers.items():
        if 'sector' in data and example_count < 3:
            print(f"  {ticker}: {data['title']}")
            print(f"    Sector: {data['sector']}")
            print(f"    Industry: {data['industry']}")
            print(f"    Exchange: {data['exchange']}")
            print(f"    CIK: {data['cik']}")
            print()
            example_count += 1

if __name__ == "__main__":
    enhance_company_tickers()
