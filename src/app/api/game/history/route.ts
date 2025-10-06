import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to view game history.' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const page = parseInt(searchParams.get('page') || String(DEFAULT_PAGE));
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db('blackjack');
    const gameHistory = db.collection('gameHistory');

    const userObjectId = new ObjectId(userId);

    // Fetch games
    const games = await gameHistory
      .find({ userId: userObjectId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count
    const totalGames = await gameHistory.countDocuments({ userId: userObjectId });

    // Calculate statistics
    const statsResult = await gameHistory.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          totalWins: {
            $sum: {
              $cond: [{ $in: ['$result', ['win', 'blackjack']] }, 1, 0]
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
    ]).toArray();

    const statistics = statsResult.length > 0 ? statsResult[0] : {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalPushes: 0,
      totalChipsWon: 0,
      totalBet: 0,
    };

    const winRate = statistics.totalGames > 0
      ? ((statistics.totalWins / statistics.totalGames) * 100).toFixed(1)
      : '0.0';

    return NextResponse.json({
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
        winRate,
      },
    });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}