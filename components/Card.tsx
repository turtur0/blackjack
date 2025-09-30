import React from 'react';
import { motion } from 'framer-motion';
import type { Card as CardType } from '../lib/blackjack';


export default function CardView({ card, faceDown }: { card: CardType; faceDown?: boolean }) {
    const color = card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black';
    return (
        <motion.div
            layout
            initial={{ rotateY: faceDown ? 180 : 0, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`w-20 h-28 rounded-lg shadow-md border flex items-center justify-center p-2 text-lg select-none bg-white`}
        >
            {faceDown ? (
                <div className="w-full h-full bg-gray-800 rounded-md flex items-center justify-center text-white">🂠</div>
            ) : (
                <div className={`flex flex-col items-center pointer-events-none ${color}`}>
                    <div className="text-sm">{card.rank}</div>
                    <div className="text-2xl leading-3">{card.suit}</div>
                </div>
            )}
        </motion.div>
    );
}