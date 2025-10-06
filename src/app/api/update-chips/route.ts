import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../../lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { token, chips, userId } = await request.json();

    // Validation
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    if (typeof chips !== 'number' || chips < 0) {
      return NextResponse.json(
        { error: 'Invalid chip amount' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('blackjack');
    const users = db.collection('users');

    // Update user's chips
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { chips } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch updated user
    const updatedUser = await users.findOne({ _id: new ObjectId(userId) });

    return NextResponse.json({
      message: 'Chips updated successfully',
      chips: updatedUser?.chips || chips,
    });
  } catch (error) {
    console.error('Update chips error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}