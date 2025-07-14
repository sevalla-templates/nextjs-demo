#!/usr/bin/env python3
"""
Quick script to analyze the enhanced company_tickers.json file.
"""

import json
from collections import Counter

with open('src/data/company_tickers.json', 'r') as f:
    tickers = json.load(f)

total_tickers = len(tickers)
with_sector = sum(1 for ticker_data in tickers.values() if 'sector' in ticker_data)
sector_counts = Counter()
exchange_counts = Counter()

for ticker_data in tickers.values():
    if 'sector' in ticker_data:
        sector_counts[ticker_data['sector']] += 1
        exchange_counts[ticker_data['exchange']] += 1

print(f"Total tickers: {total_tickers}")
print(f"Tickers with sector data: {with_sector}")
print(f"Enhancement coverage: {with_sector/total_tickers*100:.1f}%")

print(f"\nTop sectors:")
for sector, count in sector_counts.most_common(10):
    print(f"  {sector}: {count} companies")

print(f"\nExchange distribution:")
for exchange, count in exchange_counts.most_common():
    print(f"  {exchange}: {count} companies")
