'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/landing');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="flex gap-6 text-sm font-medium text-white items-center">
      <a href="/" className="hover:text-[#f7c325] transition">Home</a>
      
      {user ? (
        <>
          <a href="/dashboard" className="hover:text-[#f7c325] transition">Dashboard</a>
          <a href="/search" className="hover:text-[#f7c325] transition">Search</a>
          <a href="/account" className="hover:text-[#f7c325] transition">Account</a>
          <div className="text-xs text-gray-400 px-2 py-1 bg-gray-700 rounded">
            Press / to search
          </div>
          <button 
            onClick={handleLogout}
            className="hover:text-[#f7c325] transition"
          >
            Logout
          </button>
        </>
      ) : (
        <a href="/landing" className="hover:text-[#f7c325] transition">Sign In</a>
      )}
    </nav>
  );
}
