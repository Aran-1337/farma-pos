import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const db = getDb();
  try {
    const categories = db.prepare('SELECT DISTINCT category FROM products WHERE is_deleted = 0 AND category IS NOT NULL AND category != "" ORDER BY category').all().map(r => r.category);
    const manufacturers = db.prepare('SELECT DISTINCT manufacturer FROM products WHERE is_deleted = 0 AND manufacturer IS NOT NULL AND manufacturer != "" ORDER BY manufacturer').all().map(r => r.manufacturer);
    
    return NextResponse.json({ categories, manufacturers });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
