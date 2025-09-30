import React, { useState } from 'react';


export default function BetControls({ chips, onBet }: { chips: number; onBet: (bet: number) => void }) {
    const [bet, setBet] = useState<number>(10);
    return (
        <div className="flex gap-2 items-center">
            <input
                type="number"
                min={1}
                max={chips}
                value={bet}
                onChange={(e) => setBet(Number(e.target.value))}
                className="w-24 p-2 border rounded text-white"
            />
            <button
                className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                disabled={bet <= 0 || bet > chips}
                onClick={() => onBet(bet)}
            >
                Place Bet
            </button>
        </div>
    );
}