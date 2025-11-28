import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();

    const adminPhone = '01799999999';
    const existingAdmin = await User.findOne({ phoneNumber: adminPhone });

    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin account already exists' });
    }

    // Create Default Admin
    await User.create({
      name: 'System Admin',
      phoneNumber: adminPhone,
      pin: '1234', // In production, hash this!
      balance: 0,
      isAdmin: true,
      address: 'Head Office, Dhaka'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Admin account created. Login with 01799999999 / 1234' 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}