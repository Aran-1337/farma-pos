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

  let query = 'SELECT i.*, c.name as customer_name, u.username as user_name FROM invoices i LEFT JOIN customers c ON i.customer_id=c.id LEFT JOIN users u ON i.user_id=u.id WHERE 1=1';
  const params = [];
  if (search) { query += ' AND i.invoice_number LIKE ?'; params.push(`%${search}%`); }
  if (status) { query += ' AND i.status = ?'; params.push(status); }
  query += ' ORDER BY i.created_at DESC LIMIT 100';

  const invoices = db.prepare(query).all(...params);
  return NextResponse.json(invoices);
}

export async function POST(request) {
  init();
  const db = getDb();
  try {
    const body = await request.json();
    const { invoice_number, customer_id, user_id, subtotal, discount, total, payment_method, amount_paid, change_amount, items, notes } = body;

    console.log('Creating invoice:', invoice_number, 'Total:', total);

    const txn = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO invoices (invoice_number, customer_id, user_id, subtotal, discount, total, payment_method, amount_paid, change_amount, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
      `).run(invoice_number, customer_id || null, user_id || null, subtotal, discount || 0, total, payment_method, amount_paid, change_amount || 0, notes || null);

      const invoiceId = result.lastInsertRowid;
      console.log('Invoice saved with ID:', invoiceId);

      for (const item of items) {
        db.prepare(`INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, discount, total) VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .run(invoiceId, item.product_id, item.product_name, item.quantity, item.unit_price, item.discount || 0, item.total);
        db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?').run(item.quantity, item.product_id);
      }

      if (customer_id) {
        const points = Math.floor(total / 10);
        db.prepare('UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id = ?').run(points, customer_id);
      }

      if (body.debt) {
        db.prepare(`INSERT INTO debts (invoice_id, user_id, customer_name, customer_phone, total_amount, amount_paid, remaining, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(invoiceId, user_id || null, body.debt.customer_name, body.debt.customer_phone || null, total, amount_paid, body.debt.remaining, body.debt.notes || null);
      }

      return invoiceId;
    });

    const invoiceId = txn();
    console.log('Transaction committed successfully for invoice:', invoiceId);
    return NextResponse.json({ id: invoiceId, invoice_number }, { status: 201 });
  } catch (e) {
    console.error('Invoice creation failed:', e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
