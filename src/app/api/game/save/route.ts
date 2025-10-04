// app/api/game/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login to save game history.' },
                { status: 401 }
            );
        }

        const { bet, playerScore, dealerScore, result, chipsWon, username, userId, chipsAfter } = await req.json();

        // Validation
        if (bet === undefined || playerScore === undefined || dealerScore === undefined || !result) {
            return NextResponse.json(
                { error: 'Missing required game data' },
                { status: 400 }
            );
        }

        if (!['win', 'loss', 'push', 'blackjack'].includes(result)) {
            return NextResponse.json(
                { error: 'Invalid result value' },
                { status: 400 }
            );
        }

        if (!username || !userId) {
            return NextResponse.json(
                { error: 'Missing user information' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('blackjack');

        // Get current user's chips to verify they match what we expect
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Use the chipsAfter value sent from the client (chips have already been updated)
        // Don't modify chips here - they've already been updated in the update-chips endpoint
        const finalChipsAfter = chipsAfter !== undefined ? chipsAfter : user.chips;

        // Save game history
        const gameHistory = await db.collection('gameHistory').insertOne({
            userId: new ObjectId(userId),
            username,
            date: new Date(),
            bet,
            playerScore,
            dealerScore,
            result,
            chipsWon, // This should be the net change: positive for wins, negative for losses
            chipsAfter: finalChipsAfter,
        });

        return NextResponse.json(
            {
                message: 'Game saved successfully',
                game: {
                    id: gameHistory.insertedId.toString(),
                    chipsAfter: finalChipsAfter,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Save game error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}