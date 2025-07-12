'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function Navigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/landing');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="flex gap-6 text-sm font-medium text-white items-center">
      <button 
        onClick={() => router.push('/')}
        className={`hover:text-[#f7c325] transition ${isActive('/') ? 'text-[#f7c325]' : ''}`}
      >
        Home
      </button>
      
      {user ? (
        <>
          <button 
            onClick={() => router.push('/dashboard')}
            className={`hover:text-[#f7c325] transition ${isActive('/dashboard') ? 'text-[#f7c325]' : ''}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => router.push('/search')}
            className={`hover:text-[#f7c325] transition ${isActive('/search') ? 'text-[#f7c325]' : ''}`}
          >
            Search
          </button>
          <button 
            onClick={() => router.push('/account')}
            className={`hover:text-[#f7c325] transition ${isActive('/account') ? 'text-[#f7c325]' : ''}`}
          >
            Account
          </button>
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
        <button 
          onClick={() => router.push('/landing')}
          className="hover:text-[#f7c325] transition"
        >
          Sign In
        </button>
      )}
    </nav>
  );
}
