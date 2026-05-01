'use client';
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, RotateCcw } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?period=${period}`).then(r=>r.json()).then(d=>{ setData(d); setLoading(false); });
  }, [period]);

  if (loading || !data) return <div style={{padding:40,textAlign:'center',color:'var(--text-muted)'}}>جاري التحميل...</div>;

  const { salesByPeriod, topProducts, paymentMethods, categoryBreakdown, cashierBreakdown, expensesBreakdown, summary } = data;

  const salesChart = {
    labels: salesByPeriod.map(s => s.period),
    datasets: [{ label: 'المبيعات', data: salesByPeriod.map(s => s.total), backgroundColor: 'rgba(20,184,166,0.6)', borderColor: '#14B8A6', borderWidth: 1, borderRadius: 6 }]
  };

  const paymentChart = {
    labels: paymentMethods.map(p => ({ cash:'كاش', card:'شبكة' }[p.payment_method] || p.payment_method)),
    datasets: [{ data: paymentMethods.map(p => p.total), backgroundColor: ['#10B981','#6366F1','#F59E0B'], borderWidth: 0 }]
  };

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
    scales: { y: { ticks: { color: '#94A3B8', font:{family:'Outfit'} }, grid: { color:'rgba(51,65,85,0.5)' } }, x: { ticks: { color:'#94A3B8', font:{family:'Outfit'} }, grid: { display:false } } }
  };

  return (
    <div>
      <div className="page-header">
        <h2><BarChart3 size={24} style={{display:'inline',marginLeft:8}}/>التقارير والإحصائيات</h2>
      </div>

      <div className="tabs" style={{maxWidth:400,marginBottom:24}}>
        <button className={`tab ${period==='daily'?'active':''}`} onClick={()=>setPeriod('daily')}>يومي</button>
        <button className={`tab ${period==='weekly'?'active':''}`} onClick={()=>setPeriod('weekly')}>أسبوعي</button>
        <button className={`tab ${period==='monthly'?'active':''}`} onClick={()=>setPeriod('monthly')}>شهري</button>
      </div>

      <div className="stats-grid" style={{marginBottom:24}}>
        <div className="stat-card green"><div className="stat-icon green"><DollarSign size={24}/></div><div className="stat-info"><h3>إجمالي الإيرادات</h3><div className="stat-value num">{summary.revenue.toFixed(0)} ج.م</div></div></div>
        <div className="stat-card purple"><div className="stat-icon purple"><TrendingUp size={24}/></div><div className="stat-info"><h3>صافي الربح</h3><div className="stat-value num">{summary.profit.toFixed(0)} ج.م</div></div></div>
        <div className="stat-card orange"><div className="stat-icon orange"><RotateCcw size={24}/></div><div className="stat-info"><h3>المرتجعات</h3><div className="stat-value num">{summary.returns.toFixed(0)} ج.م</div></div></div>
        <div className="stat-card red"><div className="stat-icon red"><DollarSign size={24}/></div><div className="stat-info"><h3>المصروفات</h3><div className="stat-value num">{summary.expenses?.toFixed(0) || 0} ج.م</div></div></div>
      </div>

      <div className="card" style={{marginBottom:24, background:'var(--bg-input)'}}>
        <h3 style={{marginBottom:16}}>👥 مبيعات الموظفين (تقفيل الوردية)</h3>
        <div className="table-container">
          <table>
            <thead><tr><th>الموظف</th><th>عدد الفواتير</th><th>إجمالي المبيعات</th><th>الكاش المحصل (الدرج المفروض يكون فيه)</th></tr></thead>
            <tbody>
              {cashierBreakdown?.length === 0 ? <tr><td colSpan="4" style={{textAlign:'center',padding:10}}>لا توجد بيانات</td></tr> : cashierBreakdown?.map((c, i) => (
                <tr key={i}>
                  <td>{c.username || 'غير معروف'}</td>
                  <td className="num">{c.invoice_count}</td>
                  <td className="num">{c.total_sales.toFixed(2)} ج.م</td>
                  <td className="num" style={{color:'var(--warning)', fontWeight:700}}>{c.cash_collected.toFixed(2)} ج.م</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{fontSize:'0.8rem', color:'var(--text-muted)', marginTop:8}}>* الكاش المحصل هو المبلغ المتوقع في درج الكاشير (المبيعات الكاش - الباقي المدفوع) وقبل خصم المرتجعات والمصروفات.</p>
        </div>
      </div>

      <div className="dashboard-grid" style={{marginBottom:24}}>
        <div className="card"><h3 style={{marginBottom:16}}>📊 المبيعات</h3><div style={{height:300}}><Bar data={salesChart} options={chartOpts}/></div></div>
        <div className="card"><h3 style={{marginBottom:16}}>💳 طرق الدفع</h3><div style={{height:300,display:'flex',alignItems:'center',justifyContent:'center'}}><Doughnut data={paymentChart} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#94A3B8',font:{family:'Cairo'}}}}}}/></div></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div className="card">
          <h3 style={{marginBottom:16}}>🏆 أكثر الأصناف مبيعاً</h3>
          <div className="table-container">
            <table><thead><tr><th>#</th><th>الصنف</th><th>الكمية</th><th>المبيعات</th><th>الربح</th></tr></thead>
              <tbody>{topProducts.map((p,i) => (
                <tr key={i}><td className="num">{i+1}</td><td>{p.name}</td><td className="num">{p.total_qty}</td><td className="num">{p.total_sales.toFixed(0)} ج.م</td><td className="num" style={{color:'var(--success)'}}>{p.profit.toFixed(0)} ج.م</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{marginBottom:16}}>📦 المبيعات حسب القسم</h3>
          <div className="table-container">
            <table><thead><tr><th>القسم</th><th>الكمية</th><th>المبيعات</th></tr></thead>
              <tbody>{categoryBreakdown.map((c,i) => (
                <tr key={i}><td><span className="badge badge-info">{c.category}</span></td><td className="num">{c.qty}</td><td className="num">{c.total.toFixed(0)} ج.م</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
