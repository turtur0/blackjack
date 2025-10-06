import React, { useState, useEffect } from 'react';

interface BetControlsProps {
    chips: number;
    onBet: (bet: number) => void;
}

const DEFAULT_BET = 10;

export default function BetControls({ chips, onBet }: BetControlsProps) {
    const [bet, setBet] = useState<number>(DEFAULT_BET);

    // Reset bet to valid value if chips change
    useEffect(() => {
        if (bet > chips) {
            setBet(Math.min(DEFAULT_BET, chips));
        }
    }, [chips, bet]);

    const handleBetChange = (value: string) => {
        const numValue = parseInt(value);

        if (isNaN(numValue) || numValue < 0) {
            setBet(0);
        } else if (numValue > chips) {
            setBet(chips);
        } else {
            setBet(numValue);
        }
    };

    const handlePlaceBet = () => {
        if (bet > 0 && bet <= chips) {
            onBet(bet);
        }
    };

    const isValidBet = bet > 0 && bet <= chips && chips > 0;

    return (
        <div className="flex gap-2 items-center">
            <input
                type="number"
                min={1}
                max={chips}
                value={bet}
                onChange={(e) => handleBetChange(e.target.value)}
                className="w-24 p-2 border rounded text-black bg-white"
                placeholder="Bet amount"
            />
            <button
                className="px-3 py-2 rounded bg-yellow-500 text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400 transition duration-200"
                disabled={!isValidBet}
                onClick={handlePlaceBet}
            >
                Place Bet
            </button>
        </div>
    );
}