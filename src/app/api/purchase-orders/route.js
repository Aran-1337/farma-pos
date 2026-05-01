import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  
  let query = `
    SELECT po.*, s.name as supplier_name 
    FROM purchase_orders po 
    LEFT JOIN suppliers s ON po.supplier_id = s.id 
    WHERE 1=1
  `;
  const params = [];
  if (status) {
    query += ' AND po.status = ?';
    params.push(status);
  }
  query += ' ORDER BY po.created_at DESC';
  
  const orders = db.prepare(query).all(...params);
  
  // Get items for each order if a specific ID is provided
  const orderId = searchParams.get('id');
  if (orderId) {
    const order = db.prepare('SELECT po.*, s.name as supplier_name FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE po.id = ?').get(orderId);
    if (order) {
      order.items = db.prepare('SELECT * FROM purchase_order_items WHERE order_id = ?').all(orderId);
      return NextResponse.json(order);
    }
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(orders);
}

export async function POST(request) {
  const db = getDb();
  const { supplier_id, notes, items } = await request.json();
  
  const txn = db.transaction(() => {
    const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    
    const result = db.prepare(`
      INSERT INTO purchase_orders (supplier_id, total_amount, status, notes)
      VALUES (?, ?, 'pending', ?)
    `).run(supplier_id, total_amount, notes || null);
    
    const orderId = result.lastInsertRowid;
    
    for (const item of items) {
      db.prepare(`
        INSERT INTO purchase_order_items (order_id, product_id, product_name, quantity, unit_cost, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(orderId, item.product_id, item.product_name, item.quantity, item.unit_cost, item.quantity * item.unit_cost);
    }
    
    return orderId;
  });
  
  try {
    const orderId = txn();
    return NextResponse.json({ id: orderId }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(request) {
  const db = getDb();
  try {
    const { id, status } = await request.json();
    const orderId = parseInt(id);
    console.log('Updating order:', orderId, 'to status:', status);
    
    if (status === 'received') {
      const txn = db.transaction(() => {
        // 1. Update order status
        const updateRes = db.prepare('UPDATE purchase_orders SET status = ?, received_at = CURRENT_TIMESTAMP WHERE id = ?').run('received', orderId);
        console.log('Status update result:', updateRes);
        
        // 2. Update inventory for each item
        const items = db.prepare('SELECT * FROM purchase_order_items WHERE order_id = ?').all(id);
        console.log('Found items to receive:', items.length);
        for (const item of items) {
          const prodUpdate = db.prepare('UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(item.quantity, item.product_id);
          console.log(`Updated product ${item.product_id} with +${item.quantity}. Changes: ${prodUpdate.changes}`);
        }
      });
      
      txn();
      return NextResponse.json({ success: true });
    }
    
    db.prepare('UPDATE purchase_orders SET status = ? WHERE id = ?').run(status, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Purchase order update error:', e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
