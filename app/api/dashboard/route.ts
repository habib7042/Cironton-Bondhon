import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Token ', '');

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch User Transactions
    const transactions = await Transaction.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate Total Group Fund (Sum of all user balances)
    const result = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);
    const totalGroupBalance = result[0]?.total || 0;

    return NextResponse.json({
      balance: user.balance,
      totalGroupBalance: totalGroupBalance,
      transactions: transactions.map((t) => ({
        id: t._id.toString(),
        transaction_type: t.transaction_type,
        amount: t.amount,
        status: t.status,
        created_at: t.createdAt,
        recipientPhone: t.recipientPhone
      }))
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}