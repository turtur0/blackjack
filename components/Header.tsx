'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import ChipCounter from './ChipCounter';
import { Menu } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
    chips?: number;
}

const Header: React.FC<HeaderProps> = ({ chips = 0 }) => {
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const navItems = user
        ? [
            { label: 'Game', path: '/' },
            { label: 'History', path: '/history' },
            { label: 'Logout', action: handleLogout }
        ]
        : [
            { label: 'Game', path: '/' },
            { label: 'Login', path: '/login' },
            { label: 'Sign Up', path: '/signup' }
        ];

    return (
        <header className="w-full text-white p-4">
            <div className="flex justify-between items-center gap-4">
                {/* Left: Title and Chips */}
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <h1
                        className="text-xl sm:text-2xl font-bold cursor-pointer hover:text-yellow-400 transition"
                        onClick={() => handleNavigation('/')}
                    >
                        Blackjack
                    </h1>
                    {user && <ChipCounter chips={user.chips} />}
                </div>

                {/* Center: Username - Hidden on mobile, shown on md+ */}
                {user && (
                    <div className="hidden md:block text-base lg:text-lg font-medium flex-shrink-0">
                        Welcome, {user.username}!
                    </div>
                )}

                {/* Right: Navigation */}
                {/* Desktop Navigation - Hidden on small screens */}
                <nav className="hidden md:flex items-center gap-4 flex-shrink-0">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => item.action ? item.action() : handleNavigation(item.path!)}
                            className="bg-transparent text-white px-2 py-1 hover:text-yellow-400 hover:scale-110 transition duration-200 whitespace-nowrap"
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Mobile Navigation - Dropdown Menu */}
                <div className="md:hidden flex-shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="bg-transparent text-white p-2 hover:text-yellow-400 transition">
                                <Menu size={24} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-gray-900 text-white border-gray-700">
                            {user && (
                                <>
                                    <div className="px-2 py-2 text-sm text-yellow-400 font-medium">
                                        Welcome, {user.username}!
                                    </div>
                                    <DropdownMenuSeparator className="bg-gray-700" />
                                </>
                            )}
                            {navItems.map((item) => (
                                <DropdownMenuItem
                                    key={item.label}
                                    onClick={() => item.action ? item.action() : handleNavigation(item.path!)}
                                    className="cursor-pointer hover:bg-gray-800 hover:text-yellow-400 focus:bg-gray-800 focus:text-yellow-400"
                                >
                                    {item.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};

export default Header;