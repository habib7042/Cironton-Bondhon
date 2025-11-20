
import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

// GET: List all members
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
      SELECT 
        id, name, phone_number, balance,
        father_name, mother_name, nid, dob, email, address, nominee_name, nominee_nid,
        created_at
      FROM users 
      WHERE is_admin = false
      ORDER BY created_at DESC
    `);

    const members = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        phoneNumber: row.phone_number,
        balance: parseFloat(row.balance),
        fatherName: row.father_name,
        motherName: row.mother_name,
        nid: row.nid,
        dob: row.dob,
        email: row.email,
        address: row.address,
        nomineeName: row.nominee_name,
        nomineeNid: row.nominee_nid,
        joinedDate: row.created_at
    }));

    return NextResponse.json(members);

  } catch (error) {
    console.error('Fetch members error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create new member
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const adminId = authHeader?.replace('Token ', '');

    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify Admin Status
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [adminId]);
    if (!adminCheck.rows[0]?.is_admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { 
        name, fatherName, motherName, nid, dob, 
        phoneNumber, email, address, nomineeName, nomineeNid 
    } = body;

    // Basic Validation
    if (!name || !phoneNumber || !nid || !fatherName) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if phone exists
    const phoneCheck = await pool.query('SELECT id FROM users WHERE phone_number = $1', [phoneNumber]);
    if (phoneCheck.rows.length > 0) {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
    }

    const defaultPin = '1234'; // Default PIN for new members

    const result = await pool.query(
      `INSERT INTO users (
          phone_number, pin, name, is_admin, balance,
          father_name, mother_name, nid, dob, email, address, nominee_name, nominee_nid
       ) VALUES ($1, $2, $3, $4, 0.00, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING id, name, phone_number`,
      [
          phoneNumber, defaultPin, name, false,
          fatherName, motherName, nid, dob, email || null, address, nomineeName, nomineeNid
      ]
    );

    return NextResponse.json({ success: true, user: result.rows[0] });

  } catch (error: any) {
    console.error('Create member error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
