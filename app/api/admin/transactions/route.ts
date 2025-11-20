import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

// GET: Fetch all pending transactions with User details
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const adminId = authHeader?.replace('Token ', '');

    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify Admin Status
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [adminId]);
    if (!adminCheck.rows[0]?.is_admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await pool.query(`
      SELECT t.id, t.transaction_type, t.amount, t.status, t.created_at, u.name as user_name, u.id as user_id 
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'PENDING'
      ORDER BY t.created_at ASC
    `);

    return NextResponse.json(result.rows.map(row => ({
        id: row.id,
        transaction_type: row.transaction_type,
        amount: parseFloat(row.amount),
        status: row.status,
        created_at: row.created_at,
        userName: row.user_name,
        userId: row.user_id
    })));

  } catch (error) {
    console.error('Admin fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Approve or Reject
export async function POST(request: Request) {
    const client = await pool.connect();
    try {
        const authHeader = request.headers.get('Authorization');
        const adminId = authHeader?.replace('Token ', '');
        const { transactionId, action } = await request.json(); // action: 'APPROVE' | 'REJECT'

        if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        // Verify Admin
        const adminCheck = await client.query('SELECT is_admin FROM users WHERE id = $1', [adminId]);
        if (!adminCheck.rows[0]?.is_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await client.query('BEGIN');

        // Get Transaction
        const txRes = await client.query('SELECT * FROM transactions WHERE id = $1 FOR UPDATE', [transactionId]);
        if (txRes.rows.length === 0) throw new Error('Transaction not found');
        
        const tx = txRes.rows[0];
        if (tx.status !== 'PENDING') throw new Error('Transaction already processed');

        if (action === 'REJECT') {
            await client.query('UPDATE transactions SET status = $1 WHERE id = $2', ['REJECTED', transactionId]);
        } else if (action === 'APPROVE') {
            const amount = parseFloat(tx.amount);
            
            if (tx.transaction_type === 'DEPOSIT') {
                await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, tx.user_id]);
            } else if (tx.transaction_type === 'WITHDRAW') {
                // Check balance
                const userRes = await client.query('SELECT balance FROM users WHERE id = $1', [tx.user_id]);
                const currentBalance = parseFloat(userRes.rows[0].balance);
                if (currentBalance < amount) {
                    throw new Error('Insufficient user funds');
                }
                await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, tx.user_id]);
            }
            await client.query('UPDATE transactions SET status = $1 WHERE id = $2', ['APPROVED', transactionId]);
        } else {
            throw new Error('Invalid action');
        }

        await client.query('COMMIT');
        return NextResponse.json({ success: true });

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Admin action error:', error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
