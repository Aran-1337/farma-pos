import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { NextResponse } from 'next/server';

function init() { getDb(); seedDatabase(); }

export async function GET(request) {
  init();
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  let query = 'SELECT d.*, i.invoice_number FROM debts d LEFT JOIN invoices i ON d.invoice_id=i.id WHERE 1=1';
  const params = [];
  if (search) { query += ' AND (d.customer_name LIKE ? OR d.customer_phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (status) { query += ' AND d.status = ?'; params.push(status); }
  query += ' ORDER BY d.created_at DESC';

  const debts = db.prepare(query).all(...params);
  const totalPending = db.prepare("SELECT COALESCE(SUM(remaining),0) as total FROM debts WHERE status='pending'").get();

  return NextResponse.json({ debts, totalPending: totalPending.total });
}

export async function PUT(request) {
  init();
  const db = getDb();
  const body = await request.json();
  const { id, payment_amount } = body;

  const debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(id);
  if (!debt) return NextResponse.json({ error: 'لم يتم العثور على المديونية' }, { status: 404 });

  const newPaid = debt.amount_paid + payment_amount;
  const newRemaining = debt.total_amount - newPaid;
  const newStatus = newRemaining <= 0 ? 'paid' : 'pending';

  db.prepare('UPDATE debts SET amount_paid = ?, remaining = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newPaid, Math.max(0, newRemaining), newStatus, id);

  return NextResponse.json({ success: true, status: newStatus, remaining: Math.max(0, newRemaining) });
}

export async function DELETE(request) {
  init();
  const db = getDb();
  const { searchParams } = new URL(request.url);
  db.prepare('DELETE FROM debts WHERE id = ?').run(searchParams.get('id'));
  return NextResponse.json({ success: true });
}
