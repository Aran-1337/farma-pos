import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  
  let query = 'SELECT * FROM suppliers WHERE 1=1';
  const params = [];
  if (search) {
    query += ' AND (name LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY created_at DESC';
  
  const suppliers = db.prepare(query).all(...params);
  return NextResponse.json(suppliers);
}

export async function POST(request) {
  const db = getDb();
  const { name, phone, email, address, notes } = await request.json();
  
  try {
    const result = db.prepare(`
      INSERT INTO suppliers (name, phone, email, address, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, phone || null, email || null, address || null, notes || null);
    
    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(request) {
  const db = getDb();
  const { id, name, phone, email, address, notes } = await request.json();
  
  try {
    db.prepare(`
      UPDATE suppliers 
      SET name = ?, phone = ?, email = ?, address = ?, notes = ?
      WHERE id = ?
    `).run(name, phone || null, email || null, address || null, notes || null, id);
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  try {
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
