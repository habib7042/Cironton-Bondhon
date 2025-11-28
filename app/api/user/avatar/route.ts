import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Authenticate User
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Token ', '');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse File
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename || !request.body) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 3. Upload to Vercel Blob
    const blob = await put(`avatars/${userId}-${filename}`, request.body, {
      access: 'public',
    });

    // 4. Update Database (MongoDB)
    await connectDB();
    await User.findByIdAndUpdate(userId, { profileImage: blob.url });

    return NextResponse.json({ url: blob.url });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}