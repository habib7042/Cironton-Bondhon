import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export const dynamic = 'force-dynamic';

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

    // Use Population for SQL JOIN equivalent
    const transactions = await Transaction.find()
      .populate('userId', 'name phoneNumber')
      .sort({ createdAt: -1 });

    return NextResponse.json(transactions.map((t) => ({
        id: t._id.toString(),
        transaction_type: t.transaction_type,
        amount: t.amount,
        status: t.status,
        created_at: t.createdAt,
        userName: (t.userId as any)?.name || 'Unknown',
        phoneNumber: (t.userId as any)?.phoneNumber || '-',
        userId: (t.userId as any)?._id.toString()
    })));

  } catch (error) {
    console.error('Admin statement fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}