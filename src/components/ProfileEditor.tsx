'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../lib/firestore';

interface ProfileEditorProps {
  onProfileUpdate?: () => void;
}

export default function ProfileEditor({ onProfileUpdate }: ProfileEditorProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');

  // Predefined avatar options for MVP
  const avatarOptions = [
    '👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻',
    '🎭', '🎨', '🎪', '🎯', '🎲', '🎸', '🎺', '🎪',
    '📊', '📈', '📉', '💰', '💎', '🚀', '⭐', '🔥'
  ];

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const userProfile = await firestoreService.getUserProfile(user.uid);
          setProfile(userProfile);
          setUsername(userProfile?.username || '');
          setSelectedAvatar(userProfile?.customPhotoURL || '👤');
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };

    loadProfile();
  }, [user]);

  const checkUsername = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setUsernameAvailable(false);
      return;
    }

    if (usernameToCheck === profile?.username) {
      setUsernameError('');
      setUsernameAvailable(true);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError('');

    try {
      const isAvailable = await firestoreService.checkUsernameAvailability(usernameToCheck);
      if (isAvailable) {
        setUsernameAvailable(true);
        setUsernameError('');
      } else {
        setUsernameAvailable(false);
        setUsernameError('Username is already taken');
      }
    } catch (error) {
      setUsernameError('Error checking username availability');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(newUsername);
    
    // Debounce username checking
    setTimeout(() => checkUsername(newUsername), 500);
  };

  const handleSave = async () => {
    if (!user || !usernameAvailable || usernameError) return;

    setIsSaving(true);
    try {
      await firestoreService.updateUserProfile(user.uid, {
        username,
        customPhotoURL: selectedAvatar
      });

      setIsEditing(false);
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setUsernameError(error.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getDisplayName = () => {
    return profile?.username || user?.displayName || 'User';
  };

  const getDisplayAvatar = () => {
    return profile?.customPhotoURL || user?.photoURL || '👤';
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
      
      {!isEditing ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
              {getDisplayAvatar().startsWith('http') ? (
                <img 
                  src={getDisplayAvatar()} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <span>{getDisplayAvatar()}</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{getDisplayName()}</p>
              <p className="text-gray-600">{user.email}</p>
              {profile?.username && (
                <p className="text-sm text-blue-600">@{profile.username}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Avatar
            </label>
            <div className="grid grid-cols-8 gap-2 p-4 bg-gray-50 rounded-lg">
              {avatarOptions.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                    selectedAvatar === avatar
                      ? 'bg-blue-600 text-white'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Username Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Enter username (3+ characters, a-z, 0-9, _)"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  usernameError 
                    ? 'border-red-500' 
                    : usernameAvailable && username 
                      ? 'border-green-500' 
                      : 'border-gray-300'
                }`}
              />
              {isCheckingUsername && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {usernameError && (
              <p className="mt-1 text-sm text-red-600">{usernameError}</p>
            )}
            {usernameAvailable && username && !usernameError && (
              <p className="mt-1 text-sm text-green-600">✓ Username available</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={isSaving || !usernameAvailable || !!usernameError || !username}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setUsername(profile?.username || '');
                setSelectedAvatar(profile?.customPhotoURL || '👤');
                setUsernameError('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
