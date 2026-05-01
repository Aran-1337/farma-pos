'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users as UsersIcon, X, Shield, Lock } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  
  const defaultPerms = { can_discount: false, can_return: false, can_view_drawer: false, can_add_expense: true };
  const [form, setForm] = useState({ username: '', password: '', role: 'cashier', permissions: defaultPerms });

  const fetchUsers = () => { 
    fetch('/api/users')
      .then(async r => {
        if (!r.ok) throw new Error('Network error');
        return r.json();
      })
      .then(setUsers)
      .catch(e => console.error('Failed to fetch users:', e)); 
  };
  useEffect(() => { fetchUsers(); }, []);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const openAdd = () => { setEditing(null); setForm({username:'',password:'',role:'cashier',permissions:defaultPerms}); setShowForm(true); };
  const openEdit = (u) => { setEditing(u); setForm({username:u.username,password:'',role:u.role,permissions:u.permissions||defaultPerms}); setShowForm(true); };

  const handlePermChange = (e) => {
    setForm({ ...form, permissions: { ...form.permissions, [e.target.name]: e.target.checked } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editing && !form.password) return showToast('كلمة المرور مطلوبة', 'error');

    const body = editing ? {...form, id:editing.id} : form;
    try {
      const res = await fetch('/api/users', { method:editing?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      if (res.ok) { showToast(editing?'تم التعديل':'تم الإضافة'); setShowForm(false); fetchUsers(); }
      else { 
        const text = await res.text();
        try {
          const err = JSON.parse(text);
          showToast(err.error || 'خطأ', 'error');
        } catch {
          showToast(text || 'حدث خطأ في الخادم', 'error');
        }
      }
    } catch (e) {
      showToast('مشكلة في الاتصال بالخادم', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/users?id=${id}`, {method:'DELETE'});
      if (res.ok) { 
        showToast('تم الحذف'); 
        fetchUsers(); 
      } else { 
        const text = await res.text();
        try {
          const err = JSON.parse(text);
          showToast(err.error || 'خطأ', 'error');
        } catch {
          showToast('حدث خطأ غير معروف أثناء الحذف', 'error');
        }
      }
    } catch (e) {
      showToast('مشكلة في الاتصال بالخادم', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {toast && <div style={{position:'fixed',top:20,left:20,zIndex:2000}}><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header">
        <h2><UsersIcon size={24} style={{display:'inline',marginLeft:8}}/>إدارة الموظفين</h2>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18}/>إضافة موظف</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
        {users.map(u => (
          <div key={u.id} className="card" style={{position:'relative', borderLeft: u.role === 'owner' ? '4px solid var(--primary)' : 'none'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <div style={{background: u.role==='owner'?'rgba(20,184,166,0.1)':'rgba(99,102,241,0.1)', color: u.role==='owner'?'var(--primary)':'var(--info)', padding:8, borderRadius:'50%'}}>
                  {u.role === 'owner' ? <Shield size={20}/> : <UsersIcon size={20}/>}
                </div>
                <div>
                  <h3 style={{fontSize:'1.1rem',fontWeight:700,marginBottom:2}}>{u.username}</h3>
                  <span className={`badge ${u.role==='owner'?'badge-success':'badge-info'}`}>
                    {u.role === 'owner' ? 'مدير' : 'كاشير'}
                  </span>
                </div>
              </div>
              <div style={{display:'flex',gap:4}}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>openEdit(u)}><Edit2 size={14}/></button>
                {u.role !== 'owner' && (
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>setDeletingId(u.id)} style={{color:'var(--danger)'}}><Trash2 size={14}/></button>
                )}
              </div>
            </div>

            {u.role === 'cashier' && u.permissions && (
              <div style={{marginTop:16, borderTop:'1px solid var(--border)', paddingTop:12, fontSize:'0.8rem', color:'var(--text-secondary)'}}>
                <div style={{fontWeight:600, marginBottom:8}}>الصلاحيات المخصصة:</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
                  <div style={{color: u.permissions.can_discount ? 'var(--success)' : 'var(--text-muted)'}}>
                    {u.permissions.can_discount ? '✓ مسموح بالخصم' : '✗ غير مسموح بالخصم'}
                  </div>
                  <div style={{color: u.permissions.can_return ? 'var(--success)' : 'var(--text-muted)'}}>
                    {u.permissions.can_return ? '✓ مسموح بالمرتجع' : '✗ غير مسموح بالمرتجع'}
                  </div>
                  <div style={{color: u.permissions.can_view_drawer ? 'var(--success)' : 'var(--text-muted)'}}>
                    {u.permissions.can_view_drawer ? '✓ يرى إجمالي الدرج' : '✗ لا يرى الدرج'}
                  </div>
                  <div style={{color: u.permissions.can_add_expense ? 'var(--success)' : 'var(--text-muted)'}}>
                    {u.permissions.can_add_expense ? '✓ يضيف مصروفات' : '✗ لا يضيف مصروفات'}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:500}}>
            <div className="modal-header"><h3>{editing?'✏️ تعديل موظف':'➕ موظف جديد'}</h3><button className="btn-icon btn-ghost" onClick={()=>setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <label>اسم المستخدم *</label>
                  <input required value={form.username} onChange={e=>setForm({...form,username:e.target.value})} style={{direction:'ltr'}}/>
                </div>
                <div className="input-group">
                  <label>كلمة المرور {editing ? '(اتركها فارغة إذا لم ترد التغيير)' : '*'}</label>
                  <div style={{position:'relative'}}>
                    <Lock size={16} style={{position:'absolute',right:12,top:12,color:'var(--text-muted)'}}/>
                    <input type="password" required={!editing} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} style={{paddingRight:36}}/>
                  </div>
                </div>

                <div className="input-group">
                  <label>نوع الحساب (الرتبة)</label>
                  <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                    <option value="cashier">كاشير (صلاحيات مخصصة)</option>
                    <option value="owner">مدير (صلاحيات كاملة)</option>
                  </select>
                </div>

                {form.role === 'cashier' && (
                  <div style={{marginTop:24, background:'var(--bg-dark)', padding:16, borderRadius:'var(--radius-sm)'}}>
                    <h4 style={{marginBottom:12, fontSize:'0.9rem'}}>تخصيص الصلاحيات</h4>
                    <div style={{display:'flex', flexDirection:'column', gap:12}}>
                      <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                        <input type="checkbox" name="can_discount" checked={form.permissions.can_discount} onChange={handlePermChange}/>
                        <span>السماح بعمل خصم في المبيعات</span>
                      </label>
                      <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                        <input type="checkbox" name="can_return" checked={form.permissions.can_return} onChange={handlePermChange}/>
                        <span>السماح بعمل مرتجع</span>
                      </label>
                      <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                        <input type="checkbox" name="can_view_drawer" checked={form.permissions.can_view_drawer} onChange={handlePermChange}/>
                        <span>إظهار إجمالي مبيعاته وتقفيل الدرج (الشفافية)</span>
                      </label>
                      <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                        <input type="checkbox" name="can_add_expense" checked={form.permissions.can_add_expense} onChange={handlePermChange}/>
                        <span>السماح بتسجيل مصروفات نثرية</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">{editing?'حفظ التعديلات':'إضافة الموظف'}</button>
                <button type="button" className="btn btn-ghost" onClick={()=>setShowForm(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="modal-overlay" onClick={()=>setDeletingId(null)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()} style={{maxWidth:400,textAlign:'center',padding:32}}>
            <AlertTriangle size={48} style={{color:'var(--danger)',margin:'0 auto 16px'}}/>
            <h3 style={{marginBottom:12}}>تأكيد الحذف</h3>
            <p style={{color:'var(--text-secondary)',marginBottom:24}}>
              هل أنت متأكد من حذف هذا الموظف؟
              <br/>
              (سيتم منعه من تسجيل الدخول مع الاحتفاظ باسمه في الفواتير القديمة)
            </p>
            <div style={{display:'flex',gap:12,justifyContent:'center'}}>
              <button className="btn btn-ghost" onClick={()=>setDeletingId(null)}>إلغاء</button>
              <button className="btn" style={{background:'var(--danger)',color:'#fff'}} onClick={()=>handleDelete(deletingId)}>نعم، احذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
