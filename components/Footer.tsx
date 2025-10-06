'use client';

import React from 'react';
import { Github } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full text-white py-4 mt-auto">
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">
                        Created by turtur0
                    </span>
                    <a
                        href="https://github.com/turtur0"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-yellow-400 transition duration-200"
                        aria-label="GitHub Profile"
                    >
                        <Github size={20} />
                    </a>
                </div>
                <p className="text-xs text-gray-400">
                    © 2025 Blackjack Game
                </p>
            </div>
        </footer>
    );
};

export default Footer;