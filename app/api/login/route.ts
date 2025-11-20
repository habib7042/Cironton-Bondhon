import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, pin } = body;

    if (!phoneNumber || !pin) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // In a real app, use bcrypt to compare hashed PINs
    const result = await pool.query(
      'SELECT id, name, phone_number, balance, is_admin FROM users WHERE phone_number = $1 AND pin = $2',
      [phoneNumber, pin]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0];

    // In a real app, generate a JWT here. For simplicity, we return the User ID as the token.
    return NextResponse.json({
      token: user.id.toString(),
      user: {
        id: user.id.toString(),
        name: user.name,
        balance: parseFloat(user.balance),
        phoneNumber: user.phone_number,
        isAdmin: user.is_admin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}