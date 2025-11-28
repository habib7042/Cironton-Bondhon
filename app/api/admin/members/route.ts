import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// GET: List all members
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const adminId = authHeader?.replace('Token ', '');

    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const adminUser = await User.findById(adminId);
    if (!adminUser?.isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await User.find({ isAdmin: false }).sort({ createdAt: -1 });

    return NextResponse.json(members.map(m => ({
        id: m._id.toString(),
        name: m.name,
        phoneNumber: m.phoneNumber,
        balance: m.balance,
        fatherName: m.fatherName,
        motherName: m.motherName,
        nid: m.nid,
        dob: m.dob,
        email: m.email,
        address: m.address,
        nomineeName: m.nomineeName,
        nomineeNid: m.nomineeNid,
        profile_image: m.profileImage, // Map to camelCase for frontend consistency if needed
        joinedDate: m.createdAt
    })));

  } catch (error) {
    console.error('Fetch members error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create new member
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const adminId = authHeader?.replace('Token ', '');

    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const adminUser = await User.findById(adminId);
    if (!adminUser?.isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
        name, fatherName, motherName, nid, dob, 
        phoneNumber, email, address, nomineeName, nomineeNid 
    } = body;

    // Basic Validation
    if (!name || !phoneNumber || !nid || !fatherName) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if phone exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
    }

    const defaultPin = '1234'; 

    const newUser = await User.create({
        phoneNumber,
        pin: defaultPin,
        name,
        isAdmin: false,
        balance: 0.00,
        fatherName,
        motherName,
        nid,
        dob,
        email,
        address,
        nomineeName,
        nomineeNid
    });

    return NextResponse.json({ 
        success: true, 
        user: { 
            id: newUser._id.toString(), 
            name: newUser.name, 
            phoneNumber: newUser.phoneNumber 
        } 
    });

  } catch (error: any) {
    console.error('Create member error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}