'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Package, X, AlertTriangle, Clock } from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 100, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name:'', name_en:'', barcode:'', batch_no:'', category:'', manufacturer:'', active_ingredient:'', volume_weight:'', concentration:'', pharmaceutical_form:'', purchase_price:'', selling_price:'', quantity:'', min_quantity:'5', expiry_date:'', requires_prescription:false });

  const fetchFilters = () => {
    fetch('/api/products/filters').then(r=>r.json()).then(data => {
      setCategories(data.categories || []);
      setManufacturers(data.manufacturers || []);
    });
  };

  const fetchProducts = () => {
    fetch(`/api/products?search=${search}&category=${category}&manufacturer=${manufacturer}&page=${page}&limit=100`)
      .then(r=>r.json())
      .then(data => {
        setProducts(data.products || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 100, totalPages: 1 });
        setSelectedIds(prev => prev.filter(id => (data.products || []).some(p => p.id === id)));
      });
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, category, manufacturer]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [search, category, manufacturer, page]);

  useEffect(() => {
    let buffer = '';
    let lastTime = 0;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      const now = Date.now();
      if (now - lastTime > 50) buffer = '';
      lastTime = now;

      if (e.key === 'Enter' && buffer.length > 3) {
        e.preventDefault();
        const scanned = buffer;
        buffer = '';
        
        const existing = products.find(p => p.barcode === scanned);
        if (existing) {
          openEdit(existing);
        } else {
          openAdd();
          setForm(f => ({ ...f, barcode: scanned }));
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const openAdd = () => { setEditing(null); setForm({name:'',name_en:'',barcode:'',batch_no:'',category:'',manufacturer:'',active_ingredient:'',volume_weight:'',concentration:'',pharmaceutical_form:'',purchase_price:'',selling_price:'',quantity:'',min_quantity:'5',expiry_date:'',requires_prescription:false}); setShowForm(true); };
  const openEdit = (p) => { setEditing(p); setForm({...p,batch_no:p.batch_no||'',manufacturer:p.manufacturer||'',active_ingredient:p.active_ingredient||'',volume_weight:p.volume_weight||'',concentration:p.concentration||'',pharmaceutical_form:p.pharmaceutical_form||'',purchase_price:String(p.purchase_price),selling_price:String(p.selling_price),quantity:String(p.quantity),min_quantity:String(p.min_quantity),expiry_date:p.expiry_date||'',requires_prescription:!!p.requires_prescription}); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = {...form, purchase_price:parseFloat(form.purchase_price), selling_price:parseFloat(form.selling_price), quantity:parseInt(form.quantity)||0, min_quantity:parseInt(form.min_quantity)||5};
    if (editing) body.id = editing.id;

    const res = await fetch('/api/products', { method: editing?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (res.ok) { showToast(editing?'تم تعديل الصنف':'تم إضافة الصنف'); setShowForm(false); fetchProducts(); fetchFilters(); }
    else { const err = await res.json(); showToast(err.error||'حدث خطأ','error'); }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/products?id=${id}`, {method:'DELETE'});
      if (res.ok) {
        showToast('تم حذف الصنف');
        fetchProducts();
      } else {
        const text = await res.text();
        try {
          const err = JSON.parse(text);
          showToast(err.error || 'حدث خطأ أثناء الحذف', 'error');
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

  const handleBulkDelete = async () => {
    try {
      const res = await fetch(`/api/products?ids=${selectedIds.join(',')}`, {method:'DELETE'});
      if (res.ok) {
        showToast(`تم حذف ${selectedIds.length} أصناف بنجاح`);
        setSelectedIds([]);
        fetchProducts();
      } else {
        const text = await res.text();
        try {
          const err = JSON.parse(text);
          showToast(err.error || 'حدث خطأ أثناء الحذف', 'error');
        } catch {
          showToast('حدث خطأ غير معروف أثناء الحذف', 'error');
        }
      }
    } catch (e) {
      showToast('مشكلة في الاتصال بالخادم', 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  const safeDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ar-EG');
  };

  const now = new Date();

  return (
    <div>
      {toast && <div style={{position:'fixed',top:20,left:20,zIndex:2000}}><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header">
        <h2><Package size={24} style={{display:'inline',marginLeft:8}}/>إدارة المخزون</h2>
        <div style={{display:'flex', gap: 12}}>
          {selectedIds.length > 0 && (
            <button className="btn" style={{background:'var(--danger)', color:'#fff'}} onClick={()=>setBulkDeleting(true)}>
              <Trash2 size={18}/> حذف المحدد ({selectedIds.length})
            </button>
          )}
          <button className="btn btn-primary" onClick={openAdd}><Plus size={18}/>إضافة صنف</button>
        </div>
      </div>

      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <div className="search-box" style={{flex:1, minWidth:250}}><Search/><input type="search" placeholder="ابحث بالاسم أو الباركود أو رقم التشغيلة..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select value={category} onChange={e=>setCategory(e.target.value)} style={{width:180}}>
          <option value="">كل الأقسام</option>
          {categories.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={manufacturer} onChange={e=>setManufacturer(e.target.value)} style={{width:180}}>
          <option value="">كل الشركات (المصنعة/المستوردة)</option>
          {manufacturers.map(m=><option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead><tr>
            <th style={{width: 40}}><input type="checkbox" checked={products.length > 0 && selectedIds.length === products.length} onChange={e => setSelectedIds(e.target.checked ? products.map(p=>p.id) : [])} style={{cursor:'pointer'}} /></th>
            <th>الصنف</th><th>المادة الفعالة</th><th>الشكل الصيدلاني</th><th>التركيز</th><th>حجم/وزن</th><th>الباركود</th><th>رقم التشغيلة</th><th>القسم</th><th>الشركة المصنعة</th><th>سعر الشراء</th><th>سعر البيع</th><th>الكمية</th><th>الصلاحية</th><th>الحالة</th><th>إجراءات</th>
          </tr></thead>
          <tbody>
            {products.map(p => {
              const isLow = p.quantity <= p.min_quantity;
              const isExpired = p.expiry_date && new Date(p.expiry_date) <= now;
              const isExpiring = p.expiry_date && !isExpired && new Date(p.expiry_date) <= new Date(now.getTime()+90*24*60*60*1000);
              return (
                <tr key={p.id} style={{background: selectedIds.includes(p.id) ? 'rgba(239, 68, 68, 0.05)' : 'transparent'}}>
                  <td><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={e => setSelectedIds(e.target.checked ? [...selectedIds, p.id] : selectedIds.filter(id => id !== p.id))} style={{cursor:'pointer'}} /></td>
                  <td><div style={{fontWeight:600}}>{p.name}</div><div style={{fontSize:'0.75rem',color:'var(--text-muted)',fontFamily:'Outfit'}}>{p.name_en}</div></td>
                  <td style={{fontSize:'0.85rem'}}>{p.active_ingredient || '—'}</td>
                  <td style={{fontSize:'0.85rem'}}>{p.pharmaceutical_form || '—'}</td>
                  <td style={{fontSize:'0.85rem'}}>{p.concentration || '—'}</td>
                  <td style={{fontSize:'0.85rem'}}>{p.volume_weight || '—'}</td>
                  <td className="num" style={{fontSize:'0.8rem'}}>{p.barcode}</td>
                  <td className="num" style={{fontSize:'0.8rem'}}>{p.batch_no || '—'}</td>
                  <td><span className="badge badge-info">{p.category}</span></td>
                  <td>{p.manufacturer || '—'}</td>
                  <td className="num">{p.purchase_price} ج.م</td>
                  <td className="num">{p.selling_price} ج.م</td>
                  <td><span className={`num ${isLow?'':'badge badge-success'}`} style={isLow?{color:'var(--danger)',fontWeight:700}:{}}>{p.quantity}</span></td>
                  <td className="num" style={{fontSize:'0.8rem'}}>{safeDate(p.expiry_date)}</td>
                  <td>
                    {isExpired ? <span className="badge badge-danger"><Clock size={12}/> منتهي</span> :
                     isExpiring ? <span className="badge badge-warning"><AlertTriangle size={12}/> قريب</span> :
                     isLow ? <span className="badge badge-danger"><AlertTriangle size={12}/> منخفض</span> :
                     <span className="badge badge-success">متوفر</span>}
                  </td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>openEdit(p)}><Edit2 size={14}/></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>setDeletingId(p.id)} style={{color:'var(--danger)'}}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:10, marginTop:24, direction:'ltr'}}>
          <button 
            className="btn btn-ghost" 
            disabled={page === 1} 
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            style={{padding:'0 15px', height: 40, display:'flex', alignItems:'center', justifyContent:'center'}}
          >
            السابق
          </button>
          
          <div style={{display:'flex', gap:5}}>
            {[...Array(pagination.totalPages)].map((_, i) => {
              const p = i + 1;
              if (pagination.totalPages > 7) {
                if (p !== 1 && p !== pagination.totalPages && Math.abs(p - page) > 1) {
                  if (Math.abs(p - page) === 2) return <span key={p} style={{padding:'0 5px', display:'flex', alignItems:'center'}}>...</span>;
                  return null;
                }
              }
              return (
                <button 
                  key={p} 
                  className={`btn ${page === p ? 'btn-primary' : 'btn-ghost'}`}
                  style={{minWidth:40, height:40, padding:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Outfit, sans-serif'}}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button 
            className="btn btn-ghost" 
            disabled={page === pagination.totalPages} 
            onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
            style={{padding:'0 15px', height: 40, display:'flex', alignItems:'center', justifyContent:'center'}}
          >
            التالي
          </button>
        </div>
      )}
      
      <p style={{marginTop:12,fontSize:'0.85rem',color:'var(--text-muted)',textAlign:'center'}}>
        عرض {products.length} صنف من إجمالي {pagination.total} (صفحة {page} من {pagination.totalPages})
      </p>

      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:560}}>
            <div className="modal-header"><h3>{editing?'✏️ تعديل صنف':'➕ إضافة صنف جديد'}</h3><button className="btn-icon btn-ghost" onClick={()=>setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div className="input-group"><label>اسم الصنف *</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
                  <div className="input-group"><label>الاسم بالإنجليزي</label><input value={form.name_en} onChange={e=>setForm({...form,name_en:e.target.value})}/></div>
                  <div className="input-group"><label>الباركود</label><input value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})}/></div>
                  <div className="input-group"><label>رقم التشغيلة (Batch No)</label><input value={form.batch_no} onChange={e=>setForm({...form,batch_no:e.target.value})} placeholder="مثال: B2025-001"/></div>
                  <div className="input-group"><label>القسم</label><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} list="cats"/><datalist id="cats">{categories.map(c=><option key={c} value={c}/>)}</datalist></div>
                  <div className="input-group" style={{gridColumn:'1 / -1'}}><label>الشركة المصنعة / المستوردة</label><input value={form.manufacturer} onChange={e=>setForm({...form,manufacturer:e.target.value})} list="mans"/><datalist id="mans">{manufacturers.map(m=><option key={m} value={m}/>)}</datalist></div>
                  
                  <div className="input-group"><label>المادة الفعالة</label><input value={form.active_ingredient} onChange={e=>setForm({...form,active_ingredient:e.target.value})}/></div>
                  <div className="input-group"><label>الشكل الصيدلاني</label><input value={form.pharmaceutical_form} onChange={e=>setForm({...form,pharmaceutical_form:e.target.value})}/></div>
                  <div className="input-group"><label>حجم/وزن</label><input value={form.volume_weight} onChange={e=>setForm({...form,volume_weight:e.target.value})}/></div>
                  <div className="input-group"><label>التركيز</label><input value={form.concentration} onChange={e=>setForm({...form,concentration:e.target.value})}/></div>
                  
                  <div className="input-group"><label>سعر الشراء *</label><input type="number" required step="0.01" value={form.purchase_price} onChange={e=>setForm({...form,purchase_price:e.target.value})}/></div>
                  <div className="input-group"><label>سعر البيع *</label><input type="number" required step="0.01" value={form.selling_price} onChange={e=>setForm({...form,selling_price:e.target.value})}/></div>
                  <div className="input-group"><label>الكمية</label><input type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></div>
                  <div className="input-group"><label>حد أدنى</label><input type="number" value={form.min_quantity} onChange={e=>setForm({...form,min_quantity:e.target.value})}/></div>
                  <div className="input-group"><label>تاريخ الصلاحية</label><input type="date" value={form.expiry_date} onChange={e=>setForm({...form,expiry_date:e.target.value})}/></div>
                  <div className="input-group">
                    <label style={{visibility:'hidden'}}>روشتة</label>
                    <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',padding:'10px 14px',background:'var(--bg-input)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',margin:0,color:'var(--text-primary)'}}>
                      <input type="checkbox" checked={form.requires_prescription} onChange={e=>setForm({...form,requires_prescription:e.target.checked})} style={{margin:0}}/>
                      <span style={{fontSize:'0.9rem',fontWeight:500}}>يحتاج روشتة (أدوية الوصفات الطبية)</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">{editing?'حفظ التعديل':'إضافة الصنف'}</button>
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
              هل أنت متأكد من حذف هذا الصنف من المخزون؟
              <br/>
              (سيتم إخفاؤه من المخزون مع الاحتفاظ به في الفواتير والتقارير القديمة)
            </p>
            <div style={{display:'flex',gap:12,justifyContent:'center'}}>
              <button className="btn btn-ghost" onClick={()=>setDeletingId(null)}>إلغاء</button>
              <button className="btn" style={{background:'var(--danger)',color:'#fff'}} onClick={()=>handleDelete(deletingId)}>نعم، احذف</button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleting && (
        <div className="modal-overlay" onClick={()=>setBulkDeleting(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()} style={{maxWidth:400,textAlign:'center',padding:32}}>
            <AlertTriangle size={48} style={{color:'var(--danger)',margin:'0 auto 16px'}}/>
            <h3 style={{marginBottom:12}}>تأكيد حذف مجموعة</h3>
            <p style={{color:'var(--text-secondary)',marginBottom:24}}>
              هل أنت متأكد من حذف <strong>{selectedIds.length}</strong> أصناف محددة من المخزون؟
              <br/>
              (سيتم إخفاؤهم من المخزون مع الاحتفاظ بهم في الفواتير والتقارير القديمة)
            </p>
            <div style={{display:'flex',gap:12,justifyContent:'center'}}>
              <button className="btn btn-ghost" onClick={()=>setBulkDeleting(false)}>إلغاء</button>
              <button className="btn" style={{background:'var(--danger)',color:'#fff'}} onClick={handleBulkDelete}>نعم، احذف المحدد</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
