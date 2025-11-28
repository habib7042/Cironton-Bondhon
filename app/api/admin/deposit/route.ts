import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const adminId = authHeader?.replace('Token ', '');

    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { memberId, amount } = await request.json();

    if (!memberId || !amount || amount <= 0) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    await connectDB();

    const adminUser = await User.findById(adminId);
    if (!adminUser?.isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const member = await User.findById(memberId).session(session);
        if (!member) throw new Error('Member not found');

        // Create Transaction (Already Approved)
        const tx = await Transaction.create([{
            userId: memberId,
            transaction_type: 'DEPOSIT',
            amount: amount,
            status: 'APPROVED',
            recipientPhone: 'ADMIN_DEPOSIT' // Marker for admin action
        }], { session });

        // Update Balance
        member.balance += amount;
        await member.save({ session });

        await session.commitTransaction();
        return NextResponse.json({ success: true, newBalance: member.balance });

    } catch (err: any) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }

  } catch (error: any) {
    console.error('Admin deposit error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}