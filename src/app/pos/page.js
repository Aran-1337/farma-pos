'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Shield, X, Printer, ShoppingCart, ScanBarcode, Package, Clock, FileWarning, Pill, Filter, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { saveProductsOffline, getProductsOffline, saveInvoiceOffline, getPendingInvoices, removeSyncedInvoice } from '@/lib/offline-db';

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('available');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [toast, setToast] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [debtMode, setDebtMode] = useState(false);
  const [debtName, setDebtName] = useState('');
  const [debtPhone, setDebtPhone] = useState('');
  const [debtNotes, setDebtNotes] = useState('');
  const searchRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingInvoices, setPendingInvoices] = useState([]);

  // Monitor Connection
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Check for pending invoices
  const refreshPending = useCallback(async () => {
    const pending = await getPendingInvoices();
    setPendingInvoices(pending);
  }, []);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/products?search=${search}&limit=500`);
      if (res.ok) {
        const data = await res.json();
        const items = data.products || [];
        setProducts(items);
        if (items.length > 0) saveProductsOffline(items); // Cache for offline
      } else {
        throw new Error('API Error');
      }
    } catch (err) {
      console.log('Offline: loading products from cache...');
      const cached = await getProductsOffline();
      if (cached.length > 0) {
        setProducts(cached.filter(p => 
          p.name.includes(search) || 
          p.name_en.toLowerCase().includes(search.toLowerCase()) || 
          p.barcode.includes(search)
        ));
      }
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d => setCurrentUser(d.user));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F1') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F2') { e.preventDefault(); if (cart.length > 0) setShowPayment(true); }
      if (e.key === 'Escape') { setShowPayment(false); setShowReceipt(false); stopScanner(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // Barcode Scanner
  const startScanner = async () => {
    setShowScanner(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('عفواً، متصفح الهاتف يمنع فتح الكاميرا إلا عبر اتصال آمن (HTTPS)', 'error');
        setShowScanner(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { 
      showToast('لا يمكن الوصول للكاميرا، تأكد من إعطاء الصلاحيات', 'error'); 
      setShowScanner(false); 
    }
  };

  const stopScanner = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setShowScanner(false);
  };

  const handleBarcodeInput = (e) => {
    const val = e.target.value.trim();
    if (val.length >= 3) {
      const found = products.find(p => p.barcode === val || p.batch_no === val);
      if (found) { addToCart(found); showToast(`تم إضافة: ${found.name}`); }
      else showToast('لم يتم العثور على المنتج', 'error');
      e.target.value = '';
    }
  };

  // Filters
  const now = new Date();
  const filteredProducts = products.filter(p => {
    const isExpired = p.expiry_date && new Date(p.expiry_date) <= now;
    const isOutOfStock = p.quantity <= 0;
    const isPrescription = !!p.requires_prescription;
    switch (filter) {
      case 'available': return !isExpired && !isOutOfStock;
      case 'out_of_stock': return isOutOfStock;
      case 'expired': return isExpired;
      case 'prescription': return isPrescription;
      default: return true;
    }
  });

  const filterCounts = {
    available: products.filter(p => !(p.expiry_date && new Date(p.expiry_date) <= now) && p.quantity > 0).length,
    out_of_stock: products.filter(p => p.quantity <= 0).length,
    expired: products.filter(p => p.expiry_date && new Date(p.expiry_date) <= now).length,
    prescription: products.filter(p => p.requires_prescription).length,
  };

  const addToCart = (product) => {
    if (product.quantity <= 0) { showToast('المنتج غير متوفر في المخزون', 'error'); return; }
    const expiry = product.expiry_date ? new Date(product.expiry_date) : null;
    if (expiry && expiry <= new Date()) { showToast('المنتج منتهي الصلاحية!', 'error'); return; }
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) { showToast('الكمية المطلوبة أكبر من المتاح', 'warning'); return prev; }
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unit_price } : i);
      }
      return [...prev, { product_id: product.id, product_name: product.name, unit_price: product.selling_price, quantity: 1, total: product.selling_price, max_qty: product.quantity }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.product_id !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty <= 0) return null;
      if (newQty > i.max_qty) { showToast('الكمية أكبر من المتاح', 'warning'); return i; }
      return { ...i, quantity: newQty, total: newQty * i.unit_price };
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.product_id !== productId));
  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const total = subtotal - discount;
  const paid = parseFloat(amountPaid) || 0;
  const change = paymentMethod === 'cash' ? paid - total : 0;

  const handlePayment = async () => {
    if (paymentMethod === 'cash' && !debtMode && paid < total) { showToast('المبلغ المدفوع أقل من الإجمالي — فعّل خيار المديونية', 'error'); return; }
    if (debtMode && !debtName.trim()) { showToast('أدخل اسم العميل للمديونية', 'error'); return; }

    const invNum = `INV-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${Math.floor(Math.random()*9000+1000)}`;
    const actualPaid = debtMode ? paid : (paymentMethod === 'cash' ? paid : total);

    const body = {
      invoice_number: invNum, subtotal, discount, total,
      user_id: currentUser?.id,
      payment_method: paymentMethod,
      amount_paid: actualPaid,
      change_amount: debtMode ? 0 : (paymentMethod === 'cash' ? Math.max(0, change) : 0),
      items: cart.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price, total: i.total })),
      debt: debtMode ? { customer_name: debtName, customer_phone: debtPhone, remaining: total - actualPaid, notes: debtNotes } : null,
    };

    try {
      const res = await fetch('/api/invoices', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      
      if (res.ok) {
        setLastInvoice({ ...body, created_at: new Date().toISOString() });
        setShowPayment(false); setShowReceipt(true); setCart([]); setDiscount(0); setAmountPaid('');
        setDebtMode(false); setDebtName(''); setDebtPhone(''); setDebtNotes('');
        fetchProducts();
        showToast(debtMode ? 'تم البيع وتسجيل المديونية ✅' : 'تم إتمام عملية البيع ✅');
      } else {
        throw new Error('Failed to save on server');
      }
    } catch (e) { 
      // SAVE OFFLINE
      await saveInvoiceOffline(body);
      setLastInvoice({ ...body, created_at: new Date().toISOString(), is_offline: true });
      setShowPayment(false); setShowReceipt(true); setCart([]); setDiscount(0); setAmountPaid('');
      setDebtMode(false); setDebtName(''); setDebtPhone(''); setDebtNotes('');
      refreshPending();
      showToast('تم الحفظ محلياً (أوفلاين) 📶 سيتم المزامنة عند توفر الإنترنت', 'warning');
    }
  };

  const syncOfflineInvoices = async () => {
    if (!isOnline || pendingInvoices.length === 0) return;
    
    showToast('جاري مزامنة الفواتير المعلقة...', 'info');
    let successCount = 0;

    for (const inv of pendingInvoices) {
      try {
        const res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inv)
        });
        if (res.ok) {
          await removeSyncedInvoice(inv.tempId);
          successCount++;
        }
      } catch (err) {
        console.error('Failed to sync invoice:', inv.tempId);
      }
    }

    if (successCount > 0) {
      showToast(`تم مزامنة ${successCount} فواتير بنجاح ✅`);
      refreshPending();
      fetchProducts();
    }
  };

  const sendWhatsAppReceipt = () => {
    if (!lastInvoice) return;
    let message = `⚕️ *صيدلية فارما*\n`;
    message += `فاتورة رقم: *${lastInvoice.invoice_number}*\n`;
    message += `التاريخ: ${new Date(lastInvoice.created_at).toLocaleString('ar-EG')}\n\n`;
    message += `*الأصناف:*\n`;
    lastInvoice.items.forEach(item => {
      message += `- ${item.product_name} x${item.quantity} : ${item.total.toFixed(2)} ج.م\n`;
    });
    message += `\n*الإجمالي: ${lastInvoice.total.toFixed(2)} ج.م*\n`;
    if (lastInvoice.debt) {
      message += `*المتبقي (مديونية): ${lastInvoice.debt.remaining.toFixed(2)} ج.م*\n`;
    }
    message += `\nشكراً لزيارتكم 💊`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const paymentLabels = { cash: 'كاش', card: 'شبكة', insurance: 'تأمين' };
  const filters = [
    { key: 'available', label: 'المتاحة', icon: Package, color: 'var(--success)' },
    { key: 'out_of_stock', label: 'نفذت', icon: FileWarning, color: 'var(--danger)' },
    { key: 'expired', label: 'منتهية', icon: Clock, color: 'var(--warning)' },
    { key: 'prescription', label: 'روشتة', icon: Pill, color: 'var(--accent)' },
  ];

  return (
    <div>
      {toast && <div style={{position:'fixed',top:20,left:20,zIndex:2000}}><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header" style={{paddingBottom: 0}}>
        <div>
          <h2><ShoppingCart size={24} style={{display:'inline',marginLeft:8}}/>شاشة البيع</h2>
          <div style={{display:'flex',gap:8,fontSize:'0.75rem',color:'var(--text-muted)', marginTop: 4}}>
            <span>F1 بحث</span><span>F2 دفع</span><span>Esc إغلاق</span>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap: 12}}>
          {pendingInvoices.length > 0 && (
            <button className="btn btn-warning btn-sm" onClick={syncOfflineInvoices} style={{gap: 6}}>
              <RefreshCw size={14} className={isOnline ? 'spin' : ''}/>
              مزامنة المعلق ({pendingInvoices.length})
            </button>
          )}
          <div style={{display:'flex', alignItems:'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: isOnline ? 'var(--success)' : 'var(--danger)', fontSize: '0.8rem', fontWeight: 600}}>
            {isOnline ? <Wifi size={14}/> : <WifiOff size={14}/>}
            {isOnline ? 'متصل' : 'غير متصل'}
          </div>
        </div>
      </div>

      <div className="pos-layout">
        <div className="pos-products">
          {/* Search + Barcode */}
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            <div className="search-box" style={{flex:1}}>
              <Search />
              <input ref={searchRef} type="search" placeholder="ابحث بالاسم أو الباركود أو رقم التشغيلة..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-ghost" onClick={startScanner} title="سكان الباركود" style={{padding:'10px 14px'}}>
              <ScanBarcode size={20}/>
            </button>
          </div>

          {/* Barcode manual input */}
          <div style={{marginBottom:12,position:'relative'}}>
            <input type="text" placeholder="📷 امسح الباركود أو اكتب رقم التشغيلة (Batch No)..." onKeyDown={e => { if(e.key==='Enter') handleBarcodeInput(e); }} style={{paddingRight:14,fontSize:'0.85rem',background:'var(--bg-input)',border:'1px dashed var(--border)'}} />
          </div>

          {/* Filter Tabs */}
          <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
            {filters.map(f => {
              const Icon = f.icon;
              const active = filter === f.key;
              return (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{
                    display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:'var(--radius-sm)',
                    border: active ? `2px solid ${f.color}` : '1px solid var(--border)',
                    background: active ? `${f.color}15` : 'var(--bg-card)',
                    color: active ? f.color : 'var(--text-secondary)',
                    cursor:'pointer',fontSize:'0.8rem',fontWeight:600,fontFamily:'Cairo',transition:'var(--transition)'
                  }}>
                  <Icon size={15}/>{f.label}
                  <span className="num" style={{background:active?`${f.color}25`:'var(--bg-input)',padding:'2px 8px',borderRadius:10,fontSize:'0.7rem'}}>{filterCounts[f.key]}</span>
                </button>
              );
            })}
          </div>

          <div className="products-grid">
            {filteredProducts.map(p => {
              const isLow = p.quantity <= p.min_quantity && p.quantity > 0;
              const isExpired = p.expiry_date && new Date(p.expiry_date) <= now;
              const isOut = p.quantity <= 0;
              return (
                <div key={p.id} className="product-card" onClick={() => addToCart(p)} style={isExpired||isOut ? {opacity:0.5} : {}}>
                  <h4>{p.name}</h4>
                  <div className="product-en">{p.name_en}</div>
                  <div className="product-price num">{p.selling_price} ج.م</div>
                  <div className="product-stock">
                    {isExpired ? <span style={{color:'var(--danger)'}}>⛔ منتهي الصلاحية</span> :
                     isOut ? <span style={{color:'var(--danger)'}}>🚫 نفذ من المخزون</span> :
                     isLow ? <span style={{color:'var(--warning)'}}>⚠️ متبقي: {p.quantity}</span> :
                     <span>المخزون: {p.quantity}</span>}
                  </div>
                  {p.requires_prescription ? <span className="badge badge-purple" style={{marginTop:4,fontSize:'0.65rem'}}>💊 يحتاج روشتة</span> : null}
                </div>
              );
            })}
            {filteredProducts.length === 0 && <div className="empty-state" style={{gridColumn:'1/-1'}}><Filter size={48}/><h3>لا توجد أصناف</h3><p style={{fontSize:'0.8rem'}}>جرب فلتر آخر أو غيّر البحث</p></div>}
          </div>
        </div>

        {/* Cart Side */}
        <div className="pos-cart">
          <div className="pos-cart-header">
            <h3 style={{fontSize:'1rem',fontWeight:700}}>🛒 الفاتورة الحالية</h3>
            {cart.length > 0 && <button className="btn btn-ghost btn-sm" onClick={clearCart}><Trash2 size={14}/>مسح</button>}
          </div>
          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="empty-state"><ShoppingCart size={48}/><h3>الفاتورة فارغة</h3><p style={{fontSize:'0.8rem'}}>ابحث عن صنف أو اضغط عليه</p></div>
            ) : cart.map(item => (
              <div key={item.product_id} className="cart-item">
                <div className="cart-item-info"><h4>{item.product_name}</h4><span className="num">{item.unit_price} ج.م</span></div>
                <div className="cart-item-qty">
                  <button onClick={() => updateQty(item.product_id, -1)}><Minus size={14}/></button>
                  <span className="num">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product_id, 1)}><Plus size={14}/></button>
                </div>
                <div className="cart-item-total num">{item.total.toFixed(2)}</div>
                <button className="cart-item-remove" onClick={() => removeFromCart(item.product_id)}><X size={16}/></button>
              </div>
            ))}
          </div>
          {cart.length > 0 && (
            <div className="pos-cart-footer">
              <div className="cart-summary">
                <div className="cart-summary-row"><span>المجموع</span><span className="num">{subtotal.toFixed(2)} ج.م</span></div>
                <div className="cart-summary-row"><span>الخصم</span><input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value)||0)} style={{width:80,textAlign:'center',padding:'4px 8px'}} min="0" disabled={currentUser?.role === 'cashier' && !currentUser?.permissions?.can_discount} title={currentUser?.role === 'cashier' && !currentUser?.permissions?.can_discount ? 'ليس لديك صلاحية لإضافة خصم' : ''}/></div>
                <div className="cart-summary-row total"><span>الإجمالي</span><span className="num">{total.toFixed(2)} ج.م</span></div>
              </div>
              <button className="btn btn-primary w-full btn-lg" onClick={() => setShowPayment(true)} style={{justifyContent:'center'}}><CreditCard size={20}/>الدفع</button>
            </div>
          )}
        </div>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="modal-overlay" onClick={stopScanner}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:420}}>
            <div className="modal-header"><h3>📷 سكان الباركود</h3><button className="btn-icon btn-ghost" onClick={stopScanner}><X size={20}/></button></div>
            <div className="modal-body" style={{textAlign:'center'}}>
              <video ref={videoRef} autoPlay playsInline style={{width:'100%',borderRadius:'var(--radius-sm)',background:'#000',maxHeight:300}}/>
              <p style={{marginTop:12,fontSize:'0.85rem',color:'var(--text-secondary)'}}>وجّه الكاميرا نحو الباركود<br/>أو أدخل الرقم يدوياً في خانة البحث</p>
              <input type="text" placeholder="أدخل رقم الباركود يدوياً..." style={{marginTop:12}} onKeyDown={e => { if(e.key==='Enter'){handleBarcodeInput(e);stopScanner();}}} autoFocus />
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:500}}>
            <div className="modal-header"><h3>💳 إتمام الدفع</h3><button className="btn-icon btn-ghost" onClick={() => setShowPayment(false)}><X size={20}/></button></div>
            <div className="modal-body">
              <div className="payment-methods">
                <div className={`payment-method-btn ${paymentMethod==='cash'?'active':''}`} onClick={() => setPaymentMethod('cash')}><Banknote size={24}/><span>كاش</span></div>
                <div className={`payment-method-btn ${paymentMethod==='card'?'active':''}`} onClick={() => setPaymentMethod('card')}><CreditCard size={24}/><span>شبكة</span></div>
              </div>

              <div style={{background:'var(--bg-input)',borderRadius:'var(--radius-sm)',padding:16,marginBottom:16}}>
                <div className="cart-summary-row total" style={{border:'none',padding:0}}><span>المطلوب</span><span className="num">{total.toFixed(2)} ج.م</span></div>
              </div>

              {paymentMethod === 'cash' && (
                <>
                  <div className="input-group"><label>المبلغ المدفوع</label><input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="0.00" autoFocus/></div>
                  {paid > 0 && paid >= total && (
                    <div style={{background:'rgba(16,185,129,0.1)',borderRadius:'var(--radius-sm)',padding:12,textAlign:'center',color:'var(--success)',fontWeight:700,marginBottom:12}}>
                      الباقي: <span className="num">{(paid - total).toFixed(2)} ج.م</span>
                    </div>
                  )}
                  {paid > 0 && paid < total && !debtMode && (
                    <div style={{background:'rgba(245,158,11,0.1)',borderRadius:'var(--radius-sm)',padding:12,textAlign:'center',color:'var(--warning)',fontWeight:600,marginBottom:12}}>
                      ⚠️ ينقص <span className="num">{(total - paid).toFixed(2)} ج.م</span> — يمكنك تسجيلها كمديونية
                    </div>
                  )}

                  {/* Debt toggle */}
                  <div onClick={() => setDebtMode(!debtMode)} style={{border: debtMode ? '2px solid var(--warning)' : '1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:14,marginBottom:12,background: debtMode ? 'rgba(245,158,11,0.08)' : 'transparent',cursor:'pointer',transition:'var(--transition)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,fontSize:'0.9rem',fontWeight:600}}>
                      <div style={{width:22,height:22,borderRadius:4,border: debtMode ? '2px solid var(--warning)' : '2px solid var(--border)',background: debtMode ? 'var(--warning)' : 'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'var(--transition)'}}>
                        {debtMode && <span style={{color:'#000',fontSize:14,fontWeight:900}}>✓</span>}
                      </div>
                      📋 تسجيل كمديونية (الدفع لاحقاً)
                    </div>
                  </div>
                    {debtMode && (
                      <div style={{marginTop:12,display:'grid',gap:10}}>
                        <div className="input-group" style={{margin:0}}><label>اسم العميل *</label><input type="text" value={debtPhone} onChange={e=>setDebtPhone(e.target.value)} placeholder="اسم المدين"/></div>
                        <div className="input-group" style={{margin:0}}><label>رقم الهاتف</label><input type="tel" value={debtPhone} onChange={e=>setDebtPhone(e.target.value)} placeholder="01xxxxxxxxx"/></div>
                        <div className="input-group" style={{margin:0}}><label>ملاحظات</label><input type="text" value={debtPhone} onChange={e=>setDebtPhone(e.target.value)} placeholder="ملاحظات اختيارية"/></div>
                        <div style={{background:'rgba(245,158,11,0.1)',borderRadius:'var(--radius-sm)',padding:10,fontSize:'0.85rem'}}>
                          <div style={{display:'flex',justifyContent:'space-between'}}><span>المدفوع:</span><span className="num">{paid.toFixed(2)} ج.م</span></div>
                          <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,color:'var(--warning)'}}><span>المديونية:</span><span className="num">{Math.max(0,total-paid).toFixed(2)} ج.م</span></div>
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-success btn-lg" onClick={handlePayment} style={{flex:1,justifyContent:'center'}}>
                {debtMode ? '📋 بيع + تسجيل مديونية' : '✅ تأكيد الدفع'}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowPayment(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastInvoice && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:400}}>
            <div className="modal-header"><h3>🧾 الإيصال</h3><button className="btn-icon btn-ghost" onClick={() => setShowReceipt(false)}><X size={20}/></button></div>
            <div className="modal-body" style={{display:'flex',justifyContent:'center'}}>
              <div className="receipt">
                <div className="receipt-header">
                  <h2>⚕️ صيدلية فارما</h2>
                  <p>عنوان الصيدلية - القاهرة</p>
                  <p>ت: 01000000000</p>
                  <hr style={{border:'none',borderTop:'1px dashed #999',margin:'8px 0'}}/>
                  <p>فاتورة: {lastInvoice.invoice_number}</p>
                  <p>{new Date(lastInvoice.created_at).toLocaleString('ar-EG')}</p>
                </div>
                <div className="receipt-items">{lastInvoice.items.map((item,i) => (<div key={i} className="receipt-item"><span>{item.product_name} x{item.quantity}</span><span>{item.total.toFixed(2)}</span></div>))}</div>
                <div className="receipt-totals">
                  <div className="receipt-total-row"><span>المجموع:</span><span>{lastInvoice.subtotal.toFixed(2)}</span></div>
                  {lastInvoice.discount > 0 && <div className="receipt-total-row"><span>الخصم:</span><span>-{lastInvoice.discount.toFixed(2)}</span></div>}
                  <div className="receipt-total-row final"><span>الإجمالي:</span><span>{lastInvoice.total.toFixed(2)} ج.م</span></div>
                  <div className="receipt-total-row"><span>الدفع:</span><span>{paymentLabels[lastInvoice.payment_method]}</span></div>
                  <div className="receipt-total-row"><span>المدفوع:</span><span>{lastInvoice.amount_paid.toFixed(2)}</span></div>
                  {lastInvoice.debt && <div className="receipt-total-row" style={{color:'#c00',fontWeight:700}}><span>مديونية:</span><span>{lastInvoice.debt.remaining.toFixed(2)} ج.م</span></div>}
                  {!lastInvoice.debt && lastInvoice.change_amount > 0 && <div className="receipt-total-row"><span>الباقي:</span><span>{lastInvoice.change_amount.toFixed(2)}</span></div>}
                </div>
                <div className="receipt-footer"><p>شكراً لزيارتكم 💊</p></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16}/>طباعة</button>
              <button className="btn btn-success" onClick={sendWhatsAppReceipt} style={{background:'#25D366',border:'none'}}>واتساب</button>
              <button className="btn btn-ghost" onClick={() => setShowReceipt(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Area (Visible only during printing) */}
      {showReceipt && lastInvoice && (
        <div className="printable-receipt">
          <div className="receipt" style={{margin:'0 auto',boxShadow:'none'}}>
            <div className="receipt-header">
              <h2>⚕️ صيدلية فارما</h2>
              <p>عنوان الصيدلية - القاهرة</p>
              <p>ت: 01000000000</p>
              <hr style={{border:'none',borderTop:'1px dashed #999',margin:'8px 0'}}/>
              <p>فاتورة: {lastInvoice.invoice_number}</p>
              {(lastInvoice.customer_name || lastInvoice.debt?.customer_name) && <p>العميل: {lastInvoice.customer_name || lastInvoice.debt?.customer_name}</p>}
              <p>{new Date(lastInvoice.created_at).toLocaleString('ar-EG')}</p>
            </div>
            <div className="receipt-items">{lastInvoice.items.map((item,i) => (<div key={i} className="receipt-item"><span>{item.product_name} x{item.quantity}</span><span>{item.total.toFixed(2)}</span></div>))}</div>
            <div className="receipt-totals">
              <div className="receipt-total-row"><span>المجموع:</span><span>{lastInvoice.subtotal.toFixed(2)}</span></div>
              {lastInvoice.discount > 0 && <div className="receipt-total-row"><span>الخصم:</span><span>-{lastInvoice.discount.toFixed(2)}</span></div>}
              <div className="receipt-total-row final"><span>الإجمالي:</span><span>{lastInvoice.total.toFixed(2)} ج.م</span></div>
              <div className="receipt-total-row"><span>الدفع:</span><span>{paymentLabels[lastInvoice.payment_method]}</span></div>
              <div className="receipt-total-row"><span>المدفوع:</span><span>{lastInvoice.amount_paid.toFixed(2)}</span></div>
              {lastInvoice.debt && <div className="receipt-total-row" style={{color:'#c00',fontWeight:700}}><span>مديونية:</span><span>{lastInvoice.debt.remaining.toFixed(2)} ج.م</span></div>}
              {!lastInvoice.debt && lastInvoice.change_amount > 0 && <div className="receipt-total-row"><span>الباقي:</span><span>{lastInvoice.change_amount.toFixed(2)}</span></div>}
            </div>
            <div className="receipt-footer"><p>شكراً لزيارتكم 💊</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
