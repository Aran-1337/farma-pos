import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('farma_auth');
  
  if (!authCookie || !authCookie.value) {
    return NextResponse.json({ user: null });
  }

  try {
    const decoded = JSON.parse(Buffer.from(authCookie.value, 'base64').toString('utf-8'));
    
    // Fetch latest permissions from DB in case they were updated
    const db = getDb();
    const user = db.prepare('SELECT id, username, role, permissions FROM users WHERE id = ?').get(decoded.id);
    
    if (!user) return NextResponse.json({ user: null });

    const parsedPerms = user.permissions ? JSON.parse(user.permissions) : {};

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        permissions: parsedPerms 
      } 
    });
  } catch (e) {
    return NextResponse.json({ user: null });
  }
}
