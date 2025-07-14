import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: any;
  updatedAt: any;
  subscription: {
    plan: 'free' | 'premium';
    status: 'active' | 'cancelled' | 'expired';
  };
  watchlists: {
    growth: string[];
    decline: string[];
  };
}

export interface WatchlistItem {
  ticker: string;
  addedAt: Date;
  type: 'growth' | 'decline';
}

class FirestoreService {
  // User Profile Methods
  async createUserProfile(user: any): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const newUser: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        subscription: {
          plan: 'free',
          status: 'active'
        },
        watchlists: {
          growth: [],
          decline: []
        }
      };
      
      await setDoc(userRef, newUser);
    }
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  }

  // Optimized method to get or create user profile in one call
  async getOrCreateUserProfile(user: any): Promise<UserProfile> {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    
    // Create new user profile
    const newUser: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      subscription: {
        plan: 'free',
        status: 'active'
      },
      watchlists: {
        growth: [],
        decline: []
      }
    };
    
    await setDoc(userRef, newUser);
    return newUser;
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  async deleteUserProfile(uid: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
    
    // Also delete user's watchlist items
    const watchlistRef = doc(db, 'watchlists', uid);
    await deleteDoc(watchlistRef);
  }

  // Watchlist Methods
  async addToWatchlist(uid: string, ticker: string, type: 'growth' | 'decline'): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const watchlistField = `watchlists.${type}`;
    
    // Add to user's watchlist array
    await updateDoc(userRef, {
      [watchlistField]: arrayUnion(ticker),
      updatedAt: serverTimestamp()
    });

    // Also store detailed watchlist item with current timestamp
    const watchlistRef = doc(db, 'watchlists', uid);
    const watchlistDoc = await getDoc(watchlistRef);
    
    const watchlistItem: WatchlistItem = {
      ticker,
      addedAt: new Date(), // Use regular Date instead of serverTimestamp
      type
    };

    if (watchlistDoc.exists()) {
      const currentItems = watchlistDoc.data()[type] || [];
      // Check if item already exists
      const itemExists = currentItems.some((item: WatchlistItem) => item.ticker === ticker);
      if (!itemExists) {
        const updatedItems = [...currentItems, watchlistItem];
        await updateDoc(watchlistRef, {
          [type]: updatedItems
        });
      }
    } else {
      await setDoc(watchlistRef, {
        [type]: [watchlistItem]
      });
    }
  }

  async removeFromWatchlist(uid: string, ticker: string, type: 'growth' | 'decline'): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const watchlistField = `watchlists.${type}`;
    
    // Remove from user's watchlist array
    await updateDoc(userRef, {
      [watchlistField]: arrayRemove(ticker),
      updatedAt: serverTimestamp()
    });

    // Also remove from detailed watchlist
    const watchlistRef = doc(db, 'watchlists', uid);
    const watchlistDoc = await getDoc(watchlistRef);
    
    if (watchlistDoc.exists()) {
      const currentItems = watchlistDoc.data()[type] || [];
      const updatedItems = currentItems.filter((item: WatchlistItem) => item.ticker !== ticker);
      await updateDoc(watchlistRef, {
        [type]: updatedItems
      });
    }
  }

  async getWatchlist(uid: string): Promise<{ growth: WatchlistItem[], decline: WatchlistItem[] }> {
    const watchlistRef = doc(db, 'watchlists', uid);
    const watchlistDoc = await getDoc(watchlistRef);
    
    if (watchlistDoc.exists()) {
      const data = watchlistDoc.data();
      return {
        growth: data.growth || [],
        decline: data.decline || []
      };
    }
    
    return { growth: [], decline: [] };
  }

  // Subscription Methods
  async updateSubscription(uid: string, plan: 'free' | 'premium', status: 'active' | 'cancelled' | 'expired'): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      'subscription.plan': plan,
      'subscription.status': status,
      updatedAt: serverTimestamp()
    });
  }
}

export const firestoreService = new FirestoreService();
