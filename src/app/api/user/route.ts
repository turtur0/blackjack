import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../../lib/mongodb';

export async function POST(request: NextRequest) {
    try {
        const { userId, token } = await request.json();

        if (!token || !userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const client = await clientPromise;
        const db = client.db('blackjack');
        const users = db.collection('users');

        const user = await users.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: {
                id: user._id.toString(),
                username: user.username,
                chips: user.chips,
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}