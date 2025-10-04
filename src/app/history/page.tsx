'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export default function HistoryPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [games, setGames] = useState<GameRecord[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

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
            const response = await fetch(`/api/game/history?page=${page}&limit=20&userId=${(user as any).id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to load history');
                setLoading(false);
                return;
            }

            setGames(data.games);
            setStatistics(data.statistics);
            setTotalPages(data.pagination.totalPages);
            setLoading(false);
        } catch (err) {
            setError('An error occurred while loading history');
            setLoading(false);
        }
    };

    const getResultColor = (result: string) => {
        switch (result) {
            case 'win':
            case 'blackjack':
                return 'text-green-500';
            case 'loss':
                return 'text-red-500';
            case 'push':
                return 'text-yellow-500';
            default:
                return 'text-muted-foreground';
        }
    };

    const getResultText = (result: string) => {
        switch (result) {
            case 'win':
                return 'Win';
            case 'loss':
                return 'Loss';
            case 'push':
                return 'Push';
            case 'blackjack':
                return 'Blackjack!';
            default:
                return result;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!user || loading) {
        return (
            <div className="min-h-screen bg-background text-foreground p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl font-bold mb-8">Game History</h1>
                    <div className="text-center text-xl">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Game History</h1>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Card className="bg-card border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-muted-foreground">Total Games</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-card-foreground">{statistics.totalGames}</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-muted-foreground">Win Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-500">{statistics.winRate}%</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {statistics.totalWins}W / {statistics.totalLosses}L / {statistics.totalPushes}P
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-muted-foreground">Net Profit</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${statistics.totalChipsWon >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {statistics.totalChipsWon >= 0 ? '+' : ''}{statistics.totalChipsWon}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-muted-foreground">Total Bet</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-card-foreground">{statistics.totalBet}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Game History Table */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-card-foreground">Recent Games</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Your blackjack game history
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {games.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No games played yet. Start playing to see your history!
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-4 text-muted-foreground font-semibold">Date/Time</th>
                                            <th className="text-center py-3 px-4 text-muted-foreground font-semibold">Bet</th>
                                            <th className="text-center py-3 px-4 text-muted-foreground font-semibold">Player</th>
                                            <th className="text-center py-3 px-4 text-muted-foreground font-semibold">Dealer</th>
                                            <th className="text-center py-3 px-4 text-muted-foreground font-semibold">Result</th>
                                            <th className="text-center py-3 px-4 text-muted-foreground font-semibold">Won/Lost</th>
                                            <th className="text-right py-3 px-4 text-muted-foreground font-semibold">Chips After</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {games.map((game) => (
                                            <tr key={game._id} className="border-b border-border hover:bg-muted/50">
                                                <td className="py-3 px-4 text-card-foreground">{formatDate(game.date)}</td>
                                                <td className="py-3 px-4 text-center text-card-foreground">{game.bet}</td>
                                                <td className="py-3 px-4 text-center text-card-foreground font-semibold">{game.playerScore}</td>
                                                <td className="py-3 px-4 text-center text-card-foreground font-semibold">{game.dealerScore}</td>
                                                <td className={`py-3 px-4 text-center font-bold ${getResultColor(game.result)}`}>
                                                    {getResultText(game.result)}
                                                </td>
                                                <td className={`py-3 px-4 text-center font-semibold ${game.chipsWon >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {game.chipsWon >= 0 ? '+' : ''}{game.chipsWon}
                                                </td>
                                                <td className="py-3 px-4 text-right text-card-foreground">{game.chipsAfter}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-6">
                                <Button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    variant="outline"
                                >
                                    Previous
                                </Button>
                                <span className="text-muted-foreground">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    variant="outline"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}