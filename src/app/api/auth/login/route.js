import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);

    if (!user) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    // Create simple session data (base64 encoded for this local app)
    const sessionData = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    
    const encodedSession = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    const response = NextResponse.json({ success: true, user: sessionData });
    
    // Set cookie
    response.cookies.set('farma_auth', encodedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'حدث خطأ في النظام' }, { status: 500 });
  }
}
