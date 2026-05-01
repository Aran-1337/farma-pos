'use client';
import { useState } from 'react';
import { RefreshCw, UploadCloud, Link as LinkIcon, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SyncPage() {
  const [file, setFile] = useState(null);
  const [apiUrl, setApiUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setApiUrl(''); // Clear API url if file is selected
    }
  };

  const handleSync = async (e) => {
    e.preventDefault();
    if (!file && !apiUrl) return setError('الرجاء اختيار ملف إكسيل أو إدخال رابط API');

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (apiUrl) formData.append('apiUrl', apiUrl);

      const res = await fetch('/api/sync', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setFile(null);
        setApiUrl('');
      } else {
        setError(data.error || 'حدث خطأ غير متوقع');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h2><RefreshCw size={24} style={{ display: 'inline', marginLeft: 8 }} /> مزامنة وتحديث الأدوية</h2>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          يمكنك تحديث أسعار الأصناف الحالية وإضافة الأصناف الجديدة (وكذلك بيانات الشركات المصنعة) دفعة واحدة. 
          يتم التحديث عن طريق رفع ملف <strong>إكسيل (Excel)</strong> من الشركة الموردة، أو عبر إدخال <strong>رابط API</strong>.
        </p>

        <form onSubmit={handleSync} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Excel File Upload */}
          <div style={{ padding: 24, border: '2px dashed var(--border)', borderRadius: 'var(--radius)', textAlign: 'center', background: file ? 'rgba(16, 185, 129, 0.05)' : 'transparent', transition: 'var(--transition)' }}>
            <FileSpreadsheet size={48} style={{ color: file ? 'var(--success)' : 'var(--text-muted)', marginBottom: 16 }} />
            <h3 style={{ marginBottom: 8 }}>رفع ملف إكسيل</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>يدعم الملفات بصيغة .xlsx</p>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
              id="excel-upload"
            />
            <label htmlFor="excel-upload" className="btn btn-ghost" style={{ cursor: 'pointer', display: 'inline-flex' }}>
              <UploadCloud size={18} /> {file ? file.name : 'اختر ملف من جهازك'}
            </label>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>ـــ أو ـــ</div>

          {/* API URL Input */}
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><LinkIcon size={16}/> رابط المزامنة (API URL)</label>
            <input 
              type="url" 
              placeholder="https://api.example.com/products" 
              value={apiUrl} 
              onChange={(e) => { setApiUrl(e.target.value); setFile(null); }}
              style={{ direction: 'ltr' }}
            />
          </div>

          {error && (
            <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={20} /> {error}
            </div>
          )}

          {result && (
            <div style={{ padding: 16, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1.1rem' }}>
                <CheckCircle2 size={24} /> تمت المزامنة بنجاح!
              </div>
              <ul style={{ listStyle: 'none', paddingRight: 32, fontSize: '0.95rem' }}>
                <li>✅ الأصناف التي تم إضافتها (جديدة): <strong>{result.added}</strong></li>
                <li>🔄 الأصناف التي تم تحديث أسعارها/بياناتها: <strong>{result.updated}</strong></li>
                <li>📦 إجمالي الأصناف المعالجة: <strong>{result.total}</strong></li>
              </ul>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              className="btn btn-primary btn-lg" 
              disabled={loading || (!file && !apiUrl)}
              style={{ minWidth: 150, justifyContent: 'center' }}
            >
              {loading ? <RefreshCw className="spin" size={20}/> : <RefreshCw size={20}/>}
              {loading ? 'جاري المزامنة...' : 'بدء المزامنة'}
            </button>
          </div>

        </form>
      </div>

      <div className="card" style={{ marginTop: 24, background: 'var(--bg-input)' }}>
        <h4 style={{ marginBottom: 12 }}>ℹ️ تعليمات ملف الإكسيل</h4>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          يجب أن يحتوي الصف الأول (Headers) في ملف الإكسيل على بعض من هذه المسميات ليتعرف عليها النظام:<br/>
          <span className="badge badge-info" style={{margin:'4px 2px'}}>اسم الدواء</span> 
          <span className="badge badge-info" style={{margin:'4px 2px'}}>الباركود</span> 
          <span className="badge badge-info" style={{margin:'4px 2px'}}>القسم</span> 
          <span className="badge badge-info" style={{margin:'4px 2px'}}>الشركة المصنعة</span> 
          <span className="badge badge-info" style={{margin:'4px 2px'}}>سعر الشراء</span> 
          <span className="badge badge-info" style={{margin:'4px 2px'}}>سعر البيع</span> 
          <span className="badge badge-info" style={{margin:'4px 2px'}}>الكمية</span>
        </p>
      </div>
    </div>
  );
}
