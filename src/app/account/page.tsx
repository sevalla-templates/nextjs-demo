'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { deleteUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/ProtectedRoute';
import ProfileEditor from '../../components/ProfileEditor';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      // First, we would delete user data from Firestore here
      // await deleteUserData(user.uid);
      
      // Then delete the user account
      await deleteUser(user);
      
      // Redirect to landing page
      router.push('/landing');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/landing');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
            <p className="text-gray-600">Manage your account preferences and subscription</p>
          </div>

          {/* User Profile */}
          <ProfileEditor onProfileUpdate={() => {
            // Optionally refresh data here
            console.log('Profile updated!');
          }} />

          {/* Subscription Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription</h2>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Free Plan</p>
                  <p className="text-gray-600">Basic access to financial data</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Upgrade
                </button>
              </div>
            </div>
          </div>

          {/* Watchlists Preview */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Watchlists</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-600 mb-2">Growth Watchlist</h3>
                <p className="text-gray-600 text-sm">0 stocks added</p>
                <p className="text-gray-500 text-xs mt-1">
                  Stocks you've marked as growth opportunities
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-600 mb-2">Decline Watchlist</h3>
                <p className="text-gray-600 text-sm">0 stocks added</p>
                <p className="text-gray-500 text-xs mt-1">
                  Stocks you're monitoring for decline patterns
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h2>
            <div className="space-y-4">
              <button
                onClick={handleLogout}
                className="w-full md:w-auto px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Sign Out
              </button>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-red-600 font-semibold">
                      Are you sure you want to delete your account?
                    </p>
                    <div className="flex space-x-4">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
