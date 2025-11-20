import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Token ', '');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { transaction_type, amount } = body;

    if (!['DEPOSIT', 'WITHDRAW'].includes(transaction_type) || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const result = await pool.query(
      'INSERT INTO transactions (user_id, transaction_type, amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, transaction_type, amount, 'PENDING']
    );

    // Note: We do NOT update the user balance here immediately. 
    // It waits for Admin approval (manual database update or admin panel)

    const tx = result.rows[0];

    return NextResponse.json({
      id: tx.id,
      transaction_type: tx.transaction_type,
      amount: parseFloat(tx.amount),
      status: tx.status,
      created_at: tx.created_at
    });

  } catch (error) {
    console.error('Transaction error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}