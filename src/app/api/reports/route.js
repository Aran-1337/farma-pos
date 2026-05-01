import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { NextResponse } from 'next/server';

function init() { getDb(); seedDatabase(); }

export async function GET(request) {
  init();
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'daily';

  let dateFilter, groupBy;
  if (period === 'daily') { dateFilter = "DATE('now','-30 days')"; groupBy = "DATE(created_at)"; }
  else if (period === 'weekly') { dateFilter = "DATE('now','-12 weeks')"; groupBy = "strftime('%Y-%W', created_at)"; }
  else { dateFilter = "DATE('now','-12 months')"; groupBy = "strftime('%Y-%m', created_at)"; }

  const salesByPeriod = db.prepare(`SELECT ${groupBy} as period, SUM(total) as total, COUNT(*) as count FROM invoices WHERE created_at >= ${dateFilter} AND status='completed' GROUP BY ${groupBy} ORDER BY period`).all();

  const topProducts = db.prepare(`SELECT p.name, p.category, SUM(ii.quantity) as total_qty, SUM(ii.total) as total_sales, SUM(ii.quantity * (ii.unit_price - p.purchase_price)) as profit FROM invoice_items ii JOIN products p ON ii.product_id=p.id JOIN invoices i ON ii.invoice_id=i.id WHERE i.status='completed' AND i.created_at >= ${dateFilter} GROUP BY ii.product_id ORDER BY total_qty DESC LIMIT 20`).all();

  const paymentMethods = db.prepare(`SELECT payment_method, SUM(total) as total, COUNT(*) as count FROM invoices WHERE created_at >= ${dateFilter} AND status='completed' GROUP BY payment_method`).all();

  const totalRevenue = db.prepare(`SELECT SUM(total) as revenue FROM invoices WHERE created_at >= ${dateFilter} AND status='completed'`).get();
  const totalProfit = db.prepare(`SELECT SUM(ii.quantity * (ii.unit_price - p.purchase_price)) as profit FROM invoice_items ii JOIN invoices i ON ii.invoice_id=i.id JOIN products p ON ii.product_id=p.id WHERE i.status='completed' AND i.created_at >= ${dateFilter}`).get();
  const totalReturns = db.prepare(`SELECT COALESCE(SUM(refund_amount),0) as total FROM returns WHERE created_at >= ${dateFilter}`).get();

  const categoryBreakdown = db.prepare(`SELECT p.category, SUM(ii.quantity) as qty, SUM(ii.total) as total FROM invoice_items ii JOIN products p ON ii.product_id=p.id JOIN invoices i ON ii.invoice_id=i.id WHERE i.status='completed' AND i.created_at >= ${dateFilter} GROUP BY p.category ORDER BY total DESC`).all();

  const cashierBreakdown = db.prepare(`
    SELECT u.username, 
           SUM(i.total) as total_sales, 
           SUM(CASE WHEN i.payment_method = 'cash' THEN i.amount_paid - i.change_amount ELSE 0 END) as cash_collected,
           COUNT(i.id) as invoice_count
    FROM invoices i
    LEFT JOIN users u ON i.user_id = u.id
    WHERE i.status='completed' AND i.created_at >= ${dateFilter}
    GROUP BY i.user_id
  `).all();

  const expensesBreakdown = db.prepare(`
    SELECT category, SUM(amount) as total
    FROM expenses
    WHERE created_at >= ${dateFilter}
    GROUP BY category
  `).all();

  const totalExpenses = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE created_at >= ${dateFilter}`).get().total;

  return NextResponse.json({ 
    salesByPeriod, 
    topProducts, 
    paymentMethods, 
    categoryBreakdown, 
    cashierBreakdown,
    expensesBreakdown,
    summary: { 
      revenue: totalRevenue.revenue || 0, 
      profit: totalProfit.profit || 0, 
      returns: totalReturns.total || 0,
      expenses: totalExpenses || 0
    } 
  });
}
