import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const db = getDb();
  const logs = [];

  try {
    try { db.exec("ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '{}'"); logs.push('Added permissions to users'); } catch (e) { logs.push(e.message); }
    try { db.exec("ALTER TABLE invoices ADD COLUMN user_id INTEGER REFERENCES users(id)"); logs.push('Added user_id to invoices'); } catch (e) { logs.push(e.message); }
    try { db.exec("ALTER TABLE returns ADD COLUMN user_id INTEGER REFERENCES users(id)"); logs.push('Added user_id to returns'); } catch (e) { logs.push(e.message); }
    try { db.exec("ALTER TABLE debts ADD COLUMN user_id INTEGER REFERENCES users(id)"); logs.push('Added user_id to debts'); } catch (e) { logs.push(e.message); }
    try { db.exec("ALTER TABLE products ADD COLUMN manufacturer TEXT"); logs.push('Added manufacturer to products'); } catch (e) { logs.push(e.message); }
    
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
