'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, X } from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ amount: '', category: 'عام', notes: '' });
  
  const categories = ['عام', 'كهرباء/مياه', 'بوفيه وضيافة', 'مستلزمات صيدلية', 'مرتبات/سلف', 'أخرى'];

  const fetchExpenses = () => { fetch('/api/expenses').then(r=>r.json()).then(setExpenses); };
  useEffect(() => { fetchExpenses(); }, []);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/expenses', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    if (res.ok) { showToast('تم تسجيل المصروف'); setShowForm(false); fetchExpenses(); }
    else { const err = await res.json(); showToast(err.error||'خطأ','error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف المصروف نهائياً؟')) return;
    const res = await fetch(`/api/expenses?id=${id}`, {method:'DELETE'});
    if (res.ok) { showToast('تم الحذف'); fetchExpenses(); }
    else { const err = await res.json(); showToast(err.error||'غير مصرح لك بالحذف','error'); }
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      {toast && <div style={{position:'fixed',top:20,left:20,zIndex:2000}}><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header">
        <h2><DollarSign size={24} style={{display:'inline',marginLeft:8}}/>المصروفات النثرية</h2>
        <button className="btn btn-primary" onClick={()=>{setForm({amount:'',category:'عام',notes:''});setShowForm(true);}}><Plus size={18}/>تسجيل مصروف</button>
      </div>

      <div className="card" style={{marginBottom:24, background:'var(--bg-input)'}}>
        <h3 style={{fontSize:'1rem', color:'var(--text-secondary)'}}>إجمالي مصروفات اليوم</h3>
        <div className="num" style={{fontSize:'2rem', fontWeight:800, color:'var(--warning)'}}>{totalExpenses.toFixed(2)} ج.م</div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>التاريخ والوقت</th>
              <th>التصنيف</th>
              <th>المبلغ</th>
              <th>البيان / ملاحظات</th>
              <th>بواسطة</th>
              <th style={{width:50}}></th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign:'center', padding:20, color:'var(--text-muted)'}}>لا توجد مصروفات مسجلة</td></tr>
            ) : expenses.map(e => (
              <tr key={e.id}>
                <td className="num" style={{fontSize:'0.85rem'}}>{new Date(e.created_at).toLocaleString('ar-EG')}</td>
                <td><span className="badge badge-warning">{e.category}</span></td>
                <td className="num" style={{color:'var(--warning)', fontWeight:700}}>{e.amount.toFixed(2)} ج.م</td>
                <td>{e.notes || '-'}</td>
                <td>{e.user_name || '-'}</td>
                <td>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>handleDelete(e.id)} style={{color:'var(--danger)'}}><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:400}}>
            <div className="modal-header"><h3>💸 تسجيل مصروف جديد</h3><button className="btn-icon btn-ghost" onClick={()=>setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <label>المبلغ (ج.م) *</label>
                  <input type="number" step="0.01" required value={form.amount} onChange={e=>setForm({...form,amount:parseFloat(e.target.value)||''})} autoFocus/>
                </div>
                <div className="input-group">
                  <label>التصنيف</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>البيان / ملاحظات</label>
                  <textarea required value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={3} placeholder="سبب السحب من الدرج..."/>
                </div>
                <div style={{background:'rgba(245,158,11,0.1)', color:'var(--warning)', padding:12, borderRadius:'var(--radius-sm)', fontSize:'0.85rem', marginTop:16}}>
                  ⚠️ سيتم خصم هذا المبلغ من إجمالي الكاش الموجود في الدرج.
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">حفظ المصروف</button>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowForm(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
