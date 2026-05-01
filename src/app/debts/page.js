'use client';
import { useState, useEffect } from 'react';
import { Search, Wallet, CheckCircle, Clock, Trash2, X, Banknote, AlertTriangle } from 'lucide-react';

export default function DebtsPage() {
  const [data, setData] = useState({ debts: [], totalPending: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [toast, setToast] = useState(null);

  const fetchDebts = () => {
    fetch(`/api/debts?search=${search}&status=${statusFilter}`).then(r => r.json()).then(setData);
  };
  useEffect(() => { const t = setTimeout(fetchDebts, 300); return () => clearTimeout(t); }, [search, statusFilter]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const openPay = (debt) => { setSelectedDebt(debt); setPayAmount(''); setShowPayModal(true); };

  const handlePay = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { showToast('أدخل مبلغ صحيح', 'error'); return; }
    if (amount > selectedDebt.remaining) { showToast('المبلغ أكبر من المتبقي', 'error'); return; }

    const res = await fetch('/api/debts', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedDebt.id, payment_amount: amount })
    });
    if (res.ok) {
      const result = await res.json();
      showToast(result.status === 'paid' ? 'تم سداد المديونية بالكامل ✅' : `تم دفع ${amount} ج.م — متبقي ${result.remaining.toFixed(2)} ج.م`);
      setShowPayModal(false); fetchDebts();
    } else showToast('حدث خطأ', 'error');
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه المديونية؟')) return;
    await fetch(`/api/debts?id=${id}`, { method: 'DELETE' });
    showToast('تم الحذف'); fetchDebts();
  };

  const pendingDebts = data.debts.filter(d => d.status === 'pending');
  const paidDebts = data.debts.filter(d => d.status === 'paid');

  return (
    <div>
      {toast && <div style={{ position: 'fixed', top: 20, left: 20, zIndex: 2000 }}><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header">
        <h2><Wallet size={24} style={{ display: 'inline', marginLeft: 8 }} />المديونيات</h2>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card orange">
          <div className="stat-icon orange"><Wallet size={24} /></div>
          <div className="stat-info"><h3>إجمالي المديونيات</h3><div className="stat-value num">{data.totalPending.toFixed(0)} ج.م</div></div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red"><AlertTriangle size={24} /></div>
          <div className="stat-info"><h3>مديونيات معلقة</h3><div className="stat-value num">{pendingDebts.length}</div></div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><CheckCircle size={24} /></div>
          <div className="stat-info"><h3>مديونيات مسددة</h3><div className="stat-value num">{paidDebts.length}</div></div>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div className="search-box" style={{ flex: 1 }}><Search /><input type="search" placeholder="ابحث بالاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 160 }}>
          <option value="">الكل</option>
          <option value="pending">معلقة</option>
          <option value="paid">مسددة</option>
        </select>
      </div>

      {/* Debts Table */}
      {data.debts.length === 0 ? (
        <div className="card empty-state"><Wallet size={64} /><h3>لا توجد مديونيات</h3><p style={{ fontSize: '0.85rem' }}>المديونيات ستظهر هنا عند تسجيل بيع بدفع جزئي</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>العميل</th><th>الهاتف</th><th>رقم الفاتورة</th><th>إجمالي الفاتورة</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
            <tbody>
              {data.debts.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.customer_name}</td>
                  <td className="num" style={{ fontSize: '0.85rem' }}>{d.customer_phone || '—'}</td>
                  <td className="num" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{d.invoice_number || '—'}</td>
                  <td className="num">{d.total_amount.toFixed(2)} ج.م</td>
                  <td className="num" style={{ color: 'var(--success)' }}>{d.amount_paid.toFixed(2)} ج.م</td>
                  <td className="num" style={{ fontWeight: 700, color: d.remaining > 0 ? 'var(--warning)' : 'var(--success)' }}>{d.remaining.toFixed(2)} ج.م</td>
                  <td>
                    {d.status === 'paid'
                      ? <span className="badge badge-success"><CheckCircle size={12} style={{ marginLeft: 4 }} />مسددة</span>
                      : <span className="badge badge-warning"><Clock size={12} style={{ marginLeft: 4 }} />معلقة</span>}
                  </td>
                  <td className="num" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(d.created_at).toLocaleDateString('ar-EG')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {d.status === 'pending' && (
                        <button className="btn btn-primary btn-sm" onClick={() => openPay(d)}><Banknote size={14} />سداد</button>
                      )}
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(d.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && selectedDebt && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header"><h3>💰 سداد مديونية</h3><button className="btn-icon btn-ghost" onClick={() => setShowPayModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'var(--text-secondary)' }}>العميل:</span><span style={{ fontWeight: 700 }}>{selectedDebt.customer_name}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'var(--text-secondary)' }}>إجمالي الفاتورة:</span><span className="num">{selectedDebt.total_amount.toFixed(2)} ج.م</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: 'var(--text-secondary)' }}>المدفوع سابقاً:</span><span className="num" style={{ color: 'var(--success)' }}>{selectedDebt.amount_paid.toFixed(2)} ج.م</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, paddingTop: 8, borderTop: '1px solid var(--border)' }}><span style={{ color: 'var(--warning)' }}>المتبقي:</span><span className="num" style={{ color: 'var(--warning)', fontSize: '1.1rem' }}>{selectedDebt.remaining.toFixed(2)} ج.م</span></div>
              </div>

              <div className="input-group">
                <label>المبلغ المراد سداده</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00" autoFocus min="0" max={selectedDebt.remaining} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setPayAmount(String(selectedDebt.remaining))}>سداد كامل</button>
              </div>

              {selectedDebt.notes && <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>📝 {selectedDebt.notes}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-success btn-lg" onClick={handlePay} style={{ flex: 1, justifyContent: 'center' }}>💰 تأكيد السداد</button>
              <button className="btn btn-ghost" onClick={() => setShowPayModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
