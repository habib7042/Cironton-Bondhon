import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Token ', '');

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { transaction_type, amount } = body;

    if (!['DEPOSIT', 'WITHDRAW'].includes(transaction_type) || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    await connectDB();

    const tx = await Transaction.create({
      userId,
      transaction_type,
      amount,
      status: 'PENDING'
    });

    return NextResponse.json({
      id: tx._id.toString(),
      transaction_type: tx.transaction_type,
      amount: tx.amount,
      status: tx.status,
      created_at: tx.createdAt
    });

  } catch (error) {
    console.error('Transaction error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}