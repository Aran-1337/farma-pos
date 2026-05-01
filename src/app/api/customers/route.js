import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { NextResponse } from 'next/server';

function init() { getDb(); seedDatabase(); }

export async function GET(request) {
  init();
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  let query = 'SELECT * FROM customers WHERE 1=1';
  const params = [];
  if (search) { query += ' AND (name LIKE ? OR phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  query += ' ORDER BY name';

  const customers = db.prepare(query).all(...params);
  return NextResponse.json(customers);
}

export async function POST(request) {
  init();
  const db = getDb();
  const body = await request.json();
  try {
    const result = db.prepare('INSERT INTO customers (name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?)').run(body.name, body.phone, body.email, body.address, body.notes);
    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(request) {
  init();
  const db = getDb();
  const body = await request.json();
  try {
    db.prepare('UPDATE customers SET name=?, phone=?, email=?, address=?, notes=? WHERE id=?').run(body.name, body.phone, body.email, body.address, body.notes, body.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  init();
  const db = getDb();
  const { searchParams } = new URL(request.url);
  db.prepare('DELETE FROM customers WHERE id = ?').run(searchParams.get('id'));
  return NextResponse.json({ success: true });
}
