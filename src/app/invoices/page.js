'use client';
import { useState, useEffect } from 'react';
import { Search, FileText, Eye, RotateCcw, X, Printer } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [showReturn, setShowReturn] = useState(false);
  const [returnItem, setReturnItem] = useState(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnReason, setReturnReason] = useState('');
  const [toast, setToast] = useState(null);

  const fetchInvoices = () => { fetch(`/api/invoices?search=${search}`).then(r=>r.json()).then(setInvoices); };
  useEffect(() => { const t=setTimeout(fetchInvoices,300); return ()=>clearTimeout(t); }, [search]);

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  const paymentLabels = { cash:'كاش', card:'شبكة', insurance:'تأمين' };

  const viewInvoice = async (inv) => {
    setSelectedInvoice(inv);
    const items = await fetch(`/api/returns?invoice_id=${inv.id}`).then(r=>r.json());
    setInvoiceItems(items);
  };

  const openReturn = (item) => { setReturnItem(item); setReturnQty(1); setReturnReason(''); setShowReturn(true); };

  const handleReturn = async () => {
    if (!returnItem) return;
    const res = await fetch('/api/returns', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ invoice_id:selectedInvoice.id, product_id:returnItem.product_id, quantity:returnQty, reason:returnReason, refund_amount:returnItem.unit_price*returnQty })
    });
    if (res.ok) { showToast('تم تسجيل المرتجع بنجاح'); setShowReturn(false); viewInvoice(selectedInvoice); fetchInvoices(); }
    else showToast('حدث خطأ','error');
  };

  return (
    <div>
      {toast && <div style={{position:'fixed',top:20,left:20,zIndex:2000}}><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header"><h2><FileText size={24} style={{display:'inline',marginLeft:8}}/>الفواتير والمرتجعات</h2></div>

      <div className="search-box" style={{marginBottom:20}}><Search/><input type="search" placeholder="ابحث برقم الفاتورة..." value={search} onChange={e=>setSearch(e.target.value)}/></div>

      <div className="table-container">
        <table>
          <thead><tr><th>رقم الفاتورة</th><th>العميل</th><th>الإجمالي</th><th>الخصم</th><th>الدفع</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td className="num" style={{fontWeight:600}}>{inv.invoice_number}</td>
                <td>{inv.customer_name || '—'}</td>
                <td className="num">{inv.total.toFixed(2)} ج.م</td>
                <td className="num">{inv.discount > 0 ? `${inv.discount.toFixed(2)} ج.م` : '—'}</td>
                <td><span className="badge badge-info">{paymentLabels[inv.payment_method]}</span></td>
                <td><span className={`badge ${inv.status==='completed'?'badge-success':'badge-danger'}`}>{inv.status==='completed'?'مكتملة':'ملغاة'}</span></td>
                <td className="num" style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{new Date(inv.created_at).toLocaleString('ar-EG')}</td>
                <td>
                  <div style={{display:'flex',gap:4}}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>viewInvoice(inv)}><Eye size={14}/>عرض</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedInvoice && (
        <div className="modal-overlay" onClick={()=>setSelectedInvoice(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:600}}>
            <div className="modal-header">
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <h3>🧾 فاتورة {selectedInvoice.invoice_number}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => window.print()} style={{color:'var(--primary-light)'}}><Printer size={16}/>طباعة</button>
              </div>
              <button className="btn-icon btn-ghost" onClick={()=>setSelectedInvoice(null)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><span style={{color:'var(--text-secondary)',fontSize:'0.8rem'}}>التاريخ</span><div className="num">{new Date(selectedInvoice.created_at).toLocaleString('ar-EG')}</div></div>
                <div><span style={{color:'var(--text-secondary)',fontSize:'0.8rem'}}>طريقة الدفع</span><div>{paymentLabels[selectedInvoice.payment_method]}</div></div>
                <div><span style={{color:'var(--text-secondary)',fontSize:'0.8rem'}}>الإجمالي</span><div className="num" style={{fontWeight:700,color:'var(--primary-light)'}}>{selectedInvoice.total.toFixed(2)} ج.م</div></div>
                <div><span style={{color:'var(--text-secondary)',fontSize:'0.8rem'}}>الحالة</span><div><span className={`badge ${selectedInvoice.status==='completed'?'badge-success':'badge-danger'}`}>{selectedInvoice.status==='completed'?'مكتملة':'ملغاة'}</span></div></div>
              </div>

              <h4 style={{marginBottom:8,fontSize:'0.9rem'}}>الأصناف</h4>
              <div className="table-container" style={{marginBottom:16}}>
                <table>
                  <thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th><th>مرتجع</th></tr></thead>
                  <tbody>
                    {invoiceItems.map(item => (
                      <tr key={item.id}>
                        <td>{item.product_name}</td>
                        <td className="num">{item.quantity}</td>
                        <td className="num">{item.unit_price} ج.م</td>
                        <td className="num">{item.total.toFixed(2)} ج.م</td>
                        <td><button className="btn btn-ghost btn-sm" onClick={()=>openReturn(item)}><RotateCcw size={14}/>إرجاع</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Area (Visible only during printing) */}
      {selectedInvoice && (
        <div className="printable-receipt">
          <div className="receipt" style={{margin:'0 auto',boxShadow:'none'}}>
            <div className="receipt-header">
              <h2>⚕️ صيدلية فارما</h2>
              <p>عنوان الصيدلية - القاهرة</p>
              <p>ت: 01000000000</p>
              <hr style={{border:'none',borderTop:'1px dashed #999',margin:'8px 0'}}/>
              <p>فاتورة: {selectedInvoice.invoice_number}</p>
              <p>{new Date(selectedInvoice.created_at).toLocaleString('ar-EG')}</p>
            </div>
            <div className="receipt-items">
              {invoiceItems.map((item, i) => (
                <div key={i} className="receipt-item">
                  <span>{item.product_name} x{item.quantity}</span>
                  <span>{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="receipt-totals">
              <div className="receipt-total-row"><span>المجموع:</span><span>{selectedInvoice.total.toFixed(2)}</span></div>
              {selectedInvoice.discount > 0 && <div className="receipt-total-row"><span>الخصم:</span><span>-{selectedInvoice.discount.toFixed(2)}</span></div>}
              <div className="receipt-total-row final"><span>الإجمالي:</span><span>{selectedInvoice.total.toFixed(2)} ج.م</span></div>
              <div className="receipt-total-row"><span>الدفع:</span><span>{paymentLabels[selectedInvoice.payment_method]}</span></div>
            </div>
            <div className="receipt-footer"><p>شكراً لزيارتكم 💊</p></div>
          </div>
        </div>
      )}

      {showReturn && returnItem && (
        <div className="modal-overlay" onClick={()=>setShowReturn(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:400}}>
            <div className="modal-header"><h3>↩️ إرجاع صنف</h3><button className="btn-icon btn-ghost" onClick={()=>setShowReturn(false)}><X size={20}/></button></div>
            <div className="modal-body">
              <p style={{marginBottom:16}}>إرجاع: <strong>{returnItem.product_name}</strong></p>
              <div className="input-group"><label>الكمية المرتجعة</label><input type="number" min="1" max={returnItem.quantity} value={returnQty} onChange={e=>setReturnQty(parseInt(e.target.value)||1)}/></div>
              <div className="input-group"><label>السبب</label><textarea value={returnReason} onChange={e=>setReturnReason(e.target.value)} rows={3} placeholder="سبب الإرجاع..."/></div>
              <div style={{background:'var(--bg-input)',borderRadius:'var(--radius-sm)',padding:12}}>
                <span>مبلغ الاسترداد: </span><strong className="num">{(returnItem.unit_price * returnQty).toFixed(2)} ج.م</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={handleReturn}>تأكيد الإرجاع</button>
              <button className="btn btn-ghost" onClick={()=>setShowReturn(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
