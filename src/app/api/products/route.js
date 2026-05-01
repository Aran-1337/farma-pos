import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { NextResponse } from 'next/server';

function init() {
  getDb();
  seedDatabase();
}

export async function GET(request) {
  init();
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const manufacturer = searchParams.get('manufacturer') || '';
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 100;
  const offset = (page - 1) * limit;

  let baseQuery = 'WHERE is_deleted = 0';
  const params = [];

  if (search) {
    baseQuery += ' AND (name LIKE ? OR name_en LIKE ? OR barcode LIKE ? OR batch_no LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    baseQuery += ' AND category = ?';
    params.push(category);
  }
  if (manufacturer) {
    baseQuery += ' AND manufacturer = ?';
    params.push(manufacturer);
  }

  // Count total for pagination
  const totalCount = db.prepare(`SELECT COUNT(*) as count FROM products ${baseQuery}`).get(...params).count;

  // Fetch paginated data
  const query = `SELECT * FROM products ${baseQuery} ORDER BY name LIMIT ? OFFSET ?`;
  const products = db.prepare(query).all(...params, limit, offset);

  return NextResponse.json({
    products,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  });
}

export async function POST(request) {
  init();
  const db = getDb();
  const body = await request.json();
  const { name, name_en, barcode, category, purchase_price, selling_price, quantity, min_quantity, expiry_date, requires_prescription, manufacturer, active_ingredient, volume_weight, concentration, pharmaceutical_form, batch_no } = body;

  try {
    const result = db.prepare(`
      INSERT INTO products (name, name_en, barcode, category, purchase_price, selling_price, quantity, min_quantity, expiry_date, requires_prescription, manufacturer, active_ingredient, volume_weight, concentration, pharmaceutical_form, batch_no)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, name_en, barcode, category, purchase_price, selling_price, quantity || 0, min_quantity || 5, expiry_date, requires_prescription ? 1 : 0, manufacturer || null, active_ingredient || null, volume_weight || null, concentration || null, pharmaceutical_form || null, batch_no || null);

    return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(request) {
  init();
  const db = getDb();
  const body = await request.json();
  const { id, name, name_en, barcode, category, purchase_price, selling_price, quantity, min_quantity, expiry_date, requires_prescription, manufacturer, active_ingredient, volume_weight, concentration, pharmaceutical_form, batch_no } = body;

  try {
    db.prepare(`
      UPDATE products SET name=?, name_en=?, barcode=?, category=?, purchase_price=?, selling_price=?, quantity=?, min_quantity=?, expiry_date=?, requires_prescription=?, manufacturer=?, active_ingredient=?, volume_weight=?, concentration=?, pharmaceutical_form=?, batch_no=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(name, name_en, barcode, category, purchase_price, selling_price, quantity, min_quantity, expiry_date, requires_prescription ? 1 : 0, manufacturer || null, active_ingredient || null, volume_weight || null, concentration || null, pharmaceutical_form || null, batch_no || null, id);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  init();
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const idsParam = searchParams.get('ids');
  
  try {
    if (idsParam) {
      const ids = idsParam.split(',').map(n => parseInt(n)).filter(n => !isNaN(n));
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        db.prepare(`UPDATE products SET is_deleted = 1 WHERE id IN (${placeholders})`).run(...ids);
      }
    } else if (id) {
      db.prepare('UPDATE products SET is_deleted = 1 WHERE id = ?').run(id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
