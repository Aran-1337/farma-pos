'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, Package, Truck, Plus, Check, X, Eye, FileText, AlertTriangle, ChevronLeft, Trash2 } from 'lucide-react';

export default function PurchaseOrdersPage() {
  const [shortages, setShortages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [view, setView] = useState('shortages'); // shortages, orders
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, orderId: null });
  const [toast, setToast] = useState(null);
  const [newOrder, setNewOrder] = useState({ supplier_id: '', items: [], notes: '' });

  useEffect(() => {
    fetch('/api/products?limit=1000').then(r=>r.json()).then(data => {
      const items = data.products || [];
      setShortages(items.filter(p => p.quantity <= p.min_quantity && !p.is_deleted));
    });
    fetch('/api/suppliers').then(r=>r.json()).then(setSuppliers);
    fetch('/api/purchase-orders').then(r=>r.json()).then(setOrders);
  }, []);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const addToOrder = (product) => {
    if (newOrder.items.find(i => i.product_id === product.id)) return;
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { product_id: product.id, product_name: product.name, quantity: 1, unit_cost: product.purchase_price }]
    }));
    setShowOrderForm(true);
  };

  const updateItem = (productId, field, value) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.map(i => i.product_id === productId ? { ...i, [field]: value } : i)
    }));
  };

  const removeItem = (productId) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter(i => i.product_id !== productId)
    }));
  };

  const createOrder = async () => {
    if (!newOrder.supplier_id || newOrder.items.length === 0) {
      showToast('يرجى اختيار المورد وإضافة أصناف للطلب', 'error');
      return;
    }
    const res = await fetch('/api/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    });
    if (res.ok) {
      showToast('تم إنشاء طلب الشراء بنجاح');
      setShowOrderForm(false);
      setNewOrder({ supplier_id: '', items: [], notes: '' });
      fetch('/api/purchase-orders').then(r=>r.json()).then(setOrders);
      setView('orders');
    } else showToast('حدث خطأ', 'error');
  };

  const receiveOrder = async (orderId) => {
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: 'received' })
      });
      if (res.ok) {
        showToast('تم تحديث المخزون واستلام الطلبية ✅');
        fetch('/api/purchase-orders').then(r=>r.json()).then(setOrders);
        fetch('/api/products?limit=1000').then(r=>r.json()).then(data => {
          const items = data.products || [];
          setShortages(items.filter(p => p.quantity <= p.min_quantity && !p.is_deleted));
        });
        if (selectedOrder?.id === orderId) {
           fetch(`/api/purchase-orders?id=${orderId}`).then(r=>r.json()).then(setSelectedOrder);
        }
        setConfirmModal({ show: false, orderId: null });
      } else {
        const err = await res.json();
        showToast(err.error || 'حدث خطأ في تحديث الطلب', 'error');
      }
    } catch (e) {
      console.error('Receive order error:', e);
      showToast('فشل الاتصال بالخادم', 'error');
    }
  };

  const viewOrderDetails = async (order) => {
    const data = await fetch(`/api/purchase-orders?id=${order.id}`).then(r=>r.json());
    setSelectedOrder(data);
  };

  return (
    <div>
      {toast && <div style={{position:'fixed',top:20,left:20,zIndex:2000}}><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header">
        <h2><ShoppingCart size={24} style={{display:'inline',marginLeft:8}}/>النواقص وطلبات الشراء</h2>
        <div style={{display:'flex', gap: 8}}>
          <button className={`btn ${view==='shortages'?'btn-primary':'btn-ghost'}`} onClick={()=>setView('shortages')}><AlertTriangle size={18}/>النواقص ({shortages.length})</button>
          <button className={`btn ${view==='orders'?'btn-primary':'btn-ghost'}`} onClick={()=>setView('orders')}><FileText size={18}/>الطلبات السابقة</button>
        </div>
      </div>

      {view === 'shortages' && (
        <div className="table-container">
          <table>
            <thead><tr><th>الصنف</th><th>الرصيد الحالي</th><th>حد الطلب</th><th>سعر الشراء</th><th>إجراء</th></tr></thead>
            <tbody>
              {shortages.map(p => (
                <tr key={p.id}>
                  <td style={{fontWeight:600}}>{p.name}</td>
                  <td className="num" style={{color:'var(--danger)',fontWeight:700}}>{p.quantity}</td>
                  <td className="num">{p.min_quantity}</td>
                  <td className="num">{p.purchase_price} ج.م</td>
                  <td><button className="btn btn-sm" onClick={()=>addToOrder(p)}><Plus size={14}/>إضافة لطلب شراء</button></td>
                </tr>
              ))}
              {shortages.length === 0 && <tr><td colSpan="5" style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}><Check size={40} style={{marginBottom:10}}/><br/>لا توجد نواقص حالياً! المخزون مكتمل.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {view === 'orders' && !selectedOrder && (
        <div className="table-container">
          <table>
            <thead><tr><th>رقم الطلب</th><th>المورد</th><th>الإجمالي</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td className="num">PO-{o.id}</td>
                  <td>{o.supplier_name}</td>
                  <td className="num">{o.total_amount.toFixed(2)} ج.م</td>
                  <td>
                    <span className={`badge ${o.status==='received'?'badge-success':'badge-warning'}`}>
                      {o.status==='received'?'مستلمة':'قيد الانتظار'}
                    </span>
                  </td>
                  <td className="num">{new Date(o.created_at).toLocaleDateString('ar-EG')}</td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>viewOrderDetails(o)}><Eye size={14}/>عرض</button>
                      {o.status === 'pending' && <button className="btn btn-success btn-sm" onClick={()=>setConfirmModal({ show: true, orderId: o.id })}><Truck size={14}/>استلام</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan="6" style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>لا توجد طلبات شراء سابقة.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="card" style={{marginTop:20}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
            <h3>📦 تفاصيل طلب الشراء #PO-{selectedOrder.id}</h3>
            <button className="btn btn-ghost" onClick={()=>setSelectedOrder(null)}><ChevronLeft size={20}/>عودة</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:20,marginBottom:24,background:'var(--bg-input)',padding:16,borderRadius:'var(--radius-sm)'}}>
             <div><span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>المورد</span><div style={{fontWeight:600}}>{selectedOrder.supplier_name}</div></div>
             <div><span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>الحالة</span><div><span className={`badge ${selectedOrder.status==='received'?'badge-success':'badge-warning'}`}>{selectedOrder.status==='received'?'مستلمة':'قيد الانتظار'}</span></div></div>
             <div><span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>الإجمالي</span><div className="num" style={{fontWeight:700}}>{selectedOrder.total_amount.toFixed(2)} ج.م</div></div>
             <div><span style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>التاريخ</span><div className="num">{new Date(selectedOrder.created_at).toLocaleString('ar-EG')}</div></div>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>الصنف</th><th>الكمية المطلوبة</th><th>سعر التكلفة</th><th>الإجمالي</th></tr></thead>
              <tbody>
                {selectedOrder.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td className="num">{item.quantity}</td>
                    <td className="num">{item.unit_cost} ج.م</td>
                    <td className="num">{item.total.toFixed(2)} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedOrder.status === 'pending' && (
            <div style={{marginTop:24,textAlign:'left'}}>
              <button className="btn btn-success btn-lg" onClick={()=>setConfirmModal({ show: true, orderId: selectedOrder.id })}><Check size={20}/>تأكيد الاستلام وتحديث المخزون</button>
            </div>
          )}
        </div>
      )}

      {/* New Order Modal */}
      {showOrderForm && (
        <div className="modal-overlay" onClick={()=>setShowOrderForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:700}}>
            <div className="modal-header"><h3>🆕 طلب شراء جديد</h3><button className="btn-icon btn-ghost" onClick={()=>setShowOrderForm(false)}><X size={20}/></button></div>
            <div className="modal-body">
              <div className="input-group">
                <label>اختر المورد *</label>
                <select value={newOrder.supplier_id} onChange={e=>setNewOrder({...newOrder, supplier_id:e.target.value})}>
                  <option value="">-- اختر المورد --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="table-container" style={{maxHeight:300,overflowY:'auto'}}>
                <table>
                  <thead><tr><th>الصنف</th><th>الكمية</th><th>سعر التكلفة</th><th>الإجمالي</th><th></th></tr></thead>
                  <tbody>
                    {newOrder.items.map(item => (
                      <tr key={item.product_id}>
                        <td>{item.product_name}</td>
                        <td><input type="number" className="num" style={{width:80}} value={item.quantity} onChange={e=>updateItem(item.product_id, 'quantity', parseInt(e.target.value)||1)}/></td>
                        <td><input type="number" className="num" style={{width:100}} value={item.unit_cost} onChange={e=>updateItem(item.product_id, 'unit_cost', parseFloat(e.target.value)||0)}/></td>
                        <td className="num">{(item.quantity * item.unit_cost).toFixed(2)}</td>
                        <td><button className="btn btn-ghost btn-icon btn-sm" onClick={()=>removeItem(item.product_id)} style={{color:'var(--danger)'}}><Trash2 size={14}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{marginTop:16,textAlign:'left'}}>
                 <strong>إجمالي الطلب: </strong>
                 <span className="num" style={{fontSize:'1.2rem',fontWeight:700,color:'var(--primary-light)'}}>
                   {newOrder.items.reduce((s,i)=>s+(i.quantity*i.unit_cost),0).toFixed(2)} ج.م
                 </span>
              </div>
              <div className="input-group" style={{marginTop:12}}><label>ملاحظات</label><textarea value={newOrder.notes} onChange={e=>setNewOrder({...newOrder, notes:e.target.value})} rows={2}/></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={createOrder}>إتمام الطلب</button>
              <button className="btn btn-ghost" onClick={()=>setShowOrderForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="modal-overlay" onClick={()=>setConfirmModal({show:false, orderId:null})}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:400}}>
            <div className="modal-header"><h3>⚠️ تأكيد الاستلام</h3></div>
            <div className="modal-body" style={{textAlign:'center',padding:'20px 0'}}>
              <p>هل أنت متأكد من استلام هذه الطلبية؟</p>
              <p style={{fontSize:'0.85rem',color:'var(--text-muted)',marginTop:8}}>سيتم زيادة كميات المنتجات في المخزون تلقائياً.</p>
            </div>
            <div className="modal-footer" style={{justifyContent:'center',gap:12}}>
              <button className="btn btn-success" onClick={()=>receiveOrder(confirmModal.orderId)}>تأكيد الاستلام</button>
              <button className="btn btn-ghost" onClick={()=>setConfirmModal({show:false, orderId:null})}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
