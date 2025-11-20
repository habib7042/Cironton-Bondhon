
import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

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

    // Fetch all transactions joined with user info
    const result = await pool.query(`
      SELECT 
        t.id, 
        t.transaction_type, 
        t.amount, 
        t.status, 
        t.created_at, 
        u.name as user_name, 
        u.phone_number,
        t.user_id
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);

    return NextResponse.json(result.rows.map(row => ({
        id: row.id,
        transaction_type: row.transaction_type,
        amount: parseFloat(row.amount),
        status: row.status,
        created_at: row.created_at,
        userName: row.user_name,
        phoneNumber: row.phone_number,
        userId: row.user_id
    })));

  } catch (error) {
    console.error('Admin statement fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
