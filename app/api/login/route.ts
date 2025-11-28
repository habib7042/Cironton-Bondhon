import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, pin } = body;

    if (!phoneNumber || !pin) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    await connectDB();

    // Find user by phone and pin (In production, hash the pin!)
    const user = await User.findOne({ phoneNumber, pin });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({
      token: user._id.toString(), // Use Mongo ID as token
      user: {
        id: user._id.toString(),
        name: user.name,
        balance: user.balance,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}