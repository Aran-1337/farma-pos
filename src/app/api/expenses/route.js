import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function getUser() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('farma_auth');
  if (!authCookie) return null;
  try {
    return JSON.parse(Buffer.from(authCookie.value, 'base64').toString('utf-8'));
  } catch (e) {
    return null;
  }
}

export async function GET(request) {
  const db = getDb();
  const expenses = db.prepare(`
    SELECT e.*, u.username as user_name
    FROM expenses e
    LEFT JOIN users u ON e.user_id = u.id
    ORDER BY e.created_at DESC
  `).all();
  return NextResponse.json(expenses);
}

export async function POST(request) {
  const db = getDb();
  const body = await request.json();
  const user = await getUser();
  
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const result = db.prepare('INSERT INTO expenses (user_id, amount, category, notes) VALUES (?, ?, ?, ?)').run(
      user.id, body.amount, body.category, body.notes
    );
    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const user = await getUser();

  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'صلاحية المدير مطلوبة لحذف مصروف' }, { status: 403 });
  }

  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
