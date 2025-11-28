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

    // 1. Fetch User Transactions
    const transactions = await Transaction.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    // 2. Calculate Total Group Fund (Sum of all user balances)
    const balanceResult = await User.aggregate([
      { $match: { isAdmin: false } }, // Exclude admin accounts from fund total
      { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);
    const totalGroupBalance = balanceResult[0]?.total || 0;

    // 3. Real Active Member Count
    const activeMembersCount = await User.countDocuments({ isAdmin: false });

    // 4. Calculate Split (Total Deposited vs Withdrawn)
    const splitStats = await Transaction.aggregate([
        { $match: { status: 'APPROVED' } },
        { $group: {
            _id: "$transaction_type",
            total: { $sum: "$amount" }
        }}
    ]);

    const totalDeposited = splitStats.find(s => s._id === 'DEPOSIT')?.total || 0;
    const totalWithdrawn = splitStats.find(s => s._id === 'WITHDRAW')?.total || 0;

    // 5. Calculate Growth (Last 6 months deposits)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    
    const growthStats = await Transaction.aggregate([
        { 
            $match: { 
                status: 'APPROVED', 
                transaction_type: 'DEPOSIT',
                createdAt: { $gte: sixMonthsAgo }
            } 
        },
        {
            $group: {
                _id: { $month: "$createdAt" }, // Group by month number (1-12)
                total: { $sum: "$amount" },
                year: { $first: { $year: "$createdAt" } } // Keep year to sort correctly
            }
        },
        { $sort: { year: 1, _id: 1 } } // Sort chronologically
    ]);

    // Format growth data for frontend (ensure 6 items, fill missing months with 0)
    const formattedGrowth = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthIndex = d.getMonth() + 1; // 1-based for Mongo match
        
        const found = growthStats.find(g => g._id === monthIndex);
        formattedGrowth.push({
            label: monthNames[d.getMonth()],
            value: found ? found.total : 0
        });
    }

    return NextResponse.json({
      balance: user.balance,
      totalGroupBalance: totalGroupBalance,
      activeMembersCount: activeMembersCount,
      stats: {
          totalDeposited,
          totalWithdrawn,
          currentBalance: totalGroupBalance,
          growth: formattedGrowth
      },
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