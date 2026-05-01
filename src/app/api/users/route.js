import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const db = getDb();
    const users = db.prepare('SELECT id, username, role, permissions, created_at FROM users WHERE is_deleted = 0 ORDER BY role DESC').all();
    
    const parsedUsers = users.map(u => {
      let perms = {};
      try {
        if (u.permissions) perms = JSON.parse(u.permissions);
      } catch (e) {
        console.error('Failed to parse permissions for user', u.id);
      }
      return { ...u, permissions: perms };
    });
    
    return NextResponse.json(parsedUsers);
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const db = getDb();
  const body = await request.json();
  try {
    const perms = JSON.stringify(body.permissions || {});
    const result = db.prepare('INSERT INTO users (username, password, role, permissions) VALUES (?, ?, ?, ?)').run(
      body.username, body.password, body.role || 'cashier', perms
    );
    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'اسم المستخدم مسجل مسبقاً' }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(request) {
  const db = getDb();
  const body = await request.json();
  try {
    const perms = JSON.stringify(body.permissions || {});
    if (body.password) {
      db.prepare('UPDATE users SET username=?, password=?, role=?, permissions=? WHERE id=?').run(
        body.username, body.password, body.role || 'cashier', perms, body.id
      );
    } else {
      db.prepare('UPDATE users SET username=?, role=?, permissions=? WHERE id=?').run(
        body.username, body.role || 'cashier', perms, body.id
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'اسم المستخدم مسجل مسبقاً' }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  // Prevent deleting the main admin
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(id);
  if (user && user.role === 'owner') {
    return NextResponse.json({ error: 'لا يمكن حذف حساب الإدارة الرئيسي' }, { status: 400 });
  }

  try {
    db.prepare('UPDATE users SET is_deleted = 1 WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
