import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const VALIDATION = {
  MIN_USERNAME_LENGTH: 3,
  MIN_PASSWORD_LENGTH: 6,
  INITIAL_CHIPS: 1000,
};

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (username.length < VALIDATION.MIN_USERNAME_LENGTH) {
      return NextResponse.json(
        { error: `Username must be at least ${VALIDATION.MIN_USERNAME_LENGTH} characters long` },
        { status: 400 }
      );
    }

    if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters long` },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('blackjack');
    const users = db.collection('users');

    // Check if user exists
    const existingUser = await users.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await users.insertOne({
      username,
      password: hashedPassword,
      chips: VALIDATION.INITIAL_CHIPS,
      createdAt: new Date(),
    });

    const token = uuidv4();

    return NextResponse.json(
      {
        message: 'User created successfully',
        token,
        user: {
          id: result.insertedId.toString(),
          username,
          chips: VALIDATION.INITIAL_CHIPS,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}