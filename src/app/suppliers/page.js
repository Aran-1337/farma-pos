'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Truck, X, Phone, Mail, MapPin } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name:'', phone:'', email:'', address:'', notes:'' });

  const fetchSuppliers = () => { fetch(`/api/suppliers?search=${search}`).then(r=>r.json()).then(setSuppliers); };
  useEffect(() => { const t=setTimeout(fetchSuppliers,300); return ()=>clearTimeout(t); }, [search]);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const openAdd = () => { setEditing(null); setForm({name:'',phone:'',email:'',address:'',notes:''}); setShowForm(true); };
  const openEdit = (s) => { setEditing(s); setForm({name:s.name,phone:s.phone||'',email:s.email||'',address:s.address||'',notes:s.notes||''}); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = editing ? {...form, id:editing.id} : form;
    const res = await fetch('/api/suppliers', { method:editing?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (res.ok) { showToast(editing?'تم التعديل':'تم الإضافة'); setShowForm(false); fetchSuppliers(); }
    else { const err = await res.json(); showToast(err.error||'خطأ','error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('حذف المورد؟ سيتم حذف بيانات الاتصال به فقط.')) return;
    await fetch(`/api/suppliers?id=${id}`, {method:'DELETE'});
    showToast('تم الحذف'); fetchSuppliers();
  };

  return (
    <div>
      {toast && <div style={{position:'fixed',top:20,left:20,zIndex:2000}}><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header">
        <h2><Truck size={24} style={{display:'inline',marginLeft:8}}/>الموردين والشركات</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18}/>إضافة مورد</button>
      </div>

      <div className="search-box" style={{marginBottom:20}}><Search/><input type="search" placeholder="ابحث باسم المورد أو الهاتف..." value={search} onChange={e=>setSearch(e.target.value)}/></div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(350px,1fr))',gap:16}}>
        {suppliers.map(s => (
          <div key={s.id} className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:4}}>{s.name}</h3>
                <div style={{display:'flex',alignItems:'center',gap:6,color:'var(--text-secondary)',fontSize:'0.85rem'}}>
                  <Phone size={14}/><span className="num">{s.phone || '—'}</span>
                </div>
              </div>
              <div style={{display:'flex',gap:4}}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>openEdit(s)}><Edit2 size={14}/></button>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>handleDelete(s.id)} style={{color:'var(--danger)'}}><Trash2 size={14}/></button>
              </div>
            </div>
            
            <div style={{display:'grid',gap:8,marginTop:12}}>
              {s.email && <div style={{display:'flex',alignItems:'center',gap:8,fontSize:'0.8rem',color:'var(--text-muted)'}}><Mail size={14}/>{s.email}</div>}
              {s.address && <div style={{display:'flex',alignItems:'center',gap:8,fontSize:'0.8rem',color:'var(--text-muted)'}}><MapPin size={14}/>{s.address}</div>}
            </div>
            
            {s.notes && (
              <div style={{marginTop:12,padding:10,background:'var(--bg-input)',borderRadius:'var(--radius-sm)',fontSize:'0.8rem',color:'var(--text-secondary)'}}>
                {s.notes}
              </div>
            )}
          </div>
        ))}
        {suppliers.length === 0 && <div className="empty-state" style={{gridColumn:'1/-1'}}><Truck size={48}/><h3>لا يوجد موردين</h3><p>اضغط على "إضافة مورد" للبدء</p></div>}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:500}}>
            <div className="modal-header"><h3>{editing?'✏️ تعديل مورد':'🚛 مورد جديد'}</h3><button className="btn-icon btn-ghost" onClick={()=>setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-group"><label>اسم الشركة / المورد *</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="مثال: شركة المتحدة للصيادلة"/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div className="input-group"><label>الهاتف</label><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="01xxxxxxxxx"/></div>
                  <div className="input-group"><label>البريد الإلكتروني</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@example.com"/></div>
                </div>
                <div className="input-group"><label>العنوان</label><input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="عنوان الشركة..."/></div>
                <div className="input-group"><label>ملاحظات</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={3} placeholder="مواعيد التوريد، الخصومات المتفق عليها..."/></div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">{editing?'حفظ التعديلات':'إضافة المورد'}</button>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowForm(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
