'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types
interface GameRecord {
    _id: string;
    date: string;
    bet: number;
    playerScore: number;
    dealerScore: number;
    result: 'win' | 'loss' | 'push' | 'blackjack';
    chipsWon: number;
    chipsAfter: number;
}

interface Statistics {
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    totalPushes: number;
    totalChipsWon: number;
    totalBet: number;
    winRate: string;
}

// Utility functions
const getResultColor = (result: string): string => {
    const colors: Record<string, string> = {
        win: 'text-green-500',
        blackjack: 'text-green-500',
        loss: 'text-red-500',
        push: 'text-yellow-500',
    };
    return colors[result] || 'text-muted-foreground';
};

const getResultText = (result: string): string => {
    const texts: Record<string, string> = {
        win: 'Win',
        loss: 'Loss',
        push: 'Push',
        blackjack: 'Blackjack!',
    };
    return texts[result] || result;
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function HistoryPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [games, setGames] = useState<GameRecord[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!user || !token) {
            router.push('/login');
        } else {
            fetchHistory();
        }
    }, [user, token, page]);

    const fetchHistory = async () => {
        if (!user || !token) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(
                `/api/game/history?page=${page}&limit=20&userId=${(user as any).id}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to load history');
                return;
            }

            setGames(data.games);
            setStatistics(data.statistics);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            setError('An error occurred while loading history');
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) => (
        <Card className="bg-card border-border">
            <CardHeader className="pb-2 xs:pb-3 px-3 xs:px-4 pt-3 xs:pt-4">
                <CardTitle className="text-xs xs:text-sm text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent className="px-3 xs:px-4 pb-3 xs:pb-4">
                <div className={`text-xl xs:text-2xl sm:text-3xl font-bold ${typeof value === 'string' && value.includes('%') ? 'text-green-500' : 'text-card-foreground'}`}>
                    {value}
                </div>
                {subtitle && (
                    <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 xs:mt-1">{subtitle}</div>
                )}
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header chips={user?.chips || 0} />
                <div className="p-3 xs:p-4 sm:p-6 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-4 xs:mb-6 sm:mb-8">Game History</h1>
                        <div className="text-center text-base xs:text-lg sm:text-xl">Loading...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header chips={user.chips} />
            <div className="p-3 xs:p-4 sm:p-6 md:p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold mb-4 xs:mb-6 sm:mb-8">Game History</h1>

                    {error && (
                        <Alert variant="destructive" className="mb-4 xs:mb-6">
                            <AlertDescription className="text-xs xs:text-sm">{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Statistics Cards */}
                    {statistics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 mb-4 xs:mb-6 sm:mb-8">
                            <StatCard
                                title="Total Games"
                                value={statistics.totalGames}
                            />
                            <StatCard
                                title="Win Rate"
                                value={`${statistics.winRate}%`}
                                subtitle={`${statistics.totalWins}W / ${statistics.totalLosses}L / ${statistics.totalPushes}P`}
                            />
                            <Card className="bg-card border-border">
                                <CardHeader className="pb-2 xs:pb-3 px-3 xs:px-4 pt-3 xs:pt-4">
                                    <CardTitle className="text-xs xs:text-sm text-muted-foreground">Net Profit</CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 xs:px-4 pb-3 xs:pb-4">
                                    <div className={`text-xl xs:text-2xl sm:text-3xl font-bold ${statistics.totalChipsWon >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {statistics.totalChipsWon >= 0 ? '+' : ''}{statistics.totalChipsWon}
                                    </div>
                                </CardContent>
                            </Card>
                            <StatCard
                                title="Total Bet"
                                value={statistics.totalBet}
                            />
                        </div>
                    )}

                    {/* Game History Table */}
                    <Card className="bg-card border-border">
                        <CardHeader className="px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6 pb-2 xs:pb-3 sm:pb-4">
                            <CardTitle className="text-base xs:text-lg sm:text-xl text-card-foreground">Recent Games</CardTitle>
                            <CardDescription className="text-xs xs:text-sm text-muted-foreground">
                                Your blackjack game history
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-0 xs:px-2 sm:px-4 pb-3 xs:pb-4 sm:pb-6">
                            {games.length === 0 ? (
                                <div className="text-center py-6 xs:py-8 text-xs xs:text-sm sm:text-base text-muted-foreground px-3">
                                    No games played yet. Start playing to see your history!
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-3 px-4 text-muted-foreground font-semibold text-sm">Date/Time</th>
                                                    <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-sm">Bet</th>
                                                    <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-sm">Player</th>
                                                    <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-sm">Dealer</th>
                                                    <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-sm">Result</th>
                                                    <th className="text-center py-3 px-4 text-muted-foreground font-semibold text-sm">Won/Lost</th>
                                                    <th className="text-right py-3 px-4 text-muted-foreground font-semibold text-sm">Chips After</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {games.map((game) => (
                                                    <tr key={game._id} className="border-b border-border hover:bg-muted/50">
                                                        <td className="py-3 px-4 text-card-foreground text-sm">{formatDate(game.date)}</td>
                                                        <td className="py-3 px-4 text-center text-card-foreground text-sm">{game.bet}</td>
                                                        <td className="py-3 px-4 text-center text-card-foreground font-semibold text-sm">{game.playerScore}</td>
                                                        <td className="py-3 px-4 text-center text-card-foreground font-semibold text-sm">{game.dealerScore}</td>
                                                        <td className={`py-3 px-4 text-center font-bold text-sm ${getResultColor(game.result)}`}>
                                                            {getResultText(game.result)}
                                                        </td>
                                                        <td className={`py-3 px-4 text-center font-semibold text-sm ${game.chipsWon >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {game.chipsWon >= 0 ? '+' : ''}{game.chipsWon}
                                                        </td>
                                                        <td className="py-3 px-4 text-right text-card-foreground text-sm">{game.chipsAfter}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden space-y-2 xs:space-y-3 px-2 xs:px-3">
                                        {games.map((game) => (
                                            <div key={game._id} className="border border-border rounded-lg p-2.5 xs:p-3 bg-card/50 hover:bg-muted/50">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="text-xs text-muted-foreground">{formatDateShort(game.date)}</div>
                                                    <div className={`text-xs xs:text-sm font-bold ${getResultColor(game.result)}`}>
                                                        {getResultText(game.result)}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 xs:gap-y-2 text-xs xs:text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Bet:</span>
                                                        <span className="font-medium text-card-foreground">{game.bet}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Won/Lost:</span>
                                                        <span className={`font-semibold ${game.chipsWon >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {game.chipsWon >= 0 ? '+' : ''}{game.chipsWon}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Player:</span>
                                                        <span className="font-semibold text-card-foreground">{game.playerScore}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Dealer:</span>
                                                        <span className="font-semibold text-card-foreground">{game.dealerScore}</span>
                                                    </div>
                                                    <div className="flex justify-between col-span-2">
                                                        <span className="text-muted-foreground">Chips After:</span>
                                                        <span className="font-medium text-card-foreground">{game.chipsAfter}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-3 xs:gap-4 mt-4 xs:mt-6 px-3">
                                    <Button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        variant="outline"
                                        className="text-xs xs:text-sm h-8 xs:h-9 px-2.5 xs:px-4"
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-xs xs:text-sm text-muted-foreground">
                                        Page {page} of {totalPages}
                                    </span>
                                    <Button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        variant="outline"
                                        className="text-xs xs:text-sm h-8 xs:h-9 px-2.5 xs:px-4"
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}