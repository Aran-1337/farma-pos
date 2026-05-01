'use client';
import { useState, useEffect } from 'react';
import { DollarSign, FileText, TrendingUp, AlertTriangle, Clock, Package, ShoppingCart } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{padding:'40px',textAlign:'center',color:'var(--text-muted)'}}>جاري التحميل...</div>;
  if (!data) return <div>خطأ في تحميل البيانات</div>;

  const { stats, last7Days, topProducts, lowStockItems, expiringItems, recentInvoices } = data;

  const chartData = {
    labels: last7Days.map(d => { const date = new Date(d.date); return `${date.getDate()}/${date.getMonth()+1}`; }),
    datasets: [{ label: 'المبيعات (ج.م)', data: last7Days.map(d => d.total), backgroundColor: 'rgba(20,184,166,0.6)', borderColor: '#14B8A6', borderWidth: 1, borderRadius: 6 }]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
      y: { ticks: { color: '#94A3B8', font: { family: 'Outfit' } }, grid: { color: 'rgba(51,65,85,0.5)' } },
      x: { ticks: { color: '#94A3B8', font: { family: 'Outfit' } }, grid: { display: false } }
    }
  };

  const paymentLabel = { cash: 'كاش', card: 'شبكة', insurance: 'تأمين' };

  return (
    <div>
      <div className="page-header">
        <h2>لوحة التحكم</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'0.85rem'}}>مرحباً بك في نظام فارما 👋</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon green"><DollarSign size={24}/></div>
          <div className="stat-info"><h3>مبيعات اليوم</h3><div className="stat-value num">{stats.todaySales.toFixed(0)} ج.م</div></div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><FileText size={24}/></div>
          <div className="stat-info"><h3>فواتير اليوم</h3><div className="stat-value num">{stats.invoiceCount}</div></div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><TrendingUp size={24}/></div>
          <div className="stat-info"><h3>الأرباح</h3><div className="stat-value num">{stats.profit.toFixed(0)} ج.م</div></div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange"><AlertTriangle size={24}/></div>
          <div className="stat-info"><h3>مخزون منخفض</h3><div className="stat-value num">{stats.lowStock}</div></div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red"><Clock size={24}/></div>
          <div className="stat-info"><h3>قرب الانتهاء</h3><div className="stat-value num">{stats.expiringSoon + stats.expired}</div></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3 style={{marginBottom:16,fontSize:'1rem'}}>📊 مبيعات آخر 7 أيام</h3>
          <div style={{height:280}}><Bar data={chartData} options={chartOpts}/></div>
        </div>

        <div className="card">
          <h3 style={{marginBottom:16,fontSize:'1rem'}}>🏆 الأكثر مبيعاً</h3>
          <div style={{maxHeight:300,overflowY:'auto'}}>
            {topProducts.map((p,i) => (
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span className="num" style={{color:'var(--text-muted)',fontSize:'0.8rem',width:20}}>{i+1}</span>
                  <span style={{fontSize:'0.85rem'}}>{p.name}</span>
                </div>
                <span className="badge badge-success num">{p.total_qty} قطعة</span>
              </div>
            ))}
          </div>
        </div>

        {(lowStockItems.length > 0 || expiringItems.length > 0) && (
          <div className="card dashboard-full">
            <h3 style={{marginBottom:16,fontSize:'1rem'}}>⚠️ التنبيهات</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div>
                <h4 style={{fontSize:'0.85rem',color:'var(--warning)',marginBottom:8}}>مخزون منخفض</h4>
                {lowStockItems.map(item => (
                  <div key={item.id} className="alert-item warning">
                    <Package size={16} style={{color:'var(--warning)'}}/>
                    <div className="alert-item-info">
                      <h4>{item.name}</h4>
                      <p>متبقي: <span className="num">{item.quantity}</span> من أصل <span className="num">{item.min_quantity}</span></p>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h4 style={{fontSize:'0.85rem',color:'var(--danger)',marginBottom:8}}>قرب انتهاء الصلاحية</h4>
                {expiringItems.map(item => (
                  <div key={item.id} className="alert-item danger">
                    <Clock size={16} style={{color:'var(--danger)'}}/>
                    <div className="alert-item-info">
                      <h4>{item.name}</h4>
                      <p>تنتهي: <span className="num">{new Date(item.expiry_date).toLocaleDateString('ar-EG')}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="card dashboard-full">
          <h3 style={{marginBottom:16,fontSize:'1rem'}}>🧾 آخر الفواتير</h3>
          <div className="table-container">
            <table>
              <thead><tr><th>رقم الفاتورة</th><th>الإجمالي</th><th>طريقة الدفع</th><th>الحالة</th><th>التاريخ</th></tr></thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="num">{inv.invoice_number}</td>
                    <td className="num">{inv.total.toFixed(2)} ج.م</td>
                    <td><span className="badge badge-info">{paymentLabel[inv.payment_method] || inv.payment_method}</span></td>
                    <td><span className={`badge ${inv.status==='completed'?'badge-success':'badge-danger'}`}>{inv.status==='completed'?'مكتملة':'ملغاة'}</span></td>
                    <td className="num" style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{new Date(inv.created_at).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
