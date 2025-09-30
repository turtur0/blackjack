import React from 'react';


export default function ChipCounter({ chips }: { chips: number }) {
    return (
        <button className="flex items-center bg-yellow-500 text-black text-sm px-3 py-1 rounded-full hover:bg-yellow-400 transition-colors duration-200">
            <span className="mr-2">{chips}</span>
            <span className="font-bold">+</span>
        </button>
    );
}