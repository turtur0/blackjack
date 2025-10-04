import React, { useState, useEffect } from 'react';

export default function BetControls({ chips, onBet }: { chips: number; onBet: (bet: number) => void }) {
    const [bet, setBet] = useState<number>(10);

    // Reset bet to valid value if chips change
    useEffect(() => {
        if (bet > chips) {
            setBet(Math.min(10, chips));
        }
    }, [chips]);

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
                className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition duration-200"
                disabled={bet <= 0 || bet > chips || chips === 0}
                onClick={handlePlaceBet}
            >
                Place Bet
            </button>
        </div>
    );
}