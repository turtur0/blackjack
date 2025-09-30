'use client';
import React, { useReducer, useEffect } from 'react';
import CardView from '../../../components/Card';
import BetControls from '../../../components/BetControls';
import ChipCounter from '../../../components/ChipCounter';
import Header from '../../../components/Header';
import {
    drawRandomCard,
    Card,
    bestHandValue,
    dealerPlay,
    compareHands,
    isBust,
} from '../../../lib/blackjack';

type State = {
    player: Card[];
    dealer: Card[];
    chips: number;
    currentBet: number | null;
    status: 'idle' | 'playing' | 'player_bust' | 'dealer_playing' | 'round_end';
    lastResult?: { outcome: 'win' | 'loss' | 'push'; player: number; dealer: number; delta: number };
};


const initialState: State = {
    player: [],
    dealer: [],
    chips: 1000,
    currentBet: null,
    status: 'idle',
};

type Action =
    | { type: 'PLACE_BET'; bet: number }
    | { type: 'START_HAND' }
    | { type: 'HIT' }
    | { type: 'STAND' }
    | { type: 'DEALER_DONE'; dealer: Card[] }
    | { type: 'RESET' };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'PLACE_BET':
            return { ...state, currentBet: action.bet, chips: state.chips - action.bet, status: 'idle' };
        case 'START_HAND': {
            if (!state.currentBet) return state;
            const p1 = drawRandomCard();
            const p2 = drawRandomCard();
            const d1 = drawRandomCard();
            const newState = { ...state, player: [p1, p2], dealer: [d1], status: 'playing' as const };
            if (isBust(newState.player)) {
                return { ...newState, status: 'player_bust' };
            }
            return newState;
        }
        case 'HIT': {
            if (state.status !== 'playing') return state;
            const card = drawRandomCard();
            const player = [...state.player, card];
            if (isBust(player)) {
                return { ...state, player, status: 'player_bust' };
            }
            return { ...state, player };
        }
        case 'STAND': {
            if (state.status !== 'playing') return state;
            return { ...state, status: 'dealer_playing' };
        }
        case 'DEALER_DONE': {
            const comp = compareHands(state.player, action.dealer);
            let delta = 0;
            if (comp.result === 'win') delta = (state.currentBet ?? 0) * 2;
            if (comp.result === 'push') delta = state.currentBet ?? 0;
            const newChips = state.chips + delta;
            const lastResult = { outcome: comp.result as any, player: comp.player, dealer: comp.dealer, delta: newChips - state.chips };
            return { ...state, dealer: action.dealer, chips: newChips, lastResult, status: 'round_end', currentBet: null };
        }
        case 'RESET': {
            return { ...state, player: [], dealer: [], status: 'idle', currentBet: null, lastResult: undefined };
        }
        default:
            return state;
    }
}

export default function GamePage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [aiSuggestion, setAiSuggestion] = React.useState<string | null>(null);
    const [highlight, setHighlight] = React.useState<'hit' | 'stand' | null>(null);


    useEffect(() => {
        if (state.status === 'dealer_playing') {
            const dealerFinal = dealerPlay(state.dealer);
            dispatch({ type: 'DEALER_DONE', dealer: dealerFinal });
        }
        if (state.status !== 'playing') {
            setAiSuggestion(null);
            setHighlight(null);
        }
    }, [state.status]);


    const placeBet = (bet: number) => dispatch({ type: 'PLACE_BET', bet });
    const startHand = () => dispatch({ type: 'START_HAND' });
    const hit = () => {
        setAiSuggestion(null);
        setHighlight(null);
        dispatch({ type: 'HIT' });
    };
    const stand = () => {
        setAiSuggestion(null);
        setHighlight(null);
        dispatch({ type: 'STAND' });
    };
    const newGame = () => {
        setAiSuggestion(null);
        setHighlight(null);
        dispatch({ type: 'RESET' });
    };


    const askAI = async () => {
        setAiSuggestion("Thinking...");
        setHighlight(null);
        try {
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player: bestHandValue(state.player).value,
                    dealer: bestHandValue(state.dealer).value,
                }),
            });
            const data = await res.json();
            if (data.suggestion) {
                setAiSuggestion(data.suggestion);
                if (data.suggestion.toLowerCase().includes('hit')) {
                    setHighlight('hit');
                } else if (data.suggestion.toLowerCase().includes('stand')) {
                    setHighlight('stand');
                }
            } else {
                setAiSuggestion("AI couldn't decide.");
            }
        } catch {
            setAiSuggestion("Error fetching AI suggestion.");
        }
    };


    return (
        <div className="flex flex-col h-screen">
            {/* Header fixed at the top */}
            <Header chips={state.chips} />
            <div className="h-screen flex items-center justify-center">
                <div className="p-4 flex flex-col items-center gap-6">

                    <div className="flex flex-col items-center gap-6">
                        {/* Dealer */}
                        <div className="flex flex-col items-center">
                            <div className="flex gap-3">
                                {state.dealer.map((c) => (
                                    <CardView key={c.id} card={c} />
                                ))}
                            </div>
                            <div className="mt-2">(<strong>{bestHandValue(state.dealer).value}</strong>) Dealer</div>
                        </div>


                        {/* Player */}
                        <div className="flex flex-col items-center">
                            <div className="flex gap-3 mt-2">
                                {state.player.map((c) => (
                                    <CardView key={c.id} card={c} />
                                ))}
                            </div>
                            <div className="mt-2">(<strong>{bestHandValue(state.player).value}</strong>) Me</div>
                        </div>
                    </div>


                    {/* Game Buttons */}
                    <div className="flex flex-wrap gap-2 mt-6 items-center justify-center">
                        {state.status === 'idle' && <BetControls chips={state.chips} onBet={placeBet} />}


                        {state.status === 'idle' && (
                            <button className="px-3 py-2 rounded bg-white text-black border" disabled={!state.currentBet} onClick={startHand}>Deal</button>
                        )}


                        {state.status === 'playing' && (
                            <>
                                <button
                                    className={`px-3 py-2 rounded bg-white text-black border ${highlight === 'hit' ? 'animate-pulse bg-yellow-200' : ''}`}
                                    onClick={hit}
                                >
                                    Hit
                                </button>
                                <button
                                    className="px-3 py-2 rounded bg-white text-black border"
                                    onClick={askAI}
                                    title="Click to ask the AI assistant for advice"
                                >
                                    ?
                                </button>
                                <button
                                    className={`px-3 py-2 rounded bg-white text-black border ${highlight === 'stand' ? 'animate-pulse bg-yellow-200' : ''}`}
                                    onClick={stand}
                                >
                                    Stand
                                </button>
                            </>
                        )}


                        {(state.status === 'round_end' || state.status === 'player_bust') && (
                            <button className="px-3 py-2 rounded bg-white text-black border" onClick={newGame}>New Game</button>
                        )}
                    </div>


                    {/* Result / AI Suggestion */}
                    <div className="mt-4 flex flex-col items-center">
                        {state.status === 'player_bust' && <div className="text-red-600 font-semibold">You busted!</div>}
                        {state.status === 'round_end' && state.lastResult && (
                            <div className="p-3 rounded border mt-2">
                                <div>Result: {state.lastResult.outcome.toUpperCase()}</div>
                                <div>Player: {state.lastResult.player} — Dealer: {state.lastResult.dealer}</div>
                                <div>Chips change: {state.lastResult.delta}</div>
                            </div>
                        )}
                        {state.status === 'playing' && aiSuggestion && (
                            <div className="mt-3 p-2 border rounded bg-gray-50 text-center text-black">
                                AI Suggestion: {aiSuggestion}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

}