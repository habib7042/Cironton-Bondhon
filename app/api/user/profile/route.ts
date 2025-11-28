import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Token ', '');

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
        action, // 'UPDATE_INFO' | 'CHANGE_PIN' | 'ADD_DOC' | 'DELETE_DOC'
        // Info fields
        name, fatherName, motherName, address, nid, dob, email, nomineeName, nomineeNid, 
        profileImage, nidImage, nomineeNidImage,
        // Pin fields
        oldPin, newPin,
        // Doc fields
        docName, docUrl, docId
    } = body;

    await connectDB();
    const user = await User.findById(userId);

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'CHANGE_PIN') {
        if (user.pin !== oldPin) {
            return NextResponse.json({ error: 'Incorrect old PIN' }, { status: 400 });
        }
        if (!newPin || newPin.length < 4) {
            return NextResponse.json({ error: 'New PIN must be at least 4 digits' }, { status: 400 });
        }
        user.pin = newPin;
        await user.save();
        return NextResponse.json({ success: true, message: 'PIN changed successfully' });
    }

    if (action === 'UPDATE_INFO') {
        // Update allowed fields
        if (name) user.name = name;
        if (fatherName) user.fatherName = fatherName;
        if (motherName) user.motherName = motherName;
        if (address) user.address = address;
        if (nid) user.nid = nid;
        if (dob) user.dob = dob;
        if (email) user.email = email;
        if (nomineeName) user.nomineeName = nomineeName;
        if (nomineeNid) user.nomineeNid = nomineeNid;
        
        // Image updates
        if (profileImage) user.profileImage = profileImage;
        if (nidImage) user.nidImage = nidImage;
        if (nomineeNidImage) user.nomineeNidImage = nomineeNidImage;

        await user.save();
        return NextResponse.json({ success: true, message: 'Profile updated' });
    }

    if (action === 'ADD_DOC') {
        if (!docName || !docUrl) {
            return NextResponse.json({ error: 'Document name and file required' }, { status: 400 });
        }
        user.documents.push({ name: docName, url: docUrl });
        await user.save();
        return NextResponse.json({ success: true, message: 'Document added' });
    }
    
    // Fallback if no action matches
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// GET User Profile Details
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const userId = authHeader?.replace('Token ', '');
    
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    
        await connectDB();
        const user = await User.findById(userId).select('-pin -isAdmin');
        
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json(user);

    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}