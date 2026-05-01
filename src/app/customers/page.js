'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Users, X, Star, Shield } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name:'', phone:'', email:'', address:'', notes:'' });

  const fetchCustomers = () => { fetch(`/api/customers?search=${search}`).then(r=>r.json()).then(setCustomers); };
  useEffect(() => { const t=setTimeout(fetchCustomers,300); return ()=>clearTimeout(t); }, [search]);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const openAdd = () => { setEditing(null); setForm({name:'',phone:'',email:'',address:'',notes:''}); setShowForm(true); };
  const openEdit = (c) => { setEditing(c); setForm({name:c.name,phone:c.phone||'',email:c.email||'',address:c.address||'',notes:c.notes||''}); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = editing ? {...form, id:editing.id} : form;
    const res = await fetch('/api/customers', { method:editing?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (res.ok) { showToast(editing?'تم التعديل':'تم الإضافة'); setShowForm(false); fetchCustomers(); }
    else { const err = await res.json(); showToast(err.error||'خطأ','error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف العميل؟')) return;
    await fetch(`/api/customers?id=${id}`, {method:'DELETE'});
    showToast('تم الحذف'); fetchCustomers();
  };

  return (
    <div>
      {toast && <div style={{position:'fixed',top:20,left:20,zIndex:2000}}><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header">
        <h2><Users size={24} style={{display:'inline',marginLeft:8}}/>العملاء</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18}/>إضافة عميل</button>
      </div>

      <div className="search-box" style={{marginBottom:20}}><Search/><input type="search" placeholder="ابحث بالاسم أو الهاتف..." value={search} onChange={e=>setSearch(e.target.value)}/></div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
        {customers.map(c => (
          <div key={c.id} className="card" style={{position:'relative'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <h3 style={{fontSize:'1rem',fontWeight:700,marginBottom:4}}>{c.name}</h3>
                <p className="num" style={{color:'var(--text-secondary)',fontSize:'0.85rem'}}>{c.phone || 'بدون هاتف'}</p>
              </div>
              <div style={{display:'flex',gap:4}}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>openEdit(c)}><Edit2 size={14}/></button>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>handleDelete(c.id)} style={{color:'var(--danger)'}}><Trash2 size={14}/></button>
              </div>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <span className="badge badge-purple"><Star size={12} style={{marginLeft:4}}/>{c.loyalty_points} نقطة</span>
            </div>
            {c.email && <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:8}}>{c.email}</p>}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:500}}>
            <div className="modal-header"><h3>{editing?'✏️ تعديل عميل':'➕ عميل جديد'}</h3><button className="btn-icon btn-ghost" onClick={()=>setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-group"><label>الاسم *</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div className="input-group"><label>الهاتف</label><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
                  <div className="input-group"><label>البريد</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
                </div>
                <div className="input-group"><label>العنوان</label><input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div>
                <div className="input-group"><label>ملاحظات</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}/></div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">{editing?'حفظ':'إضافة'}</button>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowForm(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
