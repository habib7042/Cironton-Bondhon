
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Extract "Token" (User ID) from Authorization header
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Token ', '');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    
    // Fetch User Transactions
    const txResult = await pool.query(
      'SELECT id, transaction_type, amount, status, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    // Calculate Total Group Fund (Sum of all user balances)
    const totalFundResult = await pool.query('SELECT SUM(balance) as total FROM users');
    const totalGroupBalance = parseFloat(totalFundResult.rows[0]?.total || '0');

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      balance: parseFloat(userResult.rows[0].balance),
      totalGroupBalance: totalGroupBalance,
      transactions: txResult.rows.map((row: any) => ({
        id: row.id,
        transaction_type: row.transaction_type,
        amount: parseFloat(row.amount),
        status: row.status,
        created_at: row.created_at
      }))
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
