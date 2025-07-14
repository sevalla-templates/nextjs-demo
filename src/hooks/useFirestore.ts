'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService, UserProfile, WatchlistItem } from '../lib/firestore';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true); // Reset loading state when user changes
      loadUserProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      // Create user profile if it doesn't exist
      await firestoreService.createUserProfile(user);
      
      // Load user profile
      const userProfile = await firestoreService.getUserProfile(user.uid);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      await firestoreService.updateUserProfile(user.uid, updates);
      await loadUserProfile(); // Reload profile
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return { profile, loading, updateProfile, refetch: loadUserProfile };
};

export const useWatchlist = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<{ growth: WatchlistItem[], decline: WatchlistItem[] }>({
    growth: [],
    decline: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true); // Reset loading state when user changes
      loadWatchlist();
    } else {
      setWatchlist({ growth: [], decline: [] });
      setLoading(false);
    }
  }, [user]);

  const loadWatchlist = async () => {
    if (!user) return;
    
    try {
      const userWatchlist = await firestoreService.getWatchlist(user.uid);
      setWatchlist(userWatchlist);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (ticker: string, type: 'growth' | 'decline') => {
    if (!user) return;
    
    try {
      await firestoreService.addToWatchlist(user.uid, ticker, type);
      await loadWatchlist(); // Reload watchlist
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  const removeFromWatchlist = async (ticker: string, type: 'growth' | 'decline') => {
    if (!user) return;
    
    try {
      await firestoreService.removeFromWatchlist(user.uid, ticker, type);
      await loadWatchlist(); // Reload watchlist
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const isInWatchlist = (ticker: string, type: 'growth' | 'decline') => {
    return watchlist[type].some(item => item.ticker === ticker);
  };

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    refetch: loadWatchlist
  };
};
