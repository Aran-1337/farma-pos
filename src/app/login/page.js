'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Activity } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.user.role === 'cashier') {
          router.push('/pos');
        } else {
          router.push('/');
        }
      } else {
        setError(data.error || 'بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      setError('تعذر الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-dark)'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        padding: '40px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--primary-light)', marginBottom: 20 }}>
            <Activity size={36} />
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>فارما كاشير</h1>
          </div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>تسجيل الدخول للنظام</h2>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            color: 'var(--danger)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label>اسم المستخدم</label>
            <input 
              type="text" 
              required 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              placeholder="User Name"
              style={{ padding: '12px 16px' }}
            />
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <label>كلمة المرور</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ padding: '12px 16px' }}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '1.1rem', marginTop: '10px', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'جاري التحميل...' : (
              <>
                <LogIn size={20} />
                دخول
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
