import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { NextResponse } from 'next/server';

function init() { getDb(); seedDatabase(); }

export async function GET(request) {
  init();
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get('invoice_id');
  if (invoiceId) {
    const items = db.prepare('SELECT ii.*, p.quantity as stock FROM invoice_items ii JOIN products p ON ii.product_id=p.id WHERE ii.invoice_id=?').all(invoiceId);
    return NextResponse.json(items);
  }
  const returns = db.prepare('SELECT r.*, p.name as product_name, i.invoice_number FROM returns r JOIN products p ON r.product_id=p.id JOIN invoices i ON r.invoice_id=i.id ORDER BY r.created_at DESC LIMIT 50').all();
  return NextResponse.json(returns);
}

export async function POST(request) {
  init();
  const db = getDb();
  const body = await request.json();
  const { invoice_id, product_id, quantity, reason, refund_amount } = body;

  const txn = db.transaction(() => {
    db.prepare('INSERT INTO returns (invoice_id, product_id, quantity, reason, refund_amount) VALUES (?, ?, ?, ?, ?)').run(invoice_id, product_id, quantity, reason, refund_amount);
    db.prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?').run(quantity, product_id);

    const remaining = db.prepare('SELECT SUM(ii.quantity) as sold, COALESCE(SUM(r.quantity),0) as returned FROM invoice_items ii LEFT JOIN returns r ON r.invoice_id=ii.invoice_id AND r.product_id=ii.product_id WHERE ii.invoice_id=? AND ii.product_id=?').get(invoice_id, product_id);
    
    return { success: true };
  });

  try {
    const result = txn();
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
