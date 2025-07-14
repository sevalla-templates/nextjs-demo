# Phase 2 Database Schema

## Firestore Collections

### votes
```
votes/{userId}_{ticker}
{
  id: string (auto-generated: userId_ticker)
  userId: string
  ticker: string (uppercase)
  voteType: 'growth' | 'decline'
  timestamp: Timestamp
  credibilityWeight: number (starts at 1)
  sector: string (auto-derived from ticker data)
  source: 'vote' | 'converted_watchlist'
}
```

### dailyMetrics
```
dailyMetrics/{YYYY-MM-DD}
{
  date: string (YYYY-MM-DD)
  growthVotesCount: number
  declineVotesCount: number
  activeAnalysts: number (unique voters today)
  trendingTickers: [{ticker: string, voteCount: number}]
  lastUpdated: Timestamp
}
```

### tickerRankings
```
tickerRankings/{ticker}
{
  ticker: string (uppercase)
  growthVotes: number
  declineVotes: number
  netScore: number (growth - decline)
  lastUpdated: Timestamp
  sector: string
  rank: number (calculated position)
}
```

### userStats (future)
```
userStats/{userId}
{
  userId: string
  credibilityScore: number
  totalVotes: number
  accuracyScore: number
  badges: string[]
  experienceLevel: string
  joinedDate: Timestamp
}
```

## Firestore Triggers

### onVoteCreate/Update/Delete
- Update dailyMetrics/{today}
- Update tickerRankings/{ticker}
- Recalculate trending tickers
- Update user statistics

## Real-time Listeners

### Dashboard Page
- dailyMetrics/{today} → Update stats cards
- tickerRankings collection → Update top growth/decline lists

### Vote Buttons
- votes collection (where ticker = currentTicker) → Update vote counts
- votes/{userId}_{ticker} → Update user's vote state

## Implementation Notes

1. **Vote Uniqueness**: Use composite ID `${userId}_${ticker}` to ensure one vote per user per ticker
2. **Mutual Exclusivity**: Firestore rules enforce only one vote type per user per ticker
3. **Real-time Updates**: onSnapshot listeners provide instant UI updates
4. **Aggregation**: Firestore triggers handle metric calculations automatically
5. **Scalability**: Firestore scales automatically with user growth

## Migration from Watchlists

Existing watchlist entries can be migrated to votes:
- Growth watchlist → Growth votes
- Decline watchlist → Decline votes
- Preserve timestamp and user association
