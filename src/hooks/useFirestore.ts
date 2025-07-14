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
      loadUserProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      // Use optimized method that gets or creates profile in one call
      const userProfile = await firestoreService.getOrCreateUserProfile(user);
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
      // Optimistic update - update local state immediately
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      // Reload on error
      await loadUserProfile();
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
      // Optimistic update - update local state immediately
      setWatchlist(prev => ({
        ...prev,
        [type]: [...prev[type], { ticker, addedAt: new Date(), type }]
      }));
      
      await firestoreService.addToWatchlist(user.uid, ticker, type);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      // Revert on error
      await loadWatchlist();
    }
  };

  const removeFromWatchlist = async (ticker: string, type: 'growth' | 'decline') => {
    if (!user) return;
    
    try {
      // Optimistic update - update local state immediately
      setWatchlist(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item.ticker !== ticker)
      }));
      
      await firestoreService.removeFromWatchlist(user.uid, ticker, type);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      // Revert on error
      await loadWatchlist();
    }
  };

  const isInWatchlist = (ticker: string, type: 'growth' | 'decline') => {
    return watchlist[type].some(item => item.ticker === ticker);
  };

  const getWatchlistByType = (type: 'growth' | 'decline') => {
    return watchlist[type];
  };

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    getWatchlistByType,
    refetch: loadWatchlist
  };
};

// Cache for dashboard data
const dashboardCache = new Map<string, {
  profile: UserProfile;
  watchlist: { growth: WatchlistItem[], decline: WatchlistItem[] };
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Combined hook for dashboard - loads profile and watchlist in parallel
export const useDashboardData = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [watchlist, setWatchlist] = useState<{ growth: WatchlistItem[], decline: WatchlistItem[] }>({
    growth: [],
    decline: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    } else {
      setProfile(null);
      setWatchlist({ growth: [], decline: [] });
      setLoading(false);
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    // Check cache first
    const cacheKey = user.uid;
    const cached = dashboardCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      // Use cached data for instant loading
      setProfile(cached.profile);
      setWatchlist(cached.watchlist);
      setLoading(false);
      return;
    }
    
    try {
      // Load profile and watchlist in parallel
      const [userProfile, userWatchlist] = await Promise.all([
        firestoreService.getOrCreateUserProfile(user),
        firestoreService.getWatchlist(user.uid)
      ]);
      
      setProfile(userProfile);
      setWatchlist(userWatchlist);
      
      // Cache the data
      dashboardCache.set(cacheKey, {
        profile: userProfile,
        watchlist: userWatchlist,
        timestamp: now
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      await firestoreService.updateUserProfile(user.uid, updates);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Update cache
      const cached = dashboardCache.get(user.uid);
      if (cached) {
        dashboardCache.set(user.uid, {
          ...cached,
          profile: { ...cached.profile, ...updates },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      await loadDashboardData();
    }
  };

  const addToWatchlist = async (ticker: string, type: 'growth' | 'decline') => {
    if (!user) return;
    
    try {
      const newItem = { ticker, addedAt: new Date(), type };
      setWatchlist(prev => ({
        ...prev,
        [type]: [...prev[type], newItem]
      }));
      
      await firestoreService.addToWatchlist(user.uid, ticker, type);
      
      // Update cache
      const cached = dashboardCache.get(user.uid);
      if (cached) {
        dashboardCache.set(user.uid, {
          ...cached,
          watchlist: {
            ...cached.watchlist,
            [type]: [...cached.watchlist[type], newItem]
          },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      await loadDashboardData();
    }
  };

  const removeFromWatchlist = async (ticker: string, type: 'growth' | 'decline') => {
    if (!user) return;
    
    try {
      setWatchlist(prev => ({
        ...prev,
        [type]: prev[type].filter(item => item.ticker !== ticker)
      }));
      
      await firestoreService.removeFromWatchlist(user.uid, ticker, type);
      
      // Update cache
      const cached = dashboardCache.get(user.uid);
      if (cached) {
        dashboardCache.set(user.uid, {
          ...cached,
          watchlist: {
            ...cached.watchlist,
            [type]: cached.watchlist[type].filter(item => item.ticker !== ticker)
          },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      await loadDashboardData();
    }
  };

  const isInWatchlist = (ticker: string, type: 'growth' | 'decline') => {
    return watchlist[type].some(item => item.ticker === ticker);
  };

  const getWatchlistByType = (type: 'growth' | 'decline') => {
    return watchlist[type];
  };

  const clearCache = () => {
    if (user) {
      dashboardCache.delete(user.uid);
    }
  };

  return {
    profile,
    watchlist,
    loading,
    updateProfile,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    getWatchlistByType,
    refetch: loadDashboardData,
    clearCache
  };
};
