import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// GET: Fetch all pending transactions
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

    // Populate user details in transaction query
    const transactions = await Transaction.find({ status: 'PENDING' })
      .populate('userId', 'name phoneNumber')
      .sort({ createdAt: 1 });

    return NextResponse.json(transactions.map((t) => ({
        id: t._id.toString(),
        transaction_type: t.transaction_type,
        amount: t.amount,
        status: t.status,
        created_at: t.createdAt,
        userName: (t.userId as any)?.name || 'Unknown',
        userId: (t.userId as any)?._id.toString()
    })));

  } catch (error) {
    console.error('Admin fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Approve or Reject
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const adminId = authHeader?.replace('Token ', '');
        const { transactionId, action } = await request.json(); // action: 'APPROVE' | 'REJECT'

        if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        await connectDB();

        const adminUser = await User.findById(adminId);
        if (!adminUser?.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const tx = await Transaction.findById(transactionId).session(session);
            if (!tx) throw new Error('Transaction not found');
            if (tx.status !== 'PENDING') throw new Error('Transaction already processed');

            if (action === 'REJECT') {
                tx.status = 'REJECTED';
                await tx.save({ session });
            } else if (action === 'APPROVE') {
                const amount = tx.amount;
                const user = await User.findById(tx.userId).session(session);
                
                if (!user) throw new Error('User not found');

                if (tx.transaction_type === 'DEPOSIT') {
                    user.balance += amount;
                } else if (tx.transaction_type === 'WITHDRAW') {
                    if (user.balance < amount) throw new Error('Insufficient user funds');
                    user.balance -= amount;
                }

                tx.status = 'APPROVED';
                await tx.save({ session });
                await user.save({ session });
            } else {
                throw new Error('Invalid action');
            }

            await session.commitTransaction();
            return NextResponse.json({ success: true });

        } catch (err: any) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }

    } catch (error: any) {
        console.error('Admin action error:', error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}