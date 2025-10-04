// app/api/game/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to view game history.' },
        { status: 401 }
      );
    }

    // Get userId from query params
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db('blackjack');

    // Fetch user's game history, sorted by date (newest first)
    const games = await db
      .collection('gameHistory')
      .find({ userId: new ObjectId(userId) })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalGames = await db
      .collection('gameHistory')
      .countDocuments({ userId: new ObjectId(userId) });

    // Calculate statistics
    const statsResult = await db
      .collection('gameHistory')
      .aggregate([
        { $match: { userId: new ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalGames: { $sum: 1 },
            totalWins: {
              $sum: { 
                $cond: [
                  { $in: ['$result', ['win', 'blackjack']] }, 
                  1, 
                  0
                ] 
              }
            },
            totalLosses: {
              $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] }
            },
            totalPushes: {
              $sum: { $cond: [{ $eq: ['$result', 'push'] }, 1, 0] }
            },
            totalChipsWon: { $sum: '$chipsWon' },
            totalBet: { $sum: '$bet' },
          }
        }
      ])
      .toArray();

    const statistics = statsResult.length > 0 ? statsResult[0] : {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalPushes: 0,
      totalChipsWon: 0,
      totalBet: 0,
    };

    return NextResponse.json(
      {
        games: games.map(game => ({
          ...game,
          _id: game._id.toString(),
          userId: game.userId.toString(),
        })),
        pagination: {
          page,
          limit,
          totalGames,
          totalPages: Math.ceil(totalGames / limit),
        },
        statistics: {
          ...statistics,
          winRate: statistics.totalGames > 0 
            ? ((statistics.totalWins / statistics.totalGames) * 100).toFixed(1)
            : '0.0',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}