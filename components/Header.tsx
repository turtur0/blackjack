'use client';


import React from 'react';
import ChipCounter from './ChipCounter';


interface HeaderProps {
    chips?: number;
}


const Header: React.FC<HeaderProps> = ({ chips = 0 }) => {
    return (
        <header className="w-full text-white p-4 flex justify-between items-center">
            {/* Left side: Title and Chips */}
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">Blackjack</h1>
                <ChipCounter chips={chips} />
            </div>


            {/* Right side: Navigation Buttons */}
            <div className="flex items-center gap-4">
                {['Home', 'History', 'Login', 'Sign Up'].map((label) => (
                    <button
                        key={label}
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