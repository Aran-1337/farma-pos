'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, FileText, BarChart3, Users, Wallet, Settings, DollarSign, Users as UsersIcon, LogOut, User, Menu, X, RefreshCw, Truck } from 'lucide-react';

const allNavItems = [
  { href: '/', label: 'الرئيسية', icon: LayoutDashboard, roles: ['owner'] },
  { href: '/pos', label: 'شاشة البيع', icon: ShoppingCart, roles: ['owner', 'cashier'] },
  { href: '/inventory', label: 'المخزون', icon: Package, roles: ['owner'] },
  { href: '/purchase-orders', label: 'النواقص والطلبات', icon: ShoppingCart, roles: ['owner'] },
  { href: '/sync', label: 'مزامنة الأدوية', icon: RefreshCw, roles: ['owner'] },
  { href: '/invoices', label: 'الفواتير', icon: FileText, roles: ['owner', 'cashier'] },
  { href: '/reports', label: 'التقارير', icon: BarChart3, roles: ['owner'] },
  { href: '/customers', label: 'العملاء', icon: Users, roles: ['owner', 'cashier'] },
  { href: '/suppliers', label: 'الموردين', icon: Truck, roles: ['owner'] },
  { href: '/debts', label: 'المديونيات', icon: Wallet, roles: ['owner', 'cashier'] },
  { href: '/expenses', label: 'المصروفات', icon: DollarSign, roles: ['owner', 'cashier'] },
  { href: '/users', label: 'الموظفين', icon: UsersIcon, roles: ['owner'] },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const navItems = allNavItems.filter(item => user && item.roles.includes(user.role));

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>⚕️ فارما</h1>
          <p>نظام إدارة الصيدلية</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {user && (
          <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', marginBottom: 10 }}>
              <div style={{ background: 'var(--primary-light)', padding: 6, borderRadius: '50%', color: '#fff', display: 'flex' }}>
                <User size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.username}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.role === 'owner' ? 'صاحب الصيدلية' : 'كاشير'}</div>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="nav-item" 
              style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', textAlign: 'right', fontWeight: 600 }}
            >
              <LogOut size={18} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
