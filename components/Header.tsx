'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import ChipCounter from './ChipCounter';

interface HeaderProps {
    chips?: number;
}

const Header: React.FC<HeaderProps> = ({ chips = 0 }) => {
    const router = useRouter();
    const { user, logout } = useAuth();
    const isAuthenticated = !!user;

    const handleNavigation = (label: string) => {
        switch (label) {
            case 'Home':
                router.push('/');
                break;
            case 'Game':
                router.push('/');
                break;
            case 'History':
                router.push('/history');
                break;
            case 'Login':
                router.push('/login');
                break;
            case 'Sign Up':
                router.push('/signup');
                break;
            case 'Logout':
                handleLogout();
                break;
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const navItems = isAuthenticated 
        ? ['Game', 'History', 'Logout']
        : ['Game', 'Login', 'Sign Up'];

    return (
        <header className="w-full text-white p-4 flex justify-between items-center">
            {/* Left side: Title and Chips */}
            <div className="flex items-center gap-4">
                <h1 
                    className="text-2xl font-bold cursor-pointer hover:text-yellow-400 transition"
                    onClick={() => router.push('/')}
                >
                    Blackjack
                </h1>
                {isAuthenticated && <ChipCounter chips={user.chips} />}
            </div>

            {/* Center: Username if logged in */}
            {isAuthenticated && (
                <div className="text-lg font-medium">
                    Welcome, {user.username}!
                </div>
            )}

            {/* Right side: Navigation Buttons */}
            <div className="flex items-center gap-4">
                {navItems.map((label) => (
                    <button
                        key={label}
                        onClick={() => handleNavigation(label)}
                        className="bg-transparent text-white px-2 py-1 hover:text-yellow-400 hover:scale-110 transition duration-200"
                    >
                        {label}
                    </button>
                ))}
            </div>
        </header>
    );
};

export default Header;