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

// Types
type GameStatus = 'idle' | 'playing' | 'player_bust' | 'dealer_playing' | 'round_end';
type GameResult = 'win' | 'loss' | 'push' | 'blackjack';

interface LastResult {
    outcome: 'win' | 'loss' | 'push';
    player: number;
    dealer: number;
    delta: number;
    bet: number;
}

interface State {
    player: Card[];
    dealer: Card[];
    chips: number;
    currentBet: number | null;
    status: GameStatus;
    lastResult?: LastResult;
}

type Action =
    | { type: 'PLACE_BET'; bet: number }
    | { type: 'START_HAND' }
    | { type: 'HIT' }
    | { type: 'STAND' }
    | { type: 'DEALER_DONE'; dealer: Card[] }
    | { type: 'RESET' }
    | { type: 'SET_CHIPS'; chips: number };

// Constants
const INITIAL_STATE: State = {
    player: [],
    dealer: [],
    chips: 1000,
    currentBet: null,
    status: 'idle',
};

// Reducer
function gameReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_CHIPS':
            return { ...state, chips: action.chips };

        case 'PLACE_BET':
            return {
                ...state,
                currentBet: action.bet,
                chips: state.chips - action.bet,
                status: 'idle'
            };

        case 'START_HAND': {
            const betAmount = state.currentBet || 0;
            const player = [drawRandomCard(), drawRandomCard()];
            const dealer = [drawRandomCard()];

            const newState: State = {
                ...state,
                player,
                dealer,
                status: isBust(player) ? 'player_bust' : 'playing',
                currentBet: betAmount
            };

            return newState;
        }

        case 'HIT': {
            if (state.status !== 'playing') return state;

            const newCard = drawRandomCard();
            const player = [...state.player, newCard];

            return {
                ...state,
                player,
                status: isBust(player) ? 'player_bust' : 'playing'
            };
        }

        case 'STAND':
            return state.status === 'playing'
                ? { ...state, status: 'dealer_playing' }
                : state;

        case 'DEALER_DONE': {
            const comparison = compareHands(state.player, action.dealer);
            const betAmount = state.currentBet ?? 0;

            let delta = 0;
            if (comparison.result === 'win') delta = betAmount * 2;
            if (comparison.result === 'push') delta = betAmount;

            return {
                ...state,
                dealer: action.dealer,
                chips: state.chips + delta,
                lastResult: {
                    outcome: comparison.result as 'win' | 'loss' | 'push',
                    player: comparison.player,
                    dealer: comparison.dealer,
                    delta,
                    bet: betAmount
                },
                status: 'round_end'
            };
        }

        case 'RESET':
            return {
                ...state,
                player: [],
                dealer: [],
                status: 'idle',
                currentBet: null,
                lastResult: undefined
            };

        default:
            return state;
    }
}

// Utility Functions
const isBlackjack = (cards: Card[]): boolean => {
    return cards.length === 2 && bestHandValue(cards).value === 21;
};

const determineResultType = (outcome: 'win' | 'loss' | 'push', playerCards: Card[]): GameResult => {
    return outcome === 'win' && isBlackjack(playerCards) ? 'blackjack' : outcome;
};

// Main Component
export default function GamePage() {
    const { user, token, updateChips, refreshUser } = useAuth();
    const { saveGame, isSaving } = useGameHistory();
    const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [highlight, setHighlight] = useState<'hit' | 'stand' | null>(null);
    const [gameSaved, setGameSaved] = useState(false);
    const [showBetWarning, setShowBetWarning] = useState(false);
    const [syncingChips, setSyncingChips] = useState(false);

    const isGameActive = useRef(false);

    // Refresh user data on mount
    useEffect(() => {
        if (user && token) {
            refreshUser();
        }
    }, []);

    // Sync chips with user when not in active game
    useEffect(() => {
        if (user && !isGameActive.current) {
            dispatch({ type: 'SET_CHIPS', chips: user.chips });
        }
    }, [user]);

    // Track game active state
    useEffect(() => {
        isGameActive.current = state.status !== 'idle' || state.currentBet !== null;
    }, [state.status, state.currentBet]);

    // Handle dealer playing
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

    // Update chips on server
    const updateServerChips = async (chips: number) => {
        if (!user || !token) return;

        setSyncingChips(true);
        updateChips(chips);

        try {
            const response = await fetch('/api/update-chips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, chips, userId: user.id }),
            });

            if (!response.ok) {
                console.error('Failed to update chips on server');
            }
        } catch (err) {
            console.error('Failed to update chips on server:', err);
        } finally {
            setSyncingChips(false);
        }
    };

    // Save game to history
    const saveGameToHistory = async (
        bet: number,
        playerScore: number,
        dealerScore: number,
        result: GameResult,
        chipsWon: number,
        chipsAfter: number
    ) => {
        const saveResult = await saveGame({
            bet,
            playerScore,
            dealerScore,
            result,
            chipsWon,
            chipsAfter,
        } as any);

        if (saveResult.success) {
            console.log('Game saved to history!');
        } else {
            console.error('Failed to save game to history');
        }
    };

    // Handle round end
    useEffect(() => {
        const handleRoundEnd = async () => {
            if (state.status !== 'round_end' || !state.lastResult || gameSaved || !user || !token) {
                return;
            }

            setGameSaved(true);

            await updateServerChips(state.chips);

            const resultType = determineResultType(state.lastResult.outcome, state.player);
            const actualChipsWon = calculateChipsWon(state.lastResult.bet, resultType);

            await saveGameToHistory(
                state.lastResult.bet,
                state.lastResult.player,
                state.lastResult.dealer,
                resultType,
                actualChipsWon,
                state.chips
            );
        };

        handleRoundEnd();
    }, [state.status, state.lastResult, gameSaved, user, token]);

    // Handle player bust
    useEffect(() => {
        const handleBust = async () => {
            if (state.status !== 'player_bust' || gameSaved || !user || !token) {
                return;
            }

            setGameSaved(true);
            const betAmount = state.currentBet || 0;

            await updateServerChips(state.chips);
            await saveGameToHistory(
                betAmount,
                bestHandValue(state.player).value,
                bestHandValue(state.dealer).value,
                'loss',
                -betAmount,
                state.chips
            );
        };

        handleBust();
    }, [state.status, gameSaved, user, token]);

    // Action Handlers
    const placeBet = (bet: number) => {
        setShowBetWarning(false);
        dispatch({ type: 'PLACE_BET', bet });
    };

    const startHand = () => {
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
                const suggestion = data.suggestion.toLowerCase();
                if (suggestion.includes('hit')) {
                    setHighlight('hit');
                } else if (suggestion.includes('stand')) {
                    setHighlight('stand');
                }
            } else {
                setAiSuggestion("AI couldn't decide.");
            }
        } catch {
            setAiSuggestion("Error fetching AI suggestion.");
        }
    };

    // Render helpers
    const renderCards = (cards: Card[], label: string, showScore: boolean) => (
        <div className="flex flex-col items-center w-full px-2">
            <div className="flex gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 flex-wrap justify-center max-w-full">
                {cards.length === 0 ? (
                    <>
                        <div className="w-14 h-20 xs:w-16 xs:h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 bg-black rounded-lg border-2 border-gray-700 shadow-lg flex-shrink-0"></div>
                        {label === 'Me' && (
                            <div className="w-14 h-20 xs:w-16 xs:h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 bg-black rounded-lg border-2 border-gray-700 shadow-lg flex-shrink-0"></div>
                        )}
                    </>
                ) : (
                    cards.map((card, index) => (
                        <div
                            key={card.id}
                            className="animate-slideIn flex-shrink-0"
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            <CardView card={card} />
                        </div>
                    ))
                )}
            </div>
            <div className="mt-2 text-xs xs:text-sm sm:text-base">
                {showScore ? (
                    <><strong className="text-base xs:text-lg sm:text-xl md:text-2xl">{bestHandValue(cards).value}</strong> {label}</>
                ) : (
                    <>{label}</>
                )}
            </div>
        </div>
    );

    const renderGameButtons = () => (
        <div className="flex flex-col items-center gap-2 xs:gap-3 w-full px-2 xs:px-4">
            {!user && state.status === 'idle' && (
                <div className="text-xs sm:text-sm text-gray-400 text-center px-3 xs:px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full">
                    Create an account to place bets and track your progress
                </div>
            )}

            <div className="flex flex-wrap gap-2 items-center justify-center w-full max-w-md">
                {user && state.status === 'idle' && !state.currentBet && (
                    <BetControls chips={state.chips} onBet={placeBet} />
                )}

                {user && state.status === 'idle' && state.currentBet && (
                    <div className="text-xs sm:text-sm md:text-base text-gray-300">
                        Bet placed: {state.currentBet} chips
                    </div>
                )}

                {state.status === 'idle' && (
                    <button
                        className="px-3 py-2 xs:px-4 xs:py-2 sm:px-6 sm:py-3 rounded bg-white text-black border hover:bg-gray-200 transition duration-200 text-xs xs:text-sm sm:text-base font-medium"
                        onClick={startHand}
                    >
                        Deal
                    </button>
                )}

                {state.status === 'playing' && (
                    <>
                        <button
                            className={`px-3 py-2 xs:px-4 xs:py-2 sm:px-6 sm:py-3 rounded bg-white text-black border hover:bg-gray-200 transition duration-200 text-xs xs:text-sm sm:text-base font-medium ${highlight === 'hit' ? 'animate-pulse bg-yellow-200' : ''
                                }`}
                            onClick={hit}
                        >
                            Hit
                        </button>
                        <button
                            className="px-2.5 py-2 xs:px-3 xs:py-2 sm:px-4 sm:py-3 rounded bg-white text-black border hover:bg-gray-200 transition duration-200 text-xs xs:text-sm sm:text-base font-medium"
                            onClick={askAI}
                            title="Click to ask the AI assistant for advice"
                        >
                            ?
                        </button>
                        <button
                            className={`px-3 py-2 xs:px-4 xs:py-2 sm:px-6 sm:py-3 rounded bg-white text-black border hover:bg-gray-200 transition duration-200 text-xs xs:text-sm sm:text-base font-medium ${highlight === 'stand' ? 'animate-pulse bg-yellow-200' : ''
                                }`}
                            onClick={stand}
                        >
                            Stand
                        </button>
                    </>
                )}

                {(state.status === 'round_end' || state.status === 'player_bust') && (
                    <button
                        className="px-3 py-2 xs:px-4 xs:py-2 sm:px-6 sm:py-3 rounded bg-white text-black border hover:bg-gray-200 transition duration-200 text-xs xs:text-sm sm:text-base font-medium"
                        onClick={newGame}
                    >
                        New Game
                    </button>
                )}
            </div>
        </div>
    );

    const renderResult = () => (
        <div className="mt-3 xs:mt-4 flex flex-col items-center w-full px-2 xs:px-4">
            {state.status === 'player_bust' && (
                <div className="p-2.5 xs:p-3 rounded border mt-2 bg-red-50 max-w-md w-full text-xs xs:text-sm sm:text-base">
                    <div className="text-red-600 font-semibold">You busted!</div>
                    {state.currentBet && state.currentBet > 0 && (
                        <div className="text-xs sm:text-sm mt-1">Lost {state.currentBet} chips</div>
                    )}
                    {user && syncingChips && (
                        <div className="text-xs sm:text-sm text-blue-500 mt-1">Syncing chips...</div>
                    )}
                    {user && !syncingChips && gameSaved && (
                        <div className="text-xs sm:text-sm text-green-500 mt-1">✓ Saved to database</div>
                    )}
                    {!user && (
                        <div className="text-xs sm:text-sm text-gray-500 mt-1">Login to track your games</div>
                    )}
                </div>
            )}

            {state.status === 'round_end' && state.lastResult && (
                <div className="p-2.5 xs:p-3 rounded border mt-2 max-w-md w-full text-xs xs:text-sm sm:text-base">
                    <div className="font-semibold">Result: {state.lastResult.outcome.toUpperCase()}</div>
                    {state.lastResult.bet > 0 && (
                        <div className="text-xs sm:text-sm">Bet: {state.lastResult.bet} chips</div>
                    )}
                    <div className="text-xs sm:text-sm">
                        Player: {state.lastResult.player} — Dealer: {state.lastResult.dealer}
                    </div>
                    {state.lastResult.bet > 0 && (
                        <div className="text-xs sm:text-sm">
                            Chips change: {state.lastResult.delta > 0 ? '+' : ''}
                            {state.lastResult.delta}
                        </div>
                    )}
                    {user && syncingChips && (
                        <div className="text-xs sm:text-sm text-blue-500 mt-1">Syncing chips...</div>
                    )}
                    {user && !syncingChips && gameSaved && isSaving && (
                        <div className="text-xs sm:text-sm text-yellow-500 mt-1">Saving to history...</div>
                    )}
                    {user && !syncingChips && gameSaved && !isSaving && (
                        <div className="text-xs sm:text-sm text-green-500 mt-1">✓ Saved to database</div>
                    )}
                    {!user && (
                        <div className="text-xs sm:text-sm text-gray-500 mt-1">
                            Login to save game history and track chips
                        </div>
                    )}
                </div>
            )}

            {state.status === 'playing' && aiSuggestion && (
                <div className="mt-2 xs:mt-3 p-2 xs:p-3 border rounded bg-gray-50 text-center text-black max-w-md w-full text-xs sm:text-sm">
                    <strong>AI Suggestion:</strong> {aiSuggestion}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen">
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

            <div className="flex-1 flex items-center justify-center py-3 xs:py-4 sm:py-6 md:py-8">
                <div className="w-full max-w-4xl px-2 xs:px-3 sm:px-4 flex flex-col items-center gap-3 xs:gap-4 sm:gap-6">
                    <div className="flex flex-col items-center gap-3 xs:gap-4 sm:gap-6 w-full">
                        {renderCards(state.dealer, 'Dealer', state.dealer.length > 0)}
                        {renderCards(state.player, 'Me', state.player.length > 0)}
                    </div>

                    {renderGameButtons()}

                    {showBetWarning && user && (
                        <div className="text-yellow-500 text-xs sm:text-sm font-semibold animate-pulse px-2 xs:px-4 text-center">
                            Please place a bet before dealing!
                        </div>
                    )}

                    {renderResult()}
                </div>
            </div>
        </div>
    );
}