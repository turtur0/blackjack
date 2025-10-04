'use client';
import React, { useReducer, useEffect, useRef, useState } from 'react';
import CardView from '../../components/Card';
import BetControls from '../../components/BetControls';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { useGameHistory } from '../../hooks/useGameHistory';
import { calculateChipsWon } from '../../lib/gameUtils';
import {
    drawRandomCard,
    Card,
    bestHandValue,
    dealerPlay,
    compareHands,
    isBust,
} from '../../lib/blackjack';

type State = {
    player: Card[];
    dealer: Card[];
    chips: number;
    currentBet: number | null;
    status: 'idle' | 'playing' | 'player_bust' | 'dealer_playing' | 'round_end';
    lastResult?: { outcome: 'win' | 'loss' | 'push'; player: number; dealer: number; delta: number; bet: number };
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
    | { type: 'RESET' }
    | { type: 'SET_CHIPS'; chips: number };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_CHIPS':
            return { ...state, chips: action.chips };
        case 'PLACE_BET':
            return { ...state, currentBet: action.bet, chips: state.chips - action.bet, status: 'idle' };
        case 'START_HAND': {
            // For non-logged in users, set a default bet if none exists
            const betAmount = state.currentBet || 0;
            const p1 = drawRandomCard();
            const p2 = drawRandomCard();
            const d1 = drawRandomCard();
            const newState = { ...state, player: [p1, p2], dealer: [d1], status: 'playing' as const, currentBet: betAmount };
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
            const lastResult = { outcome: comp.result as any, player: comp.player, dealer: comp.dealer, delta, bet: state.currentBet ?? 0 };
            return { ...state, dealer: action.dealer, chips: newChips, lastResult, status: 'round_end' };
        }
        case 'RESET': {
            return { ...state, player: [], dealer: [], status: 'idle', currentBet: null, lastResult: undefined };
        }
        default:
            return state;
    }
}

export default function GamePage() {
    const { user, token, updateChips, refreshUser } = useAuth();
    const { saveGame, isSaving } = useGameHistory();
    const [state, dispatch] = useReducer(reducer, initialState);
    const [aiSuggestion, setAiSuggestion] = React.useState<string | null>(null);
    const [highlight, setHighlight] = React.useState<'hit' | 'stand' | null>(null);
    const [gameSaved, setGameSaved] = React.useState(false);
    const [showBetWarning, setShowBetWarning] = useState(false);
    const [syncingChips, setSyncingChips] = useState(false);

    // Track if we're in the middle of a game to prevent chip sync
    const isGameActive = useRef(false);

    // Refresh user data from database on mount
    useEffect(() => {
        if (user && token) {
            refreshUser();
        }
    }, []);

    // Sync chips with user ONLY when not in an active game
    useEffect(() => {
        if (user && !isGameActive.current) {
            dispatch({ type: 'SET_CHIPS', chips: user.chips });
        }
    }, [user]);

    // Track game active state
    useEffect(() => {
        isGameActive.current = state.status !== 'idle' || state.currentBet !== null;
    }, [state.status, state.currentBet]);

    // Helper to check if hand is blackjack
    const isBlackjack = (cards: Card[]) => {
        return cards.length === 2 && bestHandValue(cards).value === 21;
    };

    // Determine game result type for history
    const determineResultType = (outcome: 'win' | 'loss' | 'push'): 'win' | 'loss' | 'push' | 'blackjack' => {
        if (outcome === 'win' && isBlackjack(state.player)) {
            return 'blackjack';
        }
        return outcome;
    };

    // Save game to history and update auth context chips when round ends
    useEffect(() => {
        const saveGameHistory = async () => {
            if (state.status === 'round_end' && state.lastResult && !gameSaved) {
                setGameSaved(true);

                // Update chips in auth context and database
                if (user && token) {
                    setSyncingChips(true);

                    // First update local context
                    updateChips(state.chips);

                    // Then update on server
                    try {
                        const response = await fetch('/api/update-chips', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token, chips: state.chips, userId: user.id }),
                        });

                        if (!response.ok) {
                            console.error('Failed to update chips on server');
                        } else {
                            console.log('Chips updated on server:', state.chips);
                        }
                    } catch (err) {
                        console.error('Failed to update chips on server:', err);
                    } finally {
                        setSyncingChips(false);
                    }

                    const resultType = determineResultType(state.lastResult.outcome);

                    // Calculate actual chips won/lost (negative for losses)
                    const actualChipsWon = calculateChipsWon(
                        state.lastResult.bet,
                        resultType
                    );

                    const result = await saveGame({
                        bet: state.lastResult.bet,
                        playerScore: state.lastResult.player,
                        dealerScore: state.lastResult.dealer,
                        result: resultType,
                        chipsWon: actualChipsWon,
                        chipsAfter: state.chips, // Send current chips after the game
                    } as any);

                    if (result.success) {
                        console.log('Game saved to history!');
                    } else {
                        console.error('Failed to save game to history');
                    }
                }
            }
        };

        saveGameHistory();
    }, [state.status, state.lastResult, gameSaved]);

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

    // Handle player bust - update chips immediately
    useEffect(() => {
        const handleBust = async () => {
            if (state.status === 'player_bust' && user && token && !gameSaved) {
                setGameSaved(true);
                setSyncingChips(true);

                const betAmount = state.currentBet || 0;

                // Update chips in auth context
                updateChips(state.chips);

                // Update on server
                try {
                    const response = await fetch('/api/update-chips', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token, chips: state.chips, userId: user.id }),
                    });

                    if (!response.ok) {
                        console.error('Failed to update chips on server after bust');
                    } else {
                        console.log('Chips updated on server after bust:', state.chips);
                    }
                } catch (err) {
                    console.error('Failed to update chips on server after bust:', err);
                } finally {
                    setSyncingChips(false);
                }

                // Save bust game to history
                const result = await saveGame({
                    bet: betAmount,
                    playerScore: bestHandValue(state.player).value,
                    dealerScore: bestHandValue(state.dealer).value,
                    result: 'loss',
                    chipsWon: -betAmount, // Loss is negative
                    chipsAfter: state.chips, // Send current chips after the game
                } as any);

                if (result.success) {
                    console.log('Bust game saved to history!');
                } else {
                    console.error('Failed to save bust game to history');
                }
            }
        };

        handleBust();
    }, [state.status, gameSaved]);

    const placeBet = (bet: number) => {
        setShowBetWarning(false);
        dispatch({ type: 'PLACE_BET', bet });
    };

    const startHand = () => {
        // If user is logged in, require a bet
        if (user && !state.currentBet) {
            setShowBetWarning(true);
            setTimeout(() => setShowBetWarning(false), 3000);
            return;
        }
        setGameSaved(false);
        dispatch({ type: 'START_HAND' });
    };

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
        setGameSaved(false);
        setShowBetWarning(false);
        isGameActive.current = false;
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
            <Header chips={state.chips} />
            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.8);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out forwards;
                    opacity: 0;
                }
            `}</style>
            <div className="h-screen flex items-center justify-center">
                <div className="p-4 flex flex-col items-center gap-6">

                    {/* Dealer */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex flex-col items-center">
                            <div className="flex gap-3">
                                {state.dealer.length === 0 ? (
                                    // Show placeholder cards when no game is active
                                    <>
                                        <div className="w-[80px] h-[112px] bg-black rounded-lg border-2 border-gray-700 shadow-lg"></div>
                                    </>
                                ) : (
                                    state.dealer.map((c, index) => (
                                        <div
                                            key={c.id}
                                            className="animate-slideIn"
                                            style={{ animationDelay: `${index * 150}ms` }}
                                        >
                                            <CardView card={c} />
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-2">
                                {state.dealer.length > 0 ? (
                                    <>(<strong>{bestHandValue(state.dealer).value}</strong>) Dealer</>
                                ) : (
                                    <>Dealer</>
                                )}
                            </div>
                        </div>

                        {/* Player */}
                        <div className="flex flex-col items-center">
                            <div className="flex gap-3 mt-2">
                                {state.player.length === 0 ? (
                                    // Show placeholder cards when no game is active
                                    <>
                                        <div className="w-[80px] h-[112px] bg-black rounded-lg border-2 border-gray-700 shadow-lg"></div>
                                        <div className="w-[80px] h-[112px] bg-black rounded-lg border-2 border-gray-700 shadow-lg"></div>
                                    </>
                                ) : (
                                    state.player.map((c, index) => (
                                        <div
                                            key={c.id}
                                            className="animate-slideIn"
                                            style={{ animationDelay: `${index * 150}ms` }}
                                        >
                                            <CardView card={c} />
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-2">
                                {state.player.length > 0 ? (
                                    <>(<strong>{bestHandValue(state.player).value}</strong>) Me</>
                                ) : (
                                    <>Me</>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Game Buttons */}
                    <div className="flex flex-col items-center gap-3">
                        {!user && state.status === 'idle' && (
                            <div className="text-sm text-gray-400 text-center px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                                Create an account to place bets and track your progress
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2 items-center justify-center">
                            {user && state.status === 'idle' && !state.currentBet && <BetControls chips={state.chips} onBet={placeBet} />}
                            {user && state.status === 'idle' && state.currentBet && (
                                <div className="text-sm text-gray-300">
                                    Bet placed: {state.currentBet} chips
                                </div>
                            )}
                            {state.status === 'idle' && (
                                <button
                                    className="px-3 py-2 rounded bg-white text-black border hover:bg-gray-200 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={startHand}
                                >
                                    Deal
                                </button>
                            )}
                            {state.status === 'playing' && (
                                <>
                                    <button className={`px-3 py-2 rounded bg-white text-black border hover:bg-gray-200 transition duration-200 ${highlight === 'hit' ? 'animate-pulse bg-yellow-200' : ''}`} onClick={hit}>Hit</button>
                                    <button className="px-3 py-2 rounded bg-white text-black border hover:bg-gray-200 transition duration-200" onClick={askAI} title="Click to ask the AI assistant for advice">?</button>
                                    <button className={`px-3 py-2 rounded bg-white text-black border hover:bg-gray-200 transition duration-200 ${highlight === 'stand' ? 'animate-pulse bg-yellow-200' : ''}`} onClick={stand}>Stand</button>
                                </>
                            )}
                            {(state.status === 'round_end' || state.status === 'player_bust') && <button className="px-3 py-2 rounded bg-white text-black border hover:bg-gray-200 transition duration-200" onClick={newGame}>New Game</button>}
                        </div>
                    </div>

                    {/* Bet Warning */}
                    {showBetWarning && user && (
                        <div className="text-yellow-500 text-sm font-semibold animate-pulse">
                            Please place a bet before dealing!
                        </div>
                    )}

                    {/* Result / AI Suggestion */}
                    <div className="mt-4 flex flex-col items-center">
                        {state.status === 'player_bust' && (
                            <div className="p-3 rounded border mt-2 bg-red-50">
                                <div className="text-red-600 font-semibold">You busted!</div>
                                {state.currentBet && state.currentBet > 0 && (
                                    <div className="text-sm mt-1">Lost {state.currentBet} chips</div>
                                )}
                                {user && syncingChips && <div className="text-sm text-blue-500 mt-1">Syncing chips...</div>}
                                {user && !syncingChips && gameSaved && <div className="text-sm text-green-500 mt-1">✓ Saved to database</div>}
                                {!user && <div className="text-sm text-gray-500 mt-1">Login to track your games</div>}
                            </div>
                        )}
                        {state.status === 'round_end' && state.lastResult && (
                            <div className="p-3 rounded border mt-2">
                                <div>Result: {state.lastResult.outcome.toUpperCase()}</div>
                                {state.lastResult.bet > 0 && <div>Bet: {state.lastResult.bet} chips</div>}
                                <div>Player: {state.lastResult.player} — Dealer: {state.lastResult.dealer}</div>
                                {state.lastResult.bet > 0 && <div>Chips change: {state.lastResult.delta > 0 ? '+' : ''}{state.lastResult.delta}</div>}
                                {user && syncingChips && <div className="text-sm text-blue-500 mt-1">Syncing chips...</div>}
                                {user && !syncingChips && gameSaved && isSaving && <div className="text-sm text-yellow-500 mt-1">Saving to history...</div>}
                                {user && !syncingChips && gameSaved && !isSaving && <div className="text-sm text-green-500 mt-1">✓ Saved to database</div>}
                                {!user && <div className="text-sm text-gray-500 mt-1">Login to save game history and track chips</div>}
                            </div>
                        )}
                        {state.status === 'playing' && aiSuggestion && (
                            <div className="mt-3 p-2 border rounded bg-gray-50 text-center text-black">AI Suggestion: {aiSuggestion}</div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}