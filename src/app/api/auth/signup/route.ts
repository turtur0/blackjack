// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('blackjack');

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ username });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const result = await db.collection('users').insertOne({
      username,
      password: hashedPassword,
      chips: 1000,
      createdAt: new Date(),
    });

    // Generate simple token
    const token = uuidv4();

    return NextResponse.json(
      {
        message: 'User created successfully',
        token,
        user: {
          id: result.insertedId.toString(),
          username,
          chips: 1000,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}