import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Authenticate User
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Token ', '');
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse File & Type
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const type = searchParams.get('type') || 'misc'; // avatar, nid, document, misc

    if (!filename || !request.body) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 3. Upload to Vercel Blob
    const blob = await put(`uploads/${userId}/${type}-${filename}`, request.body, {
      access: 'public',
    });

    return NextResponse.json({ url: blob.url });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}