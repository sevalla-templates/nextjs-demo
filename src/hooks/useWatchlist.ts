'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService, WatchlistItem } from '@/lib/firestore';

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadWatchlist = async () => {
    if (!user) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await firestoreService.getWatchlist(user.uid);
      // Combine growth and decline lists
      const combinedList = [...data.growth, ...data.decline];
      setWatchlist(combinedList);
      setError(null);
    } catch (err) {
      console.error('Error loading watchlist:', err);
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, [user]);

  const addToWatchlist = async (ticker: string, type: 'growth' | 'decline') => {
    if (!user) return;

    try {
      await firestoreService.addToWatchlist(user.uid, ticker, type);
      await loadWatchlist(); // Refresh the list
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      setError('Failed to add to watchlist');
    }
  };

  const removeFromWatchlist = async (ticker: string) => {
    if (!user) return;

    try {
      // Find the item to determine its type
      const item = watchlist.find(w => w.ticker === ticker);
      if (item) {
        await firestoreService.removeFromWatchlist(user.uid, ticker, item.type);
        await loadWatchlist(); // Refresh the list
      }
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      setError('Failed to remove from watchlist');
    }
  };

  const getWatchlistByType = (type: 'growth' | 'decline') => {
    return watchlist.filter(item => item.type === type);
  };

  const isInWatchlist = (ticker: string) => {
    return watchlist.find(item => item.ticker === ticker);
  };

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    getWatchlistByType,
    isInWatchlist,
    refreshWatchlist: loadWatchlist
  };
};
