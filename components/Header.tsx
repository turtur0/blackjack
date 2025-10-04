'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ChipCounter from './ChipCounter';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  chips?: number;
}

const Header: React.FC<HeaderProps> = ({ chips = 0 }) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="w-full text-white p-4 flex justify-between items-center">
      {/* Left side: Title and Chips */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Blackjack</h1>
        <ChipCounter chips={user ? user.chips : chips} />
      </div>

      {/* Right side: Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/" className="hover:text-yellow-400 transition">Home</Link>
        <Link href="/history" className="hover:text-yellow-400 transition">History</Link>
        
        {user ? (
          <>
            <span className="text-yellow-400">Welcome, {user.username}</span>
            <button 
              onClick={handleLogout}
              className="hover:text-yellow-400 transition"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-yellow-400 transition">Login</Link>
            <Link href="/signup" className="hover:text-yellow-400 transition">Sign Up</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;