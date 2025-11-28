import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Chat from '@/models/Chat';
import User from '@/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// GET: Fetch latest 50 messages
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Token ', '');

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const messages = await Chat.find()
      .sort({ createdAt: -1 }) // Get newest first
      .limit(50); // Limit to last 50

    // Reverse to show oldest to newest in chat window
    return NextResponse.json(messages.reverse());

  } catch (error) {
    console.error('Chat fetch error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

// POST: Send a message
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Token ', '');

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message empty' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userId);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const shortId = user.id.length >= 8 
        ? user.id.substring(0, 4) + user.id.substring(user.id.length - 2) 
        : 'MEM';

    const newChat = await Chat.create({
      userId: user._id,
      userName: user.name,
      memberId: shortId.toUpperCase(),
      userImage: user.profileImage, // Save profile image
      message: message.trim(),
      isAdmin: user.isAdmin
    });

    return NextResponse.json(newChat);

  } catch (error) {
    console.error('Chat send error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}