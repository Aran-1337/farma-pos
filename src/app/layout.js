import { cookies } from 'next/headers';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';

export const metadata = {
  title: 'فارما - نظام كاشير الصيدلية',
  description: 'نظام متكامل لإدارة الصيدلية - نقاط البيع، المخزون، الفواتير، والتقارير',
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('farma_auth');
  let user = null;
  
  if (authCookie && authCookie.value) {
    try {
      user = JSON.parse(Buffer.from(authCookie.value, 'base64').toString('utf-8'));
    } catch (e) {}
  }

  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="app-layout">
          <Sidebar user={user} />
          <main className="main-content">
            {children}
          </main>
        </div>
        <div id="toast-root" className="toast-container"></div>
      </body>
    </html>
  );
}
