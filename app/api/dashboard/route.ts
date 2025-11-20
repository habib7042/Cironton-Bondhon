import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(request: Request) {
  try {
    // Extract "Token" (User ID) from Authorization header
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Token ', '');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    const txResult = await pool.query(
      'SELECT id, transaction_type, amount, status, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      balance: parseFloat(userResult.rows[0].balance),
      transactions: txResult.rows.map(row => ({
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