import { firestoreService } from './firestore';

export interface DisplayUser {
  displayName: string;
  avatar: string;
  username?: string;
}

// Cache for user profiles to avoid repeated API calls
const userProfileCache = new Map<string, DisplayUser>();

export const getUserDisplayInfo = async (userId: string, fallbackData?: any): Promise<DisplayUser> => {
  // Check cache first
  if (userProfileCache.has(userId)) {
    return userProfileCache.get(userId)!;
  }

  try {
    const profile = await firestoreService.getUserProfile(userId);
    
    const displayUser: DisplayUser = {
      displayName: profile?.username || profile?.displayName || fallbackData?.userName || 'Anonymous User',
      avatar: profile?.customPhotoURL || profile?.photoURL || fallbackData?.userPhoto || '👤',
      username: profile?.username
    };

    // Cache the result
    userProfileCache.set(userId, displayUser);
    
    return displayUser;
  } catch (error) {
    console.error('Error fetching user display info:', error);
    
    // Fallback to provided data or defaults
    const fallbackDisplayUser: DisplayUser = {
      displayName: fallbackData?.userName || 'Anonymous User',
      avatar: fallbackData?.userPhoto || '👤'
    };
    
    return fallbackDisplayUser;
  }
};

// Clear cache when user updates their profile
export const clearUserDisplayCache = (userId?: string) => {
  if (userId) {
    userProfileCache.delete(userId);
  } else {
    userProfileCache.clear();
  }
};

// Get display info for current user from auth context
export const getCurrentUserDisplayInfo = (user: any, profile?: any): DisplayUser => {
  return {
    displayName: profile?.username || user?.displayName || 'User',
    avatar: profile?.customPhotoURL || user?.photoURL || '👤',
    username: profile?.username
  };
};
